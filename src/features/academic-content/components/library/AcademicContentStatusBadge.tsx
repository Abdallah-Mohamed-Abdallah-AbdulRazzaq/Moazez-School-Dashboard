"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentStatus } from "../../types/contracts";

const STATUS_STYLES: Record<AcademicContentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  SCHEDULED: "bg-violet-100 text-violet-800",
  PUBLISHED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-200 text-gray-700",
  ARCHIVED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AcademicContentStatusBadge({
  status,
}: {
  status: AcademicContentStatus;
}) {
  const t = useAcademicContentTranslations("statuses");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {t(status)}
    </span>
  );
}
