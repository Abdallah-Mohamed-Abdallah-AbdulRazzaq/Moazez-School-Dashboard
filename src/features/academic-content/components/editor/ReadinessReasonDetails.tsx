"use client";

import { useLocale } from "next-intl";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";

interface ReadinessReasonDetailsProps {
  details?: Record<string, unknown>;
}

const FIELD_KEYS: Readonly<Record<string, string>> = {
  title: "metadata.field_title",
  description: "metadata.field_description",
  audience: "metadata.audience",
  academicYearId: "editor.academic_year",
  termId: "editor.term",
  subjectId: "targets.subject",
  stageId: "targets.stage",
  gradeId: "targets.grade",
  sectionId: "targets.section",
  classroomId: "targets.classroom",
  topic: "fields.topic",
  body: "fields.note_body",
  joinUrl: "fields.join_url",
  startAt: "fields.starts_at",
  endAt: "fields.ends_at",
  timezone: "fields.timezone",
};

export default function ReadinessReasonDetails({
  details,
}: ReadinessReasonDetailsProps) {
  const t = useAcademicContentTranslations();
  const locale = useLocale();
  const entries: { label: string; display: string }[] = [];
  if (
    typeof details?.missingCount === "number" &&
    Number.isFinite(details.missingCount)
  ) {
    entries.push({
      label: t("readiness.details.missing_count"),
      display: new Intl.NumberFormat(locale).format(details.missingCount),
    });
  }
  if (Array.isArray(details?.fields)) {
    const fields = details.fields.flatMap((field: unknown) =>
      typeof field === "string" && FIELD_KEYS[field]
        ? [t(FIELD_KEYS[field])]
        : [],
    );
    if (fields.length > 0)
      entries.push({
        label: t("readiness.details.fields"),
        display: new Intl.ListFormat(locale).format(fields),
      });
  }
  if (typeof details?.retryable === "boolean") {
    entries.push({
      label: t("readiness.details.retryable"),
      display: t(details.retryable ? "revisions.yes" : "revisions.no"),
    });
  }

  if (entries.length === 0) return null;

  return (
    <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-[max-content_1fr]">
      {entries.map(({ label, display }) => (
        <div key={label} className="contents">
          <dt className="font-medium text-gray-700">{label}</dt>
          <dd className="break-words">{display}</dd>
        </div>
      ))}
    </dl>
  );
}
