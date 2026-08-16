"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
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
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import {
  fetchPolicySettings,
  updatePolicySettings,
} from "@/features/settings/services/settingsService";
import type { PolicySettings } from "@/features/settings/types";

const emptyPolicies: PolicySettings = {
  attendance: {
    absenceThreshold: 0,
    lateThresholdMinutes: 0,
    lockTime: "09:00",
    guardianAlertEnabled: false,
    portalAbsenceVisible: false,
  },
  grades: {
    passingScore: 0,
    publishApprovalRequired: false,
    allowTeacherDrafts: false,
    weightingLockedAfterPublish: false,
  },
  behavior: {
    incidentThreshold: 0,
    suspensionRequiresApproval: false,
    guardianNotificationEnabled: false,
    studentPortalVisibility: false,
  },
};

export default function SettingsPoliciesPage() {
  const locale = useLocale();
  const t = useTranslations("settings.policies");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showError, showSuccess } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-policies");
  const [policies, setPolicies] = useState<PolicySettings>(emptyPolicies);
  const [initialPolicies, setInitialPolicies] = useState<PolicySettings>(emptyPolicies);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextPolicies = await fetchPolicySettings();
        if (!isCancelled) {
          setPolicies(nextPolicies);
          setInitialPolicies(nextPolicies);
          clearDirty();
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
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (JSON.stringify(policies) === JSON.stringify(initialPolicies)) {
      clearDirty();
      return;
    }
    markDirty();
  }, [clearDirty, initialPolicies, markDirty, policies]);

  const handleSave = async () => {
    if (
      policies.attendance.absenceThreshold < 0 ||
      policies.attendance.lateThresholdMinutes < 0 ||
      policies.grades.passingScore < 0 ||
      policies.grades.passingScore > 100
    ) {
      showError(t("messages.validation_failed"));
      return;
    }
    setIsSaving(true);
    try {
      const saved = await updatePolicySettings(policies);
      setPolicies(saved);
      setInitialPolicies(saved);
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPolicies(initialPolicies);
    clearDirty();
  };

  const canSave = useMemo(() => isDirty && !isSaving, [isDirty, isSaving]);

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: 10,
    };
    const columns: ExportColumn[] = [
      { key: "section", label: locale === "ar" ? "القسم" : "Section" },
      { key: "field", label: locale === "ar" ? "الحقل" : "Field" },
      { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
    ];
    const bool = (value: boolean) => (value ? tCommon("yes") : tCommon("no"));
    const rows = [
      { section: t("attendance.title"), field: t("attendance.absence_threshold"), value: policies.attendance.absenceThreshold },
      { section: t("attendance.title"), field: t("attendance.late_threshold"), value: policies.attendance.lateThresholdMinutes },
      { section: t("attendance.title"), field: t("attendance.lock_time"), value: policies.attendance.lockTime },
      { section: t("attendance.title"), field: t("attendance.guardian_alert"), value: bool(policies.attendance.guardianAlertEnabled) },
      { section: t("attendance.title"), field: t("attendance.portal_toggle"), value: bool(policies.attendance.portalAbsenceVisible) },
      { section: t("grades.title"), field: t("grades.passing_score"), value: policies.grades.passingScore },
      { section: t("grades.title"), field: t("grades.publish_approval"), value: bool(policies.grades.publishApprovalRequired) },
      { section: t("grades.title"), field: t("grades.allow_teacher_drafts"), value: bool(policies.grades.allowTeacherDrafts) },
      { section: t("grades.title"), field: t("grades.weighting_lock"), value: bool(policies.grades.weightingLockedAfterPublish) },
      { section: t("behavior.title"), field: t("behavior.incident_threshold"), value: policies.behavior.incidentThreshold },
      { section: t("behavior.title"), field: t("behavior.approval_required"), value: bool(policies.behavior.suspensionRequiresApproval) },
      { section: t("behavior.title"), field: t("behavior.guardian_notification"), value: bool(policies.behavior.guardianNotificationEnabled) },
      { section: t("behavior.title"), field: t("behavior.portal_toggle"), value: bool(policies.behavior.studentPortalVisibility) },
    ];

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-policies",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Policies",
        metadata,
        policies,
      },
    });
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.policies.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!isDirty || isSaving || !hasPermission("settings.policies.manage")} onClick={handleCancel}>
              {t("cancel_changes")}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setIsExportModalOpen(true)}
            >
              {tExport("button")}
            </Button>
            <Button variant="primary" loading={isSaving} disabled={!canSave || !hasPermission("settings.policies.manage")} onClick={handleSave}>
              {isSaving ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <SettingsSectionCard
          title={t("attendance.title")}
          description={t("attendance.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label={t("attendance.absence_threshold")}
              type="number"
              value={String(policies.attendance.absenceThreshold)}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  attendance: {
                    ...current.attendance,
                    absenceThreshold: Number(event.target.value || 0),
                  },
                }))
              }
            />
            <Input
              label={t("attendance.late_threshold")}
              type="number"
              value={String(policies.attendance.lateThresholdMinutes)}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  attendance: {
                    ...current.attendance,
                    lateThresholdMinutes: Number(event.target.value || 0),
                  },
                }))
              }
            />
            <Input
              label={t("attendance.lock_time")}
              type="time"
              value={policies.attendance.lockTime}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  attendance: {
                    ...current.attendance,
                    lockTime: event.target.value,
                  },
                }))
              }
            />
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={policies.attendance.guardianAlertEnabled}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  attendance: {
                    ...current.attendance,
                    guardianAlertEnabled: event.target.checked,
                  },
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("attendance.guardian_alert")}
          </label>
          <label className="mt-3 flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={policies.attendance.portalAbsenceVisible}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  attendance: {
                    ...current.attendance,
                    portalAbsenceVisible: event.target.checked,
                  },
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("attendance.portal_toggle")}
          </label>
        </SettingsSectionCard>

        <SettingsSectionCard
          title={t("grades.title")}
          description={t("grades.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("grades.passing_score")}
              type="number"
              value={String(policies.grades.passingScore)}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  grades: {
                    ...current.grades,
                    passingScore: Number(event.target.value || 0),
                  },
                }))
              }
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.grades.publishApprovalRequired}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    grades: {
                      ...current.grades,
                      publishApprovalRequired: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("grades.publish_approval")}
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.grades.allowTeacherDrafts}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    grades: {
                      ...current.grades,
                      allowTeacherDrafts: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("grades.allow_teacher_drafts")}
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.grades.weightingLockedAfterPublish}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    grades: {
                      ...current.grades,
                      weightingLockedAfterPublish: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("grades.weighting_lock")}
            </label>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title={t("behavior.title")}
          description={t("behavior.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("behavior.incident_threshold")}
              type="number"
              value={String(policies.behavior.incidentThreshold)}
              onChange={(event) =>
                setPolicies((current) => ({
                  ...current,
                  behavior: {
                    ...current.behavior,
                    incidentThreshold: Number(event.target.value || 0),
                  },
                }))
              }
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.behavior.suspensionRequiresApproval}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    behavior: {
                      ...current.behavior,
                      suspensionRequiresApproval: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("behavior.approval_required")}
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.behavior.guardianNotificationEnabled}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    behavior: {
                      ...current.behavior,
                      guardianNotificationEnabled: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("behavior.guardian_notification")}
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={policies.behavior.studentPortalVisibility}
                onChange={(event) =>
                  setPolicies((current) => ({
                    ...current,
                    behavior: {
                      ...current.behavior,
                      studentPortalVisibility: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("behavior.portal_toggle")}
            </label>
          </div>
        </SettingsSectionCard>
      </div>
      <SettingsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={13}
        emptyStateMessage={tExport("errors.noData")}
      />
      </main>
    </SettingsAccessGuard>
  );
}
