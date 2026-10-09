import type {
  Classroom,
  Grade,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { TimetableScopeSelection } from "@/features/academics/timetable/services/timetableScope";

interface TimetableDisplayScopeInput {
  classrooms: Classroom[];
  grades: Grade[];
  sections: Section[];
  scope: TimetableScopeSelection;
}

export function classroomsForTimetableScope({
  classrooms,
  grades,
  sections,
  scope,
}: TimetableDisplayScopeInput): Classroom[] {
  if (scope.scopeType === "TERM") {
    return classrooms;
  }
  if (scope.scopeType === "CLASSROOM") {
    return classrooms.filter((classroom) => classroom.id === scope.classroomId);
  }
  if (scope.scopeType === "SECTION") {
    return classrooms.filter(
      (classroom) => classroom.sectionId === scope.sectionId,
    );
  }

  const gradeIds = new Set(
    scope.scopeType === "STAGE"
      ? grades
          .filter((grade) => grade.stageId === scope.stageId)
          .map((grade) => grade.id)
      : [scope.gradeId],
  );
  return classroomsForGrades(classrooms, sections, gradeIds);
}

function classroomsForGrades(
  classrooms: Classroom[],
  sections: Section[],
  gradeIds: Set<string | undefined>,
): Classroom[] {
  const sectionIds = new Set(
    sections
      .filter((section) => gradeIds.has(section.gradeId))
      .map((section) => section.id),
  );
  return classrooms.filter((classroom) => sectionIds.has(classroom.sectionId));
}
