import type { Student } from "@/features/students-guardians/students/types";
import type { EnrollmentDto } from "../api/enrollmentDtos";
import type { EnrollmentRecord } from "./enrollment";

export function studentDisplayName(student: Student | undefined, locale: string): string {
  if (!student) return "Student unavailable";
  return locale === "ar"
    ? student.full_name_ar || student.name || student.full_name_en || "Student unavailable"
    : student.full_name_en || student.name || student.full_name_ar || "Student unavailable";
}

export function mapEnrollment(dto: EnrollmentDto, studentName: string): EnrollmentRecord {
  return {
    id: dto.enrollmentId,
    studentId: dto.studentId,
    studentName,
    academicYear: dto.academicYear,
    academicYearId: dto.academicYearId,
    grade: dto.grade,
    section: dto.section,
    classroom: dto.classroom,
    gradeId: dto.gradeId,
    sectionId: dto.sectionId,
    classroomId: dto.classroomId,
    enrollmentDate: dto.enrollmentDate,
    status: dto.status,
  };
}
