"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@mui/material";
import { Plus, Award, Sparkles, AlertTriangle, FileText, ClipboardCheck } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { listBehaviorRecords } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import BehaviorTable, { type BehaviorTableAction } from "@/features/behavior/shared/components/BehaviorTable";
import BehaviorDetailDrawer from "@/features/behavior/shared/components/BehaviorDetailDrawer";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import BehaviorFiltersBar from "@/features/behavior/shared/components/BehaviorFiltersBar";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type {
  BehaviorFilters,
  BehaviorRecord,
  BehaviorRecordListFilters,
  BehaviorRecordSummary,
} from "@/features/behavior/types";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";

const DEFAULT_FILTERS: BehaviorFilters = {
  scopeType: "SCHOOL",
  scopeIds: {},
};

export default function BehaviorRecordsPage() {
  const t = useTranslations("behavior");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { yearId, termId, terms, isReadOnly } = useBehaviorYearTermContext();
  const { hasPermission } = usePermissions();
  const canCreate = !isReadOnly && hasPermission("behavior.records.create");
  const canManage = !isReadOnly && hasPermission("behavior.records.manage");
  const canReview = !isReadOnly && hasPermission("behavior.records.review");
  const { showError } = useToast();

  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [summary, setSummary] = useState<BehaviorRecordSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uiFilters, setUiFilters] = useState<BehaviorFilters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(uiFilters.search ?? "", 350);

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(null);

  // Modals
  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  const term = useMemo(
    () => terms.find((item) => item.id === termId) || null,
    [termId, terms],
  );

  const loadRecords = useCallback(async () => {
    if (!yearId || !termId) return;
    const filters: BehaviorRecordListFilters = {
      academicYearId: yearId,
      termId,
      status: uiFilters.status,
      type: uiFilters.type,
      occurredFrom: uiFilters.dateFrom,
      occurredTo: uiFilters.dateTo,
      search: debouncedSearch || undefined,
    };
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorRecords(filters);
      setRecords(res?.items || []);
      setSummary(res?.summary || null);
    } catch (error) {
      const msg = behaviorUiError(error, t("messages.loadError"), t).message;
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    yearId,
    termId,
    uiFilters.status,
    uiFilters.type,
    uiFilters.dateFrom,
    uiFilters.dateTo,
    debouncedSearch,
    showError,
    t,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadRecords);
  }, [loadRecords]);

  const handleTableAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    if (action === "view") {
      setSelectedRecord(record);
      return;
    }
    if (action === "submit" && !canCreate) return;
    if ((action === "edit" || action === "cancel") && !canManage) return;
    if ((action === "approve" || action === "reject") && !canReview) return;
    const modeMap: Record<string, BehaviorModalMode> = {
      edit: "edit-record",
      submit: "submit-record",
      cancel: "cancel-record",
      approve: "approve-record",
      reject: "reject-record",
    };
    setModalTarget({
      record,
      academicYearId: yearId ?? undefined,
      termId: termId ?? undefined,
    });
    setModalMode(modeMap[action] ?? null);
  };

  const handleDrawerAction = (action: BehaviorTableAction, record: BehaviorRecord) => {
    setSelectedRecord(null);
    handleTableAction(action, record);
  };

  const openNewModal = () => {
    if (!canCreate) return;
    setModalTarget({
      academicYearId: yearId ?? undefined,
      termId: termId ?? undefined,
    });
    setModalMode("create-record");
  };

  const clearFilters = () => {
    setUiFilters({
      scopeType: "SCHOOL",
      scopeIds: {},
      dateFrom: term?.startDate,
      dateTo: term?.endDate,
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICardV2
          title={t("overview.totalRecords")}
          value={loading && !summary ? "—" : (summary?.total ?? 0)}
          icon={Award}
          iconColor="#6366f1"
          iconBgColor="#e0e7ff"
          showChart={false}
        />
        <KPICardV2
          title={t("type.positive")}
          value={loading && !summary ? "—" : (summary?.positive ?? 0)}
          icon={Sparkles}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          showChart={false}
        />
        <KPICardV2
          title={t("type.negative")}
          value={loading && !summary ? "—" : (summary?.negative ?? 0)}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          showChart={false}
        />
        <KPICardV2
          title={t("status.submitted")}
          value={loading && !summary ? "—" : (summary?.submitted ?? 0)}
          icon={FileText}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          showChart={false}
        />
        <KPICardV2
          title={t("status.approved")}
          value={loading && !summary ? "—" : (summary?.approved ?? 0)}
          icon={ClipboardCheck}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          showChart={false}
        />
      </div>

      {/* Filters */}
      {!isMobile && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
          <BehaviorFiltersBar
            filters={uiFilters}
            onChange={(patch) => setUiFilters((prev) => ({ ...prev, ...patch }))}
            onClear={clearFilters}
          />
        </div>
      )}

      {/* Header + new button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("sections.records")}
        </h2>
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openNewModal}
          >
            {t("actions.newRecord")}
          </Button>
        )}
      </div>

      {/* Table */}
      <BehaviorTable
        records={records}
        loading={loading}
        error={error}
        onRowClick={setSelectedRecord}
        onAction={handleTableAction}
        canCreate={canCreate}
        canManage={canManage}
        canReview={canReview}
      />

      {/* Detail drawer */}
      <BehaviorDetailDrawer
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onAction={handleDrawerAction}
        canCreate={canCreate}
        canManage={canManage}
        canReview={canReview}
      />

      {/* Action modals */}
      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadRecords()}
      />
    </div>
  );
}
