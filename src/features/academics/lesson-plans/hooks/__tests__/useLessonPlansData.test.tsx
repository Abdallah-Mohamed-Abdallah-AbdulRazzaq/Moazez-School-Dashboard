import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchCurriculumForScope } from "@/features/academics/curriculum/services/curriculumService";
import {
  fetchSubjectAllocations,
  fetchSubjects,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  getLessonPlan,
  getLessonPlanSummary,
  getLessonPlanValidation,
  listLessonPlans,
  listLessonPlanWeeks,
  type LessonPlan,
  type LessonPlanSummary,
  type LessonPlanValidationResponseDto,
} from "../../services/lessonPlansService";
import { useLessonPlansData } from "../useLessonPlansData";

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn(),
}));
vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({
  fetchCurriculumForScope: vi.fn(),
}));
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjectAllocations: vi.fn(),
  fetchSubjects: vi.fn(),
}));
vi.mock("@/features/academics/teacher-allocation/services/teacherAllocationService", () => ({
  fetchTeacherAllocations: vi.fn(),
  fetchTeachers: vi.fn(),
}));
vi.mock("../../services/lessonPlansService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/lessonPlansService")>()),
  getLessonPlan: vi.fn(),
  getLessonPlanSummary: vi.fn(),
  getLessonPlanValidation: vi.fn(),
  listLessonPlans: vi.fn(),
  listLessonPlanWeeks: vi.fn(),
}));

const summaryPlan = {
  id: "plan-1",
  academicYearId: "year-1",
  termId: "term-1",
  teacherSubjectAllocationId: "allocation-1",
  teacherId: "teacher-1",
  classroomId: "classroom-1",
  subjectId: "subject-1",
  curriculumId: "curriculum-1",
  title: "Week 1",
  description: null,
  status: "DRAFT",
  rawStatus: "draft",
  weekStartDate: "2026-09-01",
  weekEndDate: "2026-09-07",
  weekIndex: 0,
  items: [],
  updatedAt: "2026-09-01T00:00:00.000Z",
} satisfies LessonPlan;
const detailPlan = {
  ...summaryPlan,
  items: [
    {
      id: "item-1",
      planId: "plan-1",
      lessonId: "lesson-1",
      unitId: "unit-1",
      unitTitle: "Unit 1",
      lessonTitle: "Lesson 1",
      status: "PLANNED",
      rawStatus: "planned",
      order: 0,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    },
  ],
} satisfies LessonPlan;
const lessonPlanSummary = {
  lessonPlansCount: 1,
  itemsCount: 1,
  plannedItemsCount: 1,
  inProgressItemsCount: 0,
  completedItemsCount: 0,
  skippedItemsCount: 0,
  cancelledItemsCount: 0,
  rescheduledItemsCount: 0,
  unplannedLessonsCount: 0,
  coveragePercent: 100,
  byTeacherAllocation: [],
} satisfies LessonPlanSummary;
const lessonPlanValidation = {
  termId: "term-1",
  academicYearId: "year-1",
  summary: {
    lessonPlansChecked: 1,
    itemsChecked: 1,
    missingPlannedLessons: 0,
    holidayItems: 0,
    outsideTermItems: 0,
    duplicateLessons: 0,
  },
  issues: [],
} satisfies LessonPlanValidationResponseDto;

describe("useLessonPlansData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [],
    });
    vi.mocked(fetchSubjects).mockResolvedValue([]);
    vi.mocked(fetchSubjectAllocations).mockResolvedValue([]);
    vi.mocked(fetchTeachers).mockResolvedValue([]);
    vi.mocked(fetchCurriculumForScope).mockResolvedValue({
      id: "curriculum-1",
      units: [],
    } as never);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
      },
    ]);
    vi.mocked(listLessonPlanWeeks).mockResolvedValue([
      {
        weekIndex: 1,
        startDate: "2026-09-01",
        endDate: "2026-09-07",
        instructionalDays: ["2026-09-01"],
        holidayDays: [],
        lostTeachingDays: 0,
        hasHolidays: false,
        plannedItemsCount: 1,
      },
    ]);
    vi.mocked(listLessonPlans).mockResolvedValue([summaryPlan]);
    vi.mocked(getLessonPlan).mockResolvedValue(detailPlan);
    vi.mocked(getLessonPlanSummary).mockResolvedValue(lessonPlanSummary);
    vi.mocked(getLessonPlanValidation).mockResolvedValue(lessonPlanValidation);
  });

  it("hydrates list summaries from detail before storing board plans", async () => {
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useLessonPlansData({
        academicYearId: "year-1",
        termId: "term-1",
        isInitializing: false,
        selectedGradeId: "grade-1",
        selectedSectionId: "section-1",
        selectedClassroomId: "",
        selectedSubjectId: "subject-1",
        onLoadError,
      }),
    );

    await waitFor(() => expect(result.current.dataChecked).toBe(true));

    expect(getLessonPlan).toHaveBeenCalledWith("plan-1");
    expect(result.current.plans[0]?.items).toEqual(detailPlan.items);
    expect(result.current.plans[0]?.weekIndex).toBe(1);
  });

  it("loads the selected classroom and subject scope once without duplicate requests", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [{ id: "classroom-1", sectionId: "section-1" }],
    } as never);
    vi.mocked(fetchTeacherAllocations).mockResolvedValue([
      {
        id: "allocation-1",
        termId: "term-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        subjectId: "subject-1",
        teacherId: "teacher-1",
      },
    ]);
    const onLoadError = vi.fn();
    const { result, rerender } = renderHook(
      ({ classroomId, subjectId }) =>
        useLessonPlansData({
          academicYearId: "year-1",
          termId: "term-1",
          isInitializing: false,
          selectedGradeId: "grade-1",
          selectedSectionId: "section-1",
          selectedClassroomId: classroomId,
          selectedSubjectId: subjectId,
          onLoadError,
        }),
      {
        initialProps: {
          classroomId: "",
          subjectId: "",
        },
      },
    );

    await waitFor(() =>
      expect(result.current.scopeStatus).toBe("missing-subject"),
    );
    vi.clearAllMocks();

    rerender({
      classroomId: "classroom-1",
      subjectId: "subject-1",
    });

    await waitFor(() => expect(result.current.scopeStatus).toBe("ready"));
    expect(fetchCurriculumForScope).toHaveBeenCalledTimes(1);
    expect(fetchTeacherAllocations).toHaveBeenCalledTimes(1);
    expect(listLessonPlanWeeks).toHaveBeenCalledTimes(1);
    expect(listLessonPlans).toHaveBeenCalledTimes(1);
    expect(getLessonPlanSummary).toHaveBeenCalledTimes(1);
    expect(getLessonPlanValidation).toHaveBeenCalledTimes(1);
  });

  it("does not resolve allocation or load lesson plans when the section requires a classroom", async () => {
    vi.mocked(fetchStructureTree).mockResolvedValue({
      stages: [],
      grades: [],
      sections: [],
      classrooms: [{ id: "classroom-1", sectionId: "section-1" }],
    } as never);
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useLessonPlansData({
        academicYearId: "year-1",
        termId: "term-1",
        isInitializing: false,
        selectedGradeId: "grade-1",
        selectedSectionId: "section-1",
        selectedClassroomId: "",
        selectedSubjectId: "subject-1",
        onLoadError,
      }),
    );

    await waitFor(() => expect(result.current.scopeStatus).toBe("missing-classroom"));
    expect(result.current.dataChecked).toBe(true);
    expect(fetchCurriculumForScope).not.toHaveBeenCalled();
    expect(fetchTeacherAllocations).not.toHaveBeenCalled();
    expect(listLessonPlans).not.toHaveBeenCalled();
  });

  it("ignores stale summary and validation responses after the scope becomes incomplete", async () => {
    const summaryRequest = deferred<LessonPlanSummary>();
    const validationRequest = deferred<LessonPlanValidationResponseDto>();
    vi.mocked(getLessonPlanSummary).mockReturnValue(summaryRequest.promise);
    vi.mocked(getLessonPlanValidation).mockReturnValue(validationRequest.promise);
    const onLoadError = vi.fn();
    const { result, rerender } = renderHook(
      ({ subjectId }) =>
        useLessonPlansData({
          academicYearId: "year-1",
          termId: "term-1",
          isInitializing: false,
          selectedGradeId: "grade-1",
          selectedSectionId: "section-1",
          selectedClassroomId: "",
          selectedSubjectId: subjectId,
          onLoadError,
        }),
      { initialProps: { subjectId: "subject-1" } },
    );

    await waitFor(() => expect(result.current.scopeStatus).toBe("ready"));
    expect(result.current.summaryLoading).toBe(true);
    expect(result.current.validationLoading).toBe(true);

    rerender({ subjectId: "" });

    await waitFor(() =>
      expect(result.current.scopeStatus).toBe("missing-subject"),
    );
    expect(result.current.summary).toBeNull();
    expect(result.current.validation).toBeNull();
    expect(result.current.summaryLoading).toBe(false);
    expect(result.current.validationLoading).toBe(false);

    await act(async () => {
      summaryRequest.resolve(lessonPlanSummary);
      validationRequest.resolve(lessonPlanValidation);
      await Promise.all([summaryRequest.promise, validationRequest.promise]);
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.validation).toBeNull();
  });
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};
