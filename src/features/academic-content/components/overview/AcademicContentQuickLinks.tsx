"use client";

import { ArrowRight, ClipboardCheck, LayoutTemplate, Settings2 } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { academicContentOverviewHref } from "./overviewRoutes";

export interface AcademicContentQuickLinksProps {
  yearId: string;
  termId: string;
  canApprove: boolean;
}

export default function AcademicContentQuickLinks({
  yearId,
  termId,
  canApprove,
}: AcademicContentQuickLinksProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("overview.quick_links");
  const quickLinks = [
    ...(canApprove
      ? [{ route: "/review", icon: ClipboardCheck, key: "review_queue" }]
      : []),
    { route: "/templates", icon: LayoutTemplate, key: "preparation_templates" },
    { route: "/settings/file-policy", icon: Settings2, key: "settings" },
  ] as const;

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-950">{t("title")}</h2>
      <div className="mt-4 space-y-3">
        {quickLinks.map(({ route, icon: Icon, key }) => (
          <Link
            key={route}
            href={academicContentOverviewHref({
              locale,
              routeSuffix: route,
              yearId,
              termId,
            })}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-900">{t(key)}</span>
              <span className="mt-0.5 block text-xs leading-5 text-gray-500">
                {t(`${key}_description`)}
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
