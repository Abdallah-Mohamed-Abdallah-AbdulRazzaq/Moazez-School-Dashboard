"use client";

import { FilePenLine } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import type { OverviewResource } from "../../hooks/useAcademicContentOverview";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { OverviewPanelFrame, OverviewPanelState } from "./OverviewPanelFrame";
import { formatAcademicContentRelativeTime } from "./overviewFormatting";

export interface WorkInProgressPanelProps {
  resource: OverviewResource<AcademicContentLibraryItem[]>;
  onRetry: () => void;
  onOpen: (contentId: string) => void;
}

export default function WorkInProgressPanel({
  resource,
  onRetry,
  onOpen,
}: WorkInProgressPanelProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("overview");
  const typeLabel = useAcademicContentTranslations("types");

  return (
    <OverviewPanelFrame
      title={t("work_in_progress.title")}
      description={t("work_in_progress.description")}
      icon={<FilePenLine aria-hidden="true" className="size-5" />}
    >
      {resource.partial ? (
        <p role="status" className="border-b border-amber-100 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-800">
          {t("work_in_progress.partial_warning")}
        </p>
      ) : null}
      <OverviewPanelState
        isLoading={resource.isLoading}
        hasData={resource.data.length > 0}
        hasError={Boolean(resource.error)}
        emptyTitle={t("work_in_progress.empty_title")}
        emptyDescription={t("work_in_progress.empty_description")}
        unavailableTitle={t("work_in_progress.unavailable_title")}
        onRetry={onRetry}
      >
        <ul className="divide-y divide-gray-100 px-5">
          {resource.data.map((contentItem) => (
            <li key={contentItem.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-48 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{contentItem.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{typeLabel(contentItem.type)}</p>
              </div>
              <AcademicContentStatusBadge status={contentItem.status} />
              <time
                dateTime={contentItem.updatedAt}
                className="text-xs text-gray-500"
                title={contentItem.updatedAt}
              >
                {formatAcademicContentRelativeTime(contentItem.updatedAt, locale)}
              </time>
              <Button size="sm" variant="ghost" onClick={() => onOpen(contentItem.id)}>
                {t("open")}
              </Button>
            </li>
          ))}
        </ul>
      </OverviewPanelState>
    </OverviewPanelFrame>
  );
}
