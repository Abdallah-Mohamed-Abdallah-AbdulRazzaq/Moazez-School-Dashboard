"use client";

import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface ReinforcementSummaryWidgetProps {
  inProgress: number;
  notCompleted: number;
  completionRate: number;
}

export default function ReinforcementSummaryWidget({
  inProgress,
  notCompleted,
  completionRate,
}: ReinforcementSummaryWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement.dashboardWidget");

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t("title")}
            </h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/reinforcement`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#025766]"
        >
          {t("cta")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">{t("inProgress")}</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{inProgress}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">{t("notCompleted")}</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{notCompleted}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">{t("completionRate")}</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {completionRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
