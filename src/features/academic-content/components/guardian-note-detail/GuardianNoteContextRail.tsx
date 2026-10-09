"use client";

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Paperclip,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
} from "../../types/contracts";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";
import EditorSummaryCard from "../editor/EditorSummaryCard";
import ReadinessReasonText from "../editor/ReadinessReasonText";

type GuardianNoteContent = Extract<
  AcademicContentDetail,
  { type: "GUARDIAN_WEEKLY_NOTE" }
>;

interface GuardianNoteContextRailProps {
  content: GuardianNoteContent;
  readiness: AcademicContentReadinessResponse | null;
  targets: readonly TeacherPreparationTargetDisplay[];
  targetError: string | null;
  onRefreshReadiness: () => Promise<unknown>;
}

function EmptyValue({ children }: { children: string }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

export default function GuardianNoteContextRail(
  props: GuardianNoteContextRailProps,
) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("guardian_note_detail.context");
  const commonT = useAcademicContentTranslations();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const publicationDates = [
    ["publishAt", props.content.publishAt],
    ["visibleFrom", props.content.visibleFrom],
    ["visibleUntil", props.content.visibleUntil],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const details = props.content.details;

  return (
    <aside aria-label={t("rail_label")} className="space-y-4">
      <EditorSummaryCard
        icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
        title={t("readiness")}
        action={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void props.onRefreshReadiness()}
          >
            {t("refresh")}
          </Button>
        }
      >
        {props.readiness ? (
          <div>
            <p
              className={`text-sm font-semibold ${props.readiness.canAdvance ? "text-green-700" : "text-amber-700"}`}
            >
              {props.readiness.canAdvance ? t("ready") : t("blocked")}
            </p>
            {props.readiness.blockingReasons.length ? (
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {props.readiness.blockingReasons.map((reason) => (
                  <li key={`${reason.code}:${reason.message}`}>
                    <ReadinessReasonText reason={reason} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <EmptyValue>{t("unavailable")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<ShieldCheck aria-hidden="true" className="size-5" />}
        title={t("delivery_settings")}
      >
        {details ? (
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t("priority")}</dt>
              <dd className="font-medium text-gray-900">
                {commonT(`priorities.${details.priority}`)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t("acknowledgement")}</dt>
              <dd className="font-medium text-gray-900">
                {details.requiresAcknowledgement
                  ? t("required")
                  : t("not_required")}
              </dd>
            </div>
          </dl>
        ) : (
          <EmptyValue>{t("unavailable")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<UsersRound aria-hidden="true" className="size-5" />}
        title={t("targets")}
      >
        {props.targetError ? (
          <p role="alert" className="text-sm text-amber-700">
            {props.targetError}
          </p>
        ) : props.targets.length ? (
          <ul className="space-y-2 text-sm text-gray-700">
            {props.targets.map((target) => (
              <li key={target.targetId}>
                {[target.subject, target.scope].filter(Boolean).join(" · ") ||
                  t("unavailable")}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>{t("no_targets")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<Paperclip aria-hidden="true" className="size-5" />}
        title={t("attachments", { count: props.content.assets.length })}
      >
        {props.content.assets.length ? (
          <ul className="space-y-2">
            {props.content.assets.map((asset) => (
              <li
                key={asset.assetId}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span className="min-w-0 truncate">{asset.originalName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyValue>{t("no_attachments")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        title={t("publication")}
      >
        {props.content.publicationStatus ? (
          <div className="space-y-2">
            <PublicationStatusBadge status={props.content.publicationStatus} />
            {publicationDates.map(([field, date]) => (
              <time
                key={field}
                dateTime={date}
                className="block text-xs text-gray-600"
              >
                {formatter.format(new Date(date))}
              </time>
            ))}
          </div>
        ) : (
          <EmptyValue>{t("not_published")}</EmptyValue>
        )}
      </EditorSummaryCard>
    </aside>
  );
}
