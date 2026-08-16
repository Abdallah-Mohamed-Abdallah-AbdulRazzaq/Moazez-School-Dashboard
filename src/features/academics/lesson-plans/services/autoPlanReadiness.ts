import type { Lesson } from "@/features/academics/curriculum/services/curriculumService";

export type AutoPlanScopeStatus =
  | "loading-options"
  | "missing-academic-year"
  | "missing-term"
  | "missing-grade"
  | "missing-section"
  | "missing-classroom"
  | "missing-subject"
  | "missing-curriculum"
  | "missing-teacher-allocation"
  | "ready";

export type AutoPlanBlockingReason =
  | "incomplete_scope"
  | "missing_term"
  | "missing_teacher_allocation"
  | "missing_curriculum"
  | "no_curriculum_lessons"
  | "curriculum_subject_mismatch"
  | "allocation_subject_mismatch"
  | "missing_classroom"
  | "invalid_date_range"
  | "closed_term"
  | "no_timetable_slots_if_known";

export type AutoPlanWarning = "timetable_slots_backend_check";

export interface AutoPlanReadiness {
  canPreview: boolean;
  canApply: boolean;
  previewBlockingReasons: AutoPlanBlockingReason[];
  applyBlockingReasons: AutoPlanBlockingReason[];
  warnings: AutoPlanWarning[];
}

export interface AutoPlanReadinessInput {
  scopeStatus: AutoPlanScopeStatus;
  termId?: string;
  teacherSubjectAllocationId?: string;
  curriculumId?: string;
  lessons: Lesson[];
  selectedSubjectId?: string;
  selectedGradeId?: string;
  selectedClassroomId?: string;
  teacherAllocation?: {
    id?: string;
    subjectId?: string;
    classroomId?: string;
  } | null;
  curriculum?: {
    id?: string;
    subjectId?: string;
    gradeId?: string;
  } | null;
  timetableSlotsKnown?: {
    hasSlots: boolean;
  } | null;
  termStartDate?: string;
  termEndDate?: string;
  termStatus?: string;
}

const unique = <T extends string>(values: T[]) => Array.from(new Set(values));

export function getAutoPlanReadiness({
  scopeStatus,
  termId,
  teacherSubjectAllocationId,
  curriculumId,
  lessons,
  selectedSubjectId,
  selectedGradeId,
  selectedClassroomId,
  teacherAllocation,
  curriculum,
  timetableSlotsKnown,
  termStartDate,
  termEndDate,
  termStatus,
}: AutoPlanReadinessInput): AutoPlanReadiness {
  const commonBlockingReasons: AutoPlanBlockingReason[] = [];

  if (scopeStatus !== "ready") commonBlockingReasons.push("incomplete_scope");
  if (!termId) commonBlockingReasons.push("missing_term");
  if (scopeStatus === "missing-classroom" || !selectedClassroomId) {
    commonBlockingReasons.push("missing_classroom");
  }
  if (
    scopeStatus === "missing-teacher-allocation" ||
    !teacherSubjectAllocationId
  ) {
    commonBlockingReasons.push("missing_teacher_allocation");
  }
  if (scopeStatus === "missing-curriculum" || !curriculumId) {
    commonBlockingReasons.push("missing_curriculum");
  }
  if (lessons.length === 0) {
    commonBlockingReasons.push("no_curriculum_lessons");
  }
  if (
    curriculum?.subjectId &&
    selectedSubjectId &&
    curriculum.subjectId !== selectedSubjectId
  ) {
    commonBlockingReasons.push("curriculum_subject_mismatch");
  }
  if (
    curriculum?.gradeId &&
    selectedGradeId &&
    curriculum.gradeId !== selectedGradeId
  ) {
    commonBlockingReasons.push("curriculum_subject_mismatch");
  }
  if (
    teacherAllocation?.subjectId &&
    selectedSubjectId &&
    teacherAllocation.subjectId !== selectedSubjectId
  ) {
    commonBlockingReasons.push("allocation_subject_mismatch");
  }
  if (
    teacherAllocation?.classroomId &&
    selectedClassroomId &&
    teacherAllocation.classroomId !== selectedClassroomId
  ) {
    commonBlockingReasons.push("allocation_subject_mismatch");
  }
  if (!termStartDate || !termEndDate || termStartDate > termEndDate) {
    commonBlockingReasons.push("invalid_date_range");
  }
  if (timetableSlotsKnown && !timetableSlotsKnown.hasSlots) {
    commonBlockingReasons.push("no_timetable_slots_if_known");
  }

  const warnings: AutoPlanWarning[] = [];
  if (!timetableSlotsKnown) warnings.push("timetable_slots_backend_check");

  const previewBlockingReasons = unique(commonBlockingReasons);
  const applyBlockingReasons = unique([
    ...commonBlockingReasons,
    ...(termStatus === "closed"
      ? (["closed_term"] as AutoPlanBlockingReason[])
      : []),
  ]);
  return {
    canPreview: previewBlockingReasons.length === 0,
    canApply: applyBlockingReasons.length === 0,
    previewBlockingReasons,
    applyBlockingReasons,
    warnings,
  };
}
