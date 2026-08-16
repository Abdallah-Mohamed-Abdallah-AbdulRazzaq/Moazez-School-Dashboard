"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, Edit2, Trash2, Power, PowerOff, Bell, AlertTriangle as AlertTriangleIcon, Download } from "lucide-react";
import { Tooltip } from "@mui/material";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DataTable from "@/components/ui/data-table/DataTable";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { FilterPanel } from "@/components/ui";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";
import { isPolicyConfigComplete, hasNotificationsEnabled } from "../utils/policyKpis";
import type { AttendancePolicy, AttendanceScopeType } from "../types";
import {
  AVAILABLE_POLICY_SCOPE_TYPES,
  isAvailablePolicyScope,
} from "../policyScopes";
import { getAttendanceScopeLabel } from "@/features/attendance/shared/attendanceScopePresentation";
import type { Stage, Grade, Section, Classroom } from "@/features/academics/academic-structure-tree/services/structureService";

interface PoliciesListPanelProps {
  policies: AttendancePolicy[];
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  canManagePolicies: boolean;
  onCreatePolicy: () => void;
  onOpenExport: () => void;
  onFilteredPoliciesChange?: (policies: AttendancePolicy[]) => void;
  onEditPolicy: (policy: AttendancePolicy) => void;
  onDeletePolicy: (policyId: string) => Promise<void>;
  onToggleActive: (policyId: string, isActive: boolean) => Promise<void>;
}

export default function PoliciesListPanel({
  policies,
  stages,
  grades,
  sections,
  classrooms,
  isReadOnly,
  canManagePolicies,
  onCreatePolicy,
  onOpenExport,
  onFilteredPoliciesChange,
  onEditPolicy,
  onDeletePolicy,
  onToggleActive,
}: PoliciesListPanelProps) {
  const t = useTranslations("attendance.policies");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<AttendancePolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "scope" | "status" | "notifications",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validScopes = new Set(["ALL", ...AVAILABLE_POLICY_SCOPE_TYPES]);
      const validStatuses = new Set(["ALL", "ACTIVE", "INACTIVE"]);
      const validNotifications = new Set(["ALL", "ENABLED", "DISABLED"]);

      if (!validScopes.has(values.scope)) {
        updates.scope = null;
      }
      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }
      if (!validNotifications.has(values.notifications)) {
        updates.notifications = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useUrlQueryState<{
    search: string;
    scope: string;
    status: string;
    notifications: string;
  }>({
    defaults: {
      search: "",
      scope: "ALL",
      status: "ALL",
      notifications: "ALL",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const scopeFilter = values.scope as "ALL" | AttendanceScopeType;
  const statusFilter = values.status as "ALL" | "ACTIVE" | "INACTIVE";
  const notificationsFilter =
    values.notifications as "ALL" | "ENABLED" | "DISABLED";

  // Get scope display name
  const getScopeName = useCallback((policy: AttendancePolicy): string => {
    return getAttendanceScopeLabel({
      scopeType: policy.scopeType,
      scopeIds: policy.scopeIds,
      stages,
      grades,
      sections,
      classrooms,
      locale,
    });
  }, [classrooms, grades, locale, sections, stages]);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      if (!isAvailablePolicyScope(policy.scopeType)) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch =
          policy.nameAr.toLowerCase().includes(query) ||
          policy.nameEn.toLowerCase().includes(query);
        const scopeMatch = getScopeName(policy).toLowerCase().includes(query);
        if (!nameMatch && !scopeMatch) return false;
      }

      // Scope filter
      if (scopeFilter !== "ALL" && policy.scopeType !== scopeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !policy.isActive) return false;
      if (statusFilter === "INACTIVE" && policy.isActive) return false;

      // Notifications filter
      if (notificationsFilter !== "ALL") {
        const hasNotif = hasNotificationsEnabled(policy);
        if (notificationsFilter === "ENABLED" && !hasNotif) return false;
        if (notificationsFilter === "DISABLED" && hasNotif) return false;
      }

      return true;
    });
  }, [policies, searchQuery, scopeFilter, statusFilter, notificationsFilter, getScopeName]);

  const hasActiveFilters =
    searchQuery !== "" ||
    scopeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    notificationsFilter !== "ALL";

  const clearFilters = useCallback(() => {
    reset(undefined, "replace");
  }, [reset]);

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      void Promise.resolve().then(() => setShowFilters(true));
    }
  }, [hasActiveFilters, showFilters]);

  useEffect(() => {
    onFilteredPoliciesChange?.(filteredPolicies);
  }, [filteredPolicies, onFilteredPoliciesChange]);

  const handleDeleteClick = (policy: AttendancePolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;

    setIsDeleting(true);
    try {
      await onDeletePolicy(policyToDelete.id);
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    } catch (error) {
      console.error("Failed to delete policy:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (policy: AttendancePolicy) => {
    try {
      await onToggleActive(policy.id, !policy.isActive);
    } catch (error) {
      console.error("Failed to toggle policy status:", error);
    }
  };

  const columns = [
    {
      key: "name",
      label: t("policyName"),
      searchable: true,
      render: (_: unknown, row: AttendancePolicy) => {
        const isIncomplete = !isPolicyConfigComplete(row);
        return (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {locale === "ar" ? row.nameAr : row.nameEn}
              </div>
              <div className="text-xs text-gray-500">
                {locale === "ar" ? row.nameEn : row.nameAr}
              </div>
            </div>
            {isIncomplete && (
              <Tooltip title={t("list.incompleteConfigWarning")} arrow>
                <AlertTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "scope",
      label: t("scope"),
      render: (_: unknown, row: AttendancePolicy) => (
        <div>
          <div className="text-sm text-gray-900">{getScopeName(row)}</div>
          <div className="text-xs text-gray-500">
            {t(`scopeType.${row.scopeType.toLowerCase()}`)}
          </div>
        </div>
      ),
    },
    {
      key: "tracking",
      label: t("list.tracking"),
      render: (_: unknown, row: AttendancePolicy) => {
        const selectedCount = row.selectedPeriodIds?.length || 0;
        const isDerivedFromPeriods =
          row.dailyComputationStrategy === "DERIVED_FROM_PERIODS";
        const isManualDaily = row.mode === "DAILY" && !isDerivedFromPeriods;
        const threshold = row.absentIfMissedPeriodsCount;
        const trackingLabel = isManualDaily
          ? `${t("form.daily")} · ${t("list.manual")}`
          : isDerivedFromPeriods
            ? `${t("form.daily")} · ${t("list.derived")}`
            : t("form.period");
        
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded w-fit bg-purple-100 text-purple-800">
              {trackingLabel}
            </span>
            {isDerivedFromPeriods && selectedCount > 0 && threshold !== null && threshold !== undefined && (
              <Tooltip 
                title={locale === "ar" 
                  ? `غائب إذا فات ${threshold} من ${selectedCount} حصص` 
                  : `Absent if missed ${threshold} of ${selectedCount} periods`
                } 
                arrow
              >
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded w-fit bg-teal-100 text-teal-800 cursor-help">
                  {t("list.derived")}: {threshold}/{selectedCount}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "periods",
      label: t("list.periods"),
      render: (_: unknown, row: AttendancePolicy) => {
        const periodCount = row.selectedPeriodIds?.length || 0;
        const isDerivedFromPeriods =
          row.dailyComputationStrategy === "DERIVED_FROM_PERIODS";
        const usesPeriods =
          row.mode === "PERIOD" ||
          isDerivedFromPeriods;

        if (!usesPeriods) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        
        if (periodCount === 0) {
          return (
            <Tooltip title={t("list.noPeriodsSelected")} arrow>
              <span className="text-orange-600 text-sm font-medium">
                {t("list.none")}
              </span>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={t("list.selectedPeriods", { count: periodCount })} arrow>
            <span className="text-sm text-gray-700 cursor-help">
              {periodCount} {t("list.periodsCount")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      key: "notifications",
      label: t("list.notifications"),
      render: (_: unknown, row: AttendancePolicy) => {
        const hasNotif = hasNotificationsEnabled(row);

        if (!hasNotif) {
          return <span className="text-gray-400 text-sm">—</span>;
        }

        const recipients = [];
        if (row.notifyTeachers) recipients.push(t("list.teachers"));
        if (row.notifyStudents) recipients.push(t("list.students"));
        if (row.notifyGuardians) recipients.push(t("list.guardians"));

        const triggers = [];
        if (row.notifyOnAbsent) triggers.push(t("list.absent"));
        if (row.notifyOnLate) triggers.push(t("list.late"));
        if (row.notifyOnEarlyLeave) triggers.push(t("list.earlyLeave"));

        const summary = `${recipients.join(" + ")} / ${triggers.join(" + ")}`;

        return (
          <Tooltip title={summary} arrow>
            <div className="flex items-center gap-1 text-sm text-purple-700 cursor-help flex-0 w-fit">
              <Bell className="w-3.5 h-3.5" />
              <span>{recipients.length + triggers.length}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "rules",
      label: t("list.rules"),
      render: (_: unknown, row: AttendancePolicy) => {
        const formatThreshold = (value: number | null) =>
          value === null ? t("list.notConfigured") : `${value}${t("list.min")}`;
        const rulesSummary = [];
        rulesSummary.push(`${t("list.late")}: ${formatThreshold(row.lateThresholdMinutes)}`);
        rulesSummary.push(`${t("list.early")}: ${formatThreshold(row.earlyLeaveThresholdMinutes)}`);
        if (row.autoAbsentAfterMinutes) {
          rulesSummary.push(`${t("list.autoAbsent")}: ${row.autoAbsentAfterMinutes}${t("list.min")}`);
        }
        if (row.absentIfMissedPeriodsCount) {
          rulesSummary.push(`${t("list.missedPeriods")}: ${row.absentIfMissedPeriodsCount}`);
        }

        return (
          <Tooltip title={rulesSummary.join(" • ")} arrow>
            <span className="text-sm text-gray-600 cursor-help">
              {formatThreshold(row.lateThresholdMinutes)} / {formatThreshold(row.earlyLeaveThresholdMinutes)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: AttendancePolicy) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: AttendancePolicy) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditPolicy(row);
            }}
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title={t("edit")}
            disabled={isReadOnly || !canManagePolicies}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(row);
            }}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
            }`}
            title={row.isActive ? t("deactivate") : t("activate")}
            disabled={isReadOnly || !canManagePolicies}
          >
            {row.isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title={t("delete")}
            disabled={isReadOnly || !canManagePolicies}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("policiesList")}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={onOpenExport}
              disabled={filteredPolicies.length === 0}
            >
              {tCommon("export.button")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onCreatePolicy}
              disabled={isReadOnly || !canManagePolicies}
            >
              {t("createPolicy")}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <FilterPanel
          searchSlot={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                className="pl-10"
              />
            </div>
          }
          filtersSlot={
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Select
                label={t("scope")}
                value={scopeFilter}
                onChange={(value) => setValue("scope", value as "ALL" | AttendanceScopeType, "push")}
                options={[
                  { value: "ALL", label: tCommon("all_scopes") },
                  ...AVAILABLE_POLICY_SCOPE_TYPES.map((scopeType) => ({
                    value: scopeType,
                    label: t(`scopeType.${scopeType.toLowerCase()}`),
                  })),
                ]}
                selectSize="sm"
              />

              <Select
                label={t("status")}
                value={statusFilter}
                onChange={(value) => setValue("status", value as "ALL" | "ACTIVE" | "INACTIVE", "push")}
                options={[
                  { value: "ALL", label: tCommon("all_statuses") },
                  { value: "ACTIVE", label: t("active") },
                  { value: "INACTIVE", label: t("inactive") },
                ]}
                selectSize="sm"
              />

              <Select
                label={t("list.notifications")}
                value={notificationsFilter}
                onChange={(value) => setValue("notifications", value as "ALL" | "ENABLED" | "DISABLED", "push")}
                options={[
                  { value: "ALL", label: tCommon("all") },
                  { value: "ENABLED", label: t("list.notifications") },
                  { value: "DISABLED", label: t("inactive") },
                ]}
                selectSize="sm"
              />
            </div>
          }
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          clearAction={
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              {t("clear_filters")}
            </button>
          }
          hasActiveFilters={hasActiveFilters}
          toggleTitle={t("filters_button")}
          toggleAriaLabel={t("filters_button")}
          className="rounded-none bg-transparent p-0 shadow-none"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
          data={filteredPolicies as unknown as { [key: string]: unknown }[]}
          onRowClick={(row) => onEditPolicy(row as unknown as AttendancePolicy)}
          searchQuery={searchQuery}
          itemsPerPage={10}
          showPagination={true}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPolicyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc", {
          name: policyToDelete
            ? locale === "ar"
              ? policyToDelete.nameAr
              : policyToDelete.nameEn
            : "",
        })}
        confirmLabel={t("delete")}
        cancelLabel={tCommon("cancel")}
        loading={isDeleting}
        severity="danger"
      />
    </div>
  );
}



