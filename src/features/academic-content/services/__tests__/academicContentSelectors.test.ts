import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicContentTargetDraft } from "../../types/contracts";
import {
  eligibleSubjectsForTarget,
  hasDuplicateTargets,
  loadAcademicTargetOptions,
  targetLineage,
  teacherAllocationsForTarget,
  toTargetInput,
} from "../academicContentSelectors";

const sources = vi.hoisted(() => ({
  fetchStructureTree: vi.fn(),
  fetchSubjects: vi.fn(),
  fetchSubjectAllocations: vi.fn(),
  fetchTeacherAllocations: vi.fn(),
  resolveTeacherAllocationForTarget: vi.fn(),
}));

vi.mock(
  "@/features/academics/academic-structure-tree/services/structureService",
  () => ({ fetchStructureTree: sources.fetchStructureTree }),
);
vi.mock("@/features/academics/subjects/services/subjectsService", () => ({
  fetchSubjects: sources.fetchSubjects,
  fetchSubjectAllocations: sources.fetchSubjectAllocations,
}));
vi.mock(
  "@/features/academics/teacher-allocation/services/teacherAllocationService",
  () => ({
    fetchTeacherAllocations: sources.fetchTeacherAllocations,
    resolveTeacherAllocationForTarget: sources.resolveTeacherAllocationForTarget,
  }),
);

const structure = {
  stages: [
    { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", order: 1 },
  ],
  grades: [
    { id: "grade-1", stageId: "stage-1", name: "Grade 1", nameAr: "أول", nameEn: "Grade 1", capacity: 20, order: 1 },
  ],
  sections: [
    { id: "section-1", gradeId: "grade-1", name: "A", nameAr: "أ", nameEn: "A", capacity: 20, order: 1 },
  ],
  classrooms: [
    { id: "class-1", sectionId: "section-1", name: "Room A", nameAr: "فصل أ", nameEn: "Room A", capacity: 20, order: 1 },
  ],
};

describe("academicContentSelectors", () => {
  beforeEach(() => {
    sources.fetchStructureTree.mockReset().mockResolvedValue(structure);
    sources.fetchSubjects.mockReset().mockResolvedValue([
      { id: "subject-1", name: "Math", nameAr: "رياضيات", nameEn: "Math", code: "M", color: null, isActive: true },
      { id: "subject-2", name: "Inactive", nameAr: "غير نشط", nameEn: "Inactive", code: null, color: null, isActive: false },
    ]);
    sources.fetchSubjectAllocations.mockReset().mockResolvedValue([
      { id: "subject-allocation-1", gradeId: "grade-1", subjectId: "subject-1", weeklyHours: 5 },
    ]);
    sources.fetchTeacherAllocations.mockReset().mockResolvedValue([
      { id: "teacher-allocation-1", termId: "term-1", sectionId: "section-1", classroomId: "class-1", subjectId: "subject-1", teacherId: "teacher-1" },
    ]);
    sources.resolveTeacherAllocationForTarget.mockImplementation(
      (allocations: unknown[]) => allocations[0],
    );
  });

  it("loads authoritative structure, subjects, and allocations for the context", async () => {
    const options = await loadAcademicTargetOptions({
      academicYearId: "year-1",
      termId: "term-1",
    });

    expect(sources.fetchStructureTree).toHaveBeenCalledWith("year-1", "term-1");
    expect(sources.fetchSubjectAllocations).toHaveBeenCalledWith("term-1");
    expect(sources.fetchTeacherAllocations).toHaveBeenCalledWith("term-1");
    expect(options.subjects).toHaveLength(1);
  });

  it("normalizes a classroom target to one hierarchy anchor", () => {
    expect(
      toTargetInput({
        scopeType: "CLASSROOM",
        classroomId: "class-1",
        subjectId: "subject-1",
      }),
    ).toEqual({
      scopeType: "CLASSROOM",
      stageId: null,
      gradeId: null,
      sectionId: null,
      classroomId: "class-1",
      subjectId: "subject-1",
      teacherSubjectAllocationId: null,
    });
  });

  it("detects duplicates using the complete backend target identity", () => {
    const target = toTargetInput({ scopeType: "SCHOOL", subjectId: "subject-1" });
    expect(hasDuplicateTargets([target, { ...target }])).toBe(true);
    const classroomTarget = toTargetInput({
      scopeType: "CLASSROOM",
      classroomId: "class-1",
      subjectId: "subject-1",
    });
    expect(
      hasDuplicateTargets([
        classroomTarget,
        {
          ...classroomTarget,
          teacherSubjectAllocationId: "teacher-allocation-1",
        },
      ]),
    ).toBe(false);
  });

  it("limits subjects and teacher allocations to authoritative target matches", async () => {
    const options = await loadAcademicTargetOptions({
      academicYearId: "year-1",
      termId: "term-1",
    });
    const classroomTarget: AcademicContentTargetDraft = {
      scopeType: "CLASSROOM",
      classroomId: "class-1",
      subjectId: "subject-1",
    };

    expect(eligibleSubjectsForTarget(options, classroomTarget).map(({ id }) => id)).toEqual([
      "subject-1",
    ]);
    expect(
      teacherAllocationsForTarget(options, classroomTarget).map(({ id }) => id),
    ).toEqual(["teacher-allocation-1"]);
    expect(
      teacherAllocationsForTarget(options, {
        scopeType: "GRADE",
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).toEqual([]);
    expect(targetLineage(options, classroomTarget)).toEqual({
      stageId: "stage-1",
      gradeId: "grade-1",
      sectionId: "section-1",
    });
  });
});
