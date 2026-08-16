"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Edit3, FlaskConical } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import TemplateEditorModal from "@/features/settings/components/TemplateEditorModal";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  fetchNotificationTemplates,
  runTemplateTest,
  updateNotificationTemplate,
} from "@/features/settings/services/settingsService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type { NotificationTemplateConfig } from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsTemplatesPage() {
  const locale = useLocale();
  const t = useTranslations("settings.templates");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showError, showSuccess } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplateConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextTemplates = await fetchNotificationTemplates();
        if (!isCancelled) {
          setTemplates(nextTemplates);
        }
      } catch {
        if (!isCancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [showError, t]);

  const handleSave = async (payload: NotificationTemplateConfig) => {
    try {
      const updatedTemplate = await updateNotificationTemplate(payload.id, payload);
      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template,
        ),
      );
      setSelectedTemplate(null);
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleTest = async (templateId: string) => {
    try {
      const updatedTemplate = await runTemplateTest(templateId);
      setTemplates((current) =>
        current.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template,
        ),
      );
      showSuccess(t("messages.test_sent"));
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: templates.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "key", label: "Key" },
      { key: "name", label: locale === "ar" ? "الاسم" : "Name" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "channels", label: locale === "ar" ? "القنوات" : "Channels" },
      { key: "variableCount", label: locale === "ar" ? "عدد المتغيرات" : "Variable count" },
      { key: "variables", label: t("variables") },
      { key: "emailSubject", label: t("subject_label") },
      { key: "lastTestAt", label: locale === "ar" ? "آخر اختبار" : "Last test" },
    ];
    const rows = templates.map((template) => ({
      id: template.id,
      key: template.key,
      name: template.name,
      status: template.status,
      channels: template.template.channels.join(", "),
      variableCount: template.variables.length,
      variables: template.variables.join(", "),
      emailSubject: template.template.emailSubject,
      lastTestAt: template.lastTestAt
        ? new Date(template.lastTestAt).toLocaleString()
        : "",
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-templates",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Templates",
        metadata,
        templates,
      },
    });
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.templates.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setIsExportModalOpen(true)}
          >
            {tExport("button")}
          </Button>
        }
      />

      <div className="space-y-4">
        {templates.map((template) => (
          <SettingsSectionCard
            key={template.id}
            title={template.name}
            description={template.key}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<FlaskConical className="h-4 w-4" />}
                  disabled={!hasPermission("settings.templates.manage")}
                  onClick={() => void handleTest(template.id)}
                >
                  {t("test_send")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                  disabled={!hasPermission("settings.templates.manage")}
                  onClick={() => setSelectedTemplate(template)}
                >
                  {t("edit_template")}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <SettingsStatusBadge status={template.status} />
                {template.template.channels.map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    {channel.toUpperCase()}
                  </span>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("variables")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <code
                      key={variable}
                      className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                    >
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("subject_label")}
                  </p>
                  <p className="mt-2 text-sm text-gray-900">
                    {template.template.emailSubject}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4 lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("message_label")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-900">
                    {template.template.message}
                  </p>
                </div>
              </div>
              {template.lastTestAt ? (
                <p className="text-xs text-gray-400">
                  {t("last_test", { date: new Date(template.lastTestAt).toLocaleString() })}
                </p>
              ) : null}
            </div>
          </SettingsSectionCard>
        ))}
      </div>

      <TemplateEditorModal
        isOpen={selectedTemplate !== null}
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onSave={handleSave}
      />
      <SettingsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={templates.length}
        emptyStateMessage={tExport("errors.noData")}
      />
      </main>
    </SettingsAccessGuard>
  );
}
