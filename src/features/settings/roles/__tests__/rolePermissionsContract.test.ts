import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiPut: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: apiMocks.apiPut,
}));

import { replaceSettingsRolePermissions } from "@/features/settings/services/settingsRolesService";
import {
  assertRolePermissionsResponseMatchesRole,
  mergeRolePermissions,
} from "@/features/settings/roles/utils/mergeRolePermissions";
import type { RoleDefinition } from "@/features/settings/types";

const selectedRole: RoleDefinition = {
  id: "role-1",
  key: "academic_coordinator",
  name: "Academic Coordinator",
  description: "Coordinates academics",
  isSystem: false,
  memberCount: 4,
  permissions: ["settings.users.view"],
};

const otherRole: RoleDefinition = {
  id: "role-2",
  key: "teacher",
  name: "Teacher",
  description: "Teaching role",
  isSystem: true,
  memberCount: 12,
  permissions: ["students.records.view"],
};

describe("role permissions response contract", () => {
  beforeEach(() => {
    apiMocks.apiPut.mockReset();
  });

  it("returns the narrow backend response without mapping it as a full role", async () => {
    apiMocks.apiPut.mockResolvedValue({
      id: "role-1",
      permissions: ["settings.users.manage"],
    });

    const response = await replaceSettingsRolePermissions("role-1", [
      "settings.users.manage",
    ]);

    expect(response).toEqual({
      id: "role-1",
      permissions: ["settings.users.manage"],
    });
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/roles/role-1/permissions",
      { permissions: ["settings.users.manage"] },
    );
  });

  it("updates permissions while preserving all role metadata", () => {
    const roles = [selectedRole, otherRole];

    const updatedRoles = mergeRolePermissions(roles, {
      id: "role-1",
      permissions: ["settings.users.manage"],
    });

    expect(updatedRoles[0]).toEqual({
      id: "role-1",
      key: "academic_coordinator",
      name: "Academic Coordinator",
      description: "Coordinates academics",
      isSystem: false,
      memberCount: 4,
      permissions: ["settings.users.manage"],
    });
    expect(updatedRoles[1]).toBe(otherRole);
  });

  it("rejects a permissions response for a different role", () => {
    expect(() =>
      assertRolePermissionsResponseMatchesRole("role-1", {
        id: "role-2",
        permissions: [],
      }),
    ).toThrow("Role permissions response ID mismatch");
  });
});
