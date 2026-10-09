"use client";

import { useLocale } from "next-intl";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentLibrarySummary } from "../../types/contracts";

function dateOnlyLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00.000Z`),
  );
}

function instantLabel(instant: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));
}

export default function AcademicContentSummary({
  summary,
}: {
  summary: AcademicContentLibrarySummary | null;
}) {
  const locale = useLocale();
  const t = useAcademicContentTranslations();
  if (!summary) return <span className="text-gray-500">{t("library.summary.none")}</span>;

  switch (summary.type) {
    case "TEACHER_PREPARATION":
      return <span>{summary.topic || t("library.summary.no_topic")}</span>;
    case "WEEKLY_PLAN":
      return (
        <span>
          {t("library.summary.week", {
            start: dateOnlyLabel(summary.weekStartDate, locale),
            end: dateOnlyLabel(summary.weekEndDate, locale),
          })}
        </span>
      );
    case "GUARDIAN_WEEKLY_NOTE":
      return (
        <span>
          {t(`priorities.${summary.priority}`)} · {t(
            summary.requiresAcknowledgement
              ? "library.summary.acknowledgement_required"
              : "library.summary.acknowledgement_not_required",
          )}
        </span>
      );
    case "SUBJECT_RESOURCE":
      return <span>{t(`resource_categories.${summary.resourceCategory}`)}</span>;
    case "ONLINE_SESSION":
      return (
        <span>
          {t("library.summary.session", {
            platform: t(`platforms.${summary.platform}`),
            start: `${instantLabel(summary.startAt, locale)} – ${new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(summary.endAt))}`,
          })}
        </span>
      );
  }
}
