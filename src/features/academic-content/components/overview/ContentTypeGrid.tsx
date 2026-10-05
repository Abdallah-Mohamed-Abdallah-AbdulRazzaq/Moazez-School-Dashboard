"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  MessageSquareText,
  NotebookPen,
  Video,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import type { OverviewResource } from "../../hooks/useAcademicContentOverview";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  ACADEMIC_CONTENT_TYPES,
  type AcademicContentType,
} from "../../types/contracts";
import { academicContentTypeHref } from "./overviewRoutes";

interface TypeCardStyle {
  icon: LucideIcon;
  iconClassName: string;
}

const TYPE_CARD_STYLES: Record<AcademicContentType, TypeCardStyle> = {
  TEACHER_PREPARATION: { icon: NotebookPen, iconClassName: "bg-blue-50 text-blue-600" },
  WEEKLY_PLAN: { icon: CalendarDays, iconClassName: "bg-emerald-50 text-emerald-600" },
  GUARDIAN_WEEKLY_NOTE: { icon: MessageSquareText, iconClassName: "bg-orange-50 text-orange-600" },
  SUBJECT_RESOURCE: { icon: FileText, iconClassName: "bg-violet-50 text-violet-600" },
  ONLINE_SESSION: { icon: Video, iconClassName: "bg-rose-50 text-rose-600" },
  GENERAL_RESOURCE: { icon: FolderOpen, iconClassName: "bg-sky-50 text-sky-600" },
};

export interface ContentTypeGridProps {
  yearId: string;
  termId: string;
  totals: Record<AcademicContentType, OverviewResource<number | null>>;
  onRetryType: (type: AcademicContentType) => void;
}

export default function ContentTypeGrid({
  yearId,
  termId,
  totals,
  onRetryType,
}: ContentTypeGridProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("overview");
  const typeLabel = useAcademicContentTranslations("types");

  return (
    <section aria-label={t("title")} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ACADEMIC_CONTENT_TYPES.map((contentType) => {
        const total = totals[contentType];
        const { icon: Icon, iconClassName } = TYPE_CARD_STYLES[contentType];
        const href = academicContentTypeHref({
          locale,
          contentType,
          yearId,
          termId,
        });

        return (
          <article
            key={contentType}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-950">{typeLabel(contentType)}</h2>
                <div className="mt-0.5 min-h-5 text-sm font-medium text-gray-600">
                  {total.isLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : total.error ? (
                    <span>{t("unavailable")}</span>
                  ) : (
                    <span>{t("items", { count: total.data ?? 0 })}</span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {t(`types.${contentType}.description`)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    aria-label={`${typeLabel(contentType)} ${t("view_all")}`}
                    className="text-sm font-semibold text-primary hover:text-hover"
                    href={href}
                  >
                    {t("view_all")} <span aria-hidden="true">→</span>
                  </Link>
                  {total.error ? (
                    <Button size="sm" variant="ghost" onClick={() => onRetryType(contentType)}>
                      {t("retry")}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
