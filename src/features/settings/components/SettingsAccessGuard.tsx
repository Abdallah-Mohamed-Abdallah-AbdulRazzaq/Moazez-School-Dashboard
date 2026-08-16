"use client";

import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface SettingsAccessGuardProps {
  permission: PermissionKey;
  children: React.ReactNode;
}

export default function SettingsAccessGuard({
  permission,
  children,
}: SettingsAccessGuardProps) {
  const { hasPermission } = usePermissions();
  const t = useTranslations("settings.access");

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-amber-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-amber-800">{t("description")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
