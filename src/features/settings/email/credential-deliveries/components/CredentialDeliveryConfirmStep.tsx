"use client";

import Button from "@/components/ui/button/Button";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CredentialDeliveryWizardValues } from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type {
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";
import type { EmailDeliveryBatch } from "@/features/settings/email/deliveries/types";

interface CredentialDeliveryConfirmStepProps {
  values: CredentialDeliveryWizardValues;
  preview: CredentialDeliveryPreviewResponse | null;
  createdBatch: EmailDeliveryBatch | null;
  canManage: boolean;
  isCreating: boolean;
  onCreate: () => Promise<void>;
}

export default function CredentialDeliveryConfirmStep({
  values,
  preview,
  createdBatch,
  canManage,
  isCreating,
  onCreate,
}: CredentialDeliveryConfirmStepProps) {
  const t = useTranslations("settings.email.credentialDeliveries");
  const tStatus = useTranslations("settings.email.deliveries.statuses");

  return (
    <SettingsSectionCard
      title={t("confirm.title")}
      description={t("confirm.description")}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("warnings.no_raw_passwords")}
        </div>
        {values.credentialMode !== "LOGIN_INFO_ONLY" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("warnings.smtp_failure")}
          </div>
        ) : null}

        {preview ? (
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
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            {t("confirm.preview_required")}
          </p>
        )}

        {createdBatch ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">{t("confirm.created")}</p>
            <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-green-700">{t("confirm.batch_id")}</dt>
                <dd className="break-all font-medium">{createdBatch.batchId}</dd>
              </div>
              <div>
                <dt className="text-green-700">{t("confirm.status")}</dt>
                <dd className="font-medium">
                  {tStatus(createdBatch.status)}
                </dd>
              </div>
              <div>
                <dt className="text-green-700">{t("confirm.queued")}</dt>
                <dd className="font-medium">{createdBatch.queuedCount}</dd>
              </div>
              <div>
                <dt className="text-green-700">{t("preview.skipped")}</dt>
                <dd className="font-medium">{createdBatch.skippedCount}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <Button
          variant="primary"
          leftIcon={<Send className="h-4 w-4" />}
          loading={isCreating}
          disabled={!canManage || !preview || preview.eligibleCount < 1}
          onClick={() => void onCreate()}
        >
          {isCreating ? t("actions.creating") : t("actions.create")}
        </Button>
        {!canManage ? (
          <p className="text-sm text-gray-500">{t("confirm.manage_required")}</p>
        ) : null}
      </div>
    </SettingsSectionCard>
  );
}
