"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AccessDenied, Button } from "@/components/ui";
import type { TimetableSetupStatus } from "@/features/academics/timetable/services/timetableSetupStatus";

type IncompleteSetupStatus = Exclude<TimetableSetupStatus, { kind: "ready" }>;

export function TimetableSetupNotice({
  status,
  onOpenSetup,
  onRetry,
}: {
  status: IncompleteSetupStatus;
  onOpenSetup: () => void;
  onRetry: () => Promise<void>;
}) {
  const t = useTranslations("academics.timetable");
  const locale = useLocale();
  const isError = status.kind === "error";
  const canCompleteSetup =
    status.kind === "missing_config" || status.kind === "missing_periods";
  const readiness =
    status.kind === "read_only" ? status.readiness : status.kind;
  const title = isError
    ? t("setup.notice.loadTitle")
    : t(
        `setup.notice.${readiness === "missing_config" ? "missingConfigTitle" : "missingPeriodsTitle"}`,
      );
  const description = isError
    ? t("setup.notice.loadDescription")
    : t(
        `setup.notice.${readiness === "missing_config" ? "missingConfigDescription" : "missingPeriodsDescription"}`,
      );
  const readOnlyMessage =
    status.kind === "read_only"
      ? t(
          status.reason === "closed_term"
            ? "setup.readOnly.closedTerm"
            : "setup.readOnly.missingPermission",
        )
      : null;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section
      aria-labelledby="timetable-setup-notice-title"
      role={isError ? "alert" : undefined}
      className="shrink-0 border-b border-sky-200 bg-sky-50/70 px-4 py-3 print:hidden lg:px-6"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            {isError ? (
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h2
              id="timetable-setup-notice-title"
              className="text-sm font-semibold text-gray-950"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-sm leading-6 text-gray-700">
              {description}
            </p>
            {!isError && (
              <p className="mt-1 text-xs font-medium text-sky-800">
                {t("setup.notice.existingScopesSafe")}
              </p>
            )}
            {readOnlyMessage && (
              <p className="mt-1 text-xs font-medium text-amber-800">
                {readOnlyMessage}
              </p>
            )}
          </div>
        </div>

        {isError ? (
          <Button
            className="shrink-0"
            variant="secondary"
            size="sm"
            onClick={() => void onRetry()}
          >
            {t("setup.retry")}
          </Button>
        ) : canCompleteSetup ? (
          <Button
            className="shrink-0"
            size="sm"
            rightIcon={<Arrow className="h-4 w-4" aria-hidden="true" />}
            onClick={onOpenSetup}
          >
            {t("setup.notice.openSetup")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function TimetableSetupLoadError({
  onRetry,
}: {
  onRetry: () => Promise<void>;
}) {
  const t = useTranslations("academics.timetable");
  return (
    <div className="flex min-h-[24rem] items-center justify-center p-6">
      <div
        role="alert"
        className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
      >
        <AlertTriangle
          className="mx-auto h-8 w-8 text-red-600"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-gray-700">{t("setup.loadError")}</p>
        <Button className="mt-5" onClick={() => void onRetry()}>
          {t("setup.retry")}
        </Button>
      </div>
    </div>
  );
}

export function TimetableSetupBlocker({
  status,
}: {
  status: Extract<TimetableSetupStatus, { kind: "read_only" }>;
}) {
  const t = useTranslations("academics.timetable");
  const message = t(
    status.reason === "closed_term"
      ? "setup.readOnly.closedTerm"
      : "setup.readOnly.missingPermission",
  );

  if (status.reason === "missing_permission") {
    return (
      <AccessDenied
        className="max-w-xl"
        title={t("setup.title")}
        description={message}
        requiredPermissions={["academics.structure.manage"]}
      />
    );
  }

  return (
    <div className="flex min-h-[24rem] items-center justify-center p-6">
      <div
        role="alert"
        className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950"
      >
        <AlertTriangle className="mx-auto h-8 w-8" aria-hidden="true" />
        <p className="mt-3 text-sm">{message}</p>
      </div>
    </div>
  );
}
