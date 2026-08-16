import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  getConfig,
  getDashboardTimetable,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import TimetableSlotSelect, {
  useTimetableConfigForScope,
} from "../TimetableSlotSelect";

vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  getConfig: vi.fn(),
  getDashboardTimetable: vi.fn(),
}));

const scope = {
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  teacherUserId: "teacher-1",
  subjectId: "subject-1",
  teacherSubjectAllocationId: "allocation-1",
};

const config = {
  id: "config-1",
  academicYearId: "year-1",
  termId: "term-1",
  name: "Classroom timetable",
  weekStartDay: 0,
  activeDays: [0, 1, 2, 3, 4],
  scopeType: "classroom",
  scopeKey: "classroom-1",
  gradeId: "grade-1",
  sectionId: "section-1",
  classroomId: "classroom-1",
  status: "draft",
  createdAt: "2026-07-31T08:00:00.000Z",
  updatedAt: "2026-07-31T08:00:00.000Z",
};

const entry = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  timetableConfigId: "config-1",
  periodId: "period-1",
  dayOfWeek: 3,
  period: {
    id: "period-1",
    index: 1,
    label: "Period 2",
    startTime: "08:45",
    endTime: "09:30",
  },
  classroom: {
    id: "classroom-1",
    nameAr: "Classroom",
    nameEn: "Class A",
  },
  subject: {
    id: "subject-1",
    nameAr: "Math",
    nameEn: "Mathematics",
  },
  teacher: { userId: "teacher-1", fullName: "Teacher One" },
  room: null,
  teacherSubjectAllocationId: "allocation-1",
  notes: null,
  status: "draft",
  createdAt: "2026-07-31T08:00:00.000Z",
  updatedAt: "2026-07-31T08:00:00.000Z",
  ...overrides,
});

const dashboard = (entries: ReturnType<typeof entry>[]) => ({
  termId: "term-1",
  academicYearId: "year-1",
  publishedAt: null,
  isPublished: false,
  items: [
    {
      classroomId: "classroom-1",
      classroom: {
        id: "classroom-1",
        nameAr: "Classroom",
        nameEn: "Class A",
      },
      gradeId: "grade-1",
      grade: { id: "grade-1", nameAr: "Grade 1", nameEn: "Grade 1" },
      configs: [],
      periods: [],
      entries,
    },
  ],
});

const missingConfig = () =>
  new ApiError(
    "Config not found",
    404,
    "academics.timetable.config_not_found",
  );

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const renderSelect = (onChange = vi.fn()) =>
  render(
    <TimetableSlotSelect
      {...scope}
      plannedDate="2026-09-16"
      value=""
      onChange={onChange}
      label="Timetable slot"
      emptyOptionLabel="Without slot"
      noSlotsMessage="No slots"
      loadingMessage="Loading slots"
      loadErrorMessage="Slots failed"
    />,
  );

describe("useTimetableConfigForScope", () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReset();
    vi.mocked(getDashboardTimetable).mockReset();
  });

  it("sends the full ancestor chain and stops at the first resolved config", async () => {
    vi.mocked(getConfig)
      .mockRejectedValueOnce(missingConfig())
      .mockResolvedValueOnce(config as never);

    const { result } = renderHook(() =>
      useTimetableConfigForScope(scope, true),
    );

    await waitFor(() => expect(result.current.config).toEqual(config));
    expect(getConfig).toHaveBeenNthCalledWith(1, {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      gradeId: "grade-1",
      sectionId: "section-1",
      classroomId: "classroom-1",
    });
    expect(getConfig).toHaveBeenNthCalledWith(2, {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "SECTION",
      gradeId: "grade-1",
      sectionId: "section-1",
    });
    expect(getConfig).toHaveBeenCalledTimes(2);
  });

  it.each([
    new ApiError(
      "Classroom missing",
      404,
      "academics.timetable.classroom_not_found",
    ),
    new ApiError("Forbidden", 403, "common.forbidden"),
    ApiError.network(),
  ])("exposes non-config lookup failures without broadening", async (error) => {
    vi.mocked(getConfig).mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useTimetableConfigForScope(scope, true),
    );

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.isMissing).toBe(false);
    expect(getConfig).toHaveBeenCalledTimes(1);
  });

  it("marks metadata missing only after all exact candidates are absent", async () => {
    vi.mocked(getConfig).mockRejectedValue(missingConfig());

    const { result } = renderHook(() =>
      useTimetableConfigForScope(scope, true),
    );

    await waitFor(() => expect(result.current.isMissing).toBe(true));
    expect(result.current.error).toBeNull();
    expect(getConfig).toHaveBeenCalledTimes(4);
  });

  it("ignores an obsolete config response after the scope changes", async () => {
    const obsolete = deferred<typeof config>();
    vi.mocked(getConfig)
      .mockReturnValueOnce(obsolete.promise as never)
      .mockResolvedValueOnce({ ...config, id: "config-2" } as never);
    const { result, rerender } = renderHook(
      ({ currentScope }) =>
        useTimetableConfigForScope(currentScope, true),
      { initialProps: { currentScope: scope } },
    );

    rerender({
      currentScope: { ...scope, classroomId: "classroom-2" },
    });
    await waitFor(() => expect(result.current.config?.id).toBe("config-2"));
    obsolete.resolve(config);
    await waitFor(() => expect(result.current.config?.id).toBe("config-2"));
  });
});

describe("TimetableSlotSelect", () => {
  beforeEach(() => {
    vi.mocked(getConfig).mockReset();
    vi.mocked(getDashboardTimetable).mockReset().mockResolvedValue(
      dashboard([]) as never,
    );
  });

  it("loads the classroom dashboard without repeating config lookup", async () => {
    vi.mocked(getDashboardTimetable).mockResolvedValue(
      dashboard([
        entry(),
        entry({ id: "entry-2", timetableConfigId: "config-2" }),
      ]) as never,
    );
    const user = userEvent.setup();
    renderSelect();

    await waitFor(() =>
      expect(getDashboardTimetable).toHaveBeenCalledWith({
        termId: "term-1",
        classroomId: "classroom-1",
      }),
    );
    expect(getConfig).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Timetable slot" }));
    expect(screen.getAllByText(/Mathematics.*Teacher One/)).toHaveLength(2);
  });

  it("omits cancelled, wrong-day, and non-exact allocation entries", async () => {
    vi.mocked(getDashboardTimetable).mockResolvedValue(
      dashboard([
        entry({ id: "cancelled", status: "cancelled" }),
        entry({ id: "wrong-day", dayOfWeek: 4 }),
        entry({
          id: "wrong-allocation",
          teacherSubjectAllocationId: "allocation-2",
        }),
        entry({ id: "missing-allocation", teacherSubjectAllocationId: "" }),
      ]) as never,
    );
    const onChange = vi.fn();
    renderSelect(onChange);

    expect(await screen.findByText("No slots")).toBeInTheDocument();
    expect(screen.queryByText(/Period 2/)).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows dashboard failures separately from an empty successful result", async () => {
    vi.mocked(getDashboardTimetable).mockRejectedValueOnce(
      ApiError.network(),
    );
    renderSelect();

    expect(await screen.findByText("Slots failed")).toBeInTheDocument();
    expect(screen.queryByText("No slots")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Timetable slot" }),
    ).toBeDisabled();
  });

  it("does not load slots until the exact allocation scope is complete", async () => {
    render(
      <TimetableSlotSelect
        {...scope}
        teacherSubjectAllocationId=""
        plannedDate="2026-09-16"
        value=""
        onChange={vi.fn()}
        label="Timetable slot"
        emptyOptionLabel="Without slot"
        noSlotsMessage="No slots"
        loadingMessage="Loading slots"
        loadErrorMessage="Slots failed"
      />,
    );

    expect(getDashboardTimetable).not.toHaveBeenCalled();
    expect(await screen.findByText("No slots")).toBeInTheDocument();
  });
});
