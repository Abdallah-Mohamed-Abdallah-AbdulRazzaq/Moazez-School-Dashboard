"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, RotateCcw, Save } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import TextArea from "@/components/ui/input/TextArea";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import TemplateEditor, {
  toTemplateEditorValues,
  toUpdateTemplateRequest,
  validateTemplateEditor,
  type TemplateEditorErrors,
  type TemplateEditorValues,
} from "@/features/settings/email/templates/components/TemplateEditor";
import TemplateKeyTabs from "@/features/settings/email/templates/components/TemplateKeyTabs";
import TemplatePreviewModal from "@/features/settings/email/templates/components/TemplatePreviewModal";
import {
  fetchEmailTemplate,
  fetchEmailTemplates,
  previewEmailTemplate,
  resetEmailTemplateToDefault,
  updateEmailTemplate,
} from "@/features/settings/email/templates/services/emailTemplatesService";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  EmailTemplate,
  EmailTemplateKey,
  PreviewEmailTemplateResponse,
} from "@/features/settings/email/templates/types";

const templateKeys: EmailTemplateKey[] = [
  "ACCOUNT_CREDENTIALS",
  "PASSWORD_RESET",
  "GENERAL_MESSAGE",
];

function emptyPreviewData() {
  return JSON.stringify({}, null, 2);
}

export default function EmailTemplatesPage() {
  const t = useTranslations("settings.email.templates");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.email.templates.manage");
  const [templatesByKey, setTemplatesByKey] = useState<
    Map<EmailTemplateKey, EmailTemplate>
  >(new Map());
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>(
    "ACCOUNT_CREDENTIALS",
  );
  const [values, setValues] = useState<TemplateEditorValues | null>(null);
  const [errors, setErrors] = useState<TemplateEditorErrors>({});
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [previewDataJson, setPreviewDataJson] = useState(
    emptyPreviewData(),
  );
  const [previewJsonError, setPreviewJsonError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewEmailTemplateResponse | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const operationPending =
    isRefreshing || isSaving || isPreviewing || isResetting;

  const selectedTemplate = templatesByKey.get(selectedKey) || null;
  const templateLabels = useMemo(
    () => ({
      ACCOUNT_CREDENTIALS: t("keys.ACCOUNT_CREDENTIALS"),
      PASSWORD_RESET: t("keys.PASSWORD_RESET"),
      GENERAL_MESSAGE: t("keys.GENERAL_MESSAGE"),
    }),
    [t],
  );

  const validationMessages = useMemo(
    () => ({
      subjectRequired: t("validation.subject_required"),
      bodyHtmlRequired: t("validation.body_html_required"),
    }),
    [t],
  );

  const hydrateTemplate = useCallback(async (key: EmailTemplateKey) => {
    const template = await fetchEmailTemplate(key);
    setTemplatesByKey((current) => {
      const next = new Map(current);
      next.set(key, template);
      return next;
    });
    setValues(toTemplateEditorValues(template));
    setErrors({});
  }, []);

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      try {
        const response = await fetchEmailTemplates();
        const nextMap = new Map<EmailTemplateKey, EmailTemplate>();
        response.items.forEach((template) =>
          nextMap.set(template.key, template),
        );
        setTemplatesByKey(nextMap);
        const nextTemplate =
          nextMap.get(selectedKey) ||
          nextMap.get("ACCOUNT_CREDENTIALS") ||
          response.items[0] ||
          null;
        if (nextTemplate) {
          setSelectedKey(nextTemplate.key);
          setValues(toTemplateEditorValues(nextTemplate));
          setPreviewDataJson(emptyPreviewData());
        }
      } catch (error) {
        setPageError(classifySettingsWorkflowError(error));
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedKey, showError, t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
  }, [hydrate]);

  const handleSelectKey = async (key: EmailTemplateKey) => {
    setSelectedKey(key);
    setPreviewDataJson(emptyPreviewData());
    setPreviewJsonError(null);
    const existing = templatesByKey.get(key);
    if (existing) {
      setValues(toTemplateEditorValues(existing));
      setErrors({});
      return;
    }
    try {
      await hydrateTemplate(key);
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(t("messages.load_failed"));
    }
  };

  const handleChange = <K extends keyof TemplateEditorValues>(
    field: K,
    value: TemplateEditorValues[K],
  ) => {
    setValues((current) =>
      current ? { ...current, [field]: value } : current,
    );
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    if (!values) {
      return;
    }
    const nextErrors = validateTemplateEditor(values, validationMessages);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPageError(null);
    setIsSaving(true);
    try {
      const saved = await updateEmailTemplate(
        selectedKey,
        toUpdateTemplateRequest(values),
      );
      setTemplatesByKey((current) => {
        const next = new Map(current);
        next.set(saved.key, saved);
        return next;
      });
      setValues(toTemplateEditorValues(saved));
      showSuccess(t("messages.saved"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      const fieldErrors = getValidationFieldErrors(error);
      setErrors({
        subject: fieldErrors.subject,
        preheader: fieldErrors.preheader,
        title: fieldErrors.title,
        subtitle: fieldErrors.subtitle,
        bodyHtml: fieldErrors.bodyHtml,
        bodyText: fieldErrors.bodyText,
        footerHtml: fieldErrors.footerHtml,
        supportEmail: fieldErrors.supportEmail,
        supportPhone: fieldErrors.supportPhone,
        website: fieldErrors.website,
        facebook: fieldErrors.facebook,
        instagram: fieldErrors.instagram,
        x: fieldErrors.x,
      });
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const parsePreviewData = () => {
    try {
      const parsed = JSON.parse(previewDataJson) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setPreviewJsonError(t("validation.preview_object_required"));
        return null;
      }
      setPreviewJsonError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setPreviewJsonError(t("validation.preview_json_invalid"));
      return null;
    }
  };

  const handlePreview = async () => {
    const data = parsePreviewData();
    if (!data) {
      return;
    }
    setPageError(null);
    setIsPreviewing(true);
    try {
      const result = await previewEmailTemplate(selectedKey, {
        ...(values ? toUpdateTemplateRequest(values) : {}),
        previewData: data,
      });
      setPreview(result);
      setIsPreviewOpen(true);
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(t("messages.preview_failed"));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleReset = async () => {
    setPageError(null);
    setIsResetConfirmOpen(false);
    setIsResetting(true);
    try {
      const reset = await resetEmailTemplateToDefault(selectedKey);
      setTemplatesByKey((current) => {
        const next = new Map(current);
        next.set(reset.key, reset);
        return next;
      });
      setValues(toTemplateEditorValues(reset));
      setErrors({});
      showSuccess(t("messages.reset"));
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(tCommon("save_failed"));
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.templates.view">
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
              <Button
                variant="secondary"
                leftIcon={<Eye className="h-4 w-4" />}
                loading={isPreviewing}
                disabled={operationPending}
                onClick={() => void handlePreview()}
              >
                {t("actions.preview")}
              </Button>
              {canManage ? (
                <>
                  <Button
                    variant="secondary"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    loading={isResetting}
                    disabled={operationPending}
                    onClick={() => setIsResetConfirmOpen(true)}
                  >
                    {t("actions.reset")}
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<Save className="h-4 w-4" />}
                    loading={isSaving}
                    disabled={operationPending}
                    onClick={() => void handleSave()}
                  >
                    {t("actions.save")}
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

        <div className="space-y-6">
          <SettingsSectionCard
            title={t("list.title")}
            description={t("list.description")}
          >
            <TemplateKeyTabs
              keys={templateKeys}
              selectedKey={selectedKey}
              templatesByKey={templatesByKey}
              onSelect={(key) => void handleSelectKey(key)}
              labels={templateLabels}
              activeLabel={t("active")}
              inactiveLabel={t("inactive")}
              disabled={operationPending}
            />
          </SettingsSectionCard>

          {selectedTemplate && values ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <SettingsSectionCard
                title={templateLabels[selectedKey]}
                description={t("editor.description")}
              >
                <TemplateEditor
                  values={values}
                  errors={errors}
                  canManage={canManage}
                  allowedVariables={selectedTemplate.allowedVariables}
                  onChange={handleChange}
                  labels={{
                    subject: t("fields.subject"),
                    preheader: t("fields.preheader"),
                    title: t("fields.title"),
                    subtitle: t("fields.subtitle"),
                    bodyHtml: t("fields.body_html"),
                    bodyText: t("fields.body_text"),
                    footerHtml: t("fields.footer_html"),
                    supportEmail: t("fields.support_email"),
                    supportPhone: t("fields.support_phone"),
                    website: t("fields.website"),
                    facebook: t("fields.facebook"),
                    instagram: t("fields.instagram"),
                    x: t("fields.x"),
                    isActive: t("fields.is_active"),
                    allowedVariables: t("editor.allowed_variables"),
                    noVariables: t("editor.no_variables"),
                    credentialSafety: t("editor.credential_safety"),
                    htmlTab: t("editor.html_tab"),
                    textTab: t("editor.text_tab"),
                    variableHelp: t("editor.variable_help"),
                    insertVariable: t("editor.insert_variable"),
                  }}
                />
              </SettingsSectionCard>

              <SettingsSectionCard
                title={t("preview.title")}
                description={t("preview.description")}
              >
                <TextArea
                  label={t("preview.data_json")}
                  rows={18}
                  dir="ltr"
                  value={previewDataJson}
                  onChange={(event) => {
                    setPreviewDataJson(event.target.value);
                    setPreviewJsonError(null);
                  }}
                  error={previewJsonError || undefined}
                  helperText={t("preview.no_send")}
                />
              </SettingsSectionCard>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t("empty.description")}
              </p>
            </div>
          )}
        </div>

        <TemplatePreviewModal
          isOpen={isPreviewOpen}
          preview={preview}
          onClose={() => setIsPreviewOpen(false)}
          labels={{
            title: t("preview.modal_title"),
            subject: t("fields.subject"),
            html: t("preview.html"),
            text: t("preview.text"),
            unknownVariables: t("preview.unknown_variables"),
            missingVariables: t("preview.missing_variables"),
            none: t("preview.none"),
            close: tCommon("close"),
          }}
        />
        <ConfirmDialog
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={() => void handleReset()}
          title={t("confirm.reset_title")}
          description={t("confirm.reset_description", {
            template: templateLabels[selectedKey],
          })}
          confirmLabel={t("confirm.reset_confirm")}
          cancelLabel={tCommon("cancel")}
          loading={isResetting}
          severity="danger"
        />
      </main>
    </SettingsAccessGuard>
  );
}
