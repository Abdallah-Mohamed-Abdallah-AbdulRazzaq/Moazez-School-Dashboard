import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import type { TeacherDirectoryListItem } from "@/features/teachers/types";
import { fetchTeacherAllocationTeacherDirectory } from "../teacherAllocationDirectoryApiService";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn() }));

function teacher(
  overrides: Partial<TeacherDirectoryListItem> = {},
): TeacherDirectoryListItem {
  return {
    id: "profile-1",
    userId: "user-1",
    loginEmail: "teacher@example.test",
    username: "teacher",
    contactEmail: null,
    phone: null,
    teacherCode: "T001",
    firstNameAr: "مريم",
    lastNameAr: "علي",
    firstNameEn: "Mariam",
    lastNameEn: "Ali",
    displayName: {
      firstName: "Mariam",
      lastName: "Ali",
      fullName: "Mariam Ali",
    },
    gender: "FEMALE",
    department: null,
    specialization: null,
    accountStatus: "INVITED",
    membershipStatus: "ACTIVE",
    membershipEndedAt: null,
    employmentStatus: "ACTIVE",
    profileCompleteness: { isComplete: true, missingFields: [] },
    credentialSummary: {
      hasPassword: true,
      status: "set",
      mustChangePassword: false,
      passwordProvisionedAt: null,
      passwordChangedAt: null,
      credentialVersion: 1,
    },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("teacher allocation directory", () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset();
  });

  it.each([
    ["active", { accountStatus: "ACTIVE" }, true],
    ["invited", {}, true],
    ["disabled", { accountStatus: "DISABLED" }, false],
    ["inactive membership", { membershipStatus: "INACTIVE" }, false],
    ["ended membership", { membershipEndedAt: "2026-10-01T00:00:00Z" }, false],
    ["terminated", { employmentStatus: "TERMINATED" }, false],
    [
      "incomplete profile",
      {
        profileCompleteness: {
          isComplete: false,
          missingFields: ["teacherCode"],
        },
      },
      false,
    ],
  ] as const)(
    "maps canonical user IDs and marks %s eligibility from the existing contract",
    async (_scenario, overrides, eligible) => {
      vi.mocked(apiGet).mockResolvedValue({
        items: [teacher(overrides as Partial<TeacherDirectoryListItem>)],
        pagination: { page: 1, limit: 100, total: 1 },
      });
      expect((await fetchTeacherAllocationTeacherDirectory()).teachers).toEqual([
        {
          id: "user-1",
          nameAr: "مريم علي",
          nameEn: "Mariam Ali",
          email: "teacher@example.test",
          isActive: eligible,
        },
      ]);
      expect(apiGet).toHaveBeenCalledWith("/teachers", {
        params: { page: 1, limit: 100 },
      });
    },
  );

  it("loads subsequent directory pages without hiding invited or retained assignees", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      teacher({ id: "profile-" + index, userId: "user-" + index }),
    );
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: firstPage,
        pagination: { page: 1, limit: 100, total: 101 },
      })
      .mockResolvedValueOnce({
        items: [
          teacher({
            id: "profile-last",
            userId: "user-last",
            accountStatus: "DISABLED",
          }),
        ],
        pagination: { page: 2, limit: 100, total: 101 },
      });
    const { teachers: result } = await fetchTeacherAllocationTeacherDirectory();
    expect(result).toHaveLength(101);
    expect(result[100]).toMatchObject({ id: "user-last", isActive: false });
  });

  it("propagates directory failures instead of reporting no teachers", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("directory unavailable"));
    await expect(fetchTeacherAllocationTeacherDirectory()).rejects.toThrow(
      "directory unavailable",
    );
  });
});
