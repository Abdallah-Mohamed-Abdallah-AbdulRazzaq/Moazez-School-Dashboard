"use client";

import Select from "@/components/ui/input/Select";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { useTranslations } from "next-intl";
import type {
  CredentialDeliveryWizardValues,
} from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type { CredentialDeliveryMode } from "@/features/settings/email/credential-deliveries/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";

interface CredentialDeliveryModeStepProps {
  values: CredentialDeliveryWizardValues;
  onChange: (values: Partial<CredentialDeliveryWizardValues>) => void;
}

export default function CredentialDeliveryModeStep({
  values,
  onChange,
}: CredentialDeliveryModeStepProps) {
  const t = useTranslations("settings.email.credentialDeliveries");

  return (
    <SettingsSectionCard
      title={t("mode.title")}
      description={t("mode.description")}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label={t("mode.template_key")}
            value={values.templateKey}
            onChange={(value) =>
              onChange({ templateKey: value as EmailTemplateKey })
            }
            options={[
              {
                value: "ACCOUNT_CREDENTIALS",
                label: t("templateKeys.ACCOUNT_CREDENTIALS"),
              },
              {
                value: "PASSWORD_RESET",
                label: t("templateKeys.PASSWORD_RESET"),
              },
              {
                value: "GENERAL_MESSAGE",
                label: t("templateKeys.GENERAL_MESSAGE"),
              },
            ]}
          />
          <Select
            label={t("mode.credential_mode")}
            value={values.credentialMode}
            onChange={(value) =>
              onChange({ credentialMode: value as CredentialDeliveryMode })
            }
            options={[
              {
                value: "LOGIN_INFO_ONLY",
                label: t("credentialModes.LOGIN_INFO_ONLY"),
              },
              {
                value: "GENERATE_TEMPORARY_PASSWORD",
                label: t("credentialModes.GENERATE_TEMPORARY_PASSWORD"),
              },
              {
                value: "REGENERATE_TEMPORARY_PASSWORD",
                label: t("credentialModes.REGENERATE_TEMPORARY_PASSWORD"),
              },
            ]}
          />
        </div>

        {values.credentialMode === "GENERATE_TEMPORARY_PASSWORD" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("warnings.generate")}
          </p>
        ) : null}
        {values.credentialMode === "REGENERATE_TEMPORARY_PASSWORD" ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("warnings.regenerate")}
          </p>
        ) : null}
        {values.credentialMode !== "LOGIN_INFO_ONLY" ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {t("warnings.smtp_failure")}
          </p>
        ) : null}
      </div>
    </SettingsSectionCard>
  );
}
