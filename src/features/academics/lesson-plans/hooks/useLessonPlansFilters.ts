"use client";

import { useCallback } from "react";
import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

interface LessonPlansFilterState {
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
}

interface UseLessonPlansFiltersParams {
  initialFilters?: Partial<LessonPlansFilterState>;
}

export function subjectsForLessonPlanGrade({
  subjects,
  subjectAllocations,
  gradeId,
  currentSubjectId,
}: {
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  gradeId?: string;
  currentSubjectId?: string | null;
}): Subject[] {
  if (!gradeId) {
    return subjects;
  }

  const allocatedSubjectIds = new Set(
    subjectAllocations
      .filter(
        (allocation) =>
          allocation.gradeId === gradeId && allocation.weeklyHours > 0,
      )
      .map((allocation) => allocation.subjectId),
  );

  return subjects.filter(
    (subject) =>
      allocatedSubjectIds.has(subject.id) || subject.id === currentSubjectId,
  );
}

export function useLessonPlansFilters({
  initialFilters,
}: UseLessonPlansFiltersParams = {}) {
  const selectedStageId = initialFilters?.stageId || "";
  const selectedGradeId = initialFilters?.gradeId || "";
  const selectedSectionId = initialFilters?.sectionId || "";
  const selectedClassroomId = initialFilters?.classroomId || "";
  const selectedSubjectId = initialFilters?.subjectId || "";

  const hasFilters = !!(
    selectedStageId ||
    selectedGradeId ||
    selectedSectionId ||
    selectedClassroomId ||
    selectedSubjectId
  );

  const getFilteredGrades = useCallback(
    (grades: Grade[]) => {
      if (!selectedStageId) {
        return grades;
      }
      return grades.filter((grade) => grade.stageId === selectedStageId);
    },
    [selectedStageId],
  );

  const getFilteredSections = useCallback(
    (sections: Section[]) => {
      if (!selectedGradeId) {
        return sections;
      }
      return sections.filter((section) => section.gradeId === selectedGradeId);
    },
    [selectedGradeId],
  );

  const getFilteredClassrooms = useCallback(
    (classrooms: Classroom[]) => {
      if (!selectedSectionId) {
        return [];
      }
      return classrooms.filter(
        (classroom) => classroom.sectionId === selectedSectionId,
      );
    },
    [selectedSectionId],
  );

  return {
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    hasFilters,
    getFilteredGrades,
    getFilteredSections,
    getFilteredClassrooms,
  };
}
