"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ChevronDown, TriangleAlert } from "lucide-react";
import type {
  LessonPlanValidationIssue,
  LessonPlanValidationResponseDto,
} from "../services/lessonPlansService";

const summaryKeys: Array<keyof LessonPlanValidationResponseDto["summary"]> = [
  "lessonPlansChecked",
  "itemsChecked",
  "missingPlannedLessons",
  "holidayItems",
  "outsideTermItems",
  "duplicateLessons",
];

function issueCodeToKey(code: string) {
  return code.replaceAll(".", "_");
}

export default function LessonPlanValidationPanel({
  validation,
  isLoading,
  error,
  onRetry,
}: {
  validation: LessonPlanValidationResponseDto | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}) {
  const t = useTranslations("academics.lessonPlans.validationPanel");
  const tIssues = useTranslations("academics.lessonPlans.validationIssues");
  const [expanded, setExpanded] = useState(false);
  const issueListId = useId();
  const tCommon = useTranslations("common");

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-gray-900">Validation Error</h3>
              <p className="mt-1 text-sm text-gray-600">Failed to load lesson plan validation checks.</p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100"
            >
              {tCommon("retry", { defaultValue: "Retry" })}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (isLoading && !validation) {
    return (
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-gray-300"></div>
            <div>
              <div className="h-5 w-32 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!validation) return null;

  const hasIssues = validation.issues.length > 0;
  const Icon = hasIssues ? TriangleAlert : CheckCircle2;

  const resolveIssueMessage = (issue: LessonPlanValidationIssue) => {
    const key = issueCodeToKey(issue.code);
    try {
      const translated = tIssues(key);
      return translated === key ? issue.message : translated;
    } catch {
      return issue.message;
    }
  };

  const resolveSeverity = (severity: string) => {
    try {
      return t(`severity.${severity}`);
    } catch {
      return t("severity.warning");
    }
  };

  return (
    <section
      className={`rounded-xl border p-4 ${
        hasIssues
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              hasIssues ? "text-amber-600" : "text-emerald-600"
            }`}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {hasIssues ? t("warningTitle") : t("successTitle")}
              {isLoading && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {hasIssues
                ? t("warningDescription", { count: validation.issues.length })
                : t("successDescription")}
            </p>
          </div>
        </div>

        {hasIssues && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={issueListId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
          >
            {expanded
              ? t("hideIssues", { count: validation.issues.length })
              : t("showIssues", { count: validation.issues.length })}
            <ChevronDown
              className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        {summaryKeys.map((key) => (
          <div key={key} className="rounded-lg bg-white/80 p-3">
            <div className="text-lg font-semibold text-gray-900">
              {validation.summary[key]}
            </div>
            <div className="text-xs text-gray-600">{t(`summary.${key}`)}</div>
          </div>
        ))}
      </div>

      {hasIssues && expanded && (
        <div id={issueListId} className="mt-4 space-y-2">
          {validation.issues.map((issue, index) => (
            <div
              key={`${issue.code}-${issue.itemId ?? issue.lessonId ?? index}`}
              className="rounded-lg border border-amber-200 bg-white p-3 text-sm"
            >
              <span className="font-semibold text-amber-800">
                {resolveSeverity(issue.severity)}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-700">{resolveIssueMessage(issue)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
