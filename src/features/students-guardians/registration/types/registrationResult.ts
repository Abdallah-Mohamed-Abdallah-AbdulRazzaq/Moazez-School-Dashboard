import type { Student, StudentEnrollment, StudentGuardian } from "@/features/students-guardians/students/types";

export type RegistrationAccountStatus = "skipped" | "created" | "linked" | "failed";
export type RegistrationAccountMode = "none" | "create" | "link";

export interface RegistrationAccountUser {
  fullName: string;
  username: string | null;
  loginEmail: string;
  contactEmail: string | null;
  userType: "parent" | "student";
  roleKey: string;
  roleName: string;
  credentialStatus: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
}

export interface RegistrationAccountResult {
  target: "parent" | "student";
  guardianId?: string;
  mode: RegistrationAccountMode;
  status: RegistrationAccountStatus;
  user?: RegistrationAccountUser;
  temporaryPassword?: string;
}

export interface NormalizedRegistrationResult {
  registrationId: string;
  student: Student;
  guardians: StudentGuardian[];
  enrollment: StudentEnrollment;
  parentAccounts: RegistrationAccountResult[];
  studentAccount: RegistrationAccountResult;
  warnings: string[];
  createdAt: string;
  completedAt: string;
}
