"use client";

import { CalendarClock } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import type { OverviewResource } from "../../hooks/useAcademicContentOverview";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { UpcomingAcademicContentSession } from "../../model/academicContentOverview";
import { OverviewPanelFrame, OverviewPanelState } from "./OverviewPanelFrame";
import { formatAcademicContentDateTime } from "./overviewFormatting";

export interface UpcomingSessionsPanelProps {
  resource: OverviewResource<UpcomingAcademicContentSession[]>;
  onRetry: () => void;
  onOpen: (contentId: string) => void;
}

export default function UpcomingSessionsPanel({
  resource,
  onRetry,
  onOpen,
}: UpcomingSessionsPanelProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("overview");
  const platformLabel = useAcademicContentTranslations("platforms");

  return (
    <OverviewPanelFrame
      title={t("upcoming_sessions.title")}
      description={t("upcoming_sessions.description")}
      icon={<CalendarClock aria-hidden="true" className="size-5" />}
    >
      <OverviewPanelState
        isLoading={resource.isLoading}
        hasData={resource.data.length > 0}
        hasError={Boolean(resource.error)}
        emptyTitle={t("upcoming_sessions.empty_title")}
        emptyDescription={t("upcoming_sessions.empty_description")}
        unavailableTitle={t("upcoming_sessions.unavailable_title")}
        onRetry={onRetry}
      >
        <ul className="divide-y divide-gray-100 px-5">
          {resource.data.map(({ content, summary, state }) => (
            <li key={content.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-48 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{content.title}</p>
                <time dateTime={summary.startAt} className="mt-0.5 block text-xs text-gray-500">
                  {formatAcademicContentDateTime(summary.startAt, locale)}
                </time>
              </div>
              <span className="text-xs font-medium text-gray-600">{platformLabel(summary.platform)}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state === "STARTING_SOON" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                {t(`session_states.${state}`)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onOpen(content.id)}>
                {t("open")}
              </Button>
            </li>
          ))}
        </ul>
      </OverviewPanelState>
    </OverviewPanelFrame>
  );
}
