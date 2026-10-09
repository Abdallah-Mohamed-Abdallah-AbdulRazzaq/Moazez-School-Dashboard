"use client";

import { AccessDenied } from "@/components/ui/access-denied/AccessDenied";
import {
  usePermissions,
  type PermissionKey,
} from "@/hooks/usePermissions";

const VIEW_PERMISSION = "academics.academic_content.view" as const;

export default function AcademicContentAccessGuard({
  children,
  requiredPermission = VIEW_PERMISSION,
}: {
  children: React.ReactNode;
  requiredPermission?: PermissionKey;
}) {
  const { hasPermission, isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) return null;
  if (hasPermission(requiredPermission)) return <>{children}</>;

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
      <AccessDenied
        className="max-w-md"
        requiredPermissions={[requiredPermission]}
      />
    </main>
  );
}
