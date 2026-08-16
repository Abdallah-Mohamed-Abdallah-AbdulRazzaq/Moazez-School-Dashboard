"use client";

import { type KeyboardEvent, useState } from "react";
import { RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import UserMultiSearchSelect from "@/features/communication/components/selectors/UserMultiSearchSelect";
import { useTranslations } from "next-intl";
import type { EmailCampaignAudience } from "@/features/settings/email/campaigns/types";
import type { EmailUserType } from "@/features/settings/email/shared/recipientPreview";
import type { RoleDefinition } from "@/features/settings/types";

export type CampaignAudienceMode =
  | "selected-users"
  | "role"
  | "user-type"
  | "all-school";

export interface CampaignAudienceValues {
  audienceMode: CampaignAudienceMode;
  audience: EmailCampaignAudience;
  selectedUserIdsText: string;
  customEmailsText: string;
}

interface CampaignAudienceStepProps {
  values: CampaignAudienceValues;
  roles: RoleDefinition[];
  isLoadingRoles?: boolean;
  rolesError?: boolean;
  onRetryRoles?: () => void;
  onChange: (values: Partial<CampaignAudienceValues>) => void;
}

const CAMPAIGN_USER_TYPES = [
  "platform_user",
  "organization_user",
  "school_user",
  "teacher",
  "parent",
  "student",
  "applicant",
  "pickup_delegate",
  "service_account",
] as const satisfies readonly EmailUserType[];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDelimited(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function withCustomEmails(
  audience: EmailCampaignAudience,
  customEmailsText: string,
): EmailCampaignAudience {
  const customEmails = parseDelimited(customEmailsText);
  return customEmails.length > 0 ? { ...audience, customEmails } : audience;
}

function formatCustomEmails(emails: string[]) {
  return emails.join("\n");
}

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

function hasEmail(emails: string[], email: string) {
  return emails.some(
    (existingEmail) => existingEmail.toLowerCase() === email.toLowerCase(),
  );
}

function audienceForMode(
  mode: CampaignAudienceMode,
  values: CampaignAudienceValues,
): EmailCampaignAudience {
  switch (mode) {
    case "selected-users":
      return withCustomEmails(
        { userIds: parseDelimited(values.selectedUserIdsText) },
        values.customEmailsText,
      );
    case "role":
      return withCustomEmails(
        { roleKey: values.audience.roleKey },
        values.customEmailsText,
      );
    case "user-type":
      return withCustomEmails(
        { userType: values.audience.userType },
        values.customEmailsText,
      );
    case "all-school":
    default:
      return withCustomEmails({ allSchool: true }, values.customEmailsText);
  }
}

export function buildCampaignAudience(
  values: CampaignAudienceValues,
): EmailCampaignAudience {
  return audienceForMode(values.audienceMode, values);
}

export function parseCampaignDelimited(value: string) {
  return parseDelimited(value);
}

interface CustomEmailBadgesInputProps {
  values: CampaignAudienceValues;
  onChange: (values: Partial<CampaignAudienceValues>) => void;
}

function CustomEmailBadgesInput({
  values,
  onChange,
}: CustomEmailBadgesInputProps) {
  const t = useTranslations("settings.email.campaigns");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string>();
  const customEmails = parseDelimited(values.customEmailsText);

  const updateCustomEmails = (emails: string[]) => {
    const customEmailsText = formatCustomEmails(emails);
    onChange({
      customEmailsText,
      audience: audienceForMode(values.audienceMode, {
        ...values,
        customEmailsText,
      }),
    });
  };

  const addPendingEmail = () => {
    const email = pendingEmail.trim();

    if (!email) {
      return;
    }

    if (!isValidEmail(email)) {
      setError(t("audience.custom_email_invalid"));
      return;
    }

    if (hasEmail(customEmails, email)) {
      setError(t("audience.custom_email_duplicate"));
      return;
    }

    setError(undefined);
    setPendingEmail("");
    updateCustomEmails([...customEmails, email]);
  };

  const removeCustomEmail = (email: string) => {
    updateCustomEmails(
      customEmails.filter(
        (customEmail) => customEmail.toLowerCase() !== email.toLowerCase(),
      ),
    );
  };

  const addEmailOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addPendingEmail();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:items-start">
        <Input
          label={t("audience.custom_emails")}
          type="email"
          dir="ltr"
          value={pendingEmail}
          onChange={(event) => {
            setPendingEmail(event.target.value);
            setError(undefined);
          }}
          onKeyDown={addEmailOnEnter}
          placeholder={t("audience.custom_email_placeholder")}
          helperText={t("audience.custom_emails_help")}
          error={error}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!pendingEmail.trim()}
          onClick={addPendingEmail}
        >
          {t("audience.custom_email_add")}
        </Button>
      </div>

      {customEmails.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customEmails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              <span dir="ltr">{email}</span>
              <button
                type="button"
                className="rounded-full text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={t("audience.custom_email_remove", { email })}
                onClick={() => removeCustomEmail(email)}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CampaignAudienceStep({
  values,
  roles,
  isLoadingRoles = false,
  rolesError = false,
  onRetryRoles,
  onChange,
}: CampaignAudienceStepProps) {
  const t = useTranslations("settings.email.campaigns");
  const selectedUserIds =
    values.audience.userIds ?? parseDelimited(values.selectedUserIdsText);
  const roleOptions = roles.flatMap((role) => {
    const key = role.key?.trim();
    return key
      ? [
          {
            value: key,
            label: t("audience.role_option", {
              name: role.name,
              count: role.memberCount,
            }),
            searchText: role.description,
          },
        ]
      : [];
  });
  const roleSelectOptions =
    roleOptions.length > 0
      ? roleOptions
      : [
          {
            value: "__roles_empty",
            label: t("audience.roles_empty"),
            disabled: true,
          },
        ];

  const setAudienceMode = (mode: CampaignAudienceMode) => {
    onChange({
      audienceMode: mode,
      audience: audienceForMode(mode, values),
    });
  };

  return (
    <SettingsSectionCard
      title={t("audience.title")}
      description={t("audience.description")}
    >
      <div className="space-y-4">
        <Select
          label={t("audience.mode")}
          value={values.audienceMode}
          onChange={(value) => setAudienceMode(value as CampaignAudienceMode)}
          options={[
            {
              value: "selected-users",
              label: t("audience.options.selected_users"),
            },
            { value: "role", label: t("audience.options.role") },
            { value: "user-type", label: t("audience.options.user_type") },
            { value: "all-school", label: t("audience.options.all_school") },
          ]}
        />

        {values.audienceMode === "selected-users" ? (
          <UserMultiSearchSelect
            label={t("audience.selected_users")}
            value={selectedUserIds}
            placeholder={t("audience.selected_users_placeholder")}
            helperText={t("audience.selected_users_help")}
            onChange={(userIds) => {
              onChange({
                selectedUserIdsText: userIds.join("\n"),
                audience: withCustomEmails(
                  { userIds },
                  values.customEmailsText,
                ),
              });
            }}
          />
        ) : null}

        {values.audienceMode === "role" ? (
          <div className="space-y-2">
            {isLoadingRoles && roles.length === 0 ? (
              <div
                role="status"
                className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
              >
                {t("audience.roles_loading")}
              </div>
            ) : (
              <Select
                label={t("audience.role_id")}
                value={values.audience.roleKey || ""}
                onChange={(value) =>
                  onChange({
                    audience: withCustomEmails(
                      { roleKey: value },
                      values.customEmailsText,
                    ),
                  })
                }
                placeholder={t("audience.role_placeholder")}
                searchable
                options={roleSelectOptions}
              />
            )}
            {rolesError ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <span>{t("audience.roles_load_failed")}</span>
                {onRetryRoles ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<RefreshCcw className="h-4 w-4" />}
                    loading={isLoadingRoles}
                    onClick={onRetryRoles}
                  >
                    {t("audience.roles_retry")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {values.audienceMode === "user-type" ? (
          <Select
            label={t("audience.user_type")}
            value={values.audience.userType || ""}
            onChange={(value) =>
              onChange({
                audience: withCustomEmails(
                  { userType: value as EmailUserType },
                  values.customEmailsText,
                ),
              })
            }
            placeholder={t("audience.user_type_placeholder")}
            options={CAMPAIGN_USER_TYPES.map((userType) => ({
              value: userType,
              label: t(`audience.userTypes.${userType}`),
            }))}
          />
        ) : null}

        <CustomEmailBadgesInput values={values} onChange={onChange} />
      </div>
    </SettingsSectionCard>
  );
}
