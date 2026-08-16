import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import { fetchTeacherAllocationTeachers } from "@/features/academics/teacher-allocation/services/teacherAllocationTeachersApiService";

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchSettingsRoles: vi.fn(),
}));

vi.mock("@/features/settings/services/settingsUsersService", () => ({
  fetchSettingsUsers: vi.fn(),
}));

const mockedFetchSettingsRoles = vi.mocked(fetchSettingsRoles);
const mockedFetchSettingsUsers = vi.mocked(fetchSettingsUsers);

describe("teacherAllocationTeachersApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads active users from the backend teacher role without creating fake teachers", async () => {
    mockedFetchSettingsRoles.mockResolvedValueOnce({
      items: [
        {
          id: "role-1",
          key: "academics_teacher",
          name: "Academic Teacher",
          description: "Teachers",
          isSystem: true,
          memberCount: 1,
          permissions: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
      },
    });
    mockedFetchSettingsUsers.mockResolvedValueOnce({
      items: [
        {
          id: "teacher-user-1",
          fullName: "Mariam Ali",
          email: "teacher@example.test",
          status: "active",
          roles: [],
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });

    await expect(fetchTeacherAllocationTeachers()).resolves.toEqual([
      {
        id: "teacher-user-1",
        nameAr: "Mariam Ali",
        nameEn: "Mariam Ali",
        email: "teacher@example.test",
        subjects: [],
        isActive: true,
      },
    ]);
    expect(mockedFetchSettingsRoles).toHaveBeenCalledWith({ limit: 100 });
    expect(mockedFetchSettingsUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      roleId: "role-1",
      status: "active",
    });
  });

  it("returns an honest empty list when the backend has no teacher role", async () => {
    mockedFetchSettingsRoles.mockResolvedValueOnce({
      items: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
      },
    });

    await expect(fetchTeacherAllocationTeachers()).resolves.toEqual([]);
    expect(mockedFetchSettingsUsers).not.toHaveBeenCalled();
  });

  it("loads every active-teacher page for allocation reference data", async () => {
    mockedFetchSettingsRoles.mockResolvedValueOnce({
      items: [
        {
          id: "role-1",
          key: "teacher",
          name: "Teacher",
          description: "Teachers",
          isSystem: true,
          memberCount: 101,
          permissions: [],
        },
      ],
      pagination: { page: 1, limit: 100, total: 1 },
    });
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: `teacher-${index + 1}`,
      fullName: `Teacher ${index + 1}`,
      email: `teacher-${index + 1}@example.test`,
      roleId: "role-1",
      status: "active" as const,
    }));
    mockedFetchSettingsUsers
      .mockResolvedValueOnce({
        items: firstPage,
        pagination: { page: 1, limit: 100, total: 101 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "teacher-101",
            fullName: "Teacher 101",
            email: "teacher-101@example.test",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: 2, limit: 100, total: 101 },
      });

    await expect(fetchTeacherAllocationTeachers()).resolves.toHaveLength(101);
    expect(mockedFetchSettingsUsers).toHaveBeenNthCalledWith(2, {
      page: 2,
      limit: 100,
      roleId: "role-1",
      status: "active",
    });
  });
});
