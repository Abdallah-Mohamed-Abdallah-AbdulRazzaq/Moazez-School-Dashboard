import type {
  RegistrationAccountFormState,
  RegistrationWizardFormState,
} from "@/features/students-guardians/registration/types/registration";

export type RegistrationStep = 0 | 1 | 2 | 3 | 4;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const internationalPhonePattern = /^\+[1-9]\d{7,14}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasAtLeastTwoNameParts(name?: string): boolean {
  return (name?.trim().split(/\s+/).filter(Boolean).length ?? 0) >= 2;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() + 1 === Number(match[2])
    && date.getUTCDate() === Number(match[3]);
}

function maxLengthError(label: string, value: string | undefined, maximum: number): string[] {
  return value && value.length > maximum ? [`${label} must be ${maximum} characters or fewer.`] : [];
}

function optionalEmailErrors(label: string, email?: string): string[] {
  if (!email) return [];
  return [
    ...(!emailPattern.test(email) ? [`${label} is invalid.`] : []),
    ...maxLengthError(label, email, 200),
  ];
}

function optionalPhoneErrors(label: string, phone?: string): string[] {
  return phone && !internationalPhonePattern.test(phone)
    ? [`${label} must use international format, for example +201001112233.`]
    : [];
}

function accountErrors(
  label: string,
  account: RegistrationAccountFormState,
): string[] {
  if (account.alreadyLinked) return [];

  const errors: string[] = [];
  if (account.mode === "create") {
    if (!account.username?.trim()) errors.push(`${label}: username is required.`);
    errors.push(...maxLengthError(`${label} username`, account.username, 64));
  }
  if (account.mode === "link") {
    if (!account.userId?.trim()) errors.push(`${label}: select an existing account.`);
    else if (!uuidPattern.test(account.userId)) errors.push(`${label}: selected user ID is invalid.`);
  }
  errors.push(...optionalEmailErrors(`${label} contact email`, account.contactEmail));
  return errors;
}

function studentErrors(form: RegistrationWizardFormState): string[] {
  const { student } = form;
  const errors: string[] = [];
  if (!hasAtLeastTwoNameParts(student.fullNameEn) && !hasAtLeastTwoNameParts(student.fullNameAr)) {
    errors.push("Student full name must contain at least two words in English or Arabic.");
  }
  errors.push(
    ...maxLengthError("Student English full name", student.fullNameEn, 200),
    ...maxLengthError("Student Arabic full name", student.fullNameAr, 200),
    ...maxLengthError("Nationality", student.nationality, 120),
    ...maxLengthError("Address", student.addressLine, 300),
    ...maxLengthError("City", student.city, 120),
    ...maxLengthError("District", student.district, 120),
    ...optionalEmailErrors("Student email", student.studentEmail),
    ...optionalPhoneErrors("Student phone", student.studentPhone),
  );
  if (student.gender && student.gender.length > 50) errors.push("Gender must be 50 characters or fewer.");
  if (student.dateOfBirth && !isValidIsoDate(student.dateOfBirth)) errors.push("Student birth date must be a valid ISO date.");
  return errors;
}

function guardianErrors(form: RegistrationWizardFormState): string[] {
  const errors: string[] = [];
  if (!form.guardians.length) return ["At least one guardian is required."];
  if (form.guardians.filter((guardian) => guardian.isPrimary).length !== 1) {
    errors.push("Select exactly one primary guardian.");
  }
  form.guardians.forEach((guardian, index) => {
    const label = `Guardian ${index + 1}`;
    if (guardian.mode === "existing") {
      if (!guardian.existingGuardianId) errors.push(`${label}: select an existing guardian.`);
      else if (!uuidPattern.test(guardian.existingGuardianId)) errors.push(`${label}: selected guardian ID is invalid.`);
      return;
    }
    if (!hasAtLeastTwoNameParts(guardian.fullName)) errors.push(`${label}: full name must contain at least two words.`);
    if (!guardian.relation?.trim()) errors.push(`${label}: relation is required.`);
    if (!guardian.phonePrimary?.trim()) errors.push(`${label}: primary phone is required.`);
    errors.push(
      ...maxLengthError(`${label} full name`, guardian.fullName, 200),
      ...maxLengthError(`${label} relation`, guardian.relation, 100),
      ...maxLengthError(`${label} national ID`, guardian.nationalId, 30),
      ...maxLengthError(`${label} job title`, guardian.jobTitle, 120),
      ...maxLengthError(`${label} workplace`, guardian.workplace, 200),
      ...optionalPhoneErrors(`${label} primary phone`, guardian.phonePrimary),
      ...optionalPhoneErrors(`${label} secondary phone`, guardian.phoneSecondary),
      ...optionalEmailErrors(`${label} email`, guardian.email),
    );
  });
  return errors;
}

function enrollmentErrors(form: RegistrationWizardFormState): string[] {
  const { enrollment } = form;
  const errors: string[] = [];
  if (!enrollment.academicYearId) errors.push("Academic year is required.");
  else if (!uuidPattern.test(enrollment.academicYearId)) errors.push("Academic year ID is invalid.");
  if (!enrollment.classroomId) errors.push("Classroom is required.");
  else if (!uuidPattern.test(enrollment.classroomId)) errors.push("Classroom ID is invalid.");
  for (const [label, identifier] of [
    ["Term", enrollment.termId],
    ["Grade", enrollment.gradeId],
    ["Section", enrollment.sectionId],
  ] as const) {
    if (identifier && !uuidPattern.test(identifier)) errors.push(`${label} ID is invalid.`);
  }
  if (!enrollment.enrollmentDate) errors.push("Enrollment date is required.");
  else if (!isValidIsoDate(enrollment.enrollmentDate)) errors.push("Enrollment date must be a valid ISO date.");
  if (enrollment.status && enrollment.status !== "active") errors.push("Enrollment status must be active.");
  return errors;
}

export function validateRegistrationStep(
  form: RegistrationWizardFormState,
  step: RegistrationStep,
): string[] {
  if (step === 0) return studentErrors(form);
  if (step === 1) return guardianErrors(form);
  if (step === 2) {
    return [
      ...accountErrors("Student account", form.studentAccount),
      ...form.guardians.flatMap((guardian, index) =>
        accountErrors(`Guardian ${index + 1} account`, guardian.account),
      ),
    ];
  }
  if (step === 3) return enrollmentErrors(form);
  return [];
}

export function validateRegistrationForm(
  form: RegistrationWizardFormState,
): string[] {
  return ([0, 1, 2, 3] as RegistrationStep[]).flatMap((step) =>
    validateRegistrationStep(form, step),
  );
}
