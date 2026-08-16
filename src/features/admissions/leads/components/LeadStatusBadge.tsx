// FILE: src/components/leads/LeadStatusBadge.tsx

import { useTranslations } from "next-intl";
import { LeadStatus } from "@/features/admissions/types/enums";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<LeadStatus, { className: string }> = {
  New: {
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  Contacted: {
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  Converted: {
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  Closed: {
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },
};

// Map status values to translation keys
const statusTranslationKeys: Record<LeadStatus, string> = {
  New: "new",
  Contacted: "contacted",
  Converted: "converted",
  Closed: "closed",
};

export default function LeadStatusBadge({
  status,
  size = "sm",
}: LeadStatusBadgeProps) {
  const t = useTranslations("admissions.leads");
  const config = statusConfig[status];
  const translationKey = statusTranslationKeys[status];
  const sizeClass = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}
    >
      {t(translationKey)}
    </span>
  );
}
