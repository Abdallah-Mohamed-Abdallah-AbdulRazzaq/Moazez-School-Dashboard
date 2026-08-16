import { Subject } from "@/features/academics/subjects/services/subjectsService";
import { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import {
  SubjectHoursSummary,
  TimetableConflict,
  TimetableEntry,
  Room,
} from "@/features/academics/timetable/types/timetable";
import { detectConflicts } from "@/features/academics/timetable/services/timetableService";

interface SectionLike {
  id: string;
  gradeId: string;
  nameAr: string;
  nameEn: string;
}

interface GradeLike {
  id: string;
}

interface ClassroomLike {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface TeacherLike {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface BuildTimetableValidationParams {
  currentEntries: TimetableEntry[];
  allTermEntries: TimetableEntry[];
  selectedSectionId: string;
  selectedClassroomId?: string;
  sections: SectionLike[];
  grades: GradeLike[];
  classrooms: ClassroomLike[];
  teachers: TeacherLike[];
  rooms: Room[];
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
}

export interface TimetableValidationState {
  subjectHours: SubjectHoursSummary[];
  conflicts: TimetableConflict[];
  conflictsForTarget: TimetableConflict[];
  hasConflictsForTarget: boolean;
  hasSubjectMismatches: boolean;
}

function isSameTarget(
  entry: TimetableEntry,
  selectedSectionId: string,
  selectedClassroomId?: string
) {
  return (
    entry.sectionId === selectedSectionId &&
    (entry.classroomId || "") === (selectedClassroomId || "")
  );
}

function buildSubjectHoursSummary(params: BuildTimetableValidationParams): SubjectHoursSummary[] {
  const selectedSection = params.sections.find((section) => section.id === params.selectedSectionId);
  if (!selectedSection) {
    return [];
  }

  const selectedGrade = params.grades.find((grade) => grade.id === selectedSection.gradeId);
  if (!selectedGrade) {
    return [];
  }

  return params.subjects
    .map((subject) => {
      const allocation = params.subjectAllocations.find(
        (item) => item.gradeId === selectedGrade.id && item.subjectId === subject.id
      );
      const target = allocation?.weeklyHours || 0;
      const actual = params.currentEntries.filter(
        (entry) => entry.subjectId === subject.id && entry.slotType !== "BREAK"
      ).length;

      let status: "OK" | "UNDER" | "OVER" = "OK";
      if (actual < target) {
        status = "UNDER";
      } else if (actual > target) {
        status = "OVER";
      }

      return {
        subjectId: subject.id,
        subjectNameAr: subject.nameAr,
        subjectNameEn: subject.nameEn,
        target,
        actual,
        status,
      };
    })
    .filter((summary) => summary.target > 0);
}

export function buildTimetableValidationState(
  params: BuildTimetableValidationParams
): TimetableValidationState {
  if (!params.selectedSectionId) {
    return {
      subjectHours: [],
      conflicts: [],
      conflictsForTarget: [],
      hasConflictsForTarget: false,
      hasSubjectMismatches: false,
    };
  }

  const mergedEntries = [
    ...params.allTermEntries.filter(
      (entry) =>
        !isSameTarget(entry, params.selectedSectionId, params.selectedClassroomId)
    ),
    ...params.currentEntries,
  ];

  const subjectHours = buildSubjectHoursSummary(params);
  const conflicts = detectConflicts(
    mergedEntries,
    params.sections,
    params.classrooms,
    params.teachers,
    params.rooms,
    params.subjects
  );
  const conflictsForTarget = conflicts.filter((conflict) =>
    conflict.sections.some(
      (section) =>
        section.sectionId === params.selectedSectionId &&
        ((params.selectedClassroomId &&
          section.classroomId === params.selectedClassroomId) ||
          (!params.selectedClassroomId && !section.classroomId))
    )
  );

  return {
    subjectHours,
    conflicts,
    conflictsForTarget,
    hasConflictsForTarget: conflictsForTarget.length > 0,
    hasSubjectMismatches: subjectHours.some((summary) => summary.status !== "OK"),
  };
}
