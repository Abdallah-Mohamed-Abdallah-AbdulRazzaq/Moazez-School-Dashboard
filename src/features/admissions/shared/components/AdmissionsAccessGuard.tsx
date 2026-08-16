"use client";

import { AccessDenied } from "@/components/ui";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface AdmissionsAccessGuardProps {
  permission: PermissionKey;
  children: React.ReactNode;
}

export function AdmissionsAccessDenied({
  permission,
}: {
  permission?: PermissionKey;
}) {
  return (
    <AccessDenied
      className="max-w-md"
      requiredPermissions={permission ? [permission] : undefined}
    />
  );
}

export default function AdmissionsAccessGuard({
  permission,
  children,
}: AdmissionsAccessGuardProps) {
  const { hasPermission, isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) return null;

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
      <AdmissionsAccessDenied permission={permission} />
    </main>
  );
}
