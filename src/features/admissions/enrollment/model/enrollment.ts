import type { EnrollmentStatusDto } from "../api/enrollmentDtos";

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  academicYear: string;
  academicYearId: string;
  grade: string;
  section: string;
  classroom: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  enrollmentDate: string;
  status: EnrollmentStatusDto;
}
