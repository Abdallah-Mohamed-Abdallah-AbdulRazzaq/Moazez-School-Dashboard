"use client";

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Paperclip,
  Tags,
  Target,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentFilePolicyState } from "../../hooks/useAcademicContentFilePolicy";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationTargetDisplay } from "../../model/teacherPreparationDetail";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
} from "../../types/contracts";
import EditorSummaryCard from "../editor/EditorSummaryCard";
import ReadinessReasonText from "../editor/ReadinessReasonText";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";

type Content = Extract<AcademicContentDetail, { type: "GENERAL_RESOURCE" }>;

interface Props {
  content: Content;
  readiness: AcademicContentReadinessResponse | null;
  targets: readonly TeacherPreparationTargetDisplay[];
  targetError: string | null;
  filePolicyState: AcademicContentFilePolicyState;
  onRefreshReadiness: () => Promise<unknown>;
}

function EmptyValue({ children }: { children: string }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

export default function GeneralResourceContextRail(props: Props) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("general_resource_detail.context");
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const sortedTags = [...props.content.tags].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const publicationDates = [
    ["publishAt", t("publish_at"), props.content.publishAt],
    ["visibleFrom", t("visible_from"), props.content.visibleFrom],
    ["visibleUntil", t("visible_until"), props.content.visibleUntil],
  ].filter((entry): entry is [string, string, string] => Boolean(entry[2]));
  const policy = props.filePolicyState.policy;

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
        icon={<Target aria-hidden="true" className="size-5" />}
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
        icon={<Tags aria-hidden="true" className="size-5" />}
        title={t("tags")}
      >
        {sortedTags.length ? (
          <div className="flex flex-wrap gap-2">
            {sortedTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {tag.value}
              </span>
            ))}
          </div>
        ) : (
          <EmptyValue>{t("no_tags")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        title={t("publication")}
      >
        {props.content.publicationStatus ? (
          <div className="space-y-2">
            <PublicationStatusBadge status={props.content.publicationStatus} />
            {publicationDates.map(([field, label, date]) => (
              <p key={field} className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">{label}: </span>
                <time dateTime={date}>{formatter.format(new Date(date))}</time>
              </p>
            ))}
          </div>
        ) : (
          <EmptyValue>{t("not_published")}</EmptyValue>
        )}
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<FileText aria-hidden="true" className="size-5" />}
        title={t("audit")}
      >
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-gray-500">{t("created")}</dt>
            <dd>
              <time dateTime={props.content.createdAt}>
                {formatter.format(new Date(props.content.createdAt))}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t("updated")}</dt>
            <dd>
              <time dateTime={props.content.updatedAt}>
                {formatter.format(new Date(props.content.updatedAt))}
              </time>
            </dd>
          </div>
        </dl>
      </EditorSummaryCard>

      <EditorSummaryCard
        icon={<Paperclip aria-hidden="true" className="size-5" />}
        title={t("resources")}
      >
        <div className="space-y-2 text-sm text-gray-700">
          <p>{t("asset_count", { count: props.content.assets.length })}</p>
          <p>{t("link_count", { count: props.content.links.length })}</p>
          {props.filePolicyState.isLoading ? (
            <EmptyValue>{t("policy_loading")}</EmptyValue>
          ) : props.filePolicyState.error ? (
            <div>
              <p role="alert" className="text-amber-700">
                {props.filePolicyState.error.message}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => void props.filePolicyState.reload()}
              >
                {t("retry_policy")}
              </Button>
            </div>
          ) : policy ? (
            <ul className="space-y-1 text-xs text-gray-600">
              <li>
                {t(
                  policy.allowStudentDownload
                    ? "student_download_enabled"
                    : "student_download_disabled",
                )}
              </li>
              <li>
                {t(
                  policy.allowGuardianDownload
                    ? "guardian_download_enabled"
                    : "guardian_download_disabled",
                )}
              </li>
              <li>
                {t(
                  policy.allowInlinePreview
                    ? "inline_preview_enabled"
                    : "inline_preview_disabled",
                )}
              </li>
            </ul>
          ) : (
            <EmptyValue>{t("policy_unavailable")}</EmptyValue>
          )}
        </div>
      </EditorSummaryCard>
    </aside>
  );
}
