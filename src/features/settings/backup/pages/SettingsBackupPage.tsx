"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable } from "@/components/ui/data-table";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  createBackupJob,
  exportSettingsSnapshot,
  fetchBackupHistory,
  importSettingsSnapshot,
} from "@/features/settings/services/settingsService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type { BackupHistoryEntry } from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsBackupPage() {
  const locale = useLocale();
  const t = useTranslations("settings.backup");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [history, setHistory] = useState<BackupHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextHistory = await fetchBackupHistory();
        if (!cancelled) {
          setHistory(nextHistory);
        }
      } catch {
        if (!cancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showError, t]);

  const refresh = async () => setHistory(await fetchBackupHistory());

  const runAction = async (action: "backup" | "export" | "import" | "migration") => {
    try {
      if (action === "backup") {
        await createBackupJob({ type: "backup", note: "Manual backup from settings center" });
      } else if (action === "export") {
        await exportSettingsSnapshot();
      } else if (action === "import") {
        await importSettingsSnapshot();
      } else {
        await createBackupJob({ type: "migration", note: "Migration dry-run prepared" });
      }
      await refresh();
      showSuccess(t("messages.action_completed"));
    } catch {
      showError(tCommon("save_failed"));
    }
  };

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: history.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "fileName", label: t("table.file") },
      { key: "type", label: t("table.type") },
      { key: "status", label: t("table.status") },
      { key: "createdBy", label: t("table.created_by") },
      { key: "createdAt", label: t("table.created_at") },
      { key: "note", label: locale === "ar" ? "ملاحظة" : "Note" },
    ];
    const rows = history.map((entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt).toLocaleString(),
      note: entry.note || "",
    }));

    exportSettingsData({
      title: t("history_title"),
      metadata,
      filename: "settings-backup-history",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Backup History",
        metadata,
        history,
      },
    });
  };

  const columns = [
    {
      key: "fileName",
      label: t("table.file"),
    },
    {
      key: "type",
      label: t("table.type"),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown) => <SettingsStatusBadge status={value as BackupHistoryEntry["status"]} />,
    },
    {
      key: "createdBy",
      label: t("table.created_by"),
    },
    {
      key: "createdAt",
      label: t("table.created_at"),
      render: (value: unknown) => new Date(String(value)).toLocaleString(),
    },
  ];

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.backup.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            hasPermission("settings.backup.manage") ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={() => void runAction("export")}>
                  {t("export_settings")}
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => setIsExportModalOpen(true)}
                >
                  {tExport("button")}
                </Button>
                <Button variant="secondary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => void runAction("import")}>
                  {t("import_settings")}
                </Button>
                <Button variant="primary" onClick={() => void runAction("backup")}>
                  {t("create_backup")}
                </Button>
              </div>
            ) : null
          }
        />

        <div className="space-y-6">
          <SettingsSectionCard title={t("migration_title")} description={t("migration_description")}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {t("migration_warning")}
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                disabled={!hasPermission("settings.backup.manage")}
                onClick={() => void runAction("migration")}
              >
                {t("prepare_migration")}
              </Button>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard title={t("history_title")} description={t("history_description")}>
            <DataTable
              columns={columns}
              data={history as unknown as Record<string, unknown>[]}
              showPagination
              itemsPerPage={10}
            />
          </SettingsSectionCard>
        </div>
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={history.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
