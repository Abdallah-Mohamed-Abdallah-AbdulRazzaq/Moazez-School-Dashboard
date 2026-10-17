import type {
  Classroom,
  Section,
} from "@/features/academics/academic-structure-tree/services/structureService";
import type { SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import type { TeacherAllocation } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { TimetableEntry } from "../types/timetable";

export interface TimetableLessonAllocations {
  classrooms: Classroom[];
  sections: Pick<Section, "id" | "gradeId">[];
  teacherAllocations: TeacherAllocation[];
  subjectAllocations: SubjectAllocation[];
}

export function lessonAllocationRejection(
  entry: Pick<TimetableEntry, "classroomId" | "subjectId" | "teacherId">,
  context: TimetableLessonAllocations,
): "SUBJECT_NOT_ALLOCATED" | "ALLOCATION_MISSING" | null {
  const classroom = context.classrooms.find(
    (item) => item.id === entry.classroomId,
  );
  const gradeId = context.sections.find(
    (section) => section.id === classroom?.sectionId,
  )?.gradeId;
  if (
    !context.subjectAllocations.some(
      (allocation) =>
        allocation.gradeId === gradeId &&
        allocation.subjectId === entry.subjectId &&
        allocation.weeklyHours > 0,
    )
  )
    return "SUBJECT_NOT_ALLOCATED";
  const assigned = context.teacherAllocations.some(
    (allocation) =>
      allocation.classroomId === classroom?.id &&
      allocation.sectionId === classroom?.sectionId &&
      allocation.subjectId === entry.subjectId &&
      allocation.teacherId === entry.teacherId &&
      allocation.teacherEligibility?.eligible !== false,
  );
  return entry.teacherId && assigned ? null : "ALLOCATION_MISSING";
}
