import type { RiskFlag } from "@/features/students-guardians/students/types/enums";


// FILE: src/types/students/enrollment.ts
// ERP Enrollment types

/**
 * Student Enrollment
 * Represents a student's enrollment for a specific academic year
 */

export type EnrollmentStatus = "active" | "completed" | "withdrawn";
export type AcademicTermName = "Term 1" | "Term 2" | "Term 3";

export interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  academicYearId?: string;
  academicYear: string;
  grade: string;
  gradeId?: string;
  section: string;
  sectionId?: string;
  classroom?: string;
  classroomId?: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
}

export interface StudentYTDPerformance {
  attendance: number;
  gradeAverage: number;
  riskFlags: RiskFlag[];
}

export type EnrollmentMovementAction =
  | "enrolled"
  | "transferred_internal"
  | "transferred_external"
  | "withdrawn"
  | "promoted"
  | "reassigned_bulk";

export interface EnrollmentMovement {
  id: string;
  studentId: string;
  academicYear: string;
  actionType: EnrollmentMovementAction;
  fromGradeId?: string;
  fromSectionId?: string;
  fromClassroomId?: string;
  toGradeId?: string | null;
  toSectionId?: string | null;
  toClassroomId?: string | null;
  fromGrade?: string;
  fromSection?: string;
  fromClassroom?: string;
  toGrade?: string | null;
  toSection?: string | null;
  toClassroom?: string | null;
  effectiveDate: string;
  reason?: string | null;
  notes?: string | null;
  sourceRequestId?: string | null;
  createdAt: string;
}

/**
 * Enrollment Term
 * Represents performance data for a specific term within an enrollment
 */
export interface EnrollmentTerm {
  termId: string;
  termRecordId?: string;
  enrollmentId: string;
  term: AcademicTermName;
  startDate: string;
  endDate: string;
  attendancePercentage: number;
  gradeAverage: number;
  riskFlags: RiskFlag[];
}

/**
 * Class Teacher Assignment
 * Maps a class (grade + section) to a homeroom/class teacher
 */
export interface ClassTeacherAssignment {
  assignmentId: string;
  academicYear: string;
  grade: string;
  section: string;
  classroomId?: string;
  teacherId: string;
  teacherName: string;
  teacherNameArabic?: string;
}

/**
 * Subject Teacher Assignment
 * Maps a class + subject to a subject teacher
 */
export interface SubjectTeacherAssignment {
  assignmentId: string;
  academicYear: string;
  grade: string;
  section: string;
  classroomId?: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  teacherNameArabic?: string;
}
