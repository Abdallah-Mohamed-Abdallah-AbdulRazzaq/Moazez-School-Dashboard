"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import type { useTimetableValidationReview } from "../hooks/useTimetableValidationReview";

export type ValidationReviewState = ReturnType<
  typeof useTimetableValidationReview
> & { hasUnsavedChanges: boolean };

export default function ValidationReviewStatus({
  review,
  locale,
}: {
  review: ValidationReviewState;
  locale: string;
}) {
  const t = useTranslations("academics.timetable.validationEnhancements");
  const status = review.isChecking
    ? "checking"
    : review.failed
      ? "failed"
      : review.hasUnsavedChanges
        ? "savedOnly"
        : review.checkedAt === null
          ? "notChecked"
          : review.isCurrent
            ? "current"
            : "stale";
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1" aria-live="polite">
          <p
            className={`font-medium ${status === "failed" ? "text-red-800" : status === "current" ? "text-primary-800" : "text-amber-900"}`}
          >
            {t(status)}
          </p>
          {review.checkedAt !== null && (
            <p className="mt-1 text-xs text-slate-600">
              {t("lastChecked")}{" "}
              <time dateTime={new Date(review.checkedAt).toISOString()}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(review.checkedAt)}
              </time>
            </p>
          )}
          {review.hasUnsavedChanges && status !== "savedOnly" && (
            <p className="mt-1 text-xs text-amber-900">{t("savedOnly")}</p>
          )}
        </div>
        <Button
          variant="secondary"
          className="min-h-11 shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
          loading={review.isChecking}
          disabled={review.isChecking}
          leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => void review.recheck()}
        >
          {t("recheck")}
        </Button>
      </div>
      {review.progress &&
        review.isCurrent &&
        !review.hasUnsavedChanges &&
        !review.isChecking && (
          <p
            aria-live="polite"
            className="border-t border-slate-200 pt-2 text-slate-700"
          >
            {t("progress", review.progress)}
          </p>
        )}
    </div>
  );
}
