import type {
  CreateTeacherFormState,
  CreateTeacherRequest,
  EditTeacherFormState,
  PreferredDisplayLanguage,
  RehireTeacherRequest,
  TeacherDirectoryDetail,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";

const nullableText = (text: string) => text.trim() || null;
const optionalNumber = (text: string) => (text === "" ? null : Number(text));

export function emptyCreateTeacherForm(
  preferredDisplayLanguage: PreferredDisplayLanguage,
): CreateTeacherFormState {
  return {
    identity: {
      identityMode: "username",
      username: "",
      loginEmail: "",
      contactEmail: "",
      phone: "",
    },
    profile: {
      teacherCode: "",
      firstNameAr: "",
      lastNameAr: "",
      firstNameEn: "",
      lastNameEn: "",
      preferredDisplayLanguage,
      gender: "",
      department: "",
      specialization: "",
      employmentType: "",
      experienceYears: "",
      hireDate: "",
      notesAr: "",
      notesEn: "",
    },
    schedule: { workingDays: [], workStartTime: "", workEndTime: "" },
    employmentStatus: "ACTIVE",
  };
}

export function detailToEditForm(
  teacher: TeacherDirectoryDetail,
  preferredDisplayLanguage: PreferredDisplayLanguage,
): EditTeacherFormState {
  return {
    identity: {
      identityMode: teacher.username ? "username" : "loginEmail",
      username: teacher.username ?? "",
      loginEmail: teacher.loginEmail,
      contactEmail: teacher.contactEmail ?? "",
      phone: teacher.phone ?? "",
    },
    profile: {
      teacherCode: teacher.teacherCode ?? "",
      firstNameAr: teacher.firstNameAr ?? "",
      lastNameAr: teacher.lastNameAr ?? "",
      firstNameEn: teacher.firstNameEn ?? "",
      lastNameEn: teacher.lastNameEn ?? "",
      preferredDisplayLanguage,
      gender: teacher.gender ?? "",
      department: teacher.department ?? "",
      specialization: teacher.specialization ?? "",
      employmentType: teacher.employmentType ?? "",
      experienceYears: teacher.experienceYears?.toString() ?? "",
      hireDate: teacher.hireDate ?? "",
      notesAr: teacher.notesAr ?? "",
      notesEn: teacher.notesEn ?? "",
    },
    schedule: {
      workingDays: teacher.workingDays,
      workStartTime: teacher.workStartTime?.slice(0, 5) ?? "",
      workEndTime: teacher.workEndTime?.slice(0, 5) ?? "",
    },
  };
}

function identityRequest(identity: EditTeacherFormState["identity"]) {
  return identity.identityMode === "username"
    ? { username: identity.username.trim() }
    : { loginEmail: identity.loginEmail.trim() };
}

function editableRequest(form: EditTeacherFormState): UpdateTeacherRequest {
  const { profile, schedule, identity } = form;
  return {
    ...identityRequest(identity),
    contactEmail: nullableText(identity.contactEmail),
    phone: nullableText(identity.phone),
    teacherCode: profile.teacherCode.trim(),
    firstNameAr: nullableText(profile.firstNameAr),
    lastNameAr: nullableText(profile.lastNameAr),
    firstNameEn: nullableText(profile.firstNameEn),
    lastNameEn: nullableText(profile.lastNameEn),
    preferredDisplayLanguage: profile.preferredDisplayLanguage || undefined,
    gender: profile.gender || undefined,
    department: nullableText(profile.department),
    specialization: nullableText(profile.specialization),
    employmentType: profile.employmentType || null,
    experienceYears: optionalNumber(profile.experienceYears),
    hireDate: nullableText(profile.hireDate),
    workingDays: [...new Set(schedule.workingDays)],
    workStartTime: nullableText(schedule.workStartTime),
    workEndTime: nullableText(schedule.workEndTime),
    notesAr: nullableText(profile.notesAr),
    notesEn: nullableText(profile.notesEn),
  };
}

export function createFormToRequest(
  form: CreateTeacherFormState,
): CreateTeacherRequest {
  return {
    ...editableRequest(form),
    teacherCode: form.profile.teacherCode.trim(),
    firstNameAr: form.profile.firstNameAr.trim(),
    lastNameAr: form.profile.lastNameAr.trim(),
    firstNameEn: form.profile.firstNameEn.trim(),
    lastNameEn: form.profile.lastNameEn.trim(),
    preferredDisplayLanguage: form.profile.preferredDisplayLanguage as CreateTeacherRequest["preferredDisplayLanguage"],
    gender: form.profile.gender as CreateTeacherRequest["gender"],
    employmentStatus: form.employmentStatus,
  };
}

export function editFormToRequest(form: EditTeacherFormState): UpdateTeacherRequest {
  const request = editableRequest(form);
  delete request.username;
  delete request.loginEmail;
  return request;
}

export function editFormToRehireRequest(
  form: EditTeacherFormState,
): RehireTeacherRequest {
  const request = editableRequest(form);
  return {
    teacherCode: form.profile.teacherCode.trim(),
    firstNameAr: form.profile.firstNameAr.trim(),
    lastNameAr: form.profile.lastNameAr.trim(),
    firstNameEn: form.profile.firstNameEn.trim(),
    lastNameEn: form.profile.lastNameEn.trim(),
    preferredDisplayLanguage: form.profile.preferredDisplayLanguage as RehireTeacherRequest["preferredDisplayLanguage"],
    gender: form.profile.gender as RehireTeacherRequest["gender"],
    department: request.department,
    specialization: request.specialization,
    employmentType: request.employmentType,
    experienceYears: request.experienceYears,
    hireDate: request.hireDate,
    workingDays: request.workingDays,
    workStartTime: request.workStartTime,
    workEndTime: request.workEndTime,
    notesAr: request.notesAr,
    notesEn: request.notesEn,
  };
}
