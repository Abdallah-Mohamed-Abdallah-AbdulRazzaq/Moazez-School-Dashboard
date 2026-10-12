import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { loadAcademicContentDetailOptions } from "../academicContentDetailOptions";
import { referenceTargetOptions } from "./academicContentReferenceScope.fixture";

const mocks = vi.hoisted(() => ({
  listCurricula: vi.fn(),
  getCurriculum: vi.fn(),
  listLessonPlans: vi.fn(),
  getLessonPlan: vi.fn(),
  listHomeworkAssignments: vi.fn(),
  fetchAssessments: vi.fn(),
  fetchTimetableConfigs: vi.fn(),
  listEntries: vi.fn(),
  fetchStructureTree: vi.fn(),
}));

vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({
  listCurricula: mocks.listCurricula,
  getCurriculum: mocks.getCurriculum,
}));
vi.mock(
  "@/features/academics/lesson-plans/services/lessonPlansService",
  () => ({
    listLessonPlans: mocks.listLessonPlans,
    getLessonPlan: mocks.getLessonPlan,
  }),
);
vi.mock("@/features/academics/homework/services/homeworkService", () => ({
  listHomeworkAssignments: mocks.listHomeworkAssignments,
}));
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({
  fetchAssessments: mocks.fetchAssessments,
}));
vi.mock(
  "@/features/academics/timetable/services/timetableConfigService",
  () => ({ fetchTimetableConfigs: mocks.fetchTimetableConfigs }),
);
vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({
  listEntries: mocks.listEntries,
}));
vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({ fetchStructureTree: mocks.fetchStructureTree }),
);
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: vi.fn(async () => []),
  fetchSubjectAllocations: vi.fn(async () => []),
}));
vi.mock(
  "@/features/academics/teacher-allocation/services/teacherAllocationService",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/academics/teacher-allocation/services/teacherAllocationService")
    >()),
    fetchTeacherAllocations: vi.fn(async () => []),
  }),
);

const content: AcademicContentDetail = {
  id: "content-1",
  academicYearId: "year-1",
  termId: "term-1",
  type: "TEACHER_PREPARATION",
  audience: "INTERNAL_STAFF",
  title: "Plan",
  description: null,
  status: "DRAFT",
  archivedAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  targets: [
    {
      id: "target-1",
      scopeType: "CLASSROOM",
      stageId: null,
      gradeId: null,
      sectionId: null,
      classroomId: "class-1",
      subjectId: "subject-1",
      teacherSubjectAllocationId: null,
    },
  ],
  assets: [],
  links: [],
  tags: [],
  details: null,
};

describe("academicContentDetailOptions", () => {
  beforeEach(() => {
    mocks.fetchStructureTree.mockResolvedValue(
      referenceTargetOptions.structure,
    );
    mocks.listCurricula.mockResolvedValue([
      { id: "curriculum-1", gradeId: "grade-1", subjectId: "subject-1" },
    ]);
    mocks.getCurriculum.mockResolvedValue({ id: "curriculum-1", units: [] });
    mocks.listLessonPlans.mockResolvedValue([
      { id: "plan-1", classroomId: "class-1", subjectId: "subject-1" },
    ]);
    mocks.getLessonPlan.mockResolvedValue({ id: "plan-1", items: [] });
    mocks.listHomeworkAssignments.mockResolvedValue({
      items: [
        { id: "homework-1", classroomId: "class-1", subjectId: "subject-1" },
      ],
      meta: {},
    });
    mocks.fetchAssessments.mockResolvedValue([
      {
        id: "assessment-1",
        scopeType: "classroom",
        classroomId: "class-1",
        subjectId: "subject-1",
      },
    ]);
    mocks.fetchTimetableConfigs.mockResolvedValue([{ id: "config-1" }]);
    mocks.listEntries.mockResolvedValue([
      {
        id: "entry-1",
        classroom: { id: "class-1" },
        subject: { id: "subject-1" },
      },
    ]);
  });

  it("composes only authoritative existing references for the content context", async () => {
    const options = await loadAcademicContentDetailOptions(content);

    expect(mocks.listCurricula).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
    });
    expect(mocks.listHomeworkAssignments).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
    expect(mocks.fetchAssessments).toHaveBeenCalledWith("year-1", "term-1", {
      includeDrafts: true,
    });
    expect(options.curricula).toEqual([{ id: "curriculum-1", units: [] }]);
    expect(options.lessonPlans).toEqual([{ id: "plan-1", items: [] }]);
    expect(options.timetableEntries.map((entry) => entry.id)).toEqual([
      "entry-1",
    ]);
  });

  it("rejects references in another grade and combines valid references from either target", async () => {
    const multiScope = {
      ...content,
      targets: [
        ...content.targets,
        {
          ...content.targets[0],
          id: "target-2",
          classroomId: "class-3",
          subjectId: "subject-2",
        },
      ],
    };
    mocks.listCurricula.mockResolvedValue([
      { id: "curriculum-1", gradeId: "grade-1", subjectId: "subject-1" },
      { id: "curriculum-3", gradeId: "grade-3", subjectId: "subject-2" },
      { id: "wrong", gradeId: "grade-2", subjectId: "subject-1" },
    ]);
    mocks.getCurriculum.mockImplementation(async (id: string) => ({
      id,
      units: [],
    }));
    mocks.listLessonPlans.mockResolvedValue([
      { id: "wrong", classroomId: "class-2", subjectId: "subject-1" },
    ]);
    mocks.listHomeworkAssignments.mockResolvedValue({
      items: [{ id: "wrong", classroomId: "class-2", subjectId: "subject-1" }],
    });
    mocks.fetchAssessments.mockResolvedValue([
      {
        id: "wrong",
        scopeType: "grade",
        scopeKey: "grade-2",
        subjectId: "subject-1",
      },
    ]);
    mocks.listEntries.mockResolvedValue([
      {
        id: "entry-1",
        classroom: { id: "class-1" },
        subject: { id: "subject-1" },
      },
      {
        id: "entry-3",
        classroom: { id: "class-3" },
        subject: { id: "subject-2" },
      },
      {
        id: "wrong",
        classroom: { id: "class-2" },
        subject: { id: "subject-1" },
      },
    ]);
    const options = await loadAcademicContentDetailOptions(multiScope);
    expect(options.curricula.map(({ id }) => id)).toEqual([
      "curriculum-1",
      "curriculum-3",
    ]);
    expect(options.timetableEntries.map(({ id }) => id)).toEqual([
      "entry-1",
      "entry-3",
    ]);
    expect(options.lessonPlans).toEqual([]);
    expect(options.homeworkAssignments).toEqual([]);
    expect(options.assessments).toEqual([]);
  });
});
