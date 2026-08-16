import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import PolicyWizardDialog from "../PolicyWizardDialog";
import type { Term } from "@/features/academics/academic-structure-tree/services/structureService";
import type { AttendancePolicy, PolicyFormData } from "../../types";
import { fetchTimetableConfig } from "@/features/academics/timetable/services/timetableConfigService";
import type { TimetableConfig } from "@/features/academics/timetable/types/timetableConfig";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/features/academics/timetable/services/timetableConfigService", () => ({
  fetchTimetableConfig: vi.fn().mockResolvedValue(null),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedFetchTimetableConfig = vi.mocked(fetchTimetableConfig);

const term = {
  id: "term-1",
  yearId: "year-1",
  startDate: "2026-01-01",
  endDate: "2026-06-30",
} as Term;

function renderWizard(options: {
  policy?: AttendancePolicy | null;
  onSave?: (data: PolicyFormData) => Promise<void>;
} = {}) {
  return render(
    <PolicyWizardDialog
      isOpen
      policy={options.policy ?? null}
      term={term}
      stages={[]}
      grades={[]}
      sections={[]}
      classrooms={[]}
      isReadOnly={false}
      canManagePolicies
      onSave={options.onSave ?? vi.fn().mockResolvedValue(undefined)}
      onClose={vi.fn()}
    />,
  );
}

const classroomPolicy: AttendancePolicy = {
  id: "policy-1",
  yearId: "year-1",
  termId: "term-1",
  nameAr: "سياسة الفصل",
  nameEn: "Classroom policy",
  scopeType: "CLASSROOM",
  scopeIds: {
    stageId: "stage-1",
    gradeId: "grade-1",
    sectionId: "section-1",
    classroomId: "classroom-1",
  },
  mode: "PERIOD",
  selectedPeriodIds: ["period-1"],
  lateThresholdMinutes: 15,
  earlyLeaveThresholdMinutes: 15,
  absentIfMissedPeriodsCount: 1,
  allowExcuses: true,
  requireExcuseReason: false,
  requireAttachmentForExcuse: false,
  notifyTeachers: true,
  notifyStudents: false,
  notifyGuardians: true,
  notifyOnAbsent: true,
  notifyOnLate: true,
  notifyOnEarlyLeave: false,
  effectiveStartDate: "2026-01-01",
  effectiveEndDate: "2026-06-30",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function validationCalls() {
  return mockedApiGet.mock.calls.filter(([url]) => url === "/attendance/policies/validate-name");
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe("PolicyWizardDialog policy errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApiGet.mockImplementation(async (url) => {
      if (url === "/attendance/policies/validate-name") {
        return { uniqueAr: true, uniqueEn: true, available: true };
      }
      return [];
    });
  });

  it("validates on blur and validates again before advancing", async () => {
    const user = userEvent.setup();
    renderWizard();
    const [arabicName, englishName] = screen.getAllByRole("textbox");

    await user.type(arabicName, "سياسة الحضور");
    await user.type(englishName, "Attendance policy");
    await user.tab();

    await waitFor(() => expect(validationCalls()).toHaveLength(1));
    await user.click(screen.getByRole("button", { name: "next" }));

    await waitFor(() => expect(validationCalls()).toHaveLength(2));
    expect(screen.getByText("steps.scope.priorityTitle")).toBeInTheDocument();
  });

  it("blocks progression on validation failure and supports retry", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let validationAttempt = 0;
    mockedApiGet.mockImplementation(async (url) => {
      if (url !== "/attendance/policies/validate-name") return [];
      validationAttempt += 1;
      if (validationAttempt === 1) throw new Error("network unavailable");
      return { uniqueAr: true, uniqueEn: true, available: true };
    });
    renderWizard();
    const [arabicName, englishName] = screen.getAllByRole("textbox");

    await user.type(arabicName, "سياسة الحضور");
    await user.type(englishName, "Attendance policy");
    await user.tab();

    expect(await screen.findByRole("alert")).toHaveTextContent("nameValidationUnavailable");
    expect(screen.queryByText("steps.scope.priorityTitle")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "nameValidation.retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(validationCalls()).toHaveLength(2);
    consoleError.mockRestore();
  });

  it("returns to Scope with preserved values when the backend reports a policy conflict", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onSave = vi.fn().mockRejectedValue(
      new ApiError(
        "An active policy already exists for this scope",
        409,
        "attendance.policy.conflict",
      ),
    );
    renderWizard({ policy: classroomPolicy, onSave });

    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole("button", { name: "next" }));
    }
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("scopeConflict.classroom");
    expect(onSave).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "back" }));
    const [arabicName, englishName] = screen.getAllByRole("textbox");
    expect(arabicName).toHaveValue("سياسة الفصل");
    expect(englishName).toHaveValue("Classroom policy");

    await user.click(screen.getByRole("button", { name: "next" }));
    await user.click(screen.getByText("scope.school"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("preserves nullable thresholds and effective dates when editing", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWizard({
      policy: {
        ...classroomPolicy,
        scopeType: "SCHOOL",
        scopeIds: {},
        mode: "DAILY",
        selectedPeriodIds: [],
        lateThresholdMinutes: null,
        earlyLeaveThresholdMinutes: null,
        absentIfMissedPeriodsCount: null,
        effectiveStartDate: null,
        effectiveEndDate: null,
      },
      onSave,
    });

    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole("button", { name: "next" }));
    }
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        lateThresholdMinutes: null,
        earlyLeaveThresholdMinutes: null,
        effectiveStartDate: null,
        effectiveEndDate: null,
      }),
    );
  });

  it("loads term periods for a school-scope period policy", async () => {
    const user = userEvent.setup();
    mockedFetchTimetableConfig.mockResolvedValue({
      id: "term-config-1",
      termId: "term-1",
      scopeType: "TERM",
      days: [],
      periods: [
        {
          id: "term-period-1",
          index: 1,
          nameAr: "الحصة الأولى",
          nameEn: "Term period 1",
        },
      ],
      updatedAt: "2026-08-04T00:00:00.000Z",
    });

    renderWizard({
      policy: {
        ...classroomPolicy,
        scopeType: "SCHOOL",
        scopeIds: {},
        selectedPeriodIds: [],
      },
    });

    await waitFor(() =>
      expect(mockedFetchTimetableConfig).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "TERM",
      }),
    );
    await user.click(screen.getByRole("button", { name: "next" }));
    await user.click(screen.getByRole("button", { name: "next" }));

    expect(await screen.findByText("Term period 1")).toBeInTheDocument();
  });

  it("keeps periods from the latest scope when an earlier request resolves last", async () => {
    const user = userEvent.setup();
    const firstRequest = deferred<TimetableConfig | null>();
    const secondRequest = deferred<TimetableConfig | null>();
    mockedFetchTimetableConfig
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    const { rerender } = renderWizard({ policy: classroomPolicy });

    await waitFor(() =>
      expect(mockedFetchTimetableConfig).toHaveBeenLastCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
      }),
    );

    const latestPolicy = {
      ...classroomPolicy,
      scopeIds: { ...classroomPolicy.scopeIds, classroomId: "classroom-2" },
    };
    rerender(
      <PolicyWizardDialog
        isOpen
        policy={latestPolicy}
        term={term}
        stages={[]}
        grades={[]}
        sections={[]}
        classrooms={[]}
        isReadOnly={false}
        canManagePolicies
        onSave={vi.fn().mockResolvedValue(undefined)}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(mockedFetchTimetableConfig).toHaveBeenLastCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        classroomId: "classroom-2",
      }),
    );

    secondRequest.resolve({
      id: "classroom-config-2",
      termId: "term-1",
      scopeType: "CLASSROOM",
      days: [],
      periods: [
        {
          id: "latest-period",
          index: 1,
          nameAr: "الحصة الأحدث",
          nameEn: "Latest period",
        },
      ],
      updatedAt: "2026-08-04T00:00:00.000Z",
    });
    firstRequest.resolve({
      id: "classroom-config-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      days: [],
      periods: [
        {
          id: "stale-period",
          index: 1,
          nameAr: "الحصة القديمة",
          nameEn: "Stale period",
        },
      ],
      updatedAt: "2026-08-04T00:00:00.000Z",
    });

    await user.click(screen.getByRole("button", { name: "next" }));
    await user.click(screen.getByRole("button", { name: "next" }));

    expect(await screen.findByText("Latest period")).toBeInTheDocument();
    expect(screen.queryByText("Stale period")).not.toBeInTheDocument();
  });

  it("does not re-save period IDs outside the selected scope timetable", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    mockedFetchTimetableConfig.mockResolvedValue({
      id: "classroom-config-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      days: [],
      periods: [
        {
          id: "classroom-period-1",
          index: 1,
          nameAr: "الحصة الأولى",
          nameEn: "Classroom period 1",
        },
      ],
      updatedAt: "2026-08-04T00:00:00.000Z",
    });
    renderWizard({
      policy: { ...classroomPolicy, selectedPeriodIds: ["section-period-1"] },
      onSave,
    });

    await waitFor(() => expect(mockedFetchTimetableConfig).toHaveBeenCalled());
    for (let step = 0; step < 4; step += 1) {
      await user.click(screen.getByRole("button", { name: "next" }));
    }
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ selectedPeriodIds: [] }),
    );
  });

  it("does not offer stage as a policy scope", async () => {
    const user = userEvent.setup();
    renderWizard({ policy: classroomPolicy });

    await user.click(screen.getByRole("button", { name: "next" }));

    expect(screen.queryByText("scope.stage")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "scopeType.stage" }),
    ).not.toBeInTheDocument();
  });
});
