"use client";

import { useLocale } from "next-intl";
import { RichTextContent } from "@/components/ui/rich-text-content";
import type { AcademicContentRevisionDetail } from "../../types/contracts";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { formatRevisionDateTime } from "./revisionSnapshotFormatting";

const HIDDEN_REFERENCE_FIELDS = new Set([
  "curriculumId",
  "curriculumUnitId",
  "curriculumLessonId",
  "lessonPlanId",
  "lessonPlanItemId",
  "timetableEntryId",
  "homeworkAssignmentIds",
  "gradeAssessmentIds",
]);

const RICH_TEXT_FIELDS = new Set([
  "resourceNotes",
  "assessmentNotes",
  "teacherNotes",
]);

const DETAIL_FIELD_KEYS: Record<string, string> = {
  topic: "fields.topic",
  objectives: "fields.objectives",
  learningOutcomes: "fields.learning_outcomes",
  teachingStrategies: "fields.teaching_strategies",
  activities: "fields.activities",
  resourceNotes: "fields.resource_notes",
  assessmentNotes: "fields.assessment_notes",
  teacherNotes: "fields.teacher_notes",
  weekStartDate: "fields.week_start",
  weekEndDate: "fields.week_end",
  topics: "fields.topics",
  expectedHomework: "fields.expected_homework",
  upcomingAssessments: "fields.upcoming_assessments",
  notes: "fields.notes",
  body: "fields.note_body",
  priority: "fields.priority",
  requiresAcknowledgement: "fields.requires_acknowledgement",
  resourceCategory: "fields.resource_category",
  platform: "fields.platform",
  providerName: "fields.provider_name",
  joinUrl: "fields.join_url",
  accessCode: "fields.access_code",
  startAt: "fields.starts_at",
  endAt: "fields.ends_at",
  timezone: "fields.timezone",
  instructions: "fields.instructions",
};

function detailLabel(field: string, translate: (key: string) => string) {
  const translationKey = DETAIL_FIELD_KEYS[field];
  if (translationKey) return translate(translationKey);
  return field.replace(/([a-z])([A-Z])/gu, "$1 $2");
}

function DetailValue({
  field,
  detailValue,
}: {
  field: string;
  detailValue: unknown;
}) {
  const locale = useLocale();
  const t = useAcademicContentTranslations();

  if (RICH_TEXT_FIELDS.has(field)) {
    return <RichTextContent value={String(detailValue)} className="leading-6" />;
  }

  if (Array.isArray(detailValue)) {
    return (
      <ul className="space-y-2">
        {detailValue.map((listEntry, index) => (
          <li
            key={`${String(listEntry)}:${index}`}
            className="flex gap-2 text-sm text-gray-700"
          >
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
            />
            <span className="leading-6">{String(listEntry)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof detailValue === "boolean") {
    return <span>{t(`revisions.${detailValue ? "yes" : "no"}`)}</span>;
  }
  if (
    field === "priority" ||
    field === "resourceCategory" ||
    field === "platform"
  ) {
    const namespace = {
      priority: "priorities",
      resourceCategory: "resource_categories",
      platform: "platforms",
    }[field];
    return <span>{t(`${namespace}.${String(detailValue)}`)}</span>;
  }
  if (["weekStartDate", "weekEndDate", "startAt", "endAt"].includes(field)) {
    return (
      <time dateTime={String(detailValue)}>
        {formatRevisionDateTime(String(detailValue), locale)}
      </time>
    );
  }
  if (field === "joinUrl") {
    return (
      <a
        className="break-all font-medium text-primary underline"
        href={String(detailValue)}
        target="_blank"
        rel="noreferrer"
      >
        {String(detailValue)}
      </a>
    );
  }
  return (
    <span className="whitespace-pre-wrap leading-6">{String(detailValue)}</span>
  );
}

export default function RevisionSnapshotDetails({
  details,
}: {
  details: NonNullable<AcademicContentRevisionDetail["details"]>;
}) {
  const t = useAcademicContentTranslations();
  const entries = Object.entries(details).filter(
    ([field, detailValue]) =>
      !HIDDEN_REFERENCE_FIELDS.has(field) &&
      detailValue !== null &&
      detailValue !== "" &&
      (!Array.isArray(detailValue) || detailValue.length > 0),
  );

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">{t("revisions.no_details")}</p>;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([field, detailValue]) => (
        <div
          key={field}
          className={`rounded-xl border border-gray-200 bg-gray-50/70 p-4 ${
            Array.isArray(detailValue) ? "sm:col-span-2" : ""
          }`}
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {detailLabel(field, t)}
          </dt>
          <dd className="mt-2 text-sm font-medium text-gray-900">
            <DetailValue field={field} detailValue={detailValue} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
