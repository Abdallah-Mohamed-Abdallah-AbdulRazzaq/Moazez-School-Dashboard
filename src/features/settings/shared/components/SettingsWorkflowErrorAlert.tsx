"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  SettingsWorkflowError,
  SettingsWorkflowErrorKind,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";

interface SettingsWorkflowErrorAlertProps {
  error: SettingsWorkflowError;
}

export default function SettingsWorkflowErrorAlert({
  error,
}: SettingsWorkflowErrorAlertProps) {
  const locale = useLocale();
  const t = useTranslations("settings.workflow_errors");
  const actionHrefByKind: Partial<Record<SettingsWorkflowErrorKind, string>> = {
    "teacher-directory": `/${locale}/teachers`,
    "email-connection": `/${locale}/settings/email/connection`,
    "email-connection-unverified": `/${locale}/settings/email/connection`,
    "email-connection-test": `/${locale}/settings/email/connection`,
    "email-template": `/${locale}/settings/email/templates`,
    "email-content-invalid": `/${locale}/settings/email/templates`,
    "login-identity": `/${locale}/settings/login-identity`,
  };
  const message =
    error.kind === "recipient-limit" &&
    error.recipientCount !== undefined &&
    error.recipientLimit !== undefined
      ? t("recipient-limit.message_with_values", {
          count: error.recipientCount,
          limit: error.recipientLimit,
        })
      : t(`${error.kind}.message`);
  const actionHref = actionHrefByKind[error.kind];
  const isWarning = error.kind !== "retryable" && error.kind !== "generic";

  return (
    <section
      role="alert"
      aria-live="polite"
      className={`rounded-xl border p-4 ${
        isWarning
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-red-200 bg-red-50 text-red-950"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            isWarning ? "text-amber-600" : "text-red-600"
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{t(`${error.kind}.title`)}</h3>
          <p className="mt-1 text-sm leading-6">{message}</p>
          <ErrorDetails error={error} />
          {actionHref ? (
            <Link
              href={actionHref}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-current px-3 py-2 text-sm font-medium transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              {t(`${error.kind}.action`)}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          ) : null}
          {error.traceId ? (
            <p className="mt-3 break-all text-xs opacity-75">
              {t("trace_id")}: <code>{error.traceId}</code>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ErrorDetails({ error }: { error: SettingsWorkflowError }) {
  const t = useTranslations("settings.workflow_errors.details");
  const details = [
    error.invalidFields?.length
      ? t("invalid_fields", { fields: error.invalidFields.join(", ") })
      : null,
    error.reasonCode ? t("reason", { reason: error.reasonCode }) : null,
    error.batchStatus ? t("batch_status", { status: error.batchStatus }) : null,
    error.variables?.length
      ? t("variables", { variables: error.variables.join(", ") })
      : null,
  ].filter((detail): detail is string => Boolean(detail));
  return details.length ? (
    <ul className="mt-2 list-inside list-disc text-sm">
      {details.map((detail) => (
        <li key={detail}>{detail}</li>
      ))}
    </ul>
  ) : null;
}
