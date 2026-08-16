"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Eye, Gift, Plus, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementFilterToolbar, {
  type ActiveFilter,
  type FilterConfig,
} from "../components/shared/ReinforcementFilterToolbar";
import RewardRedemptionActionModal, {
  type RedemptionActionPayload,
} from "../components/RewardRedemptionActionModal";
import RewardRedemptionCreateModal from "../components/RewardRedemptionCreateModal";
import RewardRedemptionDetailsDrawer, {
  type RewardRedemptionDrawerAction,
} from "../components/RewardRedemptionDetailsDrawer";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import {
  approveRewardRedemption,
  cancelRewardRedemption,
  createRewardRedemption,
  fulfillRewardRedemption,
  getRewardRedemption,
  listRewardRedemptions,
  rejectRewardRedemption,
} from "../services/rewardRedemptionsService";
import type {
  RedemptionStatus,
  RewardRedemption,
} from "../types";

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE_STYLES: Record<RedemptionStatus, string> = {
  requested: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  fulfilled: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-700",
};

type RedemptionActionType = "approve" | "reject" | "fulfill" | "cancel";

export default function RewardRedemptionsPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  // Note: debounceKey is not used here because ReinforcementFilterToolbar
  // handles search debounce internally before calling onChange
  const {
    values,
    setValue,
    clearAll,
    page,
    pageSize,
    setPage,
    setPageSize,
  } = useReinforcementUrlFilters({
    paramKeys: ["status", "search", "requestedFrom", "requestedTo", "academicYearId", "termId"],
    defaults: {},
  });

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<RedemptionActionType>("approve");
  const [modalItem, setModalItem] = useState<RewardRedemption | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<RewardRedemption | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.rewards.redemptions.view");
  const canRequest = hasPermission("reinforcement.rewards.redemptions.request");
  const canReview = hasPermission("reinforcement.rewards.redemptions.review");
  const canFulfill = hasPermission("reinforcement.rewards.fulfill");
  const canDownloadFiles = hasPermission("files.downloads.view");

  // ─── Filter toolbar config ───────────────────────────────────────────────
  const redemptionFilters: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("rewardsModule.redemptions.table.status"),
        type: "select",
        options: [
          { value: "", label: t("filters.allStatuses") },
          { value: "requested", label: t("rewardsModule.status.requested") },
          { value: "approved", label: t("rewardsModule.status.approved") },
          { value: "rejected", label: t("rewardsModule.status.rejected") },
          { value: "fulfilled", label: t("rewardsModule.status.fulfilled") },
          { value: "cancelled", label: t("rewardsModule.status.cancelled") },
        ],
      },
      {
        key: "search",
        label: t("filters.search"),
        type: "search",
        placeholder: t("filters.searchPlaceholder"),
      },
      {
        key: "requestedFrom",
        label: t("rewardsModule.redemptions.filters.requestedFrom"),
        type: "date",
      },
      {
        key: "requestedTo",
        label: t("rewardsModule.redemptions.filters.requestedTo"),
        type: "date",
      },
    ],
    [t],
  );

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    if (values.status) {
      filters.push({
        key: "status",
        label: t("rewardsModule.redemptions.table.status"),
        value: values.status,
        displayValue: t(`rewardsModule.status.${values.status}`),
      });
    }
    if (values.search) {
      filters.push({
        key: "search",
        label: t("filters.search"),
        value: values.search,
        displayValue: values.search,
      });
    }
    if (values.requestedFrom) {
      filters.push({
        key: "requestedFrom",
        label: t("rewardsModule.redemptions.filters.requestedFrom"),
        value: values.requestedFrom,
        displayValue: values.requestedFrom,
      });
    }
    if (values.requestedTo) {
      filters.push({
        key: "requestedTo",
        label: t("rewardsModule.redemptions.filters.requestedTo"),
        value: values.requestedTo,
        displayValue: values.requestedTo,
      });
    }
    return filters;
  }, [values.status, values.search, values.requestedFrom, values.requestedTo, t]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setValue(key, value);
    },
    [setValue],
  );

  const handleClearAllFilters = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const handleRemoveFilter = useCallback(
    (key: string) => {
      setValue(key, "");
    },
    [setValue],
  );

  const params = useMemo(
    () => ({
      academicYearId: values.academicYearId || undefined,
      termId: values.termId || undefined,
      status: (values.status || undefined) as RedemptionStatus | undefined,
      search: values.search || undefined,
      requestedFrom: values.requestedFrom || undefined,
      requestedTo: values.requestedTo || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [values.academicYearId, values.termId, values.status, values.search, values.requestedFrom, values.requestedTo, page, pageSize],
  );

  const refreshList = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listRewardRedemptions(params);
      setItems(response.items);
      setTotal(response.total ?? response.items.length);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setItems([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshList);
  }, [refreshList]);

  const openActionModal = useCallback((item: RewardRedemption, action: RedemptionActionType) => {
    setModalItem(item);
    setModalAction(action);
    setModalOpen(true);
  }, []);

  const loadDetails = useCallback(
    async (redemptionId: string) => {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const response = await getRewardRedemption(redemptionId);
        setDetailsItem(response);
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : t("common.error");
        setDetailsError(message);
        setDetailsItem(null);
      } finally {
        setDetailsLoading(false);
      }
    },
    [t],
  );

  const openDetails = useCallback(
    (item: RewardRedemption) => {
      setDetailsId(item.id);
      setDetailsOpen(true);
      setDetailsItem(null);
      void loadDetails(item.id);
    },
    [loadDetails],
  );

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    setDetailsId(null);
    setDetailsItem(null);
    setDetailsError(null);
  }, []);

  const retryDetails = useCallback(() => {
    if (detailsId) void loadDetails(detailsId);
  }, [detailsId, loadDetails]);

  const openDrawerAction = useCallback(
    (action: RewardRedemptionDrawerAction) => {
      if (!detailsItem) return;
      openActionModal(detailsItem, action);
    },
    [detailsItem, openActionModal],
  );

  const handleModalSubmit = async (payload: RedemptionActionPayload) => {
    if (!modalItem) return;
    const updatedRedemptionId = modalItem.id;
    setModalLoading(true);
    try {
      switch (modalAction) {
        case "approve":
          await approveRewardRedemption(modalItem.id, payload as { reviewNoteEn?: string; reviewNoteAr?: string });
          showSuccess(t("rewardsModule.messages.approved"));
          break;
        case "reject":
          await rejectRewardRedemption(modalItem.id, payload as { reviewNoteEn?: string; reviewNoteAr?: string });
          showSuccess(t("rewardsModule.messages.rejected"));
          break;
        case "fulfill":
          await fulfillRewardRedemption(modalItem.id, payload as { fulfillmentNoteEn?: string; fulfillmentNoteAr?: string });
          showSuccess(t("rewardsModule.messages.fulfilled"));
          break;
        case "cancel":
          await cancelRewardRedemption(modalItem.id, payload as { cancellationReasonEn?: string; cancellationReasonAr?: string });
          showSuccess(t("rewardsModule.messages.cancelled"));
          break;
      }
      setModalOpen(false);
      await refreshList();
      if (detailsOpen && detailsId === updatedRedemptionId) {
        await loadDetails(updatedRedemptionId);
      }
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateSubmit = async (
    payload: Parameters<typeof createRewardRedemption>[0],
  ) => {
    setCreateLoading(true);
    try {
      await createRewardRedemption(payload);
      showSuccess(t("rewardsModule.messages.redemptionCreated"));
      setCreateModalOpen(false);
      await refreshList();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    } finally {
      setCreateLoading(false);
    }
  };

  const columns: Column<RewardRedemption>[] = useMemo(
    () => [
      {
        key: "student",
        label: t("rewardsModule.redemptions.table.student"),
        searchable: true,
        render: (_value: unknown, row: RewardRedemption) => {
          const fullName = `${row.student.firstName ?? ""} ${row.student.lastName ?? ""}`.trim();
          const name =
            locale === "ar"
              ? row.student.nameAr || fullName || "-"
              : fullName || row.student.nameAr || "-";
          return <span className="font-medium text-gray-900">{name}</span>;
        },
      },
      {
        key: "catalogItem",
        label: t("rewardsModule.redemptions.table.reward"),
        searchable: true,
        render: (_value: unknown, row: RewardRedemption) => {
          const item = row.catalogItem;
          const title =
            locale === "ar"
              ? item?.titleAr || item?.titleEn || "-"
              : item?.titleEn || item?.titleAr || "-";
          return <span className="text-gray-700">{title}</span>;
        },
      },
      {
        key: "status",
        label: t("rewardsModule.redemptions.table.status"),
        render: (_value: unknown, row: RewardRedemption) => {
          const redemptionStatus = row.status;
          const badgeClass =
            STATUS_BADGE_STYLES[redemptionStatus] || "bg-gray-100 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`rewardsModule.status.${redemptionStatus}`)}
            </span>
          );
        },
      },
      {
        key: "requestSource",
        label: t("rewardsModule.redemptions.table.source"),
        render: (_value: unknown, row: RewardRedemption) => {
          if (!row.requestSource) return <span className="text-gray-400">-</span>;
          return (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {t(`rewardsModule.source.${row.requestSource}`)}
            </span>
          );
        },
      },
      {
        key: "requestedAt",
        label: t("rewardsModule.redemptions.table.requestedAt"),
        render: (_value: unknown, row: RewardRedemption) => {
          if (!row.requestedAt) return <span className="text-gray-400">-</span>;
          return (
            <span className="text-gray-700">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                dateStyle: "medium",
              }).format(new Date(row.requestedAt))}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: t("rewardsModule.redemptions.table.actions"),
        render: (_value: unknown, row: RewardRedemption) => {
          const canCancelRow =
            canRequest && ["requested", "approved"].includes(row.status);
          const hasVisibleAction =
            (canReview && row.status === "requested") ||
            (canFulfill && row.status === "approved") ||
            canCancelRow;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => openDetails(row)}
              >
                {t("rewardsModule.actions.view")}
              </Button>
              {canReview && row.status === "requested" ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                    onClick={() => openActionModal(row, "approve")}
                  >
                    {t("rewardsModule.actions.approve")}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => openActionModal(row, "reject")}
                  >
                    {t("rewardsModule.actions.reject")}
                  </Button>
                </>
              ) : null}
              {canFulfill && row.status === "approved" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Gift className="h-3.5 w-3.5" />}
                  onClick={() => openActionModal(row, "fulfill")}
                >
                  {t("rewardsModule.actions.fulfill")}
                </Button>
              ) : null}
              {canCancelRow ? (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={() => openActionModal(row, "cancel")}
                >
                  {t("rewardsModule.actions.cancel")}
                </Button>
              ) : null}
              {!hasVisibleAction ? (
                <span className="text-xs text-gray-500">
                  {t(`rewardsModule.status.${row.status}`)}
                </span>
              ) : null}
            </div>
          );
        },
      },
    ],
    [locale, t, canFulfill, canRequest, canReview, openActionModal, openDetails],
  );

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("rewardsModule.redemptions.title")}
        description={t("rewardsModule.redemptions.description")}
        actions={
          <div className="flex flex-wrap gap-2">
            {canRequest ? (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateModalOpen(true)}
              >
                {t("rewardsModule.redemptions.create.button")}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshList}
            >
              {t("actions.refresh")}
            </Button>
          </div>
        }
      />

      <ReinforcementFilterToolbar
        filters={redemptionFilters}
        values={{ status: values.status, search: values.search, requestedFrom: values.requestedFrom, requestedTo: values.requestedTo }}
        onChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        searchKey="search"
        debounceMs={350}
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <DataTable<RewardRedemption>
          columns={columns}
          data={items}
          isLoading={loading}
          skeletonRows={pageSize}
          searchQuery={values.search}
          serverPagination={{
            enabled: true,
            currentPage: page,
            pageSize,
            totalItems: total,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
          onRowClick={openDetails}
        />
      </section>

      <RewardRedemptionActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        actionType={modalAction}
        loading={modalLoading}
      />
      {createModalOpen ? (
        <RewardRedemptionCreateModal
          isOpen
          academicYearId={values.academicYearId || undefined}
          termId={values.termId || undefined}
          loading={createLoading}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      ) : null}
      <RewardRedemptionDetailsDrawer
        isOpen={detailsOpen}
        redemption={detailsItem}
        loading={detailsLoading}
        error={detailsError}
        canRequest={canRequest}
        canReview={canReview}
        canFulfill={canFulfill}
        canDownloadFiles={canDownloadFiles}
        onClose={closeDetails}
        onRetry={retryDetails}
        onAction={openDrawerAction}
      />
    </div>
  );
}
