import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentDetail } from "../../types/contracts";
import { loadAcademicContentDetailOptions } from "../academicContentDetailOptions";

const mocks = vi.hoisted(() => ({
  listCurricula: vi.fn(),
  getCurriculum: vi.fn(),
  listLessonPlans: vi.fn(),
  getLessonPlan: vi.fn(),
  listHomeworkAssignments: vi.fn(),
  fetchAssessments: vi.fn(),
  fetchTimetableConfigs: vi.fn(),
  listEntries: vi.fn(),
  loadAcademicTargetOptions: vi.fn(),
}));

vi.mock("@/features/academics/curriculum/services/curriculumService", () => ({ listCurricula: mocks.listCurricula, getCurriculum: mocks.getCurriculum }));
vi.mock("@/features/academics/lesson-plans/services/lessonPlansService", () => ({ listLessonPlans: mocks.listLessonPlans, getLessonPlan: mocks.getLessonPlan }));
vi.mock("@/features/academics/homework/services/homeworkService", () => ({ listHomeworkAssignments: mocks.listHomeworkAssignments }));
vi.mock("@/features/grades/overview/services/gradesOverviewService", () => ({ fetchAssessments: mocks.fetchAssessments }));
vi.mock("@/features/academics/timetable/services/timetableConfigService", () => ({ fetchTimetableConfigs: mocks.fetchTimetableConfigs }));
vi.mock("@/features/academics/timetable/services/timetableApiAdapter", () => ({ listEntries: mocks.listEntries }));
vi.mock("../academicContentSelectors", () => ({
  loadAcademicTargetOptions: mocks.loadAcademicTargetOptions,
  targetGradeIds: () => ["grade-1"],
  targetLineage: () => ({ stageId: "stage-1", gradeId: "grade-1", sectionId: "section-1" }),
}));

const content: AcademicContentDetail = {
  id: "content-1", academicYearId: "year-1", termId: "term-1", type: "TEACHER_PREPARATION", audience: "INTERNAL_STAFF", title: "Plan", description: null, status: "DRAFT", archivedAt: null, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z", targets: [{ id: "target-1", scopeType: "CLASSROOM", stageId: null, gradeId: null, sectionId: null, classroomId: "class-1", subjectId: "subject-1", teacherSubjectAllocationId: null }], assets: [], links: [], tags: [], details: null,
};

describe("academicContentDetailOptions", () => {
  beforeEach(() => {
    mocks.loadAcademicTargetOptions.mockResolvedValue({ structure: { stages: [], grades: [], sections: [], classrooms: [] }, subjects: [], subjectAllocations: [], teacherAllocations: [] });
    mocks.listCurricula.mockResolvedValue([{ id: "curriculum-1", gradeId: "grade-1", subjectId: "subject-1" }]);
    mocks.getCurriculum.mockResolvedValue({ id: "curriculum-1", units: [] });
    mocks.listLessonPlans.mockResolvedValue([{ id: "plan-1", classroomId: "class-1", subjectId: "subject-1" }]);
    mocks.getLessonPlan.mockResolvedValue({ id: "plan-1", items: [] });
    mocks.listHomeworkAssignments.mockResolvedValue({ items: [{ id: "homework-1", classroomId: "class-1", subjectId: "subject-1" }], meta: {} });
    mocks.fetchAssessments.mockResolvedValue([{ id: "assessment-1", classroomId: "class-1", subjectId: "subject-1" }]);
    mocks.fetchTimetableConfigs.mockResolvedValue([{ id: "config-1" }]);
    mocks.listEntries.mockResolvedValue([{ id: "entry-1", classroom: { id: "class-1" }, subject: { id: "subject-1" } }]);
  });

  it("composes only authoritative existing references for the content context", async () => {
    const options = await loadAcademicContentDetailOptions(content);

    expect(mocks.listCurricula).toHaveBeenCalledWith(expect.objectContaining({ academicYearId: "year-1", termId: "term-1", status: "ACTIVE" }));
    expect(mocks.listHomeworkAssignments).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    expect(mocks.fetchAssessments).toHaveBeenCalledWith("year-1", "term-1", expect.objectContaining({ includeDrafts: true }));
    expect(options.curricula).toEqual([{ id: "curriculum-1", units: [] }]);
    expect(options.lessonPlans).toEqual([{ id: "plan-1", items: [] }]);
    expect(options.timetableEntries.map((entry) => entry.id)).toEqual(["entry-1"]);
  });
});
