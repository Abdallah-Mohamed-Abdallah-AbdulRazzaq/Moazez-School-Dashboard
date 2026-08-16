import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  autoPlanLessons,
  createLessonPlan,
  createLessonPlanItem,
  type LessonPlan,
  type WeekInfo,
} from "../../services/lessonPlansService";
import { useLessonPlanMutations } from "../useLessonPlanMutations";

vi.mock("../../services/lessonPlansService", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../services/lessonPlansService")
  >()),
  autoPlanLessons: vi.fn(),
  createLessonPlan: vi.fn(),
  createLessonPlanItem: vi.fn(),
}));

const week = (overrides: Partial<WeekInfo> = {}): WeekInfo => ({
  weekIndex: 2,
  startDate: "2026-09-08",
  endDate: "2026-09-14",
  instructionalDays: ["2026-09-09", "2026-09-10"],
  holidayDays: [],
  lostTeachingDays: 0,
  hasHolidays: false,
  ...overrides,
});

const plan = (overrides: Partial<LessonPlan> = {}): LessonPlan => ({
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  curriculumId: "curriculum-1",
  title: "Week 2",
  description: null,
  weekIndex: 2,
  weekStartDate: "2026-09-08",
  weekEndDate: "2026-09-14",
  status: "DRAFT",
  rawStatus: "draft",
  items: [],
  ...overrides,
});

function makeParams(
  overrides: Partial<Parameters<typeof useLessonPlanMutations>[0]> = {},
): Parameters<typeof useLessonPlanMutations>[0] {
  return {
    academicYearId: "year-1",
    termId: "term-1",
    termStartDate: "2026-09-01",
    termEndDate: "2026-12-31",
    selectedSubjectId: "subject-1",
    selectedClassroomId: "class-1",
    assignedTeacherId: "teacher-1",
    teacherSubjectAllocationId: "allocation-1",
    curriculumId: "curriculum-1",
    classroomRequired: true,
    lessons: [
      { id: "lesson-1", unitId: "unit-1", title: "Fractions" } as never,
    ],
    plans: [],
    weeks: [week()],
    refreshPlans: vi.fn().mockResolvedValue(undefined),
    refreshPlanDetail: vi.fn().mockResolvedValue(plan()),
    refreshSummaryAndValidation: vi.fn().mockResolvedValue(undefined),
    upsertPlanItem: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    validationMessages: {
      missingWeek: "missing week",
      noInstructionalDays: "no instructional days",
      weekOutsideTerm: "week outside term",
      plannedDateOutsideTerm: "planned date outside term",
    },
    ...overrides,
  };
}

describe("useLessonPlanMutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("previews and applies auto-plan using the supplied date strings", async () => {
    vi.mocked(autoPlanLessons).mockResolvedValue({
      termId: "term-1",
      academicYearId: "year-1",
      teacherSubjectAllocationId: "allocation-1",
      dryRun: true,
      summary: {
        candidateLessons: 1,
        availableSlots: 1,
        proposedItems: 1,
        createdItems: 0,
        skippedExistingItems: 0,
        skippedHolidaySlots: 0,
      },
      items: [],
    });
    const params = makeParams();
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.previewAutoPlan({
        from: "2026-09-01",
        to: "2026-12-31",
        overwrite: false,
      }),
    );
    expect(autoPlanLessons).toHaveBeenLastCalledWith({
      termId: "term-1",
      teacherSubjectAllocationId: "allocation-1",
      from: "2026-09-01",
      to: "2026-12-31",
      overwrite: false,
      dryRun: true,
    });

    await act(() =>
      result.current.applyAutoPlan({
        from: "2026-09-01",
        to: "2026-12-31",
        overwrite: true,
      }),
    );
    expect(params.refreshPlans).toHaveBeenCalledOnce();
  });

  it("reuses an existing weekly plan and uses its item count as sortOrder", async () => {
    const createdItem = { id: "item-2", planId: "plan-1" };
    vi.mocked(createLessonPlanItem).mockResolvedValue(createdItem as never);
    const params = makeParams({
      plans: [plan({ items: [{ id: "existing" } as never] })],
    });
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-10"),
    );

    expect(createLessonPlan).not.toHaveBeenCalled();
    expect(createLessonPlanItem).toHaveBeenCalledWith({
      lessonPlanId: "plan-1",
      payload: {
        unitId: "unit-1",
        lessonId: "lesson-1",
        plannedDate: "2026-09-10",
        dayOfWeek: 4,
        sortOrder: 1,
      },
    });
    expect(params.upsertPlanItem).toHaveBeenCalledWith("plan-1", createdItem);
    expect(params.refreshPlanDetail).not.toHaveBeenCalled();
    expect(params.refreshPlans).not.toHaveBeenCalled();
  });

  it("creates a weekly plan lazily using backend dates", async () => {
    vi.mocked(createLessonPlan).mockResolvedValue(plan());
    const params = makeParams();
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-09"),
    );

    expect(createLessonPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        classroomId: "class-1",
        weekStartDate: "2026-09-08",
        weekEndDate: "2026-09-14",
      }),
    );
    expect(createLessonPlanItem).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ plannedDate: "2026-09-09" }),
      }),
    );
  });

  it("does not reuse an archived weekly plan for item creation", async () => {
    vi.mocked(createLessonPlan).mockResolvedValue(plan({ id: "new-plan" }));
    const params = makeParams({ plans: [plan({ status: "ARCHIVED" })] });
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-09"),
    );

    expect(createLessonPlan).toHaveBeenCalledOnce();
    expect(createLessonPlanItem).toHaveBeenCalledWith(
      expect.objectContaining({ lessonPlanId: "new-plan" }),
    );
  });

  it("shows success only after the created plan detail has been refreshed", async () => {
    const events: string[] = [];
    vi.mocked(createLessonPlan).mockResolvedValue(plan());
    vi.mocked(createLessonPlanItem).mockImplementation(async () => {
      events.push("create-item");
      return {} as never;
    });
    const params = makeParams({
      refreshPlanDetail: vi.fn().mockImplementation(async () => {
        events.push("refresh");
        return plan();
      }),
      showSuccess: vi.fn().mockImplementation(() => events.push("success")),
    });
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-09"),
    );

    expect(events).toEqual(["create-item", "refresh", "success"]);
    expect(params.refreshPlans).not.toHaveBeenCalled();
  });

  it("blocks a week with no instructional days", async () => {
    const params = makeParams({ weeks: [week({ instructionalDays: [] })] });
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, ""),
    );

    expect(params.showError).toHaveBeenCalledWith("no instructional days");
    expect(createLessonPlan).not.toHaveBeenCalled();
    expect(createLessonPlanItem).not.toHaveBeenCalled();
  });

  it("does not create a plan when the required classroom scope is missing", async () => {
    const params = makeParams({ selectedClassroomId: "", classroomRequired: true });
    const { result } = renderHook(() => useLessonPlanMutations(params));

    await act(() =>
      result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-08"),
    );

    expect(createLessonPlan).not.toHaveBeenCalled();
    expect(createLessonPlanItem).not.toHaveBeenCalled();
    expect(params.showError).toHaveBeenCalled();
  });

  it("blocks backend weeks and instructional dates outside the term", async () => {
    const outsideWeekParams = makeParams({
      weeks: [week({ startDate: "2026-08-25" })],
    });
    const outsideDateParams = makeParams({
      weeks: [week({ instructionalDays: ["2027-01-01"] })],
    });
    const first = renderHook(() => useLessonPlanMutations(outsideWeekParams));
    const second = renderHook(() => useLessonPlanMutations(outsideDateParams));

    await act(() =>
      first.result.current.handleConfirmAddLesson("lesson-1", 2, "2026-09-09"),
    );
    await act(() =>
      second.result.current.handleConfirmAddLesson("lesson-1", 2, "2027-01-01"),
    );

    expect(outsideWeekParams.showError).toHaveBeenCalledWith(
      "week outside term",
    );
    expect(outsideDateParams.showError).toHaveBeenCalledWith(
      "planned date outside term",
    );
    expect(createLessonPlan).not.toHaveBeenCalled();
  });
});
