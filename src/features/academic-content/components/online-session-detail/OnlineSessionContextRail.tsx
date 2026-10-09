"use client";

import { CalendarClock, CircleCheckBig, Info } from "lucide-react";
import { useLocale } from "next-intl";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
} from "../../types/contracts";
import EditorSummaryCard from "../editor/EditorSummaryCard";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import PublicationStatusBadge from "../publication/PublicationStatusBadge";
import ReadinessReasonText from "../editor/ReadinessReasonText";

type Content = Extract<AcademicContentDetail, { type: "ONLINE_SESSION" }>;

export default function OnlineSessionContextRail({
  content,
  readiness,
}: {
  content: Content;
  readiness: AcademicContentReadinessResponse | null;
}) {
  const t = useAcademicContentTranslations("online_session_detail");
  const locale = useLocale();
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const dates = [
    [t("publish_at"), content.publishAt],
    [t("visible_from"), content.visibleFrom],
    [t("visible_until"), content.visibleUntil],
    [t("created"), content.createdAt],
    [t("updated"), content.updatedAt],
  ] as const;
  return (
    <aside aria-label={t("context_label")} className="space-y-4">
      <EditorSummaryCard
        icon={<Info aria-hidden="true" className="size-5" />}
        title={t("status")}
      >
        <div className="flex flex-wrap gap-2">
          <AcademicContentStatusBadge status={content.status} />
          {content.publicationStatus ? (
            <PublicationStatusBadge status={content.publicationStatus} />
          ) : null}
        </div>
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<CircleCheckBig aria-hidden="true" className="size-5" />}
        title={t("readiness")}
      >
        <p
          className={`text-sm font-semibold ${readiness === null ? "text-gray-500" : readiness.canAdvance ? "text-emerald-700" : "text-amber-700"}`}
        >
          {readiness === null
            ? t("readiness_unavailable")
            : readiness.canAdvance
              ? t("ready")
              : t("not_ready")}
        </p>
        {readiness?.blockingReasons.length ? (
          <ul className="mt-3 space-y-2 text-xs text-amber-800">
            {readiness.blockingReasons.map((reason) => (
              <li key={`${reason.code}:${reason.message}`}>
                <ReadinessReasonText reason={reason} />
              </li>
            ))}
          </ul>
        ) : null}
      </EditorSummaryCard>
      <EditorSummaryCard
        icon={<CalendarClock aria-hidden="true" className="size-5" />}
        title={t("dates")}
      >
        <dl className="space-y-2">
          {dates.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 text-xs">
              <dt className="text-gray-500">{label}</dt>
              <dd className="text-end font-medium text-gray-800">
                {value ? (
                  <time dateTime={value}>
                    {formatter.format(new Date(value))}
                  </time>
                ) : (
                  t("not_set")
                )}
              </dd>
            </div>
          ))}
        </dl>
      </EditorSummaryCard>
    </aside>
  );
}
