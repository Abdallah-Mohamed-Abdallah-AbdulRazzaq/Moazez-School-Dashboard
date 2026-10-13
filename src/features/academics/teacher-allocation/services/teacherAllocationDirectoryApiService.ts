import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import type { Teacher } from "./teacherAllocationService";

export interface TeacherAllocationTeacherDirectory {
  teachers: Teacher[];
}

function mapDirectoryTeacher(teacher: TeacherDirectoryListItem): Teacher {
  return {
    id: teacher.userId,
    nameAr:
      [teacher.firstNameAr, teacher.lastNameAr].filter(Boolean).join(" ") ||
      teacher.displayName.fullName,
    nameEn:
      [teacher.firstNameEn, teacher.lastNameEn].filter(Boolean).join(" ") ||
      teacher.displayName.fullName,
    email: teacher.contactEmail || teacher.loginEmail,
    isActive:
      (teacher.accountStatus === "ACTIVE" ||
        teacher.accountStatus === "INVITED") &&
      teacher.membershipStatus === "ACTIVE" &&
      teacher.membershipEndedAt === null &&
      teacher.employmentStatus === "ACTIVE" &&
      teacher.profileCompleteness.isComplete,
  };
}

export async function fetchTeacherAllocationTeacherDirectory(): Promise<TeacherAllocationTeacherDirectory> {
  const records: TeacherDirectoryListItem[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const result = await teacherApi.list({ page, limit });
    records.push(...result.items);
    if (result.items.length === 0 || page * limit >= result.pagination.total)
      break;
    page += 1;
  }
  return { teachers: records.map(mapDirectoryTeacher) };
}

