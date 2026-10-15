"use client";

import { useTranslations } from "next-intl";
import type { ValidationConflictGroup } from "../services/timetableValidationReview";

export default function ValidationConflictGroupSummary({
  group,
}: {
  group: ValidationConflictGroup;
}) {
  const t = useTranslations("academics.timetable.validationEnhancements");
  const count =
    group.conflict.entryIds.length + group.conflict.proposedIndexes.length;
  return (
    <span className="mt-2 block space-y-1 text-xs text-slate-600">
      {count > 0 && (
        <span className="block">{t("affectedLessons", { count })}</span>
      )}
      {group.reports > 1 && (
        <span className="block">
          {t("groupedReports", { count: group.reports })}
        </span>
      )}
      {group.messages.slice(1).map((message) => (
        <span className="block text-red-800" key={message}>
          {message}
        </span>
      ))}
    </span>
  );
}
