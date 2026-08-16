"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import { fetchAdmissionRequiredDocumentsForSchool } from "@/features/settings/services/settingsService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type { AdmissionRequiredDocument } from "@/features/settings/types";

function formatAcceptedFileTypes(
  document: AdmissionRequiredDocument,
  fallbackLabel: string,
) {
  return document.acceptedFileTypes.length > 0
    ? document.acceptedFileTypes.join(", ")
    : fallbackLabel;
}

export default function SettingsAdmissionsDocumentsPage() {
  const locale = useLocale();
  const t = useTranslations("settings.admissions_documents");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const schoolId = user?.activeMembership?.schoolId ?? "";
  const [documents, setDocuments] = useState<AdmissionRequiredDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!schoolId) {
      setDocuments([]);
      setLoadError(t("messages.missing_school"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const nextDocuments = await fetchAdmissionRequiredDocumentsForSchool(schoolId);
      setDocuments(nextDocuments);
    } catch {
      setDocuments([]);
      setLoadError(t("messages.load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    void Promise.resolve().then(loadDocuments);
  }, [loadDocuments]);

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: documents.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "title", label: t("title_label") },
      { key: "description", label: t("description_label") },
      { key: "isMandatory", label: t("mandatory") },
      { key: "acceptedFileTypes", label: t("accepted_file_types") },
      { key: "maxFiles", label: t("max_files") },
      { key: "sortOrder", label: t("sort_order") },
    ];
    const rows = documents.map((document) => ({
      ...document,
      isMandatory: document.isMandatory ? tCommon("yes") : tCommon("no"),
      acceptedFileTypes: formatAcceptedFileTypes(document, t("any_supported_file")),
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-admissions-documents",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Admissions Documents",
        metadata,
        documents,
      },
    });
  };

  const renderContent = () => {
    if (isLoading) return <MainLoader />;

    if (loadError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={() => void loadDocuments()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          {t("empty")}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <article key={document.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{document.title}</h3>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {document.isMandatory ? t("mandatory") : t("optional")}
                  </span>
                </div>
                {document.description && (
                  <p className="text-sm text-gray-600">{document.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {t("document_id")}: {document.id}
                </p>
              </div>

              <dl className="grid min-w-full grid-cols-1 gap-3 text-sm sm:grid-cols-3 lg:min-w-[28rem]">
                <div>
                  <dt className="font-medium text-gray-700">{t("accepted_file_types")}</dt>
                  <dd className="mt-1 text-gray-600">
                    {formatAcceptedFileTypes(document, t("any_supported_file"))}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{t("max_files")}</dt>
                  <dd className="mt-1 text-gray-600">{document.maxFiles}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">{t("sort_order")}</dt>
                  <dd className="mt-1 text-gray-600">{document.sortOrder}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <SettingsAccessGuard permission="settings.admissionsDocuments.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
              disabled={isLoading || Boolean(loadError)}
            >
              {tExport("button")}
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t("read_only_notice")}
          </div>

          <SettingsSectionCard
            title={t("section_title")}
            description={t("section_description")}
          >
            {renderContent()}
          </SettingsSectionCard>
        </div>

        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={documents.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
