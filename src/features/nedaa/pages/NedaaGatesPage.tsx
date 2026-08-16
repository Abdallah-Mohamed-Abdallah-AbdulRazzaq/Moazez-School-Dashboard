"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  DoorOpen,
  LayoutGrid,
  Plus,
  Wrench,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { DataTable, type Column } from "@/components/ui/data-table";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { getNedaaApiErrorMessage } from "@/features/nedaa/utils/nedaaApiErrors";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGateFormModal from "@/features/nedaa/components/NedaaGateFormModal";
import {
  createDismissalGate,
  listDismissalGates,
  updateDismissalGate,
} from "@/features/nedaa/services/dismissalApiService";
import type {
  CreateDismissalGatePayload,
  DismissalGatesSummary,
  DismissalGateStatus,
  NedaaGate,
} from "@/features/nedaa/types/nedaa";
import {
  buildDismissalGatesListParams,
  type NedaaBooleanFilterValue,
} from "@/features/nedaa/utils/nedaaFilters";

interface GateTableRow extends Record<string, unknown> {
  code: string;
  name: string;
  campus: string;
  status: string;
  active: string;
  gate: NedaaGate;
}

const GATE_PAGE_SIZE = 10;
const gateStatuses: DismissalGateStatus[] = [
  "open",
  "busy",
  "closed",
  "maintenance",
];

const emptyGatesSummary: DismissalGatesSummary = {
  totalCount: 0,
  openCount: 0,
  busyCount: 0,
  closedCount: 0,
  maintenanceCount: 0,
  activeCount: 0,
};

function cloneGate(gate: NedaaGate): NedaaGate {
  return {
    ...gate,
    location: { ...gate.location },
    waitingZones: [...gate.waitingZones],
  };
}

export default function NedaaGatesPage() {
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("dismissal.gates.view");
  const canManage = hasPermission("dismissal.gates.manage");
  const [gates, setGates] = useState<NedaaGate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateModalMode, setGateModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingGate, setEditingGate] = useState<NedaaGate | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<NedaaBooleanFilterValue>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(GATE_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [gatesSummary, setGatesSummary] =
    useState<DismissalGatesSummary>(emptyGatesSummary);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounce(searchInput, 350);
  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    Boolean(statusFilter) ||
    Boolean(activeFilter);

  useEffect(() => {
    let cancelled = false;

    if (!canView) {
      void Promise.resolve().then(() => setIsLoading(false));
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await listDismissalGates(
          buildDismissalGatesListParams({
            q: debouncedSearch,
            status: statusFilter,
            active: activeFilter,
            page,
            limit: pageSize,
          }),
        );
        if (!cancelled) {
          setGates(response.data.map(cloneGate));
          setTotalItems(response.summary.totalCount);
          setGatesSummary(response.summary);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_gates_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeFilter,
    canView,
    debouncedSearch,
    page,
    pageSize,
    refreshKey,
    statusFilter,
    t,
  ]);

  const gateRows = useMemo<GateTableRow[]>(
    () =>
      gates.map((gate) => ({
        code: gate.code,
        name: gate.name,
        campus: gate.campus || "-",
        status: t(`settings.status_options.${gate.status}`),
        active: gate.isActive ? t("table.yes") : t("table.no"),
        gate,
      })),
    [gates, t],
  );
  const gateColumns = useMemo<Column<GateTableRow>[]>(
    () => [
      { key: "code", label: t("table.code"), searchable: true },
      { key: "name", label: t("table.name"), searchable: true },
      { key: "campus", label: t("table.campus"), searchable: true },
      { key: "status", label: t("table.status") },
      { key: "active", label: t("table.active") },
      {
        key: "actions",
        label: t("table.actions"),
        sortable: false,
        render: (_value, row) => (
          <div className="flex justify-start">
            <Button
              size="sm"
              variant="secondary"
              disabled={!canManage}
              onClick={() => {
                setGateModalMode("edit");
                setEditingGate(row.gate);
                setIsGateModalOpen(true);
              }}
            >
              {t("settings.edit_gate")}
            </Button>
          </div>
        ),
      },
    ],
    [canManage, t],
  );
  const statusOptions = useMemo(
    () => [
      { value: "", label: t("filters.all_statuses") },
      ...gateStatuses.map((status) => ({
        value: status,
        label: t(`settings.status_options.${status}`),
      })),
    ],
    [t],
  );
  const activeOptions = useMemo(
    () => [
      { value: "", label: t("filters.all_active_states") },
      { value: "true", label: t("filters.active_only") },
      { value: "false", label: t("filters.inactive_only") },
    ],
    [t],
  );

  const resetFilters = () => {
    setSearchInput("");
    setStatusFilter("");
    setActiveFilter("");
    setPage(1);
  };

  const closeGateModal = () => {
    setIsGateModalOpen(false);
    setEditingGate(null);
    setGateModalMode("create");
  };

  const submitGate = async (payload: CreateDismissalGatePayload) => {
    if (!canManage) return;

    try {
      if (gateModalMode === "edit" && editingGate) {
        await updateDismissalGate(editingGate.id, payload);
      } else {
        await createDismissalGate(payload);
      }
      closeGateModal();
      setRefreshKey((current) => current + 1);
      showSuccess(t("messages.settings_saved"));
    } catch (error) {
      showError(
        getNedaaApiErrorMessage(error, t, "messages.settings_save_failed"),
      );
    }
  };

  if (!canView) return <NedaaAccessNotice />;
  if (!hasLoaded && isLoading) return <MainLoader />;
  if (loadError) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("gates_page.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("gates_page.subtitle")}
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={!canManage}
          onClick={() => {
            setGateModalMode("create");
            setEditingGate(null);
            setIsGateModalOpen(true);
          }}
        >
          {t("settings.add_gate")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          {
            key: "total",
            value: gatesSummary.totalCount,
            icon: LayoutGrid,
            iconColor: "#2563eb",
            iconBgColor: "#dbeafe",
          },
          {
            key: "open",
            value: gatesSummary.openCount,
            icon: DoorOpen,
            iconColor: "#059669",
            iconBgColor: "#d1fae5",
          },
          {
            key: "busy",
            value: gatesSummary.busyCount,
            icon: CircleDot,
            iconColor: "#d97706",
            iconBgColor: "#fef3c7",
          },
          {
            key: "closed",
            value: gatesSummary.closedCount,
            icon: XCircle,
            iconColor: "#dc2626",
            iconBgColor: "#fee2e2",
          },
          {
            key: "maintenance",
            value: gatesSummary.maintenanceCount,
            icon: Wrench,
            iconColor: "#7c3aed",
            iconBgColor: "#ede9fe",
          },
          {
            key: "active",
            value: gatesSummary.activeCount,
            icon: CheckCircle2,
            iconColor: "#0f766e",
            iconBgColor: "#ccfbf1",
          },
        ].map((entry) => (
          <KPICardV2
            key={entry.key}
            title={t(`gates_page.summary.${entry.key}`)}
            value={entry.value}
            icon={entry.icon}
            iconColor={entry.iconColor}
            iconBgColor={entry.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters.show_filters")}
        toggleAriaLabel={t("filters.show_filters")}
        searchSlot={
          <Input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder={t("filters.search_gates_placeholder")}
          />
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              label={t("table.status")}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={statusOptions}
            />
            <Select
              label={t("filters.active_state")}
              value={activeFilter}
              onChange={(value) => {
                setActiveFilter(value as NedaaBooleanFilterValue);
                setPage(1);
              }}
              options={activeOptions}
            />
          </div>
        }
        clearAction={
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("filters.clear_filters")}
          </Button>
        }
      />

      <DataTable
        columns={gateColumns}
        data={gateRows}
        itemsPerPage={pageSize}
        isLoading={isLoading}
        serverPagination={{
          enabled: true,
          currentPage: page,
          pageSize,
          totalItems,
          onPageChange: setPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          },
        }}
        emptyTitle={t("settings.gate_management_empty_title")}
        emptyDescription={t("settings.gate_management_empty_description")}
      />

      <NedaaGateFormModal
        isOpen={isGateModalOpen}
        mode={gateModalMode}
        initialGate={editingGate}
        existingGateIds={gates.map((gate) => gate.code)}
        onClose={closeGateModal}
        onSubmit={submitGate}
      />
    </div>
  );
}
