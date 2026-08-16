"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DataTable from "@/components/ui/data-table/DataTable";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import {
  listBehaviorCategories,
  deleteBehaviorCategory,
} from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import Modal from "@/components/ui/modal/Modal";
import BehaviorActionModals, {
  type BehaviorModalMode,
  type BehaviorModalTarget,
} from "@/features/behavior/shared/components/BehaviorActionModals";
import type {
  BehaviorCategory,
  BehaviorCategoryListFilters,
  BehaviorSeverity,
  BehaviorType,
} from "@/features/behavior/types";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";

function StatePanel({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

export default function BehaviorCategoriesPage() {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const { isReadOnly } = useBehaviorYearTermContext();
  const { hasPermission } = usePermissions();
  const canManage = !isReadOnly && hasPermission("behavior.categories.manage");
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BehaviorCategoryListFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const [modalMode, setModalMode] = useState<BehaviorModalMode | null>(null);
  const [modalTarget, setModalTarget] = useState<BehaviorModalTarget>({});

  const [deleteTarget, setDeleteTarget] = useState<BehaviorCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBehaviorCategories({
        ...filters,
        search: debouncedSearch || undefined,
      });
      setCategories(res.items);
    } catch (error) {
      const msg = behaviorUiError(error, t("messages.loadError"), t).message;
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, showError, t]);

  const handleDelete = async () => {
    if (!canManage || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBehaviorCategory(deleteTarget.id);
      showSuccess(t("messages.categoryDeleted"));
      setDeleteTarget(null);
      void loadCategories();
    } catch (error) {
      let code = "";
      if (error && typeof error === "object" && error !== null) {
        const errObj = error as Record<string, unknown>;
        const response = errObj.response as Record<string, unknown> | undefined;
        const responseData = response?.data as Record<string, unknown> | undefined;
        const responseDataError = responseData?.error as Record<string, unknown> | undefined;
        
        code = String(errObj.code || responseData?.code || responseDataError?.code || "");
      }
      if (code === "behavior.category.in_use") {
        showError(t("errors.categoryInUse"));
      } else {
        const uiError = behaviorUiError(error, t("messages.loadError"), t);
        showError(uiError.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadCategories);
  }, [loadCategories]);

  if (error) return <StatePanel title={error} />;

  const columns = [
    {
      key: "code",
      label: t("category.code"),
      searchable: true,
      render: (_: unknown, row: BehaviorCategory) => (
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {row.code}
        </span>
      ),
    },
    {
      key: "name",
      label: locale === "ar" ? t("category.nameAr") : t("category.nameEn"),
      searchable: true,
      render: (_: unknown, row: BehaviorCategory) => (
        <div
          dir={locale === "ar" ? "rtl" : "ltr"}
          className={locale === "ar" ? "text-right" : "text-left"}
          style={{ color: "var(--text-primary)" }}
        >
          {(locale === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr) || row.code}
        </div>
      ),
    },
    {
      key: "type",
      label: t("category.type"),
      render: (_: unknown, row: BehaviorCategory) => (
        <span
          className="inline-flex px-2 py-0.5 text-xs rounded-full border font-medium"
          style={
            row.type === "positive"
              ? { backgroundColor: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }
              : { backgroundColor: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }
          }
        >
          {t(`type.${row.type}`)}
        </span>
      ),
    },
    {
      key: "severity",
      label: t("category.severity"),
      render: (_: unknown, row: BehaviorCategory) => (
        <span className="capitalize" style={{ color: "var(--text-primary)" }}>
          {row.defaultSeverity}
        </span>
      ),
    },
    {
      key: "points",
      label: t("category.points"),
      sortable: true,
      render: (_: unknown, row: BehaviorCategory) => (
        <span className="font-semibold" style={{ color: row.defaultPoints >= 0 ? "#16a34a" : "#dc2626" }}>
          {row.defaultPoints > 0 ? `+${row.defaultPoints}` : row.defaultPoints}
        </span>
      ),
    },
    {
      key: "active",
      label: t("category.active"),
      render: (_: unknown, row: BehaviorCategory) => (
        <span className={`text-xs font-medium ${row.isActive ? "text-green-700" : "text-red-700"}`}>
          {row.isActive ? "✓" : "✗"}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("category.actions"),
      sortable: false,
      render: (_: unknown, row: BehaviorCategory) => (
        <div className="flex items-center justify-end gap-2">
          {canManage && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalTarget({ category: row });
                  setModalMode("edit-category");
                }}
                className="text-xs px-2 py-1 rounded border hover:bg-[var(--color-neutral-100)] transition-colors"
                style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
              >
                {t("actions.edit")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                {t("actions.delete")}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border-color)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            label={t("filters.search")}
            placeholder={t("filters.searchPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            inputSize="sm"
          />
          <Select
            label={t("filters.type")}
            value={filters.type ?? ""}
            onChange={(value) => setFilters((prev) => ({ ...prev, type: (value as BehaviorType) || undefined }))}
            options={[
              { value: "", label: t("filters.allTypes") },
              { value: "positive", label: t("filters.positive") },
              { value: "negative", label: t("filters.negative") },
            ]}
            selectSize="sm"
          />
          <Select
            label={t("advancedFilters.severity")}
            value={filters.severity ?? ""}
            onChange={(value) => setFilters((prev) => ({ ...prev, severity: (value as BehaviorSeverity) || undefined }))}
            options={[
              { value: "", label: t("advancedFilters.allSeverities") },
              { value: "low", label: t("category.low") },
              { value: "medium", label: t("category.medium") },
              { value: "high", label: t("category.high") },
              { value: "critical", label: t("overview.critical") },
            ]}
            selectSize="sm"
          />
          <Select
            label={t("category.active")}
            value={filters.isActive === undefined ? "" : String(filters.isActive)}
            onChange={(value) => setFilters((prev) => ({ ...prev, isActive: value === "" ? undefined : value === "true" }))}
            options={[
              { value: "", label: t("advancedFilters.allActivity") },
              { value: "true", label: t("category.active") },
              { value: "false", label: t("overview.inactiveCategories") },
            ]}
            selectSize="sm"
          />
          <Select
            label={t("advancedFilters.includeDeleted")}
            value={filters.includeDeleted ? "true" : "false"}
            onChange={(value) => setFilters((prev) => ({ ...prev, includeDeleted: value === "true" ? true : undefined }))}
            options={[
              { value: "false", label: t("advancedFilters.allActivity") },
              { value: "true", label: t("advancedFilters.includeDeleted") },
            ]}
            selectSize="sm"
          />
        </div>
      </div>
      {/* Header + new button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("sections.categories")}
        </h2>
        {canManage && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setModalTarget({});
              setModalMode("create-category");
            }}
          >
            {t("actions.newCategory")}
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={
          columns as unknown as {
            key: string;
            label: string;
            sortable?: boolean;
            searchable?: boolean;
            render?: (
              value: unknown,
              row: Record<string, unknown>,
            ) => React.ReactNode;
          }[]
        }
        data={categories as unknown as Record<string, unknown>[]}
        isLoading={loading}
        showPagination={true}
        itemsPerPage={15}
      />

      {/* Action modals */}
      <BehaviorActionModals
        mode={modalMode}
        target={modalTarget}
        onClose={() => setModalMode(null)}
        onSuccess={() => void loadCategories()}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("modal.deleteCategory")}
        size="sm"
        variant="danger"
        description={t("modal.confirmDeleteCategory")}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t("modal.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "..." : t("actions.delete")}
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}
