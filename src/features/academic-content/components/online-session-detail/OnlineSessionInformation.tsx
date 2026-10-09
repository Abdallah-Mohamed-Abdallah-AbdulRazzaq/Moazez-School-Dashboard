"use client";

import {
  CalendarDays,
  Clock3,
  FileText,
  ListChecks,
  UsersRound,
} from "lucide-react";
import { useLocale } from "next-intl";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import { onlineSessionDetailDurationMinutes } from "../../model/onlineSessionDetail";
import type { AcademicContentDetail } from "../../types/contracts";
import EditorSummaryCard from "../editor/EditorSummaryCard";

type Content = Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;

export default function OnlineSessionInformation({
  content,
  targets,
  targetError,
  timetableLabel,
}: {
  content: Content;
  targets: readonly TeacherPreparationTargetDisplay[];
  targetError: string | null;
  timetableLabel: string | null;
}) {
  const t = useAcademicContentTranslations("online_session_detail");
  const locale = useLocale();
  const detail = content.details;
  if (!detail) return null;
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: detail.timezone,
  });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {content.description ? (
        <div className="md:col-span-2">
          <EditorSummaryCard
            icon={<FileText aria-hidden="true" className="size-5" />}
            title={t("about_session")}
          >
            <RichTextContent
              value={content.description}
              className="text-sm leading-6 text-gray-700"
            />
          </EditorSummaryCard>
        </div>
      ) : null}
      {detail.instructions ? (
        <EditorSummaryCard
          icon={<ListChecks aria-hidden="true" className="size-5" />}
          title={t("instructions")}
        >
          <RichTextContent
            value={detail.instructions}
            className="text-sm leading-6 text-gray-700"
          />
        </EditorSummaryCard>
      ) : null}
      <EditorSummaryCard
        icon={<UsersRound aria-hidden="true" className="size-5" />}
        title={t("target_audience")}
      >
        {targetError ? (
          <p role="alert" className="text-sm text-amber-700">
            {targetError}
          </p>
        ) : targets.length ? (
          <ul className="space-y-2 text-sm text-gray-700">
            {targets.map((target) => (
              <li
                key={target.targetId}
                className="rounded-lg bg-gray-50 px-3 py-2"
              >
                {[target.subject, target.scope, target.assignedTeacher]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">{t("no_targets")}</p>
        )}
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<CalendarDays aria-hidden="true" className="size-5" />}
        title={t("schedule")}
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">{t("starts_at")}</dt>
            <dd className="mt-1 font-medium text-gray-900">
              <time dateTime={detail.startAt}>
                {formatter.format(new Date(detail.startAt))}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("ends_at")}</dt>
            <dd className="mt-1 font-medium text-gray-900">
              <time dateTime={detail.endAt}>
                {formatter.format(new Date(detail.endAt))}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("duration")}</dt>
            <dd className="mt-1 inline-flex items-center gap-1 font-medium text-gray-900">
              <Clock3 aria-hidden="true" className="size-4" />
              {t("duration_minutes", {
                minutes: onlineSessionDetailDurationMinutes(detail),
              })}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("timezone")}</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {detail.timezone}
            </dd>
          </div>
        </dl>
      </EditorSummaryCard>
      {detail.timetableEntryId ? (
        <EditorSummaryCard
          icon={<CalendarDays aria-hidden="true" className="size-5" />}
          title={t("timetable_reference")}
        >
          <p className="text-sm text-gray-700">
            {timetableLabel ?? t("reference_unavailable")}
          </p>
        </EditorSummaryCard>
      ) : null}
    </div>
  );
}
