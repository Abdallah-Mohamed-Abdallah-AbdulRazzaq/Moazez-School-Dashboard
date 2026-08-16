// Teacher Directory — Enumeration Types
// Contract reference: §6

export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DISABLED';

export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'SUSPENDED';

export type TeacherGender = 'MALE' | 'FEMALE';

export type TeacherEmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export type TeacherEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';

export type TeacherWorkDay =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export type PreferredDisplayLanguage = 'AR' | 'EN';

export type ProfileCompletenessFilter = 'complete' | 'incomplete';

export type TeacherCredentialStatus =
  | 'missing'
  | 'temporary_or_must_change'
  | 'must_change'
  | 'set';
