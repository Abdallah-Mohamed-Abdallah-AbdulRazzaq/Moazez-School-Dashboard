"use client";

import Button from "@/components/ui/button/Button";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { useTranslations } from "next-intl";
import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type {
  CredentialDeliveryPreviewRecipient,
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";

interface CredentialDeliveryPreviewStepProps {
  values: CredentialDeliveryWizardValues;
  preview: CredentialDeliveryPreviewResponse | null;
  isPreviewing: boolean;
  onPreview: () => Promise<void>;
}

function RecipientList({
  recipients,
  emptyLabel,
  reasonLabels,
}: {
  recipients: CredentialDeliveryPreviewRecipient[];
  emptyLabel: string;
  reasonLabels?: Record<string, string>;
}) {
  if (recipients.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {recipients.map((recipient) => (
        <div
          key={`${recipient.userId}-${recipient.eligible ? "eligible" : "skipped"}`}
          className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {recipient.fullName || recipient.recipientEmail || "—"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {recipient.username || recipient.loginEmail || "—"}
              </p>
              {recipient.recipientEmail ? (
                <p className="truncate text-xs text-gray-500">
                  {recipient.recipientEmail}
                </p>
              ) : null}
            </div>
            {reasonLabels && recipient.skipReason ? (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {reasonLabels[recipient.skipReason] ?? reasonLabels.unknown}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CredentialDeliveryPreviewStep({
  values,
  preview,
  isPreviewing,
  onPreview,
}: CredentialDeliveryPreviewStepProps) {
  const t = useTranslations("settings.email.credentialDeliveries");
  const skippedReasonLabels: Record<string, string> = {
    disabled_user: t("preview.skip_reasons.disabled_user"),
    missing_contact_email: t("preview.skip_reasons.missing_contact_email"),
    missing_delivery_email: t("preview.skip_reasons.missing_delivery_email"),
    duplicate_email: t("preview.skip_reasons.duplicate_email"),
    invalid_email: t("preview.skip_reasons.invalid_email"),
    already_has_password: t("preview.skip_reasons.already_has_password"),
    unknown: t("preview.skip_reasons.unknown"),
  };
  const skippedReasonEntries = Object.entries(preview?.skippedReasons ?? {})
    .filter(([, count]) => count > 0)
    .sort(([, leftCount], [, rightCount]) => rightCount - leftCount);

  return (
    <SettingsSectionCard
      title={t("preview.title")}
      description={t("preview.description")}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.template")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {t(`templateKeys.${values.templateKey}`)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.mode")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {t(`credentialModes.${values.credentialMode}`)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{t("preview.contact_email")}</p>
            <p className="mt-1 font-semibold text-gray-900">
              {values.allowLoginEmailFallback
                ? t("preview.login_email_fallback")
                : t("preview.contact_email_only")}
            </p>
          </div>
        </div>

        <Button variant="secondary" loading={isPreviewing} onClick={() => void onPreview()}>
          {isPreviewing ? t("actions.previewing") : t("actions.preview")}
        </Button>

        {preview ? (
          <div className="space-y-4">
            {preview.eligibleCount === 0 ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {t("preview.zero_eligible_warning")}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-700">{t("preview.eligible")}</p>
                <p className="mt-1 text-2xl font-semibold text-green-900">
                  {preview.eligibleCount}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">{t("preview.skipped")}</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">
                  {preview.skippedCount}
                </p>
              </div>
            </div>

            {skippedReasonEntries.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">
                  {t("preview.skip_reasons.title")}
                </h3>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {skippedReasonEntries.map(([reason, count]) => (
                    <li
                      key={reason}
                      className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-3 py-2 text-sm"
                    >
                      <span className="text-amber-900">
                        {skippedReasonLabels[reason] ?? skippedReasonLabels.unknown}
                      </span>
                      <span className="font-semibold tabular-nums text-amber-900">
                        {count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("preview.sample_eligible")}
                </h3>
                <RecipientList
                  recipients={preview.eligibleSample || []}
                  emptyLabel={t("preview.no_eligible")}
                />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("preview.sample_skipped")}
                </h3>
                <RecipientList
                  recipients={preview.skippedSample || []}
                  emptyLabel={t("preview.no_skipped")}
                  reasonLabels={skippedReasonLabels}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="font-semibold text-gray-900">{t("preview.empty_title")}</p>
            <p className="mt-1 text-sm text-gray-500">
              {t("preview.empty_description")}
            </p>
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}
