// Teacher Directory — Response DTOs
// Contract reference: §7, §13.7

import type {
  UserStatus,
  MembershipStatus,
  TeacherGender,
  TeacherEmploymentStatus,
  TeacherEmploymentType,
  TeacherWorkDay,
  TeacherCredentialStatus,
} from './enums';

// --- Error envelope (§3.2) ---

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export interface ErrorEnvelope {
  error: ApiErrorPayload;
}

// --- Credential summary (§7) ---

export interface TeacherCredentialSummary {
  hasPassword: boolean;
  status: TeacherCredentialStatus;
  mustChangePassword: boolean;
  passwordProvisionedAt: string | null;
  passwordChangedAt: string | null;
  credentialVersion: number;
}

// --- Profile completeness (§7) ---

export type TeacherProfileCompletenessField =
  | 'teacherCode'
  | 'firstNameAr'
  | 'lastNameAr'
  | 'firstNameEn'
  | 'lastNameEn'
  | 'gender';

export interface TeacherProfileCompleteness {
  isComplete: boolean;
  missingFields: TeacherProfileCompletenessField[];
}

// --- Display name ---

export interface TeacherDisplayName {
  firstName: string;
  lastName: string;
  fullName: string;
}

// --- List item (§7) ---

export interface TeacherDirectoryListItem {
  /** TeacherProfile.id */
  id: string;

  /** User.id — use for credential endpoints */
  userId: string;

  loginEmail: string;
  username: string | null;
  contactEmail: string | null;
  phone: string | null;

  teacherCode: string | null;

  firstNameAr: string | null;
  lastNameAr: string | null;
  firstNameEn: string | null;
  lastNameEn: string | null;

  displayName: TeacherDisplayName;

  gender: TeacherGender | null;
  department: string | null;
  specialization: string | null;

  accountStatus: UserStatus;
  membershipStatus: MembershipStatus;
  membershipEndedAt: string | null;
  employmentStatus: TeacherEmploymentStatus;

  profileCompleteness: TeacherProfileCompleteness;
  credentialSummary: TeacherCredentialSummary;

  createdAt: string;
  updatedAt: string;
}

// --- Detail (§7) ---

export interface TeacherDirectoryDetail extends TeacherDirectoryListItem {
  employmentType: TeacherEmploymentType | null;
  experienceYears: number | null;

  /** YYYY-MM-DD */
  hireDate: string | null;

  workingDays: TeacherWorkDay[];

  /** HH:mm:ss */
  workStartTime: string | null;

  /** HH:mm:ss */
  workEndTime: string | null;

  notesAr: string | null;
  notesEn: string | null;
}

// --- Pagination (§7) ---

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// --- List response (§7) ---

export interface TeachersListResponse {
  items: TeacherDirectoryListItem[];
  pagination: Pagination;
}

// --- Allocation summary (§13.7) ---

export interface AllocationSummary {
  currentActiveCount: number;
  futureCount: number;
  historicalCount: number;
  currentInactiveCount: number;
  inconsistentCount: number;
  invalidCount: number;
  integrityRiskCount: number;
  integrityReason: string;
}

// --- Employment status transition response (§13.7) ---

export interface EmploymentTransitionResult {
  previousEmploymentStatus: TeacherEmploymentStatus;
  employmentStatus: TeacherEmploymentStatus;
  accountStatus: UserStatus;
  membershipStatus: MembershipStatus;
  membershipEndedAt: string | null;
  effectiveAt: string;
  revokedSessionCount: number;
  reassignmentRequired: boolean;
  allocationSummary: AllocationSummary;
}

export interface TeacherEmploymentStatusResponse {
  teacher: TeacherDirectoryDetail;
  transition: EmploymentTransitionResult;
}
