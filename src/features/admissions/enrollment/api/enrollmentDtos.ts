export type EnrollmentStatusDto = "active" | "completed" | "withdrawn";

export interface EnrollmentDto {
  enrollmentId: string;
  studentId: string;
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

export interface EnrollmentFiltersDto {
  studentId?: string;
  academicYearId?: string;
  academicYear?: string;
  status?: EnrollmentStatusDto;
}

export interface EnrollmentPlacementDto {
  studentId: string;
  applicationId?: string;
  academicYearId?: string;
  academicYear?: string;
  grade?: string;
  section?: string;
  classroom?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId: string;
  termId?: string;
  enrollmentDate: string;
  status?: "active";
}

export interface ValidateEnrollmentDto extends EnrollmentPlacementDto {
  enrollmentId?: string;
}

export interface ValidationResultDto {
  valid: boolean;
  errors: string[];
}

export interface AcademicYearDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface TransferEnrollmentDto {
  studentId: string;
  targetSectionId: string;
  targetClassroomId: string;
  effectiveDate: string;
  reason: string;
  notes?: string;
}

export interface WithdrawEnrollmentDto {
  studentId: string;
  effectiveDate: string;
  reason: string;
  notes?: string;
  actionType: "withdrawn";
}

export interface PromoteEnrollmentDto {
  studentId: string;
  targetAcademicYear: string;
  effectiveDate: string;
  notes?: string;
}

export interface EnrollmentMovementDto {
  id: string;
  studentId: string;
  academicYear: string;
  actionType: string;
  fromGrade: string;
  fromSection: string;
  fromClassroom: string;
  toGrade: string | null;
  toSection: string | null;
  toClassroom: string | null;
  effectiveDate: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}
