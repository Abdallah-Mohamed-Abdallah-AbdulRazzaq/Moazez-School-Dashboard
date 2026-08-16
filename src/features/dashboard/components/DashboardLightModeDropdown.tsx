"use client";

import { LightModeDropdown } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardPermissionGuard from "./DashboardPermissionGuard";

export default function DashboardLightModeDropdown() {
  const { hasPermission, isPermissionsReady } = usePermissions();

  return (
    <DashboardPermissionGuard
      fallback={null}
      permission="dashboard.light_mode_dropdown.view"
    >
      <DashboardPermissionGuard
        fallback={null}
        permission="dashboard.widgets.view"
      >
        <LightModeDropdown
          canManageTodos={
            isPermissionsReady && hasPermission("dashboard.todos.manage")
          }
        />
      </DashboardPermissionGuard>
    </DashboardPermissionGuard>
  );
}
