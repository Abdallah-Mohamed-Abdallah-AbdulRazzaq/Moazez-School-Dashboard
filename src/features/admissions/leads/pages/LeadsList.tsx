// FILE: src/components/leads/LeadsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Plus,
  Search,
  X,
  Users,
  UserCheck,
  Download,
  Edit,
} from "lucide-react";
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import LeadStatusBadge from "@/features/admissions/leads/components/LeadStatusBadge";
import CreateLeadModal from "@/features/admissions/leads/components/CreateLeadModal";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import type {
  DateRangeValue,
} from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { formatLeadsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import {
  fetchLeads,
  createLead,
  updateLead,
} from "@/features/admissions/leads/services/leadsApiService";
import type {
  CreateLeadPayload,
  UpdateLeadPayload,
} from "@/features/admissions/leads/types/lead";
import {
  mapLeadChannelToApplicationSource,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";
import { createApplicationIntake } from "@/features/admissions/applications/services/applicationIntakeService";
import { Lead, LeadStatus, LeadChannel } from "@/features/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import MainLoader from "@/components/ui/loaders/MainLoader";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";

export default function LeadsList() {
  const router = useRouter();
  const t = useTranslations("admissions.leads");
  const locale = useLocale();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canViewLeads = hasPermission("admissions.leads.view");
  const canManageLeads = hasPermission("admissions.leads.manage");
  const canManageApplications = hasPermission("admissions.applications.manage");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [applicationLead, setApplicationLead] = useState<Lead | null>(null);
  const [creationRecovery, setCreationRecovery] = useState<{
    applicationId: string;
    failedDocuments: string[];
    conversionFailed: boolean;
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  // Load leads from API
  const loadLeads = useCallback(async () => {
    if (!canViewLeads) {
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      showToast("Failed to load leads", "error");
    } finally {
      setIsDataLoading(false);
    }
  }, [canViewLeads, showToast]);

  useEffect(() => {
    void Promise.resolve().then(loadLeads);
  }, [loadLeads]);

  const scopedLeads = leads;
  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status" | "channel" | "dateRange" | "startDate" | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "New",
        "Contacted",
        "Converted",
        "Closed",
      ]);
      const validChannels = new Set([
        "all",
        "In-app",
        "Referral",
        "Walk-in",
        "Other",
      ]);
      const validDateRanges = new Set([
        "all",
        "7",
        "14",
        "30",
        "60",
        "90",
        "custom",
      ]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }
      if (!validChannels.has(values.channel)) {
        updates.channel = null;
      }
      if (!validDateRanges.has(values.dateRange)) {
        updates.dateRange = null;
      }
      if (values.dateRange !== "custom") {
        if (values.startDate) updates.startDate = null;
        if (values.endDate) updates.endDate = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    channel: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      channel: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const statusFilter = values.status as LeadStatus | "all";
  const channelFilter = values.channel as LeadChannel | "all";
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter leads
  const filteredLeads = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedLeads.filter((lead) => {
      const displayName =
        lead.studentName || lead.primaryContactName || lead.name || "";
      const matchesSearch =
        searchQuery === "" ||
        displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.primaryContactName &&
          lead.primaryContactName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        lead.phone.includes(searchQuery) ||
        (lead.email &&
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const matchesChannel =
        channelFilter === "all" || lead.channel === channelFilter;
      const matchesDateRange = isDateInRange(lead.createdAt, filterResult);

      return (
        matchesSearch && matchesStatus && matchesChannel && matchesDateRange
      );
    });
  }, [
    channelFilter,
    customEndDate,
    customStartDate,
    dateRange,
    scopedLeads,
    searchQuery,
    statusFilter,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter leads by date range
    const leadsInRange = scopedLeads.filter((lead) =>
      isDateInRange(lead.createdAt, filterResult),
    );

    const contacted = leadsInRange.filter(
      (l) => l.status === "Contacted",
    ).length;
    const newLeads = leadsInRange.filter((l) => l.status === "New").length;
    const converted = leadsInRange.filter(
      (l) => l.status === "Converted",
    ).length;

    return {
      totalLeads: leadsInRange.length,
      contacted,
      newLeads,
      converted,
    };
  }, [customEndDate, customStartDate, dateRange, scopedLeads]);

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || channelFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleCreateLead = async (data: CreateLeadPayload) => {
    try {
      await createLead(data);
      showToast(t("lead_created"), "success");
      await loadLeads();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create lead:", err);
      showToast(t("create_failed") || "Failed to create lead", "error");
      throw err;
    }
  };

  const handleUpdateLead = async (data: UpdateLeadPayload) => {
    if (!editingLead) {
      return;
    }

    try {
      await updateLead(editingLead.id, data);
      showToast(t("lead_updated"), "success");
      await loadLeads();
      setEditingLead(null);
    } catch (err) {
      console.error("Failed to update lead:", err);
      showToast(t("update_failed"), "error");
      throw err;
    }
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatLeadsForExport(filteredLeads, exportLocale),
      format,
      filenameBase: "leads",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_leads"),
    });
  };

  const handleRowClick = (lead: Lead) => {
    router.push(`/${locale}/admissions/leads/${lead.id}`);
  };

  const handleConvertToApplication = (
    lead: Lead,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setApplicationLead(lead);
  };

  const handleCreateApplicationFromLead = async (
    data: ApplicationCreationPayload,
  ) => {
    if (!applicationLead) return;

    try {
      const intakeOutcome = await createApplicationIntake({
        ...data,
        leadId: applicationLead.id,
        source: mapLeadChannelToApplicationSource(applicationLead.channel),
      });
      setApplicationLead(null);

      if (intakeOutcome.failedDocumentLabels.length > 0) {
        setCreationRecovery({
          applicationId: intakeOutcome.application.id,
          failedDocuments: intakeOutcome.failedDocumentLabels,
          conversionFailed: false,
        });
        await loadLeads();
        return;
      }

      try {
        await updateLead(applicationLead.id, { status: "Converted" });
      } catch (conversionError) {
        console.error("Failed to convert lead after application creation:", conversionError);
        setCreationRecovery({
          applicationId: intakeOutcome.application.id,
          failedDocuments: [],
          conversionFailed: true,
        });
        await loadLeads();
        return;
      }

      setCreationRecovery(null);
      showToast(t("marked_converted"), "success");
      await loadLeads();
      router.push(
        `/${locale}/admissions/applications/${intakeOutcome.application.id}`,
      );
    } catch (err) {
      console.error("Failed to create application from lead:", err);
      showToast(t("mark_converted_failed"), "error");
    }
  };

  const handleEditLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLead(lead);
  };

  const columns = [
    {
      key: "studentName",
      label: t("name"),
      searchable: true,
      render: (value: unknown, row: Lead) => {
        const displayName =
          row.studentName || row.primaryContactName || row.name || "";
        return (
          <div className="flex items-center gap-2">
            <span>{String(displayName || value)}</span>
          </div>
        );
      },
    },
    {
      key: "phone",
      label: t("phone"),
      searchable: true,
    },
    {
      key: "email",
      label: t("email"),
      render: (value: unknown) => (value ? String(value) : "—"),
    },
    {
      key: "channel",
      label: t("channel"),
      render: (value: unknown) => {
        const channel = String(value);
        // Map channel values to translation keys
        const channelMap: Record<string, string> = {
          "In-app": "in_app",
          Referral: "referral",
          "Walk-in": "walk_in",
          Other: "other",
        };
        const translationKey = channelMap[channel] || "other";
        return t(translationKey);
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <LeadStatusBadge status={value as LeadStatus} />
      ),
    },
    {
      key: "createdAt",
      label: t("created"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: Lead) => canManageLeads ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={(e) => handleEditLead(row, e)}
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="h-3.5 w-3.5" />}
            className="px-3 py-1"
          >
            {t("edit")}
          </Button>
          {canManageApplications && (
            <Button
              type="button"
              onClick={(e) => handleConvertToApplication(row, e)}
              size="sm"
              className="px-3 py-1"
            >
              {t("mark_converted")}
            </Button>
          )}
        </div>
      ) : null,
    },
  ];

  if (!canViewLeads) {
    return <AdmissionsAccessDenied />;
  }

  if (isDataLoading) {
    return <MainLoader />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={
            dateRange === "all"
              ? t("total_leads")
              : t("leads_period", {
                  period:
                    dateRange === "custom"
                      ? t("custom")
                      : t("days", { days: dateRange }),
                })
          }
          value={kpis.totalLeads}
          subtitle={t("in_selected_period")}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("new_leads")}
          value={kpis.newLeads}
          subtitle={t("not_yet_contacted")}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
        />
        <KPICardV2
          title={t("contacted")}
          value={kpis.contacted}
          subtitle={t("in_progress")}
          icon={UserCheck}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("converted")}
          value={kpis.converted}
          subtitle={t("became_applications")}
          icon={UserCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
          {canManageLeads && (
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("new_lead")}
            </Button>
          )}
        </div>
      </div>
      {creationRecovery && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{t("partial_creation.title")}</p>
          <p className="mt-1">
            {creationRecovery.conversionFailed
              ? t("partial_creation.conversion_failed")
              : t("partial_creation.documents_failed", {
                  documents: creationRecovery.failedDocuments.join(", "),
                })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              router.push(
                `/${locale}/admissions/applications/${creationRecovery.applicationId}/documents`,
              )
            }
          >
            {t("partial_creation.open_documents")}
          </Button>
        </div>
      )}
      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                leftIcon={<Search className="w-4 h-4" />}
                className={`placeholder:text-black/60 ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                onClick={clearFilters}
                variant="danger"
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("clear")}
              </Button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Select
                label={t("status")}
                value={statusFilter}
                onChange={(value) =>
                  setValue(
                    "status",
                    value as LeadStatus | "all",
                    "push",
                  )
                }
                options={[
                  { value: "all", label: t("all_statuses") },
                  { value: "New", label: t("new") },
                  { value: "Contacted", label: t("contacted") },
                  { value: "Converted", label: t("converted") },
                  { value: "Closed", label: t("closed") },
                ]}
              />
            </div>
            <div>
              <Select
                label={t("channel")}
                value={channelFilter}
                onChange={(value) =>
                  setValue(
                    "channel",
                    value as LeadChannel | "all",
                    "push",
                  )
                }
                options={[
                  { value: "all", label: t("all_channels") },
                  { value: "In-app", label: t("in_app") },
                  { value: "Referral", label: t("referral") },
                  { value: "Walk-in", label: t("walk_in") },
                  { value: "Other", label: t("other") },
                ]}
              />
            </div>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_leads")}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  {t("clear_filters")}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredLeads}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "leadsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Modals */}
      {canManageLeads && (
        <>
          <CreateLeadModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateLead}
          />
          <CreateLeadModal
            isOpen={Boolean(editingLead)}
            onClose={() => setEditingLead(null)}
            onSubmit={handleUpdateLead}
            initialLead={editingLead}
            mode="update"
          />
        </>
      )}
      {canManageLeads && canManageApplications && (
        <ApplicationCreateStepper
          lead={applicationLead || undefined}
          isOpen={Boolean(applicationLead)}
          onClose={() => setApplicationLead(null)}
          onSubmit={handleCreateApplicationFromLead}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredLeads.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_leads")}
      />
    </div>
  );
}
