"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Archive, Edit, Plus, Rocket, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import AuthenticatedFileImage from "@/components/ui/authenticated-file-image/AuthenticatedFileImage";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Modal from "@/components/ui/modal/Modal";
import TextArea from "@/components/ui/input/TextArea";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementFilterToolbar, {
  type ActiveFilter,
  type FilterConfig,
} from "../components/shared/ReinforcementFilterToolbar";
import RewardCatalogFormModal from "../components/RewardCatalogFormModal";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import {
  archiveRewardCatalogItem,
  createRewardCatalogItem,
  listRewardCatalog,
  publishRewardCatalogItem,
  updateRewardCatalogItem,
} from "../services/rewardCatalogService";
import { getRewardCatalogSummary } from "../services/rewardDashboardService";
import type {
  CreateRewardCatalogItemPayload,
  ListRewardCatalogParams,
  RewardCatalogItem,
  RewardCatalogSummaryParams,
  RewardCatalogStatus,
  RewardItemType,
  UpdateRewardCatalogItemPayload,
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

const STATUS_BADGE_STYLES: Record<RewardCatalogStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-amber-100 text-amber-700",
};

const TYPE_BADGE_STYLES: Record<RewardItemType, string> = {
  physical: "bg-blue-100 text-blue-700",
  digital: "bg-purple-100 text-purple-700",
  privilege: "bg-indigo-100 text-indigo-700",
  certificate: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-700",
};

type CatalogSummaryCounts = {
  total?: number;
  draft?: number;
  published?: number;
  archived?: number;
  available?: number;
  outOfStock?: number;
  lowStock?: number;
  unlimited?: number;
  limited?: number;
};

const CATALOG_PAGE_LIMIT = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asCatalogItems(value: unknown): RewardCatalogItem[] {
  return Array.isArray(value) ? (value.filter(isRecord) as RewardCatalogItem[]) : [];
}

function asCatalogSummary(value: unknown): CatalogSummaryCounts {
  if (!isRecord(value)) return {};
  return {
    total: numberValue(value.total),
    draft: numberValue(value.draft),
    published: numberValue(value.published),
    archived: numberValue(value.archived),
    available: numberValue(value.available),
    outOfStock: numberValue(value.outOfStock),
    lowStock: numberValue(value.lowStock),
    unlimited: numberValue(value.unlimited),
    limited: numberValue(value.limited),
  };
}

export default function RewardCatalogPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const {
    academicYearId,
    termId,
    academicYears,
    isInitializing: contextInitializing,
  } = useAcademicYearTermLayoutContext();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  // Note: debounceKey is not used here because ReinforcementFilterToolbar
  // handles search debounce internally before calling onChange
  const {
    values,
    setValue,
    clearAll,
  } = useReinforcementUrlFilters({
    paramKeys: ["status", "type", "search"],
    defaults: {},
  });

  const [items, setItems] = useState<RewardCatalogItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(CATALOG_PAGE_LIMIT);
  const [summary, setSummary] = useState<CatalogSummaryCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RewardCatalogItem | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<RewardCatalogItem | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [publishTarget, setPublishTarget] = useState<RewardCatalogItem | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  const canView = hasPermission("reinforcement.rewards.view");
  const canManage = hasPermission("reinforcement.rewards.manage");
  const canUploadFiles = hasPermission("files.uploads.manage");
  const canDownloadFiles = hasPermission("files.downloads.view");
  const hasAcademicContext = Boolean(academicYearId && termId);

  // ─── Filter toolbar config ───────────────────────────────────────────────
  const catalogFilters: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("rewardsModule.catalog.table.status"),
        type: "select",
        options: [
          { value: "", label: t("filters.allStatuses") },
          { value: "draft", label: t("rewardsModule.status.draft") },
          { value: "published", label: t("rewardsModule.status.published") },
          { value: "archived", label: t("rewardsModule.status.archived") },
        ],
      },
      {
        key: "type",
        label: t("rewardsModule.catalog.table.type"),
        type: "select",
        options: [
          { value: "", label: t("filters.allRewardTypes") },
          { value: "physical", label: t("rewardsModule.type.physical") },
          { value: "digital", label: t("rewardsModule.type.digital") },
          { value: "privilege", label: t("rewardsModule.type.privilege") },
          { value: "certificate", label: t("rewardsModule.type.certificate") },
          { value: "other", label: t("rewardsModule.type.other") },
        ],
      },
      {
        key: "search",
        label: t("filters.search"),
        type: "search",
        placeholder: t("filters.searchPlaceholder"),
      },
    ],
    [t],
  );

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    if (values.status) {
      filters.push({
        key: "status",
        label: t("rewardsModule.catalog.table.status"),
        value: values.status,
        displayValue: t(`rewardsModule.status.${values.status}`),
      });
    }
    if (values.type) {
      filters.push({
        key: "type",
        label: t("rewardsModule.catalog.table.type"),
        value: values.type,
        displayValue: t(`rewardsModule.type.${values.type}`),
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
    return filters;
  }, [values.status, values.type, values.search, t]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setCatalogPage(1);
      setValue(key, value);
    },
    [setValue],
  );

  const handleClearAllFilters = useCallback(() => {
    void Promise.resolve().then(() => setCatalogPage(1));
    clearAll();
  }, [clearAll]);

  const handleRemoveFilter = useCallback(
    (key: string) => {
      setCatalogPage(1);
      setValue(key, "");
    },
    [setValue],
  );

  const catalogParams = useMemo<ListRewardCatalogParams>(
    () => ({
      status: (values.status || undefined) as RewardCatalogStatus | undefined,
      type: (values.type || undefined) as RewardItemType | undefined,
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
      search: values.search || undefined,
      limit: catalogPageSize,
      offset: (catalogPage - 1) * catalogPageSize,
    }),
    [
      values.status,
      values.type,
      academicYearId,
      termId,
      values.search,
      catalogPage,
      catalogPageSize,
    ],
  );

  const summaryParams = useMemo<RewardCatalogSummaryParams>(
    () => ({
      status: (values.status || undefined) as RewardCatalogStatus | undefined,
      type: (values.type || undefined) as RewardItemType | undefined,
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
    }),
    [academicYearId, termId, values.status, values.type],
  );

  const refreshCatalog = useCallback(async () => {
    if (!canView || contextInitializing || !hasAcademicContext) {
      if (!contextInitializing) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const catalogResponse = await listRewardCatalog(catalogParams);
      setItems(asCatalogItems(catalogResponse.items));
      setCatalogTotal(
        typeof catalogResponse.total === "number"
          ? catalogResponse.total
          : asCatalogItems(catalogResponse.items).length,
      );

      try {
        const summaryResponse = await getRewardCatalogSummary(summaryParams);
        setSummary(asCatalogSummary(summaryResponse.summary));
      } catch (summaryError) {
        setSummary({});
        const message =
          summaryError instanceof Error
            ? summaryError.message
            : t("common.error");
        showError(message);
      }
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setItems([]);
      setCatalogTotal(0);
      setSummary({});
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [
    canView,
    catalogParams,
    contextInitializing,
    hasAcademicContext,
    summaryParams,
    showError,
    t,
  ]);

  useEffect(() => {
    void Promise.resolve().then(() => setCatalogPage(1));
  }, [academicYearId, termId]);

  useEffect(() => {
    void Promise.resolve().then(refreshCatalog);
  }, [refreshCatalog]);

  const handleOpenPublish = useCallback((item: RewardCatalogItem) => {
    setPublishTarget(item);
  }, []);

  const handleClosePublish = useCallback(() => {
    if (publishLoading) return;
    setPublishTarget(null);
  }, [publishLoading]);

  const handleConfirmPublish = useCallback(
    async (item: RewardCatalogItem) => {
      setPublishLoading(true);
      try {
        await publishRewardCatalogItem(item.id);
        showSuccess(t("rewardsModule.messages.published"));
        setPublishTarget(null);
        await refreshCatalog();
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : t("common.error");
        showError(message);
      } finally {
        setPublishLoading(false);
      }
    },
    [refreshCatalog, showSuccess, showError, t],
  );

  const handleOpenArchive = useCallback((item: RewardCatalogItem) => {
    setArchiveTarget(item);
    setArchiveReason("");
  }, []);

  const handleCloseArchive = useCallback(() => {
    if (archiveLoading) return;
    setArchiveTarget(null);
    setArchiveReason("");
  }, [archiveLoading]);

  const handleConfirmArchive = useCallback(
    async () => {
      if (!archiveTarget) return;
      setArchiveLoading(true);
      try {
        await archiveRewardCatalogItem(archiveTarget.id, {
          reason: archiveReason.trim() || undefined,
        });
        showSuccess(t("rewardsModule.messages.archived"));
        setArchiveTarget(null);
        setArchiveReason("");
        await refreshCatalog();
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : t("common.error");
        showError(message);
      } finally {
        setArchiveLoading(false);
      }
    },
    [
      archiveReason,
      archiveTarget,
      refreshCatalog,
      showError,
      showSuccess,
      t,
    ],
  );

  const handleOpenCreate = () => {
    setEditingItem(undefined);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: RewardCatalogItem) => {
    if (item.status === "published") {
      setFormModalOpen(false);
      setEditingItem(undefined);
      return;
    }
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleFormClose = () => {
    setFormModalOpen(false);
    setEditingItem(undefined);
  };

  const handleFormSubmit = async (
    payload: CreateRewardCatalogItemPayload | UpdateRewardCatalogItemPayload,
  ) => {
    setFormLoading(true);
    try {
      if (editingItem) {
        await updateRewardCatalogItem(editingItem.id, payload as UpdateRewardCatalogItemPayload);
        showSuccess(t("rewardsModule.messages.updated"));
      } else {
        await createRewardCatalogItem(payload as CreateRewardCatalogItemPayload);
        showSuccess(t("rewardsModule.messages.created"));
      }
      setFormModalOpen(false);
      setEditingItem(undefined);
      void refreshCatalog();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const columns: Column<RewardCatalogItem>[] = useMemo(
    () => [
      {
        key: "title",
        label: t("rewardsModule.catalog.table.title"),
        searchable: true,
        render: (_value: unknown, row: RewardCatalogItem) => {
          const title =
            locale === "ar"
              ? row.titleAr || row.titleEn || "-"
              : row.titleEn || row.titleAr || "-";
          return (
            <div className="flex min-w-0 items-center gap-3">
              <AuthenticatedFileImage
                fileId={row.imageFileId}
                alt={title}
                canDownload={canDownloadFiles}
                unavailableLabel={t(
                  "rewardsModule.catalog.form.imageUnavailable",
                )}
                retryLabel={t("rewardsModule.catalog.form.retryImage")}
              />
              <span className="font-medium text-gray-900">{title}</span>
            </div>
          );
        },
      },
      {
        key: "type",
        label: t("rewardsModule.catalog.table.type"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          const itemType = row.type || "other";
          const badgeClass = TYPE_BADGE_STYLES[itemType] || "bg-gray-100 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`rewardsModule.type.${itemType}`)}
            </span>
          );
        },
      },
      {
        key: "minTotalXp",
        label: t("rewardsModule.catalog.table.xpCost"),
        render: (_value: unknown, row: RewardCatalogItem) => (
          <span className="text-gray-700">{row.minTotalXp ?? 0}</span>
        ),
      },
      {
        key: "stock",
        label: t("rewardsModule.catalog.table.stock"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          if (row.isUnlimited) {
            return <span className="text-gray-700">{t("rewardsModule.catalog.stock.unlimited")}</span>;
          }
          return (
            <span className="text-gray-700">
              {row.stockRemaining ?? 0} / {row.stockQuantity ?? 0}
            </span>
          );
        },
      },
      {
        key: "availability",
        label: t("rewardsModule.catalog.table.availability"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          const availabilityKey = row.isLowStock
            ? "lowStock"
            : row.isAvailable === false
              ? "outOfStock"
              : "available";
          const badgeClass =
            availabilityKey === "available"
              ? "bg-emerald-100 text-emerald-700"
              : availabilityKey === "lowStock"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700";

          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`rewardsModule.catalog.availability.${availabilityKey}`)}
            </span>
          );
        },
      },
      {
        key: "redemptions",
        label: t("rewardsModule.catalog.table.redemptions"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          const redemptions = isRecord(row.redemptions) ? row.redemptions : {};
          const open = numberValue(redemptions.open);
          const totalRedemptions = numberValue(redemptions.total);

          return (
            <div className="space-y-0.5 text-sm text-gray-700">
              <div>
                {open} {t("rewardsModule.overview.open")}
              </div>
              <div className="text-xs text-gray-500">
                {totalRedemptions} {t("rewardsModule.overview.requests")}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: t("rewardsModule.catalog.table.status"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          const itemStatus = row.status || "draft";
          const badgeClass = STATUS_BADGE_STYLES[itemStatus] || "bg-gray-100 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`rewardsModule.status.${itemStatus}`)}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: t("rewardsModule.catalog.table.actions"),
        render: (_value: unknown, row: RewardCatalogItem) => {
          if (!canManage) return null;
          return (
            <div className="flex items-center gap-2">
              {row.status !== "published" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEdit(row)}
                >
                  {t("rewardsModule.actions.edit")}
                </Button>
              ) : null}
              {row.status === "draft" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Rocket className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenPublish(row)}
                >
                  {t("rewardsModule.actions.publish")}
                </Button>
              ) : null}
              {row.status === "published" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Archive className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenArchive(row)}
                >
                  {t("rewardsModule.actions.archive")}
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      canDownloadFiles,
      locale,
      t,
      canManage,
      handleOpenPublish,
      handleOpenArchive,
    ],
  );

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  const summaryCards = [
    {
      label: t("rewardsModule.overview.totalCatalogItems"),
      value: summary.total ?? items.length,
    },
    {
      label: t("rewardsModule.status.published"),
      value: summary.published || 0,
    },
    {
      label: t("rewardsModule.overview.available"),
      value: summary.available || 0,
    },
    {
      label: t("rewardsModule.overview.lowStock"),
      value: summary.lowStock || 0,
    },
    {
      label: t("rewardsModule.overview.outOfStock"),
      value: summary.outOfStock || 0,
    },
    {
      label: t("rewardsModule.overview.limited"),
      value: summary.limited || 0,
    },
  ];

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("rewardsModule.catalog.title")}
        description={t("rewardsModule.description")}
        actions={
          canManage && hasAcademicContext ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreate}
            >
              {t("rewardsModule.catalog.addReward")}
            </Button>
          ) : undefined
        }
      />

      <ReinforcementFilterToolbar
        filters={catalogFilters}
        values={{
          status: values.status,
          type: values.type,
          search: values.search,
        }}
        onChange={handleFilterChange}
        onClearAll={handleClearAllFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        searchKey="search"
        debounceMs={350}
      />

      {!contextInitializing && !hasAcademicContext ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          {t("rewardsModule.catalog.form.contextUnavailable")}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
            <DataTable<RewardCatalogItem>
              columns={columns}
              data={items}
              isLoading={loading}
              skeletonRows={catalogPageSize}
              searchQuery={values.search}
              itemsPerPage={catalogPageSize}
              serverPagination={{
                enabled: true,
                currentPage: catalogPage,
                pageSize: catalogPageSize,
                totalItems: catalogTotal,
                onPageChange: setCatalogPage,
                onPageSizeChange: (nextPageSize) => {
                  setCatalogPageSize(nextPageSize);
                  setCatalogPage(1);
                },
              }}
            />
          </section>
      </>

      <Modal
        isOpen={Boolean(publishTarget)}
        onClose={handleClosePublish}
        title={t("rewardsModule.catalog.publish.title")}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleClosePublish}
              disabled={publishLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                publishTarget && void handleConfirmPublish(publishTarget)
              }
              loading={publishLoading}
              disabled={publishLoading}
              leftIcon={<Rocket className="h-4 w-4" />}
            >
              {t("rewardsModule.actions.publish")}
            </Button>
          </>
        }
      >
        <p className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          {t("rewardsModule.catalog.publish.description")}
        </p>
      </Modal>

      <Modal
        isOpen={Boolean(archiveTarget)}
        onClose={handleCloseArchive}
        title={t("rewardsModule.catalog.archive.title")}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleCloseArchive}
              disabled={archiveLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmArchive}
              loading={archiveLoading}
              disabled={archiveLoading}
              leftIcon={<Archive className="h-4 w-4" />}
            >
              {t("rewardsModule.actions.archive")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            {t("rewardsModule.catalog.archive.description")}
          </div>
          <TextArea
            label={t("rewardsModule.catalog.archive.reason")}
            value={archiveReason}
            onChange={(event) => setArchiveReason(event.target.value)}
            placeholder={t("rewardsModule.catalog.archive.reasonPlaceholder")}
            rows={4}
          />
        </div>
      </Modal>

      <RewardCatalogFormModal
        isOpen={formModalOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        loading={formLoading}
        academicYears={academicYears}
        defaultAcademicYearId={academicYearId}
        defaultTermId={termId}
        canUploadFiles={canUploadFiles}
        canDownloadFiles={canDownloadFiles}
      />
    </div>
  );
}
