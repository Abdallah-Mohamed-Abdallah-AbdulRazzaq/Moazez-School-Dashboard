"use client";

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
import { CONTENT_TYPE_PRESENTATION } from "./contentTypePresentation";
import { academicContentTypeHref } from "./overviewRoutes";

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
        const { icon: Icon, iconClassName } =
          CONTENT_TYPE_PRESENTATION[contentType];
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
