"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export default function HomeworkCreationBar({ questionCount, points, classCount, help, children }: {
  questionCount: number; points: number; classCount: number; help?: string; children: ReactNode;
}) {
  const t = useTranslations("academics.homework.manual");
  return <div role="region" aria-label={t("creationSummary")} className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:p-5">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-900">{t("questionSummary", { count: questionCount })}<span className="mx-2 text-gray-400" aria-hidden="true">·</span>{t("pointsSummary", { points })}<span className="mx-2 text-gray-400" aria-hidden="true">·</span>{t("classSummary", { count: classCount })}</p>
      {help && <p className="mt-1 text-sm text-gray-600">{help}</p>}
    </div>
    <div className="flex w-full flex-wrap gap-2 sm:w-auto [&_button]:min-h-11 [&_button]:flex-1 sm:[&_button]:flex-none">{children}</div>
  </div>;
}
