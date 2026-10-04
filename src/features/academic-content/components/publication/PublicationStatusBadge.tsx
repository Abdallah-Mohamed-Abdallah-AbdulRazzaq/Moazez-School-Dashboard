"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentPublicationStatus } from "../../types/contracts";

const statusStyles: Record<AcademicContentPublicationStatus, string> = {
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  PUBLISHED: "border-green-200 bg-green-50 text-green-700",
  EXPIRED: "border-gray-200 bg-gray-100 text-gray-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

interface PublicationStatusBadgeProps {
  status: AcademicContentPublicationStatus;
}

export default function PublicationStatusBadge({
  status,
}: PublicationStatusBadgeProps) {
  const t = useAcademicContentTranslations("publication.statuses");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {t(status)}
    </span>
  );
}
