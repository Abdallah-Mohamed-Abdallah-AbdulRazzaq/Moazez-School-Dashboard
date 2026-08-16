"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  fetchSettingsSecuritySettings,
  updateSettingsSecuritySettings,
} from "@/features/settings/services/settingsSecurityService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type ExportSection,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type { SecuritySettings } from "@/features/settings/types";
import { Download } from "lucide-react";

const emptySecuritySettings: SecuritySettings = {
  enforceTwoFactor: false,
  ipAllowlistEnabled: false,
  ipAllowlist: "",
  sessionTimeoutMinutes: 30,
  suspiciousLoginAlerts: false,
  passwordMinLength: 8,
  passwordRotationDays: 90,
};

export default function SettingsSecurityPage() {
  const locale = useLocale();
  const t = useTranslations("settings.security");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-security");
  const [settings, setSettings] = useState<SecuritySettings>(emptySecuritySettings);
  const [initialSettings, setInitialSettings] = useState<SecuritySettings>(emptySecuritySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextSettings = await fetchSettingsSecuritySettings();

        if (isCancelled) {
          return;
        }

        setSettings(nextSettings);
        setInitialSettings(nextSettings);
        clearDirty();
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
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (JSON.stringify(settings) === JSON.stringify(initialSettings)) {
      clearDirty();
      return;
    }
    markDirty();
  }, [clearDirty, initialSettings, markDirty, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await updateSettingsSecuritySettings(settings);
      setSettings(saved);
      setInitialSettings(saved);
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: 1,
    };
    const controlsColumns: ExportColumn[] = [
      { key: "field", label: locale === "ar" ? "الحقل" : "Field" },
      { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
    ];
    const bool = (value: boolean) => (value ? "Yes" : "No");
    const sections: ExportSection[] = [
      {
        title: locale === "ar" ? "عناصر الأمان" : "Security controls",
        columns: controlsColumns,
        rows: [
          { field: t("controls.two_factor"), value: bool(settings.enforceTwoFactor) },
          { field: t("controls.ip_allowlist"), value: bool(settings.ipAllowlistEnabled) },
          { field: t("controls.ip_allowlist_values"), value: settings.ipAllowlist },
          { field: t("controls.suspicious_logins"), value: bool(settings.suspiciousLoginAlerts) },
          { field: t("controls.session_timeout"), value: settings.sessionTimeoutMinutes },
          { field: t("controls.password_min_length"), value: settings.passwordMinLength },
          { field: t("controls.password_rotation"), value: settings.passwordRotationDays },
        ],
      },
    ];

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-security",
      format,
      sections,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Security",
        metadata,
        securitySettings: settings,
      },
    });
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.security.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
            >
              {tExport("button")}
            </Button>
            <Button
              variant="primary"
              loading={isSaving}
              disabled={!isDirty || !hasPermission("settings.security.manage")}
              onClick={handleSave}
            >
              {isSaving ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <SettingsSectionCard
          title={t("controls.title")}
          description={t("controls.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.enforceTwoFactor}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    enforceTwoFactor: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.two_factor")}
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.ipAllowlistEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    ipAllowlistEnabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.ip_allowlist")}
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.suspiciousLoginAlerts}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    suspiciousLoginAlerts: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.suspicious_logins")}
            </label>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.session_timeout")}
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sessionTimeoutMinutes: Number(event.target.value || 0),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.password_min_length")}
              </label>
              <input
                type="number"
                value={settings.passwordMinLength}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    passwordMinLength: Number(event.target.value || 8),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.password_rotation")}
              </label>
              <input
                type="number"
                value={settings.passwordRotationDays}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    passwordRotationDays: Number(event.target.value || 90),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="mt-4">
            <Input
              label={t("controls.ip_allowlist_values")}
              value={settings.ipAllowlist}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  ipAllowlist: event.target.value,
                }))
              }
            />
          </div>
        </SettingsSectionCard>
      </div>
      <SettingsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={1}
        emptyStateMessage={tExport("errors.noData")}
      />
      </main>
    </SettingsAccessGuard>
  );
}
