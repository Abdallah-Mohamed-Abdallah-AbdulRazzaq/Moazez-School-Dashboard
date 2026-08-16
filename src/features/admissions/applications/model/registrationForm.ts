import type {
  RegisterApplicationRequest,
  RegistrationAccountRequest,
  RegistrationGuardianRequest,
  RegistrationHandoffResponseDto,
} from "../api/registrationDtos";

export interface RegistrationGuardianFormState {
  fullName: string;
  firstName: string;
  lastName: string;
  relation: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  nationalId: string;
  jobTitle: string;
  workplace: string;
  isPrimary: boolean;
  canPickup: boolean;
  canReceiveNotifications: boolean;
}

export interface RegistrationFormState {
  firstNameEn: string;
  fatherNameEn: string;
  grandfatherNameEn: string;
  familyNameEn: string;
  firstNameAr: string;
  fatherNameAr: string;
  grandfatherNameAr: string;
  familyNameAr: string;
  fullNameEn: string;
  fullNameAr: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  addressLine: string;
  city: string;
  district: string;
  studentPhone: string;
  studentEmail: string;
  guardians: RegistrationGuardianFormState[];
  gradeId: string;
  sectionId: string;
  classroomId: string;
  enrollmentDate: string;
}

export type RegistrationValidationIssue =
  | "student_name_required"
  | "student_name_two_parts"
  | "date_of_birth_required"
  | "date_of_birth_invalid"
  | "gender_required"
  | "nationality_required"
  | "guardian_required"
  | "guardian_name_required"
  | "guardian_name_two_parts"
  | "guardian_relation_required"
  | "guardian_phone_required"
  | "guardian_phone_invalid"
  | "guardian_secondary_phone_invalid"
  | "guardian_email_invalid"
  | "student_phone_invalid"
  | "student_email_invalid"
  | "academic_year_required"
  | "term_required"
  | "grade_required"
  | "section_required"
  | "classroom_required"
  | "enrollment_date_required"
  | "enrollment_date_invalid";

export function emptyRegistrationForm(studentName: string): RegistrationFormState {
  return {
    firstNameEn: "",
    fatherNameEn: "",
    grandfatherNameEn: "",
    familyNameEn: "",
    firstNameAr: "",
    fatherNameAr: "",
    grandfatherNameAr: "",
    familyNameAr: "",
    fullNameEn: studentName,
    fullNameAr: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    addressLine: "",
    city: "",
    district: "",
    studentPhone: "",
    studentEmail: "",
    guardians: [emptyGuardian(true)],
    gradeId: "",
    sectionId: "",
    classroomId: "",
    enrollmentDate: new Date().toISOString().slice(0, 10),
  };
}

export function emptyGuardian(isPrimary = false): RegistrationGuardianFormState {
  return {
    fullName: "",
    firstName: "",
    lastName: "",
    relation: isPrimary ? "father" : "mother",
    phonePrimary: "",
    phoneSecondary: "",
    email: "",
    nationalId: "",
    jobTitle: "",
    workplace: "",
    isPrimary,
    canPickup: true,
    canReceiveNotifications: true,
  };
}

export function registrationFormFromHandoff(
  current: RegistrationFormState,
  handoff: RegistrationHandoffResponseDto,
  requestedGradeId: string | null,
): RegistrationFormState {
  const student = handoff.wizardDraft?.student;
  const enrollment = handoff.wizardDraft?.enrollment;
  const guardianDrafts = handoff.wizardDraft?.guardians ?? [];
  return {
    ...current,
    firstNameEn: student?.first_name_en || current.firstNameEn,
    fatherNameEn: student?.father_name_en || current.fatherNameEn,
    grandfatherNameEn: student?.grandfather_name_en || current.grandfatherNameEn,
    familyNameEn: student?.family_name_en || current.familyNameEn,
    firstNameAr: student?.first_name_ar || current.firstNameAr,
    fatherNameAr: student?.father_name_ar || current.fatherNameAr,
    grandfatherNameAr: student?.grandfather_name_ar || current.grandfatherNameAr,
    familyNameAr: student?.family_name_ar || current.familyNameAr,
    fullNameEn: student?.full_name_en || student?.name || current.fullNameEn,
    fullNameAr: student?.full_name_ar || current.fullNameAr,
    dateOfBirth: student?.dateOfBirth || student?.date_of_birth || "",
    gender: student?.gender || "",
    nationality: student?.nationality || "",
    addressLine: student?.contact?.address_line || "",
    city: student?.contact?.city || "",
    district: student?.contact?.district || "",
    studentPhone: student?.contact?.student_phone || "",
    studentEmail: student?.contact?.student_email || "",
    guardians: guardianDrafts.length > 0
      ? guardianDrafts.map(mapGuardianDraftToForm)
      : current.guardians,
    gradeId: enrollment?.gradeId || requestedGradeId || "",
    sectionId: enrollment?.sectionId || "",
    classroomId: enrollment?.classroomId || "",
    enrollmentDate: enrollment?.enrollmentDate || current.enrollmentDate,
  };
}

export function isRegistrationFormValid(
  form: RegistrationFormState,
  academicYearId: string | null,
  termId: string | null,
): boolean {
  return getRegistrationValidationIssues(form, academicYearId, termId).length === 0;
}

export function getRegistrationValidationIssues(
  form: RegistrationFormState,
  academicYearId: string | null,
  termId: string | null,
): RegistrationValidationIssue[] {
  return uniqueIssues([
    ...studentValidationIssues(form),
    ...guardianValidationIssues(form.guardians),
    ...placementValidationIssues(form, academicYearId, termId),
  ]);
}

export function buildRegistrationRequest(
  form: RegistrationFormState,
  academicYearId: string,
  termId: string,
): RegisterApplicationRequest {
  return {
    student: {
      name: displayStudentName(form),
      first_name_en: blankToNull(form.firstNameEn),
      father_name_en: blankToNull(form.fatherNameEn),
      grandfather_name_en: blankToNull(form.grandfatherNameEn),
      family_name_en: blankToNull(form.familyNameEn),
      full_name_en: blankToUndefined(displayStudentName(form)),
      first_name_ar: blankToNull(form.firstNameAr),
      father_name_ar: blankToNull(form.fatherNameAr),
      grandfather_name_ar: blankToNull(form.grandfatherNameAr),
      family_name_ar: blankToNull(form.familyNameAr),
      full_name_ar: blankToNull(form.fullNameAr || composeName([
        form.firstNameAr,
        form.fatherNameAr,
        form.grandfatherNameAr,
        form.familyNameAr,
      ])),
      dateOfBirth: form.dateOfBirth,
      date_of_birth: form.dateOfBirth,
      gender: form.gender,
      nationality: form.nationality.trim(),
      status: "Active",
      contact: {
        address_line: blankToNull(form.addressLine),
        city: blankToNull(form.city),
        district: blankToNull(form.district),
        student_phone: blankToNull(form.studentPhone),
        student_email: blankToNull(form.studentEmail),
      },
    },
    guardians: form.guardians.map(buildGuardianRequest),
    enrollment: {
      academicYearId,
      termId,
      gradeId: form.gradeId,
      sectionId: form.sectionId,
      classroomId: form.classroomId,
      enrollmentDate: form.enrollmentDate,
      status: "active",
    },
    studentAccount: defaultAccount(),
  };
}

function mapGuardianDraftToForm(
  guardian: RegistrationGuardianRequest,
): RegistrationGuardianFormState {
  return {
    fullName: guardian.profile.full_name || "",
    firstName: guardian.profile.first_name || "",
    lastName: guardian.profile.last_name || "",
    relation: guardian.profile.relation || "father",
    phonePrimary: guardian.profile.phone_primary || "",
    phoneSecondary: guardian.profile.phone_secondary || "",
    email: guardian.profile.email || "",
    nationalId: guardian.profile.national_id || "",
    jobTitle: guardian.profile.job_title || "",
    workplace: guardian.profile.workplace || "",
    isPrimary: Boolean(guardian.relationship?.is_primary),
    canPickup: guardian.profile.can_pickup ?? true,
    canReceiveNotifications: guardian.profile.can_receive_notifications ?? true,
  };
}

function buildGuardianRequest(
  guardian: RegistrationGuardianFormState,
): RegistrationGuardianRequest {
  return {
    profile: {
      full_name: guardian.fullName.trim(),
      first_name: blankToNull(guardian.firstName),
      last_name: blankToNull(guardian.lastName),
      relation: guardian.relation,
      phone_primary: guardian.phonePrimary.trim(),
      phone_secondary: blankToNull(guardian.phoneSecondary),
      email: blankToNull(guardian.email),
      national_id: blankToNull(guardian.nationalId),
      job_title: blankToNull(guardian.jobTitle),
      workplace: blankToNull(guardian.workplace),
      can_pickup: guardian.canPickup,
      can_receive_notifications: guardian.canReceiveNotifications,
    },
    relationship: { is_primary: guardian.isPrimary },
    account: defaultAccount(),
  };
}

function defaultAccount(): RegistrationAccountRequest {
  return { mode: "none" };
}

function displayStudentName(form: RegistrationFormState): string {
  return (
    form.fullNameEn.trim() ||
    composeName([
      form.firstNameEn,
      form.fatherNameEn,
      form.grandfatherNameEn,
      form.familyNameEn,
    ])
  );
}

function composeName(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join(" ");
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function studentValidationIssues(
  form: RegistrationFormState,
): RegistrationValidationIssue[] {
  const issues: RegistrationValidationIssue[] = [];
  if (!displayStudentName(form)) issues.push("student_name_required");
  if (displayStudentName(form) && !hasResolvableStudentName(form)) {
    issues.push("student_name_two_parts");
  }
  if (!form.dateOfBirth) issues.push("date_of_birth_required");
  if (form.dateOfBirth && !isDateOnly(form.dateOfBirth)) {
    issues.push("date_of_birth_invalid");
  }
  if (!form.gender) issues.push("gender_required");
  if (!form.nationality.trim()) issues.push("nationality_required");
  if (form.studentPhone.trim() && !isPhoneNumber(form.studentPhone)) {
    issues.push("student_phone_invalid");
  }
  if (form.studentEmail.trim() && !isEmail(form.studentEmail)) {
    issues.push("student_email_invalid");
  }
  return issues;
}

function guardianValidationIssues(
  guardians: RegistrationGuardianFormState[],
): RegistrationValidationIssue[] {
  if (guardians.length === 0) return ["guardian_required"];
  return guardians.flatMap((guardian) => {
    const issues: RegistrationValidationIssue[] = [];
    if (!guardian.fullName.trim() && !hasGuardianNameParts(guardian)) {
      issues.push("guardian_name_required");
    }
    if (!hasResolvableGuardianName(guardian)) {
      issues.push("guardian_name_two_parts");
    }
    if (!guardian.relation.trim()) issues.push("guardian_relation_required");
    if (!guardian.phonePrimary.trim()) issues.push("guardian_phone_required");
    if (guardian.phonePrimary.trim() && !isPhoneNumber(guardian.phonePrimary)) {
      issues.push("guardian_phone_invalid");
    }
    if (guardian.phoneSecondary.trim() && !isPhoneNumber(guardian.phoneSecondary)) {
      issues.push("guardian_secondary_phone_invalid");
    }
    if (guardian.email.trim() && !isEmail(guardian.email)) {
      issues.push("guardian_email_invalid");
    }
    return issues;
  });
}

function placementValidationIssues(
  form: RegistrationFormState,
  academicYearId: string | null,
  termId: string | null,
): RegistrationValidationIssue[] {
  const issues: RegistrationValidationIssue[] = [];
  if (!academicYearId) issues.push("academic_year_required");
  if (!termId) issues.push("term_required");
  if (!form.gradeId) issues.push("grade_required");
  if (!form.sectionId) issues.push("section_required");
  if (!form.classroomId) issues.push("classroom_required");
  if (!form.enrollmentDate) issues.push("enrollment_date_required");
  if (form.enrollmentDate && !isDateOnly(form.enrollmentDate)) {
    issues.push("enrollment_date_invalid");
  }
  return issues;
}

function hasResolvableStudentName(form: RegistrationFormState): boolean {
  if (hasTwoNameParts(form.fullNameEn) || hasTwoNameParts(form.fullNameAr)) {
    return true;
  }
  return Boolean(
    (form.firstNameEn.trim() && form.familyNameEn.trim()) ||
      (form.firstNameAr.trim() && form.familyNameAr.trim()),
  );
}

function hasResolvableGuardianName(guardian: RegistrationGuardianFormState): boolean {
  return hasTwoNameParts(guardian.fullName) || hasGuardianNameParts(guardian);
}

function hasGuardianNameParts(guardian: RegistrationGuardianFormState): boolean {
  return Boolean(guardian.firstName.trim() && guardian.lastName.trim());
}

function hasTwoNameParts(name: string): boolean {
  return name.trim().replace(/\s+/g, " ").split(" ").length >= 2;
}

function isPhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isDateOnly(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function uniqueIssues(
  issues: RegistrationValidationIssue[],
): RegistrationValidationIssue[] {
  return Array.from(new Set(issues));
}
