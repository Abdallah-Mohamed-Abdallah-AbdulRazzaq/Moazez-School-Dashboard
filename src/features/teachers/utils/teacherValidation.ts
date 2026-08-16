import type {
  CreateTeacherFormState,
  EditTeacherFormState,
  TeacherFormErrors,
} from "@/features/teachers/types/index";

export function validateTeacherForm(
  form: CreateTeacherFormState | EditTeacherFormState,
) {
  const errors: TeacherFormErrors = {};
  const { identity, profile, schedule } = form;

  if (identity.identityMode === "username" && !identity.username.trim()) {
    errors.username = "required";
  }
  if (identity.identityMode === "loginEmail" && !identity.loginEmail.trim()) {
    errors.loginEmail = "required";
  }
  if (!profile.teacherCode.trim()) errors.teacherCode = "required";
  if (!profile.firstNameAr.trim()) errors.firstNameAr = "required";
  if (!profile.lastNameAr.trim()) errors.lastNameAr = "required";
  if (!profile.firstNameEn.trim()) errors.firstNameEn = "required";
  if (!profile.lastNameEn.trim()) errors.lastNameEn = "required";
  if (!profile.preferredDisplayLanguage) errors.preferredDisplayLanguage = "required";
  if (!profile.gender) errors.gender = "required";

  const experienceYears = Number(profile.experienceYears);
  if (
    profile.experienceYears !== "" &&
    (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60)
  ) {
    errors.experienceYears = "range";
  }

  if (Boolean(schedule.workStartTime) !== Boolean(schedule.workEndTime)) {
    errors.workTime = "paired";
  }

  return errors;
}

export function validateRehireTeacherForm(form: EditTeacherFormState) {
  const errors = validateTeacherForm(form);
  delete errors.username;
  delete errors.loginEmail;
  return errors;
}
