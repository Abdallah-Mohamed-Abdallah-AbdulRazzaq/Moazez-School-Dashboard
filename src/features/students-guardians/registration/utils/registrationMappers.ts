import type { CompositeRegistrationPayload, RegistrationAccountFormState, RegistrationGuardianFormState, RegistrationWizardFormState } from "@/features/students-guardians/registration/types/registration";

const optionalString = (value?: string) => value?.trim() || undefined;

export function mapAccount(account: RegistrationAccountFormState): Record<string, unknown> {
  if (account.mode === "link") return { mode: "link", userId: account.userId };
  return {
    mode: "create",
    username: optionalString(account.username),
    contactEmail: optionalString(account.contactEmail),
    generatePassword: account.generatePassword ?? true,
    temporaryPasswordMode: account.generatePassword === false ? "none" : "generate",
  };
}

export function mapGuardianProfile(guardian: RegistrationGuardianFormState) {
  return {
    full_name: optionalString(guardian.fullName), relation: optionalString(guardian.relation),
    phone_primary: optionalString(guardian.phonePrimary), phone_secondary: optionalString(guardian.phoneSecondary),
    email: optionalString(guardian.email), national_id: optionalString(guardian.nationalId),
    job_title: optionalString(guardian.jobTitle), workplace: optionalString(guardian.workplace),
    can_pickup: guardian.canPickup ?? true, can_receive_notifications: guardian.canReceiveNotifications ?? true,
  };
}

export function mapRegistrationToStudentPayload(form: RegistrationWizardFormState) {
  return { full_name_en: form.student.fullNameEn.trim(), full_name_ar: optionalString(form.student.fullNameAr),
    dateOfBirth: optionalString(form.student.dateOfBirth), gender: optionalString(form.student.gender), nationality: optionalString(form.student.nationality),
    contact: { student_email: optionalString(form.student.studentEmail), student_phone: optionalString(form.student.studentPhone),
      address_line: optionalString(form.student.addressLine), city: optionalString(form.student.city), district: optionalString(form.student.district) } };
}

export function mapRegistrationToEnrollmentPayload(form: RegistrationWizardFormState, studentId?: string) {
  return { ...(studentId ? { studentId } : {}), academicYearId: form.enrollment.academicYearId,
    gradeId: optionalString(form.enrollment.gradeId), sectionId: optionalString(form.enrollment.sectionId), classroomId: form.enrollment.classroomId,
    termId: optionalString(form.enrollment.termId), enrollmentDate: form.enrollment.enrollmentDate, status: form.enrollment.status ?? "active" };
}

export function mapRegistrationToCompositePayload(form: RegistrationWizardFormState): CompositeRegistrationPayload {
  if (form.guardians.some((guardian) => guardian.mode === "existing")) throw new Error("Existing guardian registration must use the staged flow.");
  return { student: mapRegistrationToStudentPayload(form), guardians: form.guardians.map((guardian) => ({ profile: mapGuardianProfile(guardian),
    relationship: { is_primary: guardian.isPrimary }, account: mapAccount(guardian.account) })),
    enrollment: mapRegistrationToEnrollmentPayload(form), studentAccount: mapAccount(form.studentAccount) };
}
