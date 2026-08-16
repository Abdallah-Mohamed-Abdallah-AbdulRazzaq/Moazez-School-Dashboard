"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  fetchBrandingProfile,
  getEmptyBrandingProfile,
  updateBrandingProfile,
} from "@/features/settings/services/brandingService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import { SchoolBrandingEditor } from "../components/SchoolBrandingEditor";
import type { SchoolBrandingFormCopy } from "../components/SchoolBrandingEditor";
import { useSchoolBrandingEditor } from "../hooks/useSchoolBrandingEditor";

const emptyProfile = getEmptyBrandingProfile();

export default function SettingsBrandingPage() {
  const locale = useLocale();
  const t = useTranslations("settings.branding");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty } = useDirtyKey("settings-branding");
  const [initialProfile, setInitialProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const copy: SchoolBrandingFormCopy = {
    schoolName: t("school_name"),
    shortName: t("short_name"),
    timezone: t("timezone"),
    address: t("address"),
    city: t("city"),
    country: t("country"),
    footerSignature: t("footer_signature"),
    uploadLogo: t("upload_button"),
    uploadHint: t("upload_hint"),
    removeLogo: t("remove_logo"),
    removeLogoTitle: t("remove_logo_dialog.title"),
    removeLogoDescription: t("remove_logo_dialog.description"),
    confirmRemoveLogo: t("remove_logo_dialog.confirm"),
    cancel: tCommon("cancel"),
    pickFromMap: t("pick_from_map"),
    clearLocation: t("clear_location"),
    selectedLocation: t("selected_location_title"),
    noLocation: t("no_location_selected"),
    locationStale: t("location_stale"),
    coordinates: (lat, lng) => t("coordinates", { lat, lng }),
    logoUploadFailed: t("messages.logo_upload_failed"),
    logoDeleteFailed: t("messages.logo_delete_failed"),
    logoUploaded: t("messages.logo_uploaded"),
    logoRemoved: t("messages.logo_removed"),
    validation: {
      schoolName: t("validation.school_name_required"),
      shortName: t("validation.short_name_required"),
      timezone: t("validation.timezone_required"),
      addressLine: t("validation.location_required"),
      city: t("validation.city_required"),
      country: t("validation.country_required"),
      footerSignature: t("validation.footer_required"),
      logoUrl: t("validation.logo_required"),
    },
  };

  const editor = useSchoolBrandingEditor({
    initialProfile,
    copy,
    onSave: updateBrandingProfile,
    onError: () => showError(tCommon("save_failed")),
  });

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const profile = await fetchBrandingProfile({ force: true });
        if (!isCancelled) {
          setInitialProfile(profile);
          clearDirty();
        }
      } catch {
        if (!isCancelled) showError(t("messages.load_failed"));
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (editor.isDirty) markDirty();
    else clearDirty();
  }, [clearDirty, editor.isDirty, markDirty]);

  const handleSave = async () => {
    const saved = await editor.save();
    if (saved) {
      setInitialProfile(saved);
      clearDirty();
      showSuccess(t("messages.saved"));
    }
  };

  const handleExport = (format: SettingsExportFormat) => {
    const profile = editor.profile;
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: 1,
    };
    const columns: ExportColumn[] = [
      { key: "field", label: locale === "ar" ? "الحقل" : "Field" },
      { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
    ];
    const rows = [
      { field: t("school_name"), value: profile.schoolName },
      { field: t("short_name"), value: profile.shortName },
      { field: t("timezone"), value: profile.timezone },
      { field: t("address"), value: profile.addressLine },
      { field: t("city"), value: profile.city },
      { field: t("country"), value: profile.country },
      { field: t("footer_signature"), value: profile.footerSignature },
      { field: t("selected_location_title"), value: profile.formattedAddress },
      {
        field: "Coordinates",
        value:
          profile.latitude !== null && profile.longitude !== null
            ? `${profile.latitude}, ${profile.longitude}`
            : "",
      },
    ];

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-branding",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: { title: "Settings Branding", metadata, schoolProfile: profile },
    });
  };

  if (isLoading) return <MainLoader />;

  const canManage = hasPermission("settings.branding.manage");

  return (
    <SettingsAccessGuard permission="settings.branding.view">
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!editor.isDirty || editor.isSaving || !canManage}
                onClick={() => editor.cancel()}
                variant="secondary"
              >
                {t("cancel_changes")}
              </Button>
              <Button
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => setIsExportModalOpen(true)}
                variant="secondary"
              >
                {tExport("button")}
              </Button>
              <Button
                disabled={editor.isSaving || !canManage}
                onClick={editor.reset}
                variant="secondary"
              >
                {tCommon("reset")}
              </Button>
              <Button
                disabled={!editor.isDirty || editor.isSaving || !canManage}
                loading={editor.isSaving}
                onClick={() => void handleSave()}
                variant="primary"
              >
                {editor.isSaving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          }
          subtitle={t("subtitle")}
          title={t("title")}
        />

        <SchoolBrandingEditor
          copy={copy}
          disabled={!canManage}
          editor={editor}
        />

        <SettingsGlobalExportModal
          datasetCount={1}
          emptyStateMessage={tExport("errors.noData")}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      </main>
    </SettingsAccessGuard>
  );
}
