"use client";

import Link from "next/link";
import { Gauge, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { DashboardCommandCenterResponse } from "@/features/dashboard/types/dashboardApi.types";
import { resolveDashboardActionTarget } from "@/features/dashboard/utils/resolveDashboardActionTarget";

export default function DashboardAnalysisCards({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenterResponse | null;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard_new.command_center");
  const items = commandCenter?.operationalHealth.slice(0, 3) ?? [];

  if (!items.length) return null;

  return (
    <section aria-labelledby="dashboard-analysis-cards-title" className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
          <Gauge className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 id="dashboard-analysis-cards-title" className="text-base font-extrabold text-gray-950">{t("analysis_cards")}</h2>
          <p className="text-xs font-medium text-gray-500">{t("analysis_cards_description")}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => {
          const score = Math.min(100, Math.max(0, item.score));
          const tint = index === 0 ? "from-primary-50/80 to-white" : index === 1 ? "from-emerald-50/75 to-white" : "from-amber-50/80 to-white";
          const accent = index === 0 ? "bg-primary" : index === 1 ? "bg-emerald-500" : "bg-amber-500";

          return (
            <Link key={item.key} href={resolveDashboardActionTarget(item.action.target)} className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br ${tint} p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 cursor-pointer`}>
              <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-extrabold text-gray-950">{item.label}</p><p className="mt-1 line-clamp-2 min-h-10 text-xs font-medium leading-5 text-gray-600">{item.summary}</p></div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/90 text-primary shadow-sm"><ShieldCheck className="h-4 w-4" /></span>
              </div>
              <div className="mt-4 flex items-end gap-3"><p className="text-2xl font-extrabold tracking-tight text-gray-950">{formatMetric(score, locale)}<span className="ms-0.5 text-xs text-gray-500">%</span></p><div className="mb-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200/80"><div className={`h-1.5 rounded-full ${accent}`} style={{ width: `${score}%` }} /></div></div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">{item.source}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatMetric(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(value);
}
