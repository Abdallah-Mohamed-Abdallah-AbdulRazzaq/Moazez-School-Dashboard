import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import type { RoleDefinition, SettingsUserRecord } from "@/features/settings/types";
import type { Teacher } from "@/features/academics/teacher-allocation/services/teacherAllocationService";

function isTeacherRole(role: RoleDefinition) {
  const roleKey = (role.key || "").toLowerCase();
  const roleName = (role.name || "").toLowerCase();
  return (
    roleKey === "teacher" ||
    roleKey.endsWith(".teacher") ||
    roleKey.endsWith("_teacher") ||
    roleName === "teacher" ||
    roleName.includes("teacher")
  );
}

function mapUserToTeacher(user: SettingsUserRecord): Teacher {
  return {
    id: user.id,
    nameAr: user.fullName,
    nameEn: user.fullName,
    email: user.email,
    subjects: [],
    isActive: (user.status || "").toLowerCase() === "active",
  };
}

export interface TeacherAllocationTeacherDirectory {
  roleId: string;
  teachers: Teacher[];
}

export async function fetchTeacherAllocationTeacherDirectory(): Promise<TeacherAllocationTeacherDirectory> {
  const rolesResult = await fetchSettingsRoles({ limit: 100 });
  const teacherRole = rolesResult.items.find(isTeacherRole);

  if (!teacherRole) {
    return { roleId: "", teachers: [] };
  }

  const users: SettingsUserRecord[] = [];
  const limit = 100;
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (users.length < total) {
    const usersResult = await fetchSettingsUsers({
      page,
      limit,
      roleId: teacherRole.id,
      status: "active",
    });
    users.push(...usersResult.items);
    total = usersResult.pagination.total;

    if (
      usersResult.items.length === 0 ||
      usersResult.pagination.page < page ||
      page * limit >= total
    ) {
      break;
    }
    page += 1;
  }

  return {
    roleId: teacherRole.id,
    teachers: Array.from(
      new Map(users.map((user) => [user.id, user])).values(),
      mapUserToTeacher,
    ),
  };
}

export async function fetchTeacherAllocationTeachers(): Promise<Teacher[]> {
  const directory = await fetchTeacherAllocationTeacherDirectory();
  return directory.teachers;
}
