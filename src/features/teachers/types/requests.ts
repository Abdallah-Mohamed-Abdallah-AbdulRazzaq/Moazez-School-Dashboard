// Teacher Directory — Request DTOs
// Contract reference: §8.2, §10.2, §11.2, §13.2, §15.2

import type {
  UserStatus,
  MembershipStatus,
  TeacherGender,
  TeacherEmploymentStatus,
  TeacherEmploymentType,
  TeacherWorkDay,
  PreferredDisplayLanguage,
  ProfileCompletenessFilter,
} from './enums';

// --- List query (§8.2) ---

export interface TeacherListQuery {
  search?: string;
  accountStatus?: UserStatus;
  membershipStatus?: MembershipStatus;
  employmentStatus?: TeacherEmploymentStatus;
  gender?: TeacherGender;
  profileCompleteness?: ProfileCompletenessFilter;
  page?: number;
  limit?: number;
}

// --- Create teacher (§10.2) ---

export interface CreateTeacherRequest {
  /**
   * Optional only when username is supplied.
   * In username mode the backend generates the login email.
   */
  loginEmail?: string;

  /**
   * Optional alternative to legacy loginEmail mode.
   * Requires active school login-domain settings.
   */
  username?: string;

  contactEmail?: string | null;
  phone?: string | null;

  teacherCode: string;

  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;

  preferredDisplayLanguage: PreferredDisplayLanguage;
  gender: TeacherGender;

  /** TERMINATED is rejected during creation */
  employmentStatus: 'ACTIVE' | 'INACTIVE';

  department?: string | null;
  specialization?: string | null;
  employmentType?: TeacherEmploymentType | null;
  experienceYears?: number | null;
  hireDate?: string | null;
  workingDays?: TeacherWorkDay[];
  workStartTime?: string | null;
  workEndTime?: string | null;
  notesAr?: string | null;
  notesEn?: string | null;
}

// --- Update teacher (§11.2) ---

export interface UpdateTeacherRequest {
  loginEmail?: string;
  username?: string;
  contactEmail?: string | null;
  phone?: string | null;

  teacherCode?: string;

  firstNameAr?: string | null;
  lastNameAr?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;

  preferredDisplayLanguage?: PreferredDisplayLanguage;
  gender?: TeacherGender;

  department?: string | null;
  specialization?: string | null;
  employmentType?: TeacherEmploymentType | null;
  experienceYears?: number | null;
  hireDate?: string | null;
  workingDays?: TeacherWorkDay[];
  workStartTime?: string | null;
  workEndTime?: string | null;
  notesAr?: string | null;
  notesEn?: string | null;
}

// --- Change employment status (§13.2) ---

export interface ChangeTeacherEmploymentStatusRequest {
  employmentStatus: TeacherEmploymentStatus;

  /**
   * Exact, calendar-valid, non-future ISO timestamp with Z or numeric offset.
   * Defaults to the server's current time.
   */
  effectiveAt?: string;
}

// --- Rehire teacher (§15.2) ---

export interface RehireTeacherRequest {
  teacherCode: string;

  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;

  preferredDisplayLanguage: PreferredDisplayLanguage;
  gender: TeacherGender;

  department?: string | null;
  specialization?: string | null;
  employmentType?: TeacherEmploymentType | null;
  experienceYears?: number | null;
  hireDate?: string | null;
  workingDays?: TeacherWorkDay[];
  workStartTime?: string | null;
  workEndTime?: string | null;
  notesAr?: string | null;
  notesEn?: string | null;
}
