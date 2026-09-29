import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  fetchSubjectAllocations,
  type Subject,
  type SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  resolveTeacherAllocationForTarget,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { AcademicContentTargetDraft } from "../types/contracts";

export interface AcademicTargetOptions {
  structure: StructureTree;
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  teacherAllocations: TeacherAllocation[];
}

export interface LoadAcademicTargetOptionsInput {
  academicYearId: string;
  termId: string;
}

export async function loadAcademicTargetOptions({
  academicYearId,
  termId,
}: LoadAcademicTargetOptionsInput): Promise<AcademicTargetOptions> {
  const [structure, subjects, subjectAllocations, teacherAllocations] =
    await Promise.all([
      fetchStructureTree(academicYearId, termId),
      fetchSubjects(),
      fetchSubjectAllocations(termId),
      fetchTeacherAllocations(termId),
    ]);

  return {
    structure,
    subjects: subjects.filter((subject) => subject.isActive),
    subjectAllocations,
    teacherAllocations,
  };
}

export function toTargetInput(
  target: AcademicContentTargetDraft,
): Required<AcademicContentTargetDraft> {
  const anchor = {
    SCHOOL: null,
    STAGE: "stageId",
    GRADE: "gradeId",
    SECTION: "sectionId",
    CLASSROOM: "classroomId",
  } as const;
  const selectedAnchor = anchor[target.scopeType];

  return {
    scopeType: target.scopeType,
    stageId: selectedAnchor === "stageId" ? target.stageId ?? null : null,
    gradeId: selectedAnchor === "gradeId" ? target.gradeId ?? null : null,
    sectionId: selectedAnchor === "sectionId" ? target.sectionId ?? null : null,
    classroomId:
      selectedAnchor === "classroomId" ? target.classroomId ?? null : null,
    subjectId: target.subjectId ?? null,
    teacherSubjectAllocationId:
      target.scopeType === "CLASSROOM" && target.subjectId
        ? target.teacherSubjectAllocationId ?? null
        : null,
  };
}

function targetIdentity(target: AcademicContentTargetDraft): string {
  const normalized = toTargetInput(target);
  return JSON.stringify([
    normalized.scopeType,
    normalized.stageId,
    normalized.gradeId,
    normalized.sectionId,
    normalized.classroomId,
    normalized.subjectId,
    normalized.teacherSubjectAllocationId,
  ]);
}

export function hasDuplicateTargets(
  targets: readonly AcademicContentTargetDraft[],
): boolean {
  const identities = new Set<string>();
  for (const target of targets) {
    const identity = targetIdentity(target);
    if (identities.has(identity)) return true;
    identities.add(identity);
  }
  return false;
}

export function targetGradeIds(
  options: AcademicTargetOptions,
  target: AcademicContentTargetDraft,
): string[] {
  const { structure } = options;

  if (target.scopeType === "SCHOOL") {
    return structure.grades.map((grade) => grade.id);
  }
  if (target.scopeType === "STAGE") {
    return structure.grades
      .filter((grade) => grade.stageId === target.stageId)
      .map((grade) => grade.id);
  }
  if (target.scopeType === "GRADE") return target.gradeId ? [target.gradeId] : [];

  const sectionId =
    target.scopeType === "SECTION"
      ? target.sectionId
      : structure.classrooms.find(
          (classroom) => classroom.id === target.classroomId,
        )?.sectionId;
  const gradeId = structure.sections.find((section) => section.id === sectionId)?.gradeId;
  return gradeId ? [gradeId] : [];
}

export function eligibleSubjectsForTarget(
  options: AcademicTargetOptions,
  target: AcademicContentTargetDraft,
): Subject[] {
  const gradeIds = new Set(targetGradeIds(options, target));
  const eligibleSubjectIds = new Set(
    options.subjectAllocations
      .filter(
        (allocation) =>
          gradeIds.has(allocation.gradeId) && allocation.weeklyHours > 0,
      )
      .map((allocation) => allocation.subjectId),
  );
  return options.subjects.filter((subject) => eligibleSubjectIds.has(subject.id));
}

export function teacherAllocationsForTarget(
  options: AcademicTargetOptions,
  target: AcademicContentTargetDraft,
): TeacherAllocation[] {
  if (
    target.scopeType !== "CLASSROOM" ||
    !target.classroomId ||
    !target.subjectId
  ) {
    return [];
  }

  const sectionId = options.structure.classrooms.find(
    (classroom) => classroom.id === target.classroomId,
  )?.sectionId;
  if (!sectionId) return [];

  const exactClassroomAllocations = options.teacherAllocations.filter(
    (allocation) => allocation.classroomId === target.classroomId,
  );
  const resolved = resolveTeacherAllocationForTarget(exactClassroomAllocations, {
    sectionId,
    classroomId: target.classroomId,
    subjectId: target.subjectId,
  });
  return resolved ? [resolved] : [];
}

export function targetLineage(
  options: AcademicTargetOptions,
  target: AcademicContentTargetDraft,
): { stageId: string; gradeId: string; sectionId: string } {
  const { structure } = options;
  let sectionId = target.scopeType === "SECTION" ? target.sectionId ?? "" : "";
  if (target.scopeType === "CLASSROOM") {
    sectionId =
      structure.classrooms.find((item) => item.id === target.classroomId)
        ?.sectionId ?? "";
  }

  let gradeId = target.scopeType === "GRADE" ? target.gradeId ?? "" : "";
  if (sectionId) {
    gradeId = structure.sections.find((item) => item.id === sectionId)?.gradeId ?? "";
  }

  let stageId = target.scopeType === "STAGE" ? target.stageId ?? "" : "";
  if (gradeId) {
    stageId = structure.grades.find((item) => item.id === gradeId)?.stageId ?? "";
  }

  return { stageId, gradeId, sectionId };
}
