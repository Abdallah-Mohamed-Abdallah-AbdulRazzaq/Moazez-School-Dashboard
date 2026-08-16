import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import {
  fetchCredentialRoles,
  generateUserCredential,
  getBulkCredentialPreviewPayloadKey,
  mapBulkCredentialPreviewResponse,
  regenerateUserCredential,
} from "../credentialsService";
import type {
  BulkCredentialPreviewResponseDto,
  CredentialUserSummaryDto,
} from "../../types";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

const user: CredentialUserSummaryDto = {
  userId: "user-1",
  fullName: "Ahmed Ali",
  username: "ahmed",
  loginEmail: "ahmed@school.edu",
  contactEmail: "ahmed@example.com",
  userType: "school_user",
  roleId: "role-1",
  roleKey: "school_admin",
  roleName: "School Admin",
  status: "temporary_or_must_change",
  hasPassword: true,
  mustChangePassword: true,
  passwordChangedAt: null,
  passwordProvisionedAt: "2026-05-13T20:06:05.050Z",
  credentialVersion: 2,
  lastLoginAt: null,
  createdAt: "2026-05-13T20:03:55.605Z",
};

describe("bulk credential preview contract", () => {
  it("maps the production nested skipped-user response without reading email", () => {
    const response: BulkCredentialPreviewResponseDto = {
      totalMatched: 26,
      eligible: 0,
      skipped: 26,
      skippedReasons: {
        already_has_password: 25,
        disabled_user: 1,
      },
      sample: {
        eligible: [],
        skipped: [{ user, reason: "already_has_password" }],
      },
    };

    expect(mapBulkCredentialPreviewResponse(response)).toEqual({
      totalMatched: 26,
      eligibleCount: 0,
      skippedCount: 26,
      skippedReasons: {
        already_has_password: 25,
        disabled_user: 1,
      },
      recipients: [
        {
          userId: "user-1",
          fullName: "Ahmed Ali",
          username: "ahmed",
          loginEmail: "ahmed@school.edu",
          contactEmail: "ahmed@example.com",
          eligible: false,
          skipReason: "already_has_password",
        },
      ],
    });
  });

  it("generates the same preview key for equivalent array ordering", () => {
    const first = getBulkCredentialPreviewPayloadKey({
      scope: "role",
      roleKeys: ["teacher", "parent"],
      includeUsersWithPassword: true,
    });
    const second = getBulkCredentialPreviewPayloadKey({
      scope: "role",
      roleKeys: ["parent", "teacher"],
      includeUsersWithPassword: true,
      includeDisabledUsers: false,
    });

    expect(first).toBe(second);
  });
});

describe("single-user credential contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["generate", generateUserCredential],
    ["regenerate", regenerateUserCredential],
  ] as const)("posts %s without a request body", async (operation, call) => {
    vi.mocked(apiPost).mockResolvedValue({
      user: { userId: "user-1", fullName: "Nour Ali", username: "nour.ali", loginEmail: "nour@school.test", contactEmail: null },
      temporaryPassword: "one-time-secret",
      mustChangePassword: true,
      generatedAt: "2026-07-21T09:00:00Z",
      credentialVersion: 2,
    });

    await call("user-1");

    expect(apiPost).toHaveBeenCalledWith(`/settings/users/user-1/credentials/${operation}`);
  });
});

describe("credential role options", () => {
  beforeEach(() => vi.clearAllMocks());

  it("includes roles without credential users and preserves known backend role keys", async () => {
    vi.mocked(apiGet).mockImplementation((path: string) => {
      if (path === "/settings/roles?page=1&limit=100") {
        return Promise.resolve({
          items: [
            { id: "role-1", name: "School Admin", permissions: [] },
            { id: "role-2", name: "Teacher", permissions: [] },
            { id: "role-3", name: "Empty Custom Role", permissions: [] },
          ],
          pagination: { page: 1, limit: 100, total: 3 },
        });
      }
      if (path === "/settings/users/credentials/status?page=1&limit=100") {
        return Promise.resolve({
          items: [
            { ...user, userId: "user-1" },
            { ...user, userId: "user-2" },
          ],
          pagination: { page: 1, limit: 2, total: 3 },
        });
      }
      if (path === "/settings/users/credentials/status?page=2&limit=100") {
        return Promise.resolve({
          items: [
            {
              ...user,
              userId: "user-3",
              roleId: "role-2",
              roleKey: "teacher",
              roleName: "Teacher",
            },
          ],
          pagination: { page: 2, limit: 2, total: 3 },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });

    await expect(fetchCredentialRoles()).resolves.toEqual([
      { id: "role-1", key: "school_admin", name: "School Admin" },
      { id: "role-2", key: "teacher", name: "Teacher" },
      { id: "role-3", key: undefined, name: "Empty Custom Role" },
    ]);
    expect(apiGet).toHaveBeenCalledWith(
      "/settings/users/credentials/status?page=1&limit=100",
    );
    expect(apiGet).toHaveBeenCalledWith(
      "/settings/users/credentials/status?page=2&limit=100",
    );
  });
});
