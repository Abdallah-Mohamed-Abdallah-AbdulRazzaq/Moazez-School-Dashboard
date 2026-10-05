"use client";

import { Clock3 } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import type { OverviewResource } from "../../hooks/useAcademicContentOverview";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentLibraryItem } from "../../types/contracts";
import AcademicContentStatusBadge from "../library/AcademicContentStatusBadge";
import { OverviewPanelFrame, OverviewPanelState } from "./OverviewPanelFrame";
import { formatAcademicContentRelativeTime } from "./overviewFormatting";

export interface RecentlyUpdatedPanelProps {
  resource: OverviewResource<AcademicContentLibraryItem[]>;
  onRetry: () => void;
  onOpen: (contentId: string) => void;
}

interface RecentContentRowProps {
  content: AcademicContentLibraryItem;
  locale: string;
  onOpen: (contentId: string) => void;
}

function RecentContentRow({ content, locale, onOpen }: RecentContentRowProps) {
  const t = useAcademicContentTranslations("overview");
  const typeLabel = useAcademicContentTranslations("types");
  return (
    <tr className="border-t border-gray-100">
      <td className="px-5 py-3 text-sm font-semibold text-gray-900">{content.title}</td>
      <td className="px-5 py-3 text-sm text-gray-600">{typeLabel(content.type)}</td>
      <td className="px-5 py-3 text-sm text-gray-600">
        <time dateTime={content.updatedAt} title={content.updatedAt}>
          {formatAcademicContentRelativeTime(content.updatedAt, locale)}
        </time>
      </td>
      <td className="px-5 py-3"><AcademicContentStatusBadge status={content.status} /></td>
      <td className="px-5 py-3 text-end">
        <Button size="sm" variant="ghost" onClick={() => onOpen(content.id)}>{t("open")}</Button>
      </td>
    </tr>
  );
}

export default function RecentlyUpdatedPanel({
  resource,
  onRetry,
  onOpen,
}: RecentlyUpdatedPanelProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("overview");
  const typeLabel = useAcademicContentTranslations("types");

  return (
    <OverviewPanelFrame
      title={t("recently_updated.title")}
      description={t("recently_updated.description")}
      icon={<Clock3 aria-hidden="true" className="size-5" />}
    >
      <OverviewPanelState
        isLoading={resource.isLoading}
        hasData={resource.data.length > 0}
        hasError={Boolean(resource.error)}
        emptyTitle={t("recently_updated.empty_title")}
        emptyDescription={t("recently_updated.empty_description")}
        unavailableTitle={t("recently_updated.unavailable_title")}
        onRetry={onRetry}
      >
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-start">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                {(["title", "type", "updated", "status", "actions"] as const).map((column) => (
                  <th key={column} scope="col" className="px-5 py-3 text-start">
                    {t(`recently_updated.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resource.data.map((contentItem) => (
                <RecentContentRow key={contentItem.id} content={contentItem} locale={locale} onOpen={onOpen} />
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-gray-100 px-5 md:hidden">
          {resource.data.map((contentItem) => (
            <li key={contentItem.id} className="space-y-2 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{contentItem.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{typeLabel(contentItem.type)}</p>
                </div>
                <AcademicContentStatusBadge status={contentItem.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <time dateTime={contentItem.updatedAt} className="text-xs text-gray-500">
                  {formatAcademicContentRelativeTime(contentItem.updatedAt, locale)}
                </time>
                <Button size="sm" variant="ghost" onClick={() => onOpen(contentItem.id)}>{t("open")}</Button>
              </div>
            </li>
          ))}
        </ul>
      </OverviewPanelState>
    </OverviewPanelFrame>
  );
}
