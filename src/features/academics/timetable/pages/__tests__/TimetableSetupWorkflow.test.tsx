import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
  BackendTimetableEntryDto,
} from "../../services/timetableApiTypes";
import TimetableSetupPage from "../TimetableSetupPage";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));
vi.mock("@/features/academics/hooks/AcademicYearTermLayoutContext", () => ({
  useAcademicYearTermLayoutContext: () => ({
    academicYearId: "year-1",
    termId: "term-1",
    termStatus: "open",
    selectedAcademicYear: { nameEn: "2026/2027" },
    selectedTerm: { nameEn: "First term" },
    isInitializing: false,
  }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isPermissionsReady: true,
  }),
}));

const config: BackendTimetableConfigDto = {
  id: "config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "First term",
  scopeType: "term",
  scopeKey: "term:term-1",
  stageId: null,
  gradeId: null,
  sectionId: null,
  classroomId: null,
  activeDays: [0, 1, 2, 3, 4],
  weekStartDay: 0,
  status: "draft",
  createdAt: "2026-10-16",
  updatedAt: "2026-10-16",
};
const period: BackendTimetablePeriodDto = {
  id: "period-1",
  timetableConfigId: config.id,
  index: 1,
  label: "First period",
  startTime: "08:00",
  endTime: "08:45",
  type: "class",
  isInstructional: true,
  createdAt: "2026-10-16",
  updatedAt: "2026-10-16",
};

describe("timetable setup workflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps period setup open after saving the first period so users can add the rest", async () => {
    let periods: BackendTimetablePeriodDto[] = [];
    let finishRefresh!: () => void;
    const refresh = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    vi.mocked(apiGet).mockImplementation(async (url) => {
      if (url.endsWith("/config")) {
        if (periods.length) await refresh;
        return config;
      }
      return { items: url.endsWith("/entries") ? [] : periods };
    });
    vi.mocked(apiPost).mockImplementation(async () => {
      periods = [period];
      return period;
    });
    const user = userEvent.setup();
    render(<TimetableSetupPage />);
    const nameInput = await screen.findByRole("textbox", {
      name: "config.periodLabel",
    });
    await user.type(nameInput, "First period");
    fireEvent.change(screen.getByLabelText("config.startTime"), {
      target: { value: "08:00" },
    });
    fireEvent.change(screen.getByLabelText("config.endTime"), {
      target: { value: "08:45" },
    });
    await user.click(
      screen.getByRole("button", { name: "config.addNextPeriod" }),
    );
    await act(async () => {
      finishRefresh();
    });
    await waitFor(() =>
      expect(screen.getByText("First period")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: "config.periodLabel" }),
    ).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "config.addNextPeriod" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "setup.startBuilding" }),
    ).not.toBeInTheDocument();
  });
  it("prevents removing a school day that already has saved lessons", async () => {
    const lesson: BackendTimetableEntryDto = {
      id: "lesson-1",
      timetableConfigId: config.id,
      periodId: period.id,
      dayOfWeek: 1,
      period: {
        id: period.id,
        index: 1,
        label: period.label,
        startTime: period.startTime,
        endTime: period.endTime,
      },
      classroom: {
        id: "classroom-1",
        nameAr: "الفصل أ",
        nameEn: "Classroom A",
      },
      subject: { id: "subject-1", nameAr: "رياضيات", nameEn: "Math" },
      teacher: { userId: "teacher-1", fullName: "Teacher One" },
      room: null,
      teacherSubjectAllocationId: "allocation-1",
      notes: null,
      status: "draft",
      createdAt: "2026-10-16",
      updatedAt: "2026-10-16",
    };
    vi.mocked(apiGet).mockImplementation(async (url) =>
      url.endsWith("/config")
        ? config
        : { items: url.endsWith("/entries") ? [lesson] : [period] },
    );
    const user = userEvent.setup();
    render(<TimetableSetupPage />);
    await screen.findByRole("button", { name: "setup.startBuilding" });
    await user.click(screen.getByRole("button", { name: "setup.back" }));
    await user.click(screen.getByRole("button", { name: "setup.back" }));
    await user.click(screen.getByRole("checkbox", { name: "Monday" }));
    await user.click(
      screen.getByRole("button", { name: "setup.saveAndContinue" }),
    );
    expect(
      screen.getByText("config.errors.activeDayInUse"),
    ).toBeInTheDocument();
    expect(apiPut).not.toHaveBeenCalled();
  });
});
