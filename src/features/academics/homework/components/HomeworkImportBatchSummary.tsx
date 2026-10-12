"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, CircleAlert, Clock3, Users } from "lucide-react";

interface BatchSummaryProps { created?: number; eligible: number; skipped: number; attention?: number }

export default function HomeworkImportBatchSummary({ created, eligible, skipped, attention }: BatchSummaryProps) {
  const t = useTranslations("academics.homework.importBatch");
  const cards = created === undefined
    ? [{ label: t("eligible"), count: eligible, icon: Users, style: "bg-primary-50 text-primary" }, { label: t("statuses.skipped"), count: skipped, icon: CircleAlert, style: "bg-amber-50 text-amber-800" }]
    : [{ label: t("statuses.created"), count: created, icon: CheckCircle2, style: "bg-emerald-50 text-emerald-800" }, { label: t("attentionLabel"), count: attention ?? 0, icon: CircleAlert, style: "bg-amber-50 text-amber-800" }, { label: t("statuses.skipped"), count: skipped, icon: Clock3, style: "bg-gray-50 text-gray-700" }];
  return <dl className={`grid gap-3 ${created === undefined ? "grid-cols-2" : "grid-cols-3"}`}>
    {cards.map(({ label, count, icon: Icon, style }) => <div key={label} className={`rounded-xl p-3 sm:p-4 ${style}`}>
      <dt className="flex items-center gap-2 text-xs font-medium sm:text-sm"><Icon size={16} aria-hidden="true" className="hidden shrink-0 sm:block" />{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{count}</dd>
    </div>)}
  </dl>;
}
