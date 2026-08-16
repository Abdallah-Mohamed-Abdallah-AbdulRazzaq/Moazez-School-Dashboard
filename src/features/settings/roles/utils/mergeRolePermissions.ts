import type {
  RoleDefinition,
  SettingsRolePermissionsResponseDto,
} from "@/features/settings/types";

export function assertRolePermissionsResponseMatchesRole(
  expectedRoleId: string,
  response: SettingsRolePermissionsResponseDto,
): void {
  if (response.id !== expectedRoleId) {
    throw new Error("Role permissions response ID mismatch");
  }
}

export function mergeRolePermissions(
  roles: RoleDefinition[],
  response: SettingsRolePermissionsResponseDto,
): RoleDefinition[] {
  return roles.map((role) =>
    role.id === response.id
      ? { ...role, permissions: response.permissions }
      : role,
  );
}
