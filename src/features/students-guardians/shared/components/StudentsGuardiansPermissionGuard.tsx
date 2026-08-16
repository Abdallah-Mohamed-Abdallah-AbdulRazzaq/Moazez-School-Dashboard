"use client";

import { AccessDenied } from "@/components/ui";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface StudentsGuardiansPermissionGuardProps {
  children: React.ReactNode;
  permissions: PermissionKey[];
}

export default function StudentsGuardiansPermissionGuard({
  children,
  permissions,
}: StudentsGuardiansPermissionGuardProps) {
  const { hasAllPermissions, isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) return null;
  if (hasAllPermissions(permissions)) return <>{children}</>;

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
      <AccessDenied className="max-w-md" requiredPermissions={permissions} />
    </main>
  );
}
