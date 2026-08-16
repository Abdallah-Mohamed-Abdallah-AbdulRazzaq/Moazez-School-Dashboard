"use client";

import { useTranslations } from "next-intl";

interface TeacherAllocationTechnicalDetailsProps {
  traceId?: string;
  details?: string[];
}

export default function TeacherAllocationTechnicalDetails({
  traceId,
  details = [],
}: TeacherAllocationTechnicalDetailsProps) {
  const t = useTranslations("academics.teacherAllocation.technicalDetails");

  if (!traceId && details.length === 0) {
    return null;
  }

  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer font-medium">{t("summary")}</summary>
      <div className="mt-2 space-y-1 rounded-md bg-white/70 p-2 font-mono text-[11px]">
        {traceId && <div>{t("traceId")}: {traceId}</div>}
        {details.map((detailMessage, detailIndex) => (
          <div key={`${detailMessage}-${detailIndex}`}>{detailMessage}</div>
        ))}
      </div>
    </details>
  );
}
