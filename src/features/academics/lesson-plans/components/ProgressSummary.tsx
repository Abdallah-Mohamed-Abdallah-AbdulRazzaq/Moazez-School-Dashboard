"use client";

import { useTranslations } from "next-intl";
import {
  BookOpen,
  CalendarRange,
  ChartNoAxesCombined,
  CircleCheck,
  Clock3,
  ListChecks,
} from "lucide-react";
import type { LessonPlanSummary } from "../services/lessonPlansService";

export default function ProgressSummary({
  summary,
  isLoading,
  error,
  onRetry,
}: {
  summary: LessonPlanSummary | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}) {
  const t = useTranslations("academics.lessonPlans.summary");
  const tCommon = useTranslations("common");

  if (error) {
    return (
      <section className="space-y-3" aria-labelledby="lesson-plans-summary">
        <h2 id="lesson-plans-summary" className="text-base font-semibold text-gray-900">
          {t("title")}
        </h2>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between text-red-700">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>Failed to load summary</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold underline hover:text-red-800"
            >
              {tCommon("retry", { defaultValue: "Retry" })}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (isLoading && !summary) {
    return (
      <section className="space-y-3 animate-pulse" aria-labelledby="lesson-plans-summary">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 h-28"></div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-gray-200"></div>
      </section>
    );
  }

  if (!summary) return null;

  const coverageWidth = Math.min(100, Math.max(0, summary.coveragePercent));
  const stats = [
    {
      key: "plans",
      label: t("lessonPlans"),
      value: summary.lessonPlansCount,
      icon: CalendarRange,
    },
    {
      key: "items",
      label: t("items"),
      value: summary.itemsCount,
      icon: ListChecks,
    },
    {
      key: "planned",
      label: t("planned"),
      value: summary.plannedItemsCount,
      icon: Clock3,
    },
    {
      key: "completed",
      label: t("completed"),
      value: summary.completedItemsCount,
      icon: CircleCheck,
    },
    {
      key: "unplanned",
      label: t("unplanned"),
      value: summary.unplannedLessonsCount,
      icon: BookOpen,
    },
    {
      key: "coverage",
      label: t("coverage"),
      value: `${summary.coveragePercent}%`,
      icon: ChartNoAxesCombined,
    },
  ] as const;

  return (
    <section className="space-y-3" aria-labelledby="lesson-plans-summary">
      <div className="flex items-center justify-between">
        <h2
          id="lesson-plans-summary"
          className="text-base font-semibold text-gray-900 flex items-center gap-2"
        >
          {t("title")}
          {isLoading && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </h2>
        <span className="text-sm font-semibold text-primary">
          {summary.coveragePercent}%
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map(({ key, label, value, icon: Icon }) => (
          <div
            key={key}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div
        role="progressbar"
        aria-label={t("coverage")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={coverageWidth}
        className="h-2 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${coverageWidth}%` }}
        />
      </div>
    </section>
  );
}
