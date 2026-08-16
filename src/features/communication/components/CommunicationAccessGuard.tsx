"use client";

import { AccessDenied } from "@/components/ui";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface SinglePermissionGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
  permissions?: never;
}

interface MultiplePermissionsGuardProps {
  children: React.ReactNode;
  permission?: never;
  permissions: readonly PermissionKey[];
}

type CommunicationAccessGuardProps =
  | SinglePermissionGuardProps
  | MultiplePermissionsGuardProps;

export default function CommunicationAccessGuard({
  children,
  permission,
  permissions,
}: CommunicationAccessGuardProps) {
  const { hasPermission, isPermissionsReady } = usePermissions();
  const requiredPermissions = permissions ?? [permission];

  if (!isPermissionsReady) return null;
  if (requiredPermissions.every(hasPermission)) return <>{children}</>;

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
      <AccessDenied
        className="max-w-md"
        requiredPermissions={requiredPermissions}
      />
    </main>
  );
}
