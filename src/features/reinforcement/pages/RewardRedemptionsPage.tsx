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
import { listRewardCatalog } from "../services/rewardCatalogService";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import type {
  RedemptionRequestSource,
  RedemptionStatus,
  RewardCatalogItem,
  RewardRedemption,
} from "../types";
import { describeRewardApiError } from "../utils/rewardApiErrors";

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

interface RedemptionFilterOption {
  value: string;
  label: string;
  searchText: string;
}

function asLookupRecord(candidate: unknown): Record<string, unknown> | null {
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? (candidate as Record<string, unknown>)
    : null;
}

function readLookupText(
  lookupRecord: Record<string, unknown>,
  fieldNames: string[],
): string | undefined {
  return fieldNames
    .map((fieldName) => lookupRecord[fieldName])
    .find((fieldValue): fieldValue is string =>
      typeof fieldValue === "string" && Boolean(fieldValue.trim()),
    );
}

function mapStudentFilterOption(
  candidate: unknown,
  locale: string,
): RedemptionFilterOption | null {
  const student = asLookupRecord(candidate);
  if (!student) return null;

  const studentId = readLookupText(student, ["studentId", "id", "student_id"]);
  if (!studentId) return null;

  const nameEn = readLookupText(student, ["nameEn", "fullNameEn", "name"]);
  const nameAr = readLookupText(student, ["nameAr", "fullNameAr"]);
  const displayName = locale === "ar" ? nameAr || nameEn : nameEn || nameAr;

  return {
    value: studentId,
    label: displayName || studentId,
    searchText: [nameEn, nameAr, studentId].filter(Boolean).join(" "),
  };
}

function mapCatalogFilterOption(
  catalogItem: RewardCatalogItem,
  locale: string,
): RedemptionFilterOption {
  const title =
    locale === "ar"
      ? catalogItem.titleAr || catalogItem.titleEn || catalogItem.id
      : catalogItem.titleEn || catalogItem.titleAr || catalogItem.id;

  return {
    value: catalogItem.id,
    label: title,
    searchText: [catalogItem.titleEn, catalogItem.titleAr, catalogItem.id]
      .filter(Boolean)
      .join(" "),
  };
}

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
    paramKeys: ["status", "studentId", "catalogItemId", "requestSource", "includeTerminal", "search", "requestedFrom", "requestedTo", "academicYearId", "termId"],
    defaults: {},
  });

  const [items, setItems] = useState<RewardRedemption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentFilterOptions, setStudentFilterOptions] = useState<RedemptionFilterOption[]>([]);
  const [catalogFilterOptions, setCatalogFilterOptions] = useState<RedemptionFilterOption[]>([]);
  const [filterLookupError, setFilterLookupError] = useState<string | null>(null);

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

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      getReinforcementFilterOptions({
        academicYearId: values.academicYearId || undefined,
        termId: values.termId || undefined,
      }),
      listRewardCatalog({
        academicYearId: values.academicYearId || undefined,
        termId: values.termId || undefined,
        limit: 100,
      }),
    ])
      .then(([filterOptions, catalogResponse]) => {
        if (!isActive) return;

        setStudentFilterOptions(
          (filterOptions.students ?? [])
            .map((student) => mapStudentFilterOption(student, locale))
            .filter((option): option is RedemptionFilterOption => Boolean(option)),
        );
        setCatalogFilterOptions(
          catalogResponse.items.map((catalogItem) =>
            mapCatalogFilterOption(catalogItem, locale),
          ),
        );
        setFilterLookupError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setStudentFilterOptions([]);
        setCatalogFilterOptions([]);
        setFilterLookupError(t("rewardsModule.redemptions.filters.optionsUnavailable"));
      });

    return () => {
      isActive = false;
    };
  }, [locale, t, values.academicYearId, values.termId]);

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
        key: "requestSource",
        label: t("rewardsModule.redemptions.table.source"),
        type: "select",
        options: [
          { value: "", label: t("rewardsModule.redemptions.filters.allSources") },
          ...(["dashboard", "teacher", "student_app", "parent_app", "system"] as const).map((source) => ({
            value: source,
            label: t(`rewardsModule.source.${source}`),
          })),
        ],
      },
      {
        key: "studentId",
        label: t("rewardsModule.redemptions.table.student"),
        type: "select",
        options: [
          { value: "", label: t("rewardsModule.redemptions.filters.allStudents") },
          ...studentFilterOptions,
        ],
        searchable: true,
      },
      {
        key: "catalogItemId",
        label: t("rewardsModule.redemptions.table.reward"),
        type: "select",
        options: [
          { value: "", label: t("rewardsModule.redemptions.filters.allRewards") },
          ...catalogFilterOptions,
        ],
        searchable: true,
      },
      {
        key: "includeTerminal",
        label: t("rewardsModule.redemptions.filters.requestState"),
        type: "select",
        options: [
          { value: "", label: t("rewardsModule.redemptions.filters.allRequests") },
          { value: "false", label: t("rewardsModule.redemptions.filters.openOnly") },
        ],
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
    [catalogFilterOptions, studentFilterOptions, t],
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
    if (values.studentId) {
      filters.push({
        key: "studentId",
        label: t("rewardsModule.redemptions.table.student"),
        value: values.studentId,
        displayValue:
          studentFilterOptions.find((option) => option.value === values.studentId)
            ?.label || values.studentId,
      });
    }
    if (values.catalogItemId) {
      filters.push({
        key: "catalogItemId",
        label: t("rewardsModule.redemptions.table.reward"),
        value: values.catalogItemId,
        displayValue:
          catalogFilterOptions.find(
            (option) => option.value === values.catalogItemId,
          )?.label || values.catalogItemId,
      });
    }
    if (values.requestSource) {
      filters.push({
        key: "requestSource",
        label: t("rewardsModule.redemptions.table.source"),
        value: values.requestSource,
        displayValue: t(`rewardsModule.source.${values.requestSource}`),
      });
    }
    if (values.includeTerminal === "false") {
      filters.push({
        key: "includeTerminal",
        label: t("rewardsModule.redemptions.filters.requestState"),
        value: "false",
        displayValue: t("rewardsModule.redemptions.filters.openOnly"),
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
  }, [catalogFilterOptions, studentFilterOptions, t, values.catalogItemId, values.includeTerminal, values.requestSource, values.requestedFrom, values.requestedTo, values.search, values.status, values.studentId]);

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
      studentId: values.studentId || undefined,
      catalogItemId: values.catalogItemId || undefined,
      requestSource: (values.requestSource || undefined) as RedemptionRequestSource | undefined,
      includeTerminal: values.includeTerminal === "false" ? false : undefined,
      search: values.search || undefined,
      requestedFrom: values.requestedFrom || undefined,
      requestedTo: values.requestedTo || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize, values.academicYearId, values.catalogItemId, values.includeTerminal, values.requestSource, values.requestedFrom, values.requestedTo, values.search, values.status, values.studentId, values.termId],
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
      const message = t(describeRewardApiError(nextError).messageKey);
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
        const message = t(describeRewardApiError(nextError).messageKey);
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
      const message = t(describeRewardApiError(nextError).messageKey);
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
      const message = t(describeRewardApiError(nextError).messageKey);
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
            canRequest && row.status === "requested";
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
        values={{ status: values.status, studentId: values.studentId, catalogItemId: values.catalogItemId, requestSource: values.requestSource, includeTerminal: values.includeTerminal, search: values.search, requestedFrom: values.requestedFrom, requestedTo: values.requestedTo }}
        onChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        searchKey="search"
        debounceMs={350}
      />

      {filterLookupError ? (
        <p className="text-sm text-amber-700" role="status">
          {filterLookupError}
        </p>
      ) : null}

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
