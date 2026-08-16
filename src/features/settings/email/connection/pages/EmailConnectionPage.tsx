"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleOff, PlayCircle, RefreshCcw, Save, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import EmailConnectionForm, {
  toEmailConnectionFormValues,
  toUpdateEmailConnectionRequest,
  validateEmailConnectionForm,
  type EmailConnectionFormErrors,
  type EmailConnectionFormValues,
} from "@/features/settings/email/connection/components/EmailConnectionForm";
import EmailConnectionStatusCard from "@/features/settings/email/connection/components/EmailConnectionStatusCard";
import {
  activateEmailConnection,
  disableEmailConnection,
  fetchEmailConnection,
  testEmailConnection,
  updateEmailConnection,
} from "@/features/settings/email/connection/services/emailConnectionService";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type { EmailConnection } from "@/features/settings/email/connection/types";

export default function EmailConnectionPage() {
  const t = useTranslations("settings.email.connection");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.email.connection.manage");
  const [connection, setConnection] = useState<EmailConnection | null>(null);
  const [values, setValues] = useState<EmailConnectionFormValues>(
    toEmailConnectionFormValues(null),
  );
  const [errors, setErrors] = useState<EmailConnectionFormErrors>({});
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [refreshError, setRefreshError] =
    useState<SettingsWorkflowError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);

  const validationMessages = useMemo(
    () => ({
      fromNameRequired: t("validation.from_name_required"),
      fromEmailRequired: t("validation.from_email_required"),
      providerRequired: t("validation.provider_required"),
      hostRequired: t("validation.host_required"),
      portInvalid: t("validation.port_invalid"),
    }),
    [t],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      setRefreshError(null);
      try {
        const nextConnection = await fetchEmailConnection();
        setConnection(nextConnection);
        setValues((current) => ({
          ...toEmailConnectionFormValues(nextConnection),
          testRecipientEmail: current.testRecipientEmail,
        }));
        setErrors({});
      } catch (error) {
        setPageError(classifySettingsWorkflowError(error));
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showError, t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
  }, [hydrate]);

  const mutationPending =
    isSaving || isTesting || isActivating || isDisabling;
  const operationPending = isRefreshing || mutationPending;
  const configured = connection?.configured === true;
  const canTest = configured && !operationPending;
  const canActivate =
    configured && connection?.status === "VERIFIED" && !operationPending;
  const canDisable =
    configured && connection?.status !== "DISABLED" && !operationPending;

  const handleChange = <K extends keyof EmailConnectionFormValues>(
    field: K,
    value: EmailConnectionFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    const nextErrors = validateEmailConnectionForm(
      values,
      validationMessages,
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setPageError(null);
    setRefreshError(null);
    setIsSaving(true);
    try {
      const saved = await updateEmailConnection(
        toUpdateEmailConnectionRequest(values),
      );
      setConnection(saved);
      setValues((current) => ({
        ...toEmailConnectionFormValues(saved),
        testRecipientEmail: current.testRecipientEmail,
      }));
      showSuccess(t("messages.saved"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      const fieldErrors = getValidationFieldErrors(error);
      setErrors({
        providerType: fieldErrors.providerType,
        fromName: fieldErrors.fromName,
        fromEmail: fieldErrors.fromEmail,
        replyToEmail: fieldErrors.replyToEmail,
        host: fieldErrors.host,
        port: fieldErrors.port,
        secure: fieldErrors.secure,
        username: fieldErrors.username,
        password: fieldErrors.password,
        apiKey: fieldErrors.apiKey,
      });
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!canTest) {
      return;
    }
    const nextErrors = validateEmailConnectionForm(
      values,
      validationMessages,
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setPageError(null);
    setRefreshError(null);
    setIsTesting(true);
    try {
      const toEmail = values.testRecipientEmail.trim();
      const result = await testEmailConnection(toEmail ? { toEmail } : {});
      setConnection(result);
      showSuccess(result.message || t("messages.test_sent"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(t("messages.test_failed"));
      try {
        const authoritativeConnection = await fetchEmailConnection();
        setConnection(authoritativeConnection);
        setValues((current) => ({
          ...toEmailConnectionFormValues(authoritativeConnection),
          testRecipientEmail: current.testRecipientEmail,
        }));
      } catch (refreshFailure) {
        setRefreshError(classifySettingsWorkflowError(refreshFailure));
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleActivate = async () => {
    if (!canActivate) {
      return;
    }
    setPageError(null);
    setIsActivating(true);
    try {
      const result = await activateEmailConnection();
      setConnection(result);
      showSuccess(t("messages.activated"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(tCommon("save_failed"));
    } finally {
      setIsActivating(false);
    }
  };

  const handleDisable = async () => {
    if (!canDisable) {
      return;
    }
    setPageError(null);
    setIsDisableConfirmOpen(false);
    setIsDisabling(true);
    try {
      const result = await disableEmailConnection();
      setConnection(result);
      showSuccess(t("messages.disabled"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(tCommon("save_failed"));
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.connection.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isRefreshing}
                disabled={operationPending}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
              {canManage ? (
                <>
                  <Button
                    variant="secondary"
                    leftIcon={<PlayCircle className="h-4 w-4" />}
                    loading={isTesting}
                    disabled={!canTest}
                    onClick={() => void handleTest()}
                  >
                    {t("actions.test")}
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Send className="h-4 w-4" />}
                    loading={isActivating}
                    disabled={!canActivate}
                    onClick={() => void handleActivate()}
                  >
                    {t("actions.activate")}
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<CircleOff className="h-4 w-4" />}
                    loading={isDisabling}
                    disabled={!canDisable}
                    onClick={() => setIsDisableConfirmOpen(true)}
                  >
                    {t("actions.disable")}
                  </Button>
                </>
              ) : null}
            </div>
          }
        />

        {pageError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageError} />
          </div>
        ) : null}

        {refreshError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={refreshError} />
          </div>
        ) : null}

        <div className="space-y-6">
          <EmailConnectionStatusCard
            connection={connection}
            labels={{
              title: t("status.title"),
              description: t("status.description"),
              status: t("status.status"),
              provider: t("fields.provider_type"),
              lastTest: t("status.last_test"),
              password: t("fields.password"),
              apiKey: t("fields.api_key"),
              configured: t("status.configured"),
              notConfigured: t("status.not_configured"),
              failureReason: t("status.failure_reason"),
              failureReasonLabels: {
                smtp_configuration_invalid: t(
                  "status.failure_reasons.smtp_configuration_invalid",
                ),
                smtp_password_missing: t(
                  "status.failure_reasons.smtp_password_missing",
                ),
                secret_decryption_failed: t(
                  "status.failure_reasons.secret_decryption_failed",
                ),
                unknown: t("status.failure_reasons.unknown"),
              },
              notAvailable: t("not_available"),
              statusLabels: {
                DRAFT: t("states.DRAFT"),
                VERIFIED: t("states.VERIFIED"),
                ACTIVE: t("states.ACTIVE"),
                DISABLED: t("states.DISABLED"),
                FAILED: t("states.FAILED"),
              },
            }}
          />

          <SettingsSectionCard
            title={t("form.title")}
            description={t("form.description")}
            actions={
              canManage ? (
                <Button
                  variant="primary"
                  leftIcon={<Save className="h-4 w-4" />}
                  loading={isSaving}
                  disabled={operationPending}
                  onClick={() => void handleSave()}
                >
                  {t("actions.save")}
                </Button>
              ) : null
            }
          >
            <EmailConnectionForm
              values={values}
              errors={errors}
              canManage={canManage}
              hasPassword={Boolean(connection?.hasPassword)}
              hasApiKey={Boolean(connection?.hasApiKey)}
              onChange={handleChange}
              labels={{
                providerType: t("fields.provider_type"),
                fromName: t("fields.from_name"),
                fromEmail: t("fields.from_email"),
                replyToEmail: t("fields.reply_to_email"),
                host: t("fields.host"),
                port: t("fields.port"),
                secure: t("fields.secure"),
                username: t("fields.username"),
                password: t("fields.password"),
                apiKey: t("fields.api_key"),
                testRecipientEmail: t("fields.test_recipient_email"),
                smtp: t("provider.SMTP"),
                configured: t("status.configured"),
                notConfigured: t("status.not_configured"),
                secretHelp: t("form.secret_help"),
                testRecipientHelp: t("form.test_recipient_help"),
              }}
            />
          </SettingsSectionCard>
        </div>
        <ConfirmDialog
          isOpen={isDisableConfirmOpen}
          onClose={() => setIsDisableConfirmOpen(false)}
          onConfirm={() => void handleDisable()}
          title={t("confirm.disable_title")}
          description={t("confirm.disable_description")}
          confirmLabel={t("confirm.disable_confirm")}
          cancelLabel={tCommon("cancel")}
          loading={isDisabling}
          severity="danger"
        />
      </main>
    </SettingsAccessGuard>
  );
}
