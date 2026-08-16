import type {
  Teacher,
  TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type {
  Subject,
  SubjectAllocation,
} from "@/features/academics/subjects/services/subjectsService";

export interface TeacherAllocationOption {
  allocationId: string;
  teacherId: string;
  subjectId: string;
  label: string;
}

export interface TeacherAllocationOptionParams {
  teacherAllocations: TeacherAllocation[];
  teachers: Teacher[];
  subjects: Subject[];
  sectionId: string;
  classroomId?: string;
  subjectId?: string;
  locale: string;
}

export interface SubjectOptionsForGradeAllocationsParams {
  subjects: Subject[];
  subjectAllocations: SubjectAllocation[];
  gradeId?: string;
  currentSubjectId?: string | null;
}

export function subjectOptionsForGradeAllocations({
  subjects,
  subjectAllocations,
  gradeId,
  currentSubjectId,
}: SubjectOptionsForGradeAllocationsParams): Subject[] {
  if (!gradeId) {
    return subjects;
  }

  const allocatedSubjectIds = new Set(
    subjectAllocations
      .filter((allocation) => allocation.gradeId === gradeId)
      .map((allocation) => allocation.subjectId),
  );

  return subjects.filter(
    (subject) =>
      allocatedSubjectIds.has(subject.id) || subject.id === currentSubjectId,
  );
}

export function teacherAllocationOptions({
  teacherAllocations,
  teachers,
  subjects,
  sectionId,
  classroomId,
  subjectId,
  locale,
}: TeacherAllocationOptionParams): TeacherAllocationOption[] {
  return teacherAllocations
    .filter((allocation) => allocation.sectionId === sectionId)
    .filter((allocation) => !subjectId || allocation.subjectId === subjectId)
    .filter((allocation) => allocation.classroomId === classroomId)
    .filter((allocation) => Boolean(allocation.teacherId))
    .map((allocation) => {
      const teacher = teachers.find((item) => item.id === allocation.teacherId);
      const subject = subjects.find((item) => item.id === allocation.subjectId);
      return {
        allocationId: allocation.id,
        teacherId: allocation.teacherId ?? "",
        subjectId: allocation.subjectId,
        label: allocationLabel({ teacher, subject, locale }) || allocation.id,
      };
    });
}

function allocationLabel({
  teacher,
  subject,
  locale,
}: {
  teacher?: Teacher;
  subject?: Subject;
  locale: string;
}): string {
  const teacherName =
    locale === "ar" ? teacher?.nameAr : teacher?.nameEn || teacher?.nameAr;
  const subjectName =
    locale === "ar" ? subject?.nameAr : subject?.nameEn || subject?.nameAr;

  if (teacherName && subjectName) {
    return `${teacherName} - ${subjectName}`;
  }
  return teacherName ?? subjectName ?? "";
}
