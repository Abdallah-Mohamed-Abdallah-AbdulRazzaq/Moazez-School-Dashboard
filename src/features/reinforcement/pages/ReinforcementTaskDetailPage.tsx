"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Gift, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementBadge from "../components/shared/ReinforcementBadge";
import ReinforcementTaskCancelModal from "../components/ReinforcementTaskCancelModal";
import ReinforcementTaskDuplicateModal from "../components/ReinforcementTaskDuplicateModal";
import {
  cancelReinforcementTask,
  duplicateReinforcementTask,
  getReinforcementTask,
} from "../services/reinforcementTasksService";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import { getReinforcementTaskTargetLabel } from "../utils/reinforcementTaskPresentation";
import type {
  CancelReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ReinforcementFilterOptions,
  ReinforcementTask,
} from "../types";

interface ReinforcementTaskDetailPageProps {
  taskId: string;
}

const labelFor = (key: string, t: (k: string, opts?: Record<string, string>) => string): string => {
  // Try translation first for known keys
  const knownKeys: Record<string, string> = {
    total: "tasks.assignmentSummary",
    notCompleted: "kpi.notCompleted",
    inProgress: "kpi.inProgress",
    underReview: "status.under_review",
    completed: "status.completed",
    cancelled: "status.cancelled",
    completionRate: "overview.completionRate",
  };
  if (knownKeys[key]) {
    return t(knownKeys[key], { defaultMessage: key });
  }
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const valueFor = (value: unknown, locale?: string): string => {
  if (typeof value === "number") {
    // If it looks like a rate (0-1), show as percentage
    if (value >= 0 && value <= 1 && value !== Math.floor(value)) {
      return `${Math.round(value * 100)}%`;
    }
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(value);
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? (locale === "ar" ? "نعم" : "Yes") : (locale === "ar" ? "لا" : "No");
  return "-";
};

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

export default function ReinforcementTaskDetailPage({
  taskId,
}: ReinforcementTaskDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [task, setTask] = useState<ReinforcementTask | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<ReinforcementFilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const canView = hasPermission("reinforcement.tasks.view");
  const canManage = hasPermission("reinforcement.tasks.manage");

  const refreshTask = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const nextTask = await getReinforcementTask(taskId);
      setTask(nextTask);
      try {
        setFilterOptions(
          await getReinforcementFilterOptions({
            academicYearId: nextTask.academicYearId,
            termId: nextTask.termId,
          }),
        );
      } catch {
        // Target names are optional enrichment; task details remain usable with scope keys.
        setFilterOptions({});
      }
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, showError, t, taskId]);

  useEffect(() => {
    void Promise.resolve().then(refreshTask);
  }, [refreshTask]);

  const handleDuplicate = async (
    payload: DuplicateReinforcementTaskPayload,
  ) => {
    if (!task) return;
    try {
      await duplicateReinforcementTask(task.id, payload);
      showSuccess(t("tasks.messages.duplicated"));
      setDuplicateOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const handleCancel = async (payload: CancelReinforcementTaskPayload) => {
    if (!task || task.status === "cancelled") return;
    try {
      const nextTask = await cancelReinforcementTask(task.id, payload);
      setTask(nextTask);
      showSuccess(t("tasks.messages.cancelled"));
      setCancelOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  const title = task
    ? locale === "ar"
      ? task.titleAr || task.titleEn || task.id
      : task.titleEn || task.titleAr || task.id
    : t("tasks.detailTitle");
  const isCancelled = task?.status === "cancelled";

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={title}
        description={t("tasks.detailDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshTask}
            >
              {t("actions.refresh")}
            </Button>
            {canManage && task ? (
              <Button variant="secondary" onClick={() => setDuplicateOpen(true)}>
                {t("actions.duplicate")}
              </Button>
            ) : null}
            {canManage && task && !isCancelled ? (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                {t("tasks.confirmCancel")}
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {loading && !task ? (
        <MainLoader />
      ) : task ? (
        <>
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.summary")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { key: "status", content: <ReinforcementBadge value={task.status} type="status" /> },
                { key: "source", content: <ReinforcementBadge value={task.source} type="source" /> },
                { key: "rewardType", content: task.reward.type
                  ? <ReinforcementBadge value={task.reward.type} type="rewardType" />
                  : <span className="text-gray-400">-</span> },
                { key: "dueDate", content: task.dueDate
                  ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(task.dueDate))
                  : "-" },
              ].map(({ key, content }) => (
                <div key={key} className="rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t(`tasks.detailFields.${key}`)}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {content}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          {(task.descriptionEn || task.descriptionAr) && (
            <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {t("tasks.form.details")}
              </h2>
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                {locale === "ar"
                  ? task.descriptionAr || task.descriptionEn
                  : task.descriptionEn || task.descriptionAr}
              </p>
            </section>
          )}

          {/* Reward details */}
          {task.reward && (
            <section className="overflow-hidden rounded-lg border border-violet-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/60 px-4 py-3">
                <Gift className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <h2 className="text-base font-semibold text-gray-900">
                  {t("tasks.form.reward")}
                </h2>
              </div>
              <div className="mt-4 grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("tasks.form.rewardType")}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {task.reward.type
                      ? <ReinforcementBadge value={task.reward.type} type="rewardType" />
                      : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("tasks.form.rewardValue")}
                  </div>
                  <div className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                    {task.reward.value != null
                      ? String(task.reward.value)
                      : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500">
                    {t("tasks.form.rewardLabelEn")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {locale === "ar"
                      ? task.reward.labelAr || task.reward.labelEn || "-"
                      : task.reward.labelEn || task.reward.labelAr || "-"}
                  </div>
                </div>
                {task.assignedByName && (
                  <div className="rounded-lg bg-gray-50 px-3 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500">
                      {t("tasks.detailFields.assignedBy")}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {String(task.assignedByName)}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-4" />
            </section>
          )}

          {/* Cancellation info */}
          {isCancelled && (task.cancelledAt || task.cancellationReason) ? (
            <section className="rounded-lg border border-red-100 bg-red-50 p-4">
              <h2 className="text-base font-semibold text-red-900">
                {t("tasks.cancelTitle")}
              </h2>
              <div className="mt-3 space-y-2">
                {task.cancelledAt ? (
                  <p className="text-sm text-red-700">
                    <span className="font-medium">{t("tasks.detailFields.cancelledAt")}:</span>{" "}
                    {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(task.cancelledAt)))}
                  </p>
                ) : null}
                {task.cancellationReason ? (
                  <p className="text-sm text-red-700">
                    <span className="font-medium">{t("tasks.cancelReason")}:</span>{" "}
                    {String(task.cancellationReason)}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {task.assignmentSummary ? (
            <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                {t("tasks.assignmentSummary")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(task.assignmentSummary).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500">
                      {labelFor(key, t)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {valueFor(value, locale)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-gray-900">
                {t("tasks.form.targets")}
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(task.targets || []).length === 0 ? (
                <span className="text-sm text-gray-500">{t("common.empty")}</span>
              ) : (
                (task.targets || []).map((target, idx) => {
                  const targetLabel = getReinforcementTaskTargetLabel(
                    target,
                    filterOptions,
                    locale === "ar" ? "ar" : "en",
                  );
                  const scopeLabel = t(`assignmentScope.${target.scopeType}`, {
                    defaultMessage: target.scopeType,
                  });
                  return (
                    <span
                      key={target.id || `${target.scopeType}:${target.scopeKey || idx}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary"
                    >
                      {scopeLabel ? <span className="text-xs text-primary/60">{scopeLabel}:</span> : null}
                      {targetLabel}
                    </span>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("tasks.form.stages")}
            </h2>
            <div className="mt-4 space-y-3">
              {(task.stages || []).map((stage, index) => (
                <div
                  key={stage.id || index}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {stage.sortOrder ?? index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {locale === "ar"
                          ? stage.titleAr || stage.titleEn
                          : stage.titleEn || stage.titleAr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.proofType && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {t(`proofType.${String(stage.proofType).toLowerCase()}`, { defaultMessage: String(stage.proofType) })}
                        </span>
                      )}
                      {stage.requiresApproval && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          {t("tasks.form.requiresApproval")}
                        </span>
                      )}
                    </div>
                  </div>
                  {(stage.descriptionEn || stage.descriptionAr) && (
                    <p className="mt-2 text-sm text-gray-600">
                      {locale === "ar"
                        ? stage.descriptionAr || stage.descriptionEn
                        : stage.descriptionEn || stage.descriptionAr}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          {t("emptyStates.tasks")}
        </div>
      )}

      <ReinforcementTaskDuplicateModal
        task={task}
        isOpen={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onSubmit={handleDuplicate}
      />
      <ReinforcementTaskCancelModal
        task={task}
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
    </div>
  );
}
