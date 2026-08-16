"use client";

import { useTranslations } from "next-intl";
import type { AuditSeverity, SettingsStatus } from "@/features/settings/types";

interface SettingsStatusBadgeProps {
  status: SettingsStatus | AuditSeverity;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  connected: "bg-green-100 text-green-700",
  disconnected: "bg-gray-100 text-gray-700",
  needs_attention: "bg-red-100 text-red-700",
  invited: "bg-blue-100 text-blue-700",
  inactive: "bg-gray-100 text-gray-700",
  completed: "bg-green-100 text-green-700",
  running: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function SettingsStatusBadge({ status }: SettingsStatusBadgeProps) {
  const t = useTranslations("settings.shared.status");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] || statusStyles.disconnected}`}
    >
      {t(status)}
    </span>
  );
}
