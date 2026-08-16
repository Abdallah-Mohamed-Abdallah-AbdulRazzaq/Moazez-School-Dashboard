import type {
  PreferredDisplayLanguage,
  TeacherDirectoryDetail,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";

const managedFields: Array<keyof UpdateTeacherRequest> = [
  "contactEmail", "phone", "teacherCode",
  "firstNameAr", "lastNameAr", "firstNameEn", "lastNameEn", "gender",
  "department", "specialization", "employmentType", "experienceYears",
  "hireDate", "workingDays", "workStartTime", "workEndTime", "notesAr", "notesEn",
];

function sameValue(left: unknown, right: unknown) {
  return Array.isArray(left) && Array.isArray(right)
    ? JSON.stringify(left) === JSON.stringify(right)
    : left === right;
}

export function buildTeacherPatch(
  teacher: TeacherDirectoryDetail,
  candidate: UpdateTeacherRequest,
  preferredDisplayLanguage: PreferredDisplayLanguage,
) {
  const patch: UpdateTeacherRequest = {};
  const teacherFields: Record<string, unknown> = {
    ...teacher,
    workStartTime: teacher.workStartTime?.slice(0, 5) ?? null,
    workEndTime: teacher.workEndTime?.slice(0, 5) ?? null,
  };

  for (const field of managedFields) {
    if (field in candidate && !sameValue(candidate[field], teacherFields[field])) {
      Object.assign(patch, { [field]: candidate[field] });
    }
  }

  const namesChanged = ["firstNameAr", "lastNameAr", "firstNameEn", "lastNameEn"]
    .some((field) => field in patch);
  if (namesChanged) patch.preferredDisplayLanguage = preferredDisplayLanguage;

  return patch;
}
