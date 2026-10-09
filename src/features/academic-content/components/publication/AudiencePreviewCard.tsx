"use client";

import {
  BellOff,
  RefreshCw,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentAudiencePreviewResponse } from "../../types/contracts";

interface AudiencePreviewCardProps {
  preview: AcademicContentAudiencePreviewResponse | null;
  error: AcademicContentUiError | null;
  onRetry: () => void;
}

interface AudienceMetric {
  label: string;
  count: number;
  icon: LucideIcon;
  iconClassName: string;
}

export default function AudiencePreviewCard({
  preview,
  error,
  onRetry,
}: AudiencePreviewCardProps) {
  const locale = useLocale();
  const t = useAcademicContentTranslations("publication");
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const metrics: ReadonlyArray<AudienceMetric> = preview
    ? [
        {
          label: "students",
          count: preview.students,
          icon: Users,
          iconClassName: "bg-blue-50 text-blue-700",
        },
        {
          label: "guardian_contexts",
          count: preview.guardianContexts,
          icon: UserRound,
          iconClassName: "bg-violet-50 text-violet-700",
        },
        {
          label: "guardian_accounts",
          count: preview.guardianUsersWithAccounts,
          icon: UserCheck,
          iconClassName: "bg-emerald-50 text-emerald-700",
        },
        {
          label: "guardian_opt_out_contexts",
          count: preview.guardianNotificationOptOutContexts,
          icon: BellOff,
          iconClassName: "bg-amber-50 text-amber-700",
        },
      ]
    : [];

  return (
    <section
      aria-labelledby="audience-preview-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <h3
            id="audience-preview-heading"
            className="text-base font-semibold text-gray-900"
          >
            {t("audience_preview_title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {t("current_preview_disclaimer")}
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error.message}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw aria-hidden="true" className="size-4" />}
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
        </div>
      ) : null}

      {preview ? (
        <>
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metrics.map(({ label, count, icon: Icon, iconClassName }) => (
              <div
                key={label}
                className="flex min-h-28 items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <dt className="text-sm font-medium leading-5 text-gray-600">
                    {t(label)}
                  </dt>
                  <dd className="mt-auto text-3xl font-semibold leading-none tabular-nums text-gray-900">
                    {new Intl.NumberFormat(locale).format(count)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-5 text-gray-600">
            {t("audience_counts_note")}
          </p>
          <p className="mt-4 text-xs text-gray-600">
            {t("as_of", {
              date: formatter.format(new Date(preview.asOf)),
            })}
          </p>
          {metrics.every(({ count }) => count === 0) ? (
            <p className="mt-2 text-xs text-gray-600">
              {t("zero_audience_valid")}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
