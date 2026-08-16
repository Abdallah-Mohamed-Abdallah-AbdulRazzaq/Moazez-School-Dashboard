import type { Student, StudentEnrollment, StudentGuardian } from "@/features/students-guardians/students/types";
import type { EnrollmentStatus } from "@/features/students-guardians/students/types/enrollment";
import type { RegistrationAccountResult } from "@/features/students-guardians/registration/types/registrationResult";

export type RegistrationGuardianMode = "create" | "existing";
export type RegistrationAccountMode = "create" | "link";

export interface RegistrationAccountFormState {
  mode: RegistrationAccountMode;
  username?: string;
  contactEmail?: string;
  userId?: string;
  userLabel?: string;
  generatePassword?: boolean;
  alreadyLinked?: boolean;
}

export interface RegistrationStudentFormState {
  fullNameEn: string;
  fullNameAr?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  studentEmail?: string;
  studentPhone?: string;
  addressLine?: string;
  city?: string;
  district?: string;
}

export interface RegistrationGuardianFormState {
  key: string;
  mode: RegistrationGuardianMode;
  existingGuardianId?: string;
  existingGuardianLabel?: string;
  fullName?: string;
  relation?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  email?: string;
  nationalId?: string;
  jobTitle?: string;
  workplace?: string;
  canPickup?: boolean;
  canReceiveNotifications?: boolean;
  isPrimary: boolean;
  account: RegistrationAccountFormState;
}

export interface RegistrationEnrollmentFormState {
  academicYearId: string;
  academicYear?: string;
  gradeId?: string;
  grade?: string;
  sectionId?: string;
  section?: string;
  classroomId: string;
  classroom?: string;
  termId?: string;
  enrollmentDate: string;
  status?: EnrollmentStatus;
}

export interface RegistrationWizardFormState {
  student: RegistrationStudentFormState;
  studentAccount: RegistrationAccountFormState;
  guardians: RegistrationGuardianFormState[];
  enrollment: RegistrationEnrollmentFormState;
}

export interface CompositeRegistrationPayload {
  student: Record<string, unknown>;
  guardians: Array<{ profile: Record<string, unknown>; relationship: { is_primary: boolean }; account: Record<string, unknown> }>;
  enrollment: Record<string, unknown>;
  studentAccount: Record<string, unknown>;
}

export type RegistrationFailedStep = "student" | "guardian_link" | "enrollment" | "accounts";
export interface RegistrationSuccessResult {
  status: "success";
  registrationId?: string;
  student?: Student | null;
  enrollment?: StudentEnrollment | null;
  guardians: StudentGuardian[];
  warnings: string[];
  parentAccounts: RegistrationAccountResult[];
  studentAccount?: RegistrationAccountResult | null;
  createdAt?: string;
  completedAt?: string;
}
export interface RegistrationPartialResult {
  status: "partial";
  student: Student;
  failedStep: RegistrationFailedStep;
  errorMessage: string;
  warnings: string[];
}
export type RegistrationResult = RegistrationSuccessResult | RegistrationPartialResult;
