"use client";

import { CalendarPlus, Download, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";

interface LessonPlansPageHeaderProps {
  scopeLabels: string[];
  autoPlanDisabled: boolean;
  createPlanDisabled: boolean;
  autoPlanUnavailableReason?: string;
  exportDisabled: boolean;
  refreshing: boolean;
  onAutoPlan: () => void;
  onCreatePlan: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function LessonPlansPageHeader({
  scopeLabels,
  autoPlanDisabled,
  createPlanDisabled,
  autoPlanUnavailableReason,
  exportDisabled,
  refreshing,
  onAutoPlan,
  onCreatePlan,
  onRefresh,
  onExport,
}: LessonPlansPageHeaderProps) {
  const t = useTranslations("academics.lessonPlans");
  const tExport = useTranslations("academics.export");

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>

          {scopeLabels.length > 0 && (
            <div aria-label={t("scope.title")} className="flex flex-wrap gap-2">
              {scopeLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onCreatePlan}
            leftIcon={<CalendarPlus className="h-4 w-4" />}
            disabled={createPlanDisabled}
          >
            {t("actions.createPlan")}
          </Button>
          <span
            title={autoPlanDisabled ? autoPlanUnavailableReason : undefined}
            className="inline-flex"
          >
            <Button
              variant="secondary"
              onClick={onAutoPlan}
              leftIcon={<Sparkles className="h-4 w-4" />}
              disabled={autoPlanDisabled}
            >
              {t("actions.autoPlan")}
            </Button>
          </span>
          <Button
            variant="secondary"
            onClick={onRefresh}
            leftIcon={
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            }
            disabled={refreshing}
          >
            {t("actions.validateRefresh")}
          </Button>
          <Button
            variant="secondary"
            onClick={onExport}
            leftIcon={<Download className="h-4 w-4" />}
            disabled={exportDisabled}
          >
            {tExport("button")}
          </Button>
        </div>
      </div>
    </header>
  );
}
