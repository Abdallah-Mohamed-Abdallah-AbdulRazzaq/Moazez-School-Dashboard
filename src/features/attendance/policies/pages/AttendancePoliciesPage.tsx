"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast/Toast";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import { getPeriodDisplayLabel } from "@/features/attendance/utils/periodIdNormalization";
import PoliciesListPanel from "../components/PoliciesListPanel";
import PolicyWizardDialog from "../components/PolicyWizardDialog";
import PoliciesKpiPanel from "../components/PoliciesKpiPanel";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import {
  fetchStructureTree,
  type Stage,
  type Grade,
  type Section,
  type Classroom,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  isAttendancePolicyConflict,
} from "../services/attendancePolicyService";
import {
  computePolicyKpis,
  hasNotificationsEnabled,
  isPolicyConfigComplete,
} from "../utils/policyKpis";
import type { AttendancePolicy, PolicyFormData } from "../types";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AttendanceReadOnlyBanner from "../../shared/components/AttendanceReadOnlyBanner";
import { usePermissions } from "@/hooks/usePermissions";

export default function AttendancePoliciesPage() {
  const { hasPermission } = usePermissions();
  const locale = useLocale();
  const t = useTranslations("attendance.policies");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();

  // Use unified term context
  const termContext = useAttendanceYearTermLayoutContext();

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Policies data
  const [policies, setPolicies] = useState<AttendancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visiblePolicies, setVisiblePolicies] = useState<AttendancePolicy[]>(
    [],
  );
  const [showExportModal, setShowExportModal] = useState(false);

  // Editor state
  const [selectedPolicy, setSelectedPolicy] = useState<AttendancePolicy | null>(
    null,
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isReadOnly = termContext.isReadOnly;
  const canManagePolicies = hasPermission("attendance.policies.manage");

  // Compute KPIs
  const kpis = useMemo(() => {
    if (policies.length === 0 && sections.length === 0) {
      return null;
    }
    return computePolicyKpis(policies, sections);
  }, [policies, sections]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.academicYears.find((item) => item.id === termContext.yearId)
      ?.nameEn ||
    termContext.yearId ||
    "";

  const selectedTermName =
    (locale === "ar" ? term?.nameAr : term?.nameEn) ||
    term?.nameEn ||
    term?.nameAr ||
    term?.name ||
    termContext.termId ||
    "";

  // Load structure and policies when term changes
  useEffect(() => {
    if (!termContext.yearId || !termContext.termId) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termContext.yearId, termContext.termId]);

  async function loadData() {
    if (!termContext.yearId || !termContext.termId) return;

    try {
      setIsLoading(true);
      // Load structure
      const structure = await fetchStructureTree(
        termContext.yearId,
        termContext.termId,
      );
      setStages(structure.stages);
      setGrades(structure.grades);
      setSections(structure.sections);
      setClassrooms(structure.classrooms);

      // Load policies
      const policiesData = await fetchPolicies(
        termContext.yearId,
        termContext.termId,
      );
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      showError(tCommon("error_loading"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setIsEditorOpen(true);
  };

  const handleEditPolicy = (policy: AttendancePolicy) => {
    setSelectedPolicy(policy);
    setIsEditorOpen(true);
  };

  const handleSavePolicy = async (data: PolicyFormData) => {
    if (!termContext.yearId || !termContext.termId) return;

    try {
      // Add year and term IDs
      const payload = {
        ...data,
        yearId: termContext.yearId,
        termId: termContext.termId,
      };

      if (selectedPolicy) {
        // Update existing policy
        await updatePolicy(selectedPolicy.id, payload);
        showSuccess(t("policyUpdated"));
      } else {
        // Create new policy
        await createPolicy(payload);
        showSuccess(t("policyCreated"));
      }

      // Reload policies
      await loadData();

      // Close editor
      setIsEditorOpen(false);
      setSelectedPolicy(null);
    } catch (error) {
      console.error("Failed to save policy:", error);
      if (!isAttendancePolicyConflict(error)) {
        showError(tCommon("error_saving"));
      }
      throw error;
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId);
      showSuccess(t("policyDeleted"));
      await loadData();
    } catch (error) {
      console.error("Failed to delete policy:", error);
      showError(tCommon("error_deleting"));
      throw error;
    }
  };

  const handleToggleActive = async (policyId: string, isActive: boolean) => {
    try {
      await updatePolicy(policyId, { isActive });
      showSuccess(isActive ? t("policyActivated") : t("policyDeactivated"));
      await loadData();
    } catch (error) {
      console.error("Failed to toggle policy status:", error);
      showError(tCommon("error_saving"));
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setSelectedPolicy(null);
  };

  const handleExport = useCallback(
    async (format: AttendanceExportFormat) => {
      const columns: ExportColumn[] = [
        { key: "name", label: "Policy" },
        { key: "nameEn", label: "Policy (English)" },
        { key: "nameAr", label: "Policy (Arabic)" },
        { key: "scopeType", label: "Scope Type" },
        { key: "scopeName", label: "Scope" },
        { key: "mode", label: "Mode" },
        { key: "dailyComputationStrategy", label: "Daily Computation" },
        { key: "selectedPeriods", label: "Selected Periods" },
        { key: "lateThresholdMinutes", label: "Late Threshold (min)" },
        {
          key: "earlyLeaveThresholdMinutes",
          label: "Early Leave Threshold (min)",
        },
        { key: "autoAbsentAfterMinutes", label: "Auto Absent After (min)" },
        {
          key: "absentIfMissedPeriodsCount",
          label: "Absent If Missed Periods",
        },
        { key: "allowExcuses", label: "Allow Excuses" },
        { key: "requireExcuseReason", label: "Require Reason" },
        { key: "requireAttachmentForExcuse", label: "Require Attachment" },
        { key: "notificationsEnabled", label: "Notifications Enabled" },
        { key: "notificationRecipients", label: "Notification Recipients" },
        { key: "notificationTriggers", label: "Notification Triggers" },
        { key: "effectiveStartDate", label: "Effective Start" },
        { key: "effectiveEndDate", label: "Effective End" },
        { key: "status", label: "Status" },
        { key: "isConfigComplete", label: "Configuration Complete" },
        { key: "notes", label: "Notes" },
        { key: "createdAt", label: "Created At" },
        { key: "updatedAt", label: "Updated At" },
      ];

      const localizedColumns: ExportColumn[] =
        locale === "ar"
          ? [
              { key: "name", label: "السياسة" },
              { key: "nameEn", label: "السياسة (بالإنجليزية)" },
              { key: "nameAr", label: "السياسة (بالعربية)" },
              { key: "scopeType", label: "نوع النطاق" },
              { key: "scopeName", label: "النطاق" },
              { key: "mode", label: "الوضع" },
              {
                key: "dailyComputationStrategy",
                label: "استراتيجية الحساب اليومي",
              },
              { key: "selectedPeriods", label: "الحصص المحددة" },
              { key: "lateThresholdMinutes", label: "حد التأخير (دقيقة)" },
              {
                key: "earlyLeaveThresholdMinutes",
                label: "حد المغادرة المبكرة (دقيقة)",
              },
              {
                key: "autoAbsentAfterMinutes",
                label: "الغياب التلقائي بعد (دقيقة)",
              },
              {
                key: "absentIfMissedPeriodsCount",
                label: "الغياب إذا فات عدد حصص",
              },
              { key: "allowExcuses", label: "السماح بالأعذار" },
              { key: "requireExcuseReason", label: "يتطلب سببًا" },
              { key: "requireAttachmentForExcuse", label: "يتطلب مرفقًا" },
              { key: "notificationsEnabled", label: "الإشعارات مفعلة" },
              { key: "notificationRecipients", label: "مستلمو الإشعارات" },
              { key: "notificationTriggers", label: "مسببات الإشعار" },
              { key: "effectiveStartDate", label: "تاريخ البدء" },
              { key: "effectiveEndDate", label: "تاريخ الانتهاء" },
              { key: "status", label: "الحالة" },
              { key: "isConfigComplete", label: "الإعداد مكتمل" },
              { key: "notes", label: "ملاحظة" },
              { key: "createdAt", label: "تاريخ الإنشاء" },
              { key: "updatedAt", label: "آخر تحديث" },
            ]
          : columns;

      const rows = visiblePolicies.map((policy) => {
        const scopeName = getAttendanceScopeLabel({
          scopeType: policy.scopeType,
          scopeIds: policy.scopeIds,
          stages,
          grades,
          sections,
          classrooms,
          locale,
        });
        const selectedPeriods = (policy.selectedPeriodIds || [])
          .map((id) => getPeriodDisplayLabel(id))
          .join(", ");
        const recipients = [
          policy.notifyTeachers
            ? locale === "ar"
              ? "المعلمون"
              : "Teachers"
            : null,
          policy.notifyStudents
            ? locale === "ar"
              ? "الطلاب"
              : "Students"
            : null,
          policy.notifyGuardians
            ? locale === "ar"
              ? "أولياء الأمور"
              : "Guardians"
            : null,
        ]
          .filter(Boolean)
          .join(", ");
        const triggers = [
          policy.notifyOnAbsent ? (locale === "ar" ? "غياب" : "Absent") : null,
          policy.notifyOnLate ? (locale === "ar" ? "تأخر" : "Late") : null,
          policy.notifyOnEarlyLeave
            ? locale === "ar"
              ? "مغادرة مبكرة"
              : "Early Leave"
            : null,
        ]
          .filter(Boolean)
          .join(", ");

        return {
          name: locale === "ar" ? policy.nameAr : policy.nameEn,
          nameEn: policy.nameEn,
          nameAr: policy.nameAr,
          scopeType: t(`scopeType.${policy.scopeType.toLowerCase()}`),
          scopeName,
          mode: policy.mode === "DAILY" ? t("form.daily") : t("form.period"),
          dailyComputationStrategy:
            policy.dailyComputationStrategy === "MANUAL"
              ? t("wizard.computation.manual")
              : policy.dailyComputationStrategy === "DERIVED_FROM_PERIODS"
                ? t("wizard.computation.derived")
                : "",
          selectedPeriods,
          lateThresholdMinutes: policy.lateThresholdMinutes,
          earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes,
          autoAbsentAfterMinutes: policy.autoAbsentAfterMinutes ?? "",
          absentIfMissedPeriodsCount: policy.absentIfMissedPeriodsCount ?? "",
          allowExcuses: policy.allowExcuses ? tCommon("yes") : tCommon("no"),
          requireExcuseReason: policy.requireExcuseReason
            ? tCommon("yes")
            : tCommon("no"),
          requireAttachmentForExcuse: policy.requireAttachmentForExcuse
            ? tCommon("yes")
            : tCommon("no"),
          notificationsEnabled: hasNotificationsEnabled(policy)
            ? tCommon("yes")
            : tCommon("no"),
          notificationRecipients: recipients,
          notificationTriggers: triggers,
          effectiveStartDate: policy.effectiveStartDate,
          effectiveEndDate: policy.effectiveEndDate,
          status: policy.isActive ? t("active") : t("inactive"),
          isConfigComplete: isPolicyConfigComplete(policy)
            ? tCommon("yes")
            : tCommon("no"),
          notes: policy.notes || "",
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        };
      });

      exportAttendanceData({
        title: t("title"),
        metadata: {
          yearName: selectedYearName,
          termName: selectedTermName,
          viewName: t("policiesList"),
          exportDate: formatAttendanceExportDate(locale === "ar" ? "ar" : "en"),
        },
        filename: generateAttendanceExportFilename(
          "attendance-policies",
          termContext.termId || undefined,
        ),
        format,
        columns: localizedColumns,
        rows,
        jsonData: {
          title: "Attendance Policies",
          metadata: {
            yearName:
              termContext.academicYears.find(
                (item) => item.id === termContext.yearId,
              )?.nameEn ||
              termContext.yearId ||
              "",
            termName: term?.nameEn || term?.name || "",
            viewName: "Policies",
            exportDate: formatAttendanceExportDate("en"),
          },
          policies: visiblePolicies.map((policy) => ({
            id: policy.id,
            yearId: policy.yearId,
            termId: policy.termId,
            nameEn: policy.nameEn,
            nameAr: policy.nameAr,
            descriptionEn: policy.descriptionEn || "",
            descriptionAr: policy.descriptionAr || "",
            notes: policy.notes || "",
            scopeType: policy.scopeType,
            scopeIds: policy.scopeIds || null,
            scopeName: getAttendanceScopeLabel({
              scopeType: policy.scopeType,
              scopeIds: policy.scopeIds,
              stages,
              grades,
              sections,
              classrooms,
              locale: "en",
            }),
            mode: policy.mode,
            dailyComputationStrategy: policy.dailyComputationStrategy || null,
            selectedPeriodIds: policy.selectedPeriodIds || [],
            lateThresholdMinutes: policy.lateThresholdMinutes,
            earlyLeaveThresholdMinutes: policy.earlyLeaveThresholdMinutes,
            autoAbsentAfterMinutes: policy.autoAbsentAfterMinutes ?? null,
            absentIfMissedPeriodsCount:
              policy.absentIfMissedPeriodsCount ?? null,
            allowExcuses: policy.allowExcuses,
            requireExcuseReason: policy.requireExcuseReason,
            requireAttachmentForExcuse: policy.requireAttachmentForExcuse,
            notifications: {
              enabled: hasNotificationsEnabled(policy),
              notifyTeachers: policy.notifyTeachers,
              notifyStudents: policy.notifyStudents,
              notifyGuardians: policy.notifyGuardians,
              notifyOnAbsent: policy.notifyOnAbsent,
              notifyOnLate: policy.notifyOnLate,
              notifyOnEarlyLeave: policy.notifyOnEarlyLeave,
            },
            effectiveStartDate: policy.effectiveStartDate,
            effectiveEndDate: policy.effectiveEndDate,
            isActive: policy.isActive,
            isConfigComplete: isPolicyConfigComplete(policy),
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt,
          })),
        },
        locale: locale === "ar" ? "ar" : "en",
        emptyMessage: t("selectOrCreateDesc"),
      });

      showSuccess(tCommon("export.button"));
    },
    [
      classrooms,
      grades,
      sections,
      selectedTermName,
      selectedYearName,
      showSuccess,
      stages,
      locale,
      t,
      tCommon,
      term?.name,
      term?.nameEn,
      termContext.academicYears,
      termContext.termId,
      termContext.yearId,
      visiblePolicies,
    ],
  );

  if (termContext.isLoading || isLoading) {
    return <MainLoader />;
  }

  return (
    <div
      style={{ backgroundColor: "var(--color-neutral-50)" }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {isReadOnly && (
        <AttendanceReadOnlyBanner message={t("readonly_banner")} />
      )}

      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <PoliciesKpiPanel kpis={kpis} isLoading={false} />

          <PoliciesListPanel
            policies={policies}
            stages={stages}
            grades={grades}
            sections={sections}
            classrooms={classrooms}
            isReadOnly={isReadOnly}
            canManagePolicies={canManagePolicies}
            onCreatePolicy={handleCreatePolicy}
            onOpenExport={() => setShowExportModal(true)}
            onFilteredPoliciesChange={setVisiblePolicies}
            onEditPolicy={handleEditPolicy}
            onDeletePolicy={handleDeletePolicy}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>

      {isEditorOpen && (
        <PolicyWizardDialog
          isOpen={isEditorOpen}
          policy={selectedPolicy}
          term={term}
          stages={stages}
          grades={grades}
          sections={sections}
          classrooms={classrooms}
          isReadOnly={isReadOnly}
          canManagePolicies={canManagePolicies}
          onSave={handleSavePolicy}
          onClose={handleCancelEdit}
        />
      )}

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("title")}
        subtitle={t("selectOrCreateDesc")}
        datasetCount={visiblePolicies.length}
        emptyStateMessage={t("selectOrCreateDesc")}
      />
    </div>
  );
}
