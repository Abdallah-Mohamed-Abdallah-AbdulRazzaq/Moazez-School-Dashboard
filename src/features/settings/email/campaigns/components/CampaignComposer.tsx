"use client";

import { useMemo, useState } from "react";
import { Eye, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import CampaignAudienceStep, {
  buildCampaignAudience,
  type CampaignAudienceMode,
  type CampaignAudienceValues,
} from "@/features/settings/email/campaigns/components/CampaignAudienceStep";
import CampaignPreviewModal from "@/features/settings/email/campaigns/components/CampaignPreviewModal";
import { useTranslations } from "next-intl";
import type {
  EmailCampaignBatch,
  EmailCampaignAudience,
  EmailCampaignPreviewRecipientsResponse,
  EmailCampaignPreviewResponse,
} from "@/features/settings/email/campaigns/types";
import type { RoleDefinition } from "@/features/settings/types";
import {
  campaignRecipientPreviewFingerprint,
  findCredentialVariables,
} from "@/features/settings/email/campaigns/utils/campaignPayloads";

export interface CampaignComposerValues {
  audienceMode: CampaignAudienceMode;
  audience: EmailCampaignAudience;
  selectedUserIdsText: string;
  customEmailsText: string;
  templateKey: "GENERAL_MESSAGE";
  subject: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  footerHtml: string;
}

interface CampaignComposerProps {
  canManage: boolean;
  roles: RoleDefinition[];
  isLoadingRoles: boolean;
  rolesError: boolean;
  recipientPreview: EmailCampaignPreviewRecipientsResponse | null;
  recipientPreviewFingerprint: string | null;
  renderedPreview: EmailCampaignPreviewResponse | null;
  createdBatch: EmailCampaignBatch | null;
  isPreviewingRecipients: boolean;
  isPreviewingCampaign: boolean;
  isCreating: boolean;
  onPreviewRecipients: (
    values: CampaignComposerValues,
  ) => Promise<EmailCampaignPreviewRecipientsResponse | null>;
  onPreviewCampaign: (
    values: CampaignComposerValues,
  ) => Promise<EmailCampaignPreviewResponse | null>;
  onCreate: (
    values: CampaignComposerValues,
  ) => Promise<EmailCampaignBatch | null>;
  onRetryRoles: () => void;
  onRecipientPreviewInvalidated: () => void;
  onStartNewCampaign: () => void;
}

const initialValues: CampaignComposerValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  customEmailsText: "",
  templateKey: "GENERAL_MESSAGE",
  subject: "",
  title: "",
  bodyHtml: "",
  bodyText: "",
  footerHtml: "",
};

export default function CampaignComposer({
  canManage,
  roles,
  isLoadingRoles,
  rolesError,
  recipientPreview,
  recipientPreviewFingerprint,
  renderedPreview,
  createdBatch,
  isPreviewingRecipients,
  isPreviewingCampaign,
  isCreating,
  onPreviewRecipients,
  onPreviewCampaign,
  onCreate,
  onRetryRoles,
  onRecipientPreviewInvalidated,
  onStartNewCampaign,
}: CampaignComposerProps) {
  const t = useTranslations("settings.email.campaigns");
  const [values, setValues] = useState<CampaignComposerValues>(initialValues);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const skippedReasonLabels = {
    disabled_user: t("recipients.skip_reasons.disabled_user"),
    missing_contact_email: t("recipients.skip_reasons.missing_contact_email"),
    duplicate_email: t("recipients.skip_reasons.duplicate_email"),
    invalid_email: t("recipients.skip_reasons.invalid_email"),
    unknown: t("recipients.skip_reasons.unknown"),
  };

  const audienceValues = useMemo<CampaignAudienceValues>(
    () => ({
      audienceMode: values.audienceMode,
      audience: values.audience,
      selectedUserIdsText: values.selectedUserIdsText,
      customEmailsText: values.customEmailsText,
    }),
    [
      values.audience,
      values.audienceMode,
      values.customEmailsText,
      values.selectedUserIdsText,
    ],
  );

  const updateValues = (patch: Partial<CampaignComposerValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setValidationError(null);
  };

  const updateAudience = (patch: Partial<CampaignAudienceValues>) => {
    updateValues(patch as Partial<CampaignComposerValues>);
    onRecipientPreviewInvalidated();
  };

  const validate = (mode: "preview" | "create") => {
    const nextAudience = buildCampaignAudience(values);
    if (!values.subject.trim()) {
      return t("validation.subject_required");
    }
    if (!values.bodyHtml.trim()) {
      return t("validation.body_html_required");
    }
    if (
      values.audienceMode === "selected-users" &&
      (!nextAudience.userIds || nextAudience.userIds.length === 0)
    ) {
      return t("validation.selected_users_required");
    }
    if (values.audienceMode === "role" && !nextAudience.roleKey) {
      return t("validation.role_required");
    }
    if (values.audienceMode === "user-type" && !nextAudience.userType) {
      return t("validation.user_type_required");
    }
    const blockedVariables = findCredentialVariables(values);
    if (blockedVariables.length > 0) {
      return `${t("validation.credential_variables_blocked")} ${blockedVariables.join(", ")}`;
    }
    if (mode === "create" && !recipientPreview) {
      return t("validation.preview_required");
    }
    return null;
  };

  const handlePreviewRecipients = async () => {
    const error = validate("preview");
    if (error) {
      setValidationError(error);
      return;
    }
    const nextValues = { ...values, audience: buildCampaignAudience(values) };
    setValues(nextValues);
    await onPreviewRecipients(nextValues);
  };

  const handlePreviewCampaign = async () => {
    const error = validate("preview");
    if (error) {
      setValidationError(error);
      return;
    }
    const result = await onPreviewCampaign(values);
    if (result) {
      setIsPreviewOpen(true);
    }
  };

  const handleCreate = async () => {
    const error = validate("create");
    if (error) {
      setValidationError(error);
      return;
    }
    await onCreate({ ...values, audience: buildCampaignAudience(values) });
  };

  const handleStartNewCampaign = () => {
    setValues(initialValues);
    setValidationError(null);
    setIsPreviewOpen(false);
    onStartNewCampaign();
  };

  const hasCurrentEligiblePreview =
    recipientPreview !== null &&
    recipientPreview.eligibleCount > 0 &&
    recipientPreviewFingerprint ===
      campaignRecipientPreviewFingerprint(values);
  const operationPending =
    isPreviewingRecipients || isPreviewingCampaign || isCreating;
  const createDisabled =
    !canManage ||
    !hasCurrentEligiblePreview ||
    operationPending ||
    Boolean(createdBatch);

  return (
    <div className="space-y-6">
      <CampaignAudienceStep
        values={audienceValues}
        roles={roles}
        isLoadingRoles={isLoadingRoles}
        rolesError={rolesError}
        onRetryRoles={onRetryRoles}
        onChange={updateAudience}
      />

      <SettingsSectionCard
        title={t("composer.title")}
        description={t("composer.description")}
      >
        <div className="space-y-4">
          {validationError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {validationError}
            </p>
          ) : null}

          <Select
            label={t("fields.template_key")}
            value={values.templateKey}
            onChange={() => updateValues({ templateKey: "GENERAL_MESSAGE" })}
            options={[
              {
                value: "GENERAL_MESSAGE",
                label: t("templateKeys.GENERAL_MESSAGE"),
              },
            ]}
            helperText={t("composer.external_only")}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("fields.subject")}
              value={values.subject}
              onChange={(event) => updateValues({ subject: event.target.value })}
              required
            />
            <Input
              label={t("fields.title")}
              value={values.title}
              onChange={(event) => updateValues({ title: event.target.value })}
            />
          </div>

          <TextArea
            label={t("fields.body_html")}
            rows={8}
            dir="ltr"
            value={values.bodyHtml}
            onChange={(event) => updateValues({ bodyHtml: event.target.value })}
            required
          />
          <TextArea
            label={t("fields.body_text")}
            rows={5}
            value={values.bodyText}
            onChange={(event) => updateValues({ bodyText: event.target.value })}
            helperText={t("fields.body_text_help")}
          />
          <TextArea
            label={t("fields.footer_html")}
            rows={4}
            dir="ltr"
            value={values.footerHtml}
            onChange={(event) =>
              updateValues({ footerHtml: event.target.value })
            }
          />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {t("composer.credential_safety")}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              leftIcon={<Eye className="h-4 w-4" />}
              loading={isPreviewingRecipients}
              disabled={operationPending}
              onClick={() => void handlePreviewRecipients()}
            >
              {t("actions.preview_recipients")}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Eye className="h-4 w-4" />}
              loading={isPreviewingCampaign}
              disabled={operationPending}
              onClick={() => void handlePreviewCampaign()}
            >
              {t("actions.preview_campaign")}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              loading={isCreating}
              disabled={createDisabled}
              onClick={() => void handleCreate()}
            >
              {t("actions.create")}
            </Button>
          </div>

          {!canManage ? (
            <p className="text-sm text-amber-700">
              {t("validation.manage_required")}
            </p>
          ) : null}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title={t("recipients.title")}
        description={t("recipients.description")}
      >
        {recipientPreview ? (
          <div className="space-y-4">
            {recipientPreview.eligibleCount === 0 ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {t("recipients.zero_eligible_warning")}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryMetric
                label={t("recipients.total_matched")}
                value={recipientPreview.totalMatched ?? 0}
              />
              <SummaryMetric
                label={t("recipients.eligible")}
                value={recipientPreview.eligibleCount}
              />
              <SummaryMetric
                label={t("recipients.skipped")}
                value={recipientPreview.skippedCount}
              />
            </div>
            {recipientPreview.skippedCount > 0 ? (
              <SkippedReasonSummary
                reasons={recipientPreview.skippedReasons}
                labels={{
                  title: t("recipients.skip_reasons.title"),
                  ...skippedReasonLabels,
                  unknown: t("recipients.skip_reasons.unknown"),
                }}
              />
            ) : null}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <RecipientSample
                title={t("recipients.sample_eligible")}
                empty={t("recipients.no_eligible")}
                recipients={recipientPreview.recipients.filter(
                  (recipient) => recipient.eligible,
                )}
              />
              <RecipientSample
                title={t("recipients.sample_skipped")}
                empty={t("recipients.no_skipped")}
                recipients={recipientPreview.recipients.filter(
                  (recipient) => !recipient.eligible,
                )}
                skipReasonLabels={skippedReasonLabels}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="font-semibold text-gray-900">
              {t("recipients.empty_title")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("recipients.empty_description")}
            </p>
          </div>
        )}
      </SettingsSectionCard>

      {createdBatch ? (
        <SettingsSectionCard
          title={t("created.title")}
          description={t("created.description")}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryMetric label={t("created.batch_id")} value={createdBatch.batchId} />
            <SummaryMetric
              label={t("created.status")}
              value={t(`statuses.${createdBatch.status}`)}
            />
            <SummaryMetric
              label={t("created.total_recipients")}
              value={createdBatch.totalRecipients}
            />
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={handleStartNewCampaign}
            >
              {t("actions.create_another")}
            </Button>
          </div>
        </SettingsSectionCard>
      ) : null}

      <CampaignPreviewModal
        isOpen={isPreviewOpen}
        preview={renderedPreview}
        onClose={() => setIsPreviewOpen(false)}
        labels={{
          title: t("preview.modal_title"),
          subject: t("fields.subject"),
          html: t("preview.html"),
          text: t("preview.text"),
          unknownVariables: t("preview.unknown_variables"),
          missingVariables: t("preview.missing_variables"),
          none: t("preview.none"),
          close: t("actions.close"),
        }}
      />
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function RecipientSample({
  title,
  empty,
  recipients,
  skipReasonLabels = {},
}: {
  title: string;
  empty: string;
  recipients: EmailCampaignPreviewRecipientsResponse["recipients"];
  skipReasonLabels?: Record<string, string>;
}) {
  const sample = recipients.slice(0, 8);
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
        {title}
      </div>
      {sample.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {sample.map((recipient, index) => (
            <div
              key={`${recipient.username || recipient.recipientEmail || "recipient"}-${index}`}
              className="px-3 py-2 text-sm"
            >
              <p className="font-medium text-gray-900">
                {recipient.fullName || recipient.recipientEmail || "—"}
              </p>
              {recipient.username ? (
                <p className="text-xs text-gray-500">{recipient.username}</p>
              ) : null}
              {recipient.recipientEmail ? (
                <p className="break-all text-xs text-gray-500">{recipient.recipientEmail}</p>
              ) : null}
              {recipient.skipReason ? (
                <p className="mt-1 text-xs text-red-600">
                  {skipReasonLabels[recipient.skipReason] ||
                    skipReasonLabels.unknown}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="p-3 text-sm text-gray-500">{empty}</p>
      )}
    </div>
  );
}

function SkippedReasonSummary({
  reasons,
  labels,
}: {
  reasons?: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(reasons ?? {}).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">
        {labels.title}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-amber-800">
        {entries.map(([reason, count]) => (
          <li key={reason} className="flex items-center justify-between gap-3">
            <span>{labels[reason] || labels.unknown}</span>
            <span className="font-semibold tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
