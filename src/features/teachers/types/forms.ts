// Teacher Directory — UI Form Models
// These are internal form state models, not sent to the API directly.

import type {
  TeacherGender,
  TeacherEmploymentType,
  TeacherWorkDay,
  PreferredDisplayLanguage,
} from './enums';

/** Login identity section of the create/edit form */
export interface TeacherIdentityForm {
  identityMode: 'username' | 'loginEmail';
  username: string;
  loginEmail: string;
  contactEmail: string;
  phone: string;
}

/** Profile section of the create/edit form */
export interface TeacherProfileForm {
  teacherCode: string;
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  preferredDisplayLanguage: PreferredDisplayLanguage | '';
  gender: TeacherGender | '';
  department: string;
  specialization: string;
  employmentType: TeacherEmploymentType | '';
  experienceYears: string;
  hireDate: string;
  notesAr: string;
  notesEn: string;
}

/** Work schedule section of the create/edit form */
export interface TeacherScheduleForm {
  workingDays: TeacherWorkDay[];
  workStartTime: string;
  workEndTime: string;
}

/** Combined create form state */
export interface CreateTeacherFormState {
  identity: TeacherIdentityForm;
  profile: TeacherProfileForm;
  schedule: TeacherScheduleForm;
  employmentStatus: 'ACTIVE' | 'INACTIVE';
}

export interface EditTeacherFormState {
  identity: TeacherIdentityForm;
  profile: TeacherProfileForm;
  schedule: TeacherScheduleForm;
}

export interface EmploymentStatusForm {
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  effectiveAt: string;
}

/** Field-level form errors */
export interface TeacherFormErrors {
  [field: string]: string | undefined;
}
