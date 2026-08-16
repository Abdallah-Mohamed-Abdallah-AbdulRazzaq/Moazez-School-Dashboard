"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTemplateForm from "../components/ReinforcementTemplateForm";
import ReinforcementTemplateTable from "../components/ReinforcementTemplateTable";
import {
  createReinforcementTemplate,
  listReinforcementTemplates,
} from "../services/reinforcementTemplatesService";
import type {
  CreateReinforcementTemplatePayload,
  ReinforcementSource,
  ReinforcementTemplate,
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

export default function ReinforcementTemplatesPage() {
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [templates, setTemplates] = useState<ReinforcementTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | ReinforcementSource>(
    "all",
  );
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateDirty, setIsCreateDirty] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const canView = hasPermission("reinforcement.templates.view");
  const canManage = hasPermission("reinforcement.templates.manage");

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      source: sourceFilter === "all" ? undefined : sourceFilter,
      includeDeleted: includeDeleted || undefined,
    }),
    [includeDeleted, search, sourceFilter],
  );

  const sourceOptions = useMemo(
    () => [
      { value: "all", label: t("templates.allSources") },
      { value: "teacher", label: t("source.teacher") },
      { value: "parent", label: t("source.parent") },
      { value: "system", label: t("source.system") },
    ],
    [t],
  );

  const refreshTemplates = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listReinforcementTemplates(queryParams);
      setTemplates(response.items);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setTemplates([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, queryParams, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshTemplates);
  }, [refreshTemplates]);

  const closeCreateModal = useCallback(() => {
    setIsCreateOpen(false);
    setIsCreateDirty(false);
    setIsDiscardConfirmOpen(false);
  }, []);

  const requestCloseCreateModal = useCallback(() => {
    if (isCreateDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }

    closeCreateModal();
  }, [closeCreateModal, isCreateDirty]);

  const handleCreate = async (payload: CreateReinforcementTemplatePayload) => {
    try {
      await createReinforcementTemplate(payload);
      showSuccess(t("templates.messages.created"));
      closeCreateModal();
      await refreshTemplates();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50">
      <ReinforcementPageHeader
        title={t("templates.title")}
        description={t("templates.description")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshTemplates}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setIsCreateDirty(false);
                  setIsCreateOpen(true);
                }}
              >
                {t("templates.form.create")}
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_220px] lg:items-end">
          <Input
            label={t("templates.search")}
            placeholder={t("templates.searchPlaceholder")}
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label={t("templates.sourceFilter")}
            value={sourceFilter}
            onChange={(value) =>
              setSourceFilter(value as "all" | ReinforcementSource)
            }
            options={sourceOptions}
          />
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{t("templates.includeDeleted")}</span>
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refreshTemplates}>
              {t("actions.refresh")}
            </Button>
          </div>
        </div>
      ) : null}

      <ReinforcementTemplateTable
        templates={templates}
        loading={loading}
        search={search}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={requestCloseCreateModal}
        title={t("templates.form.createTitle")}
        description={t("templates.form.createDescription")}
        size="xl"
      >
        <ReinforcementTemplateForm
          onSubmit={handleCreate}
          onCancel={requestCloseCreateModal}
          onDirtyChange={setIsCreateDirty}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={closeCreateModal}
        title={t("templates.form.discardTitle")}
        description={t("templates.form.discardDescription")}
        cancelLabel={t("templates.form.keepEditing")}
        confirmLabel={t("templates.form.discard")}
        severity="warning"
      />
    </div>
  );
}
