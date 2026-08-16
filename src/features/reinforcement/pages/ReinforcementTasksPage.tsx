"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementTaskCancelModal from "../components/ReinforcementTaskCancelModal";
import ReinforcementTaskDuplicateModal from "../components/ReinforcementTaskDuplicateModal";
import ReinforcementTaskTable from "../components/ReinforcementTaskTable";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  cancelReinforcementTask,
  duplicateReinforcementTask,
  listReinforcementTasks,
} from "../services/reinforcementTasksService";
import type {
  CancelReinforcementTaskPayload,
  DuplicateReinforcementTaskPayload,
  ReinforcementTask,
  ReinforcementTaskStatus,
  ReinforcementFilterOptions,
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

export default function ReinforcementTasksPage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();

  // ─── URL-synced filters ──────────────────────────────────────────────────
  const {
    values,
    setValue,
  } = useReinforcementUrlFilters({
    paramKeys: ["stageId", "gradeId", "sectionId", "classroomId", "subjectId", "studentId", "enrollmentId"],
    defaults: {},
  });

  // ─── Academic context derived from URL params ────────────────────────────
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId,
      termId,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      subjectId: values.subjectId || undefined,
      studentId: values.studentId || undefined,
      enrollmentId: values.enrollmentId || undefined,
    }),
    [academicYearId, termId, values.stageId, values.gradeId, values.sectionId, values.classroomId, values.subjectId, values.studentId, values.enrollmentId],
  );

  const [status, setStatus] = useState<ReinforcementTaskStatus | "">("");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number | undefined>();
  const [filterOptions, setFilterOptions] = useState<ReinforcementFilterOptions>({});
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateTask, setDuplicateTask] = useState<ReinforcementTask | null>(
    null,
  );
  const [cancelTask, setCancelTask] = useState<ReinforcementTask | null>(null);

  const canView = hasPermission("reinforcement.tasks.view");
  const canManage = hasPermission("reinforcement.tasks.manage");
  const [debouncedSearch] = useDebounce(search.trim(), 400);

  const resetFilters = () => {
    ["stageId", "gradeId", "sectionId", "classroomId", "subjectId", "studentId", "enrollmentId"]
      .forEach((key) => setValue(key, ""));
    setStatus("");
    setIncludeCancelled(false);
    setSource("");
    setSearch("");
    setDueFrom("");
    setDueTo("");
    setDueDate("");
    setOffset(0);
  };

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
      subjectId: context.subjectId,
      studentId: context.studentId,
      classroomId: context.classroomId,
      sectionId: context.sectionId,
      gradeId: context.gradeId,
      stageId: context.stageId,
      status: status || undefined,
      source: source || undefined,
      dueFrom: dueFrom || undefined,
      dueTo: dueTo || undefined,
      dueDate: dueDate || undefined,
      search: debouncedSearch || undefined,
      includeCancelled: includeCancelled || undefined,
      limit: 25,
      offset,
    }),
    [
      context.academicYearId,
      context.termId,
      context.subjectId,
      context.studentId,
      context.classroomId,
      context.sectionId,
      context.gradeId,
      context.stageId,
      status,
      source,
      dueFrom,
      dueTo,
      dueDate,
      debouncedSearch,
      includeCancelled,
      offset,
    ],
  );

  const sourceOptions = useMemo(
    () => (Array.isArray(filterOptions.sources) ? filterOptions.sources : [])
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const value = String(record.value || record.id || record.code || "");
        const label = String(
          locale === "ar"
            ? record.nameAr || record.nameEn || record.name || value
            : record.nameEn || record.nameAr || record.name || value,
        );
        return value ? { value, label } : null;
      })
      .filter((item): item is { value: string; label: string } => Boolean(item)),
    [filterOptions.sources, locale],
  );

  const refreshTasks = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const optionsResponse = await getReinforcementFilterOptions({
        academicYearId: context.academicYearId,
        termId: context.termId,
      });
      const response = await listReinforcementTasks(params);
      setFilterOptions(optionsResponse);
      setFilterOptionsLoaded(true);
      setTasks(response.items);
      setTotal(response.total);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setTasks([]);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, context.academicYearId, context.termId, params, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshTasks);
  }, [refreshTasks]);

  useEffect(() => {
      void Promise.resolve().then(() => setFilterOptionsLoaded(false));
  }, [context.academicYearId, context.termId]);

  const handleDuplicate = async (
    payload: DuplicateReinforcementTaskPayload,
  ) => {
    if (!duplicateTask) return;
    try {
      await duplicateReinforcementTask(duplicateTask.id, payload);
      showSuccess(t("tasks.messages.duplicated"));
      setDuplicateTask(null);
      await refreshTasks();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
      throw nextError;
    }
  };

  const handleCancel = async (payload: CancelReinforcementTaskPayload) => {
    if (!cancelTask || cancelTask.status === "cancelled") return;
    try {
      await cancelReinforcementTask(cancelTask.id, payload);
      showSuccess(t("tasks.messages.cancelled"));
      setCancelTask(null);
      await refreshTasks();
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
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("tasks.title")}
        description={t("tasks.description")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshTasks}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Link href={`/${locale}/reinforcement/tasks/new`}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  {t("actions.newTask")}
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t("tasks.filters")}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{t("tasks.filtersDescription")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("tasks.clearFilters")}
          </button>
        </div>

        <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">{t("tasks.academicContext")}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 shadow-sm">
              {academicYearId && termId ? t("tasks.currentContext") : t("tasks.contextNotSelected")}
            </span>
          </div>
          <ReinforcementAcademicContextFilter
            value={context}
            filterOptions={filterOptionsLoaded ? filterOptions : undefined}
            showAcademicYearTerm={false}
            showSubject
            showStudent
            onChange={(selection: ReinforcementAcademicContextSelection) => {
              setValue("stageId", selection.stageId || "");
              setValue("gradeId", selection.gradeId || "");
              setValue("sectionId", selection.sectionId || "");
              setValue("classroomId", selection.classroomId || "");
              setValue("subjectId", selection.subjectId || "");
              setValue("studentId", selection.studentId || "");
              setValue("enrollmentId", selection.enrollmentId || "");
              setOffset(0);
            }}
          />
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            label={t("tasks.search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label={t("tasks.table.status")}
            value={status}
            onChange={(value) =>
              setStatus(value as ReinforcementTaskStatus | "")
            }
            options={[
              { value: "", label: t("filters.allStatuses") },
              { value: "not_completed", label: t("status.not_completed") },
              { value: "in_progress", label: t("status.in_progress") },
              { value: "under_review", label: t("status.under_review") },
              { value: "completed", label: t("status.completed") },
              { value: "cancelled", label: t("status.cancelled") },
            ]}
          />
          <Select
            label={t("tasks.source")}
            value={source}
            onChange={setSource}
            options={[
              { value: "", label: t("filters.allSources") },
              ...sourceOptions,
            ]}
            searchable
          />
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((current) => !current)}
            className="flex w-full items-center justify-between text-sm font-medium text-gray-700 transition-colors hover:text-primary"
          >
            <span>{showAdvancedFilters ? t("tasks.hideAdvancedFilters") : t("tasks.showAdvancedFilters")}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showAdvancedFilters ? (
          <div className="grid gap-3 border-t border-gray-100 bg-gray-50/40 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            type="date"
            label={t("tasks.dueFrom")}
            value={dueFrom}
            onChange={(event) => setDueFrom(event.target.value)}
          />
          <Input
            type="date"
            label={t("tasks.dueTo")}
            value={dueTo}
            onChange={(event) => setDueTo(event.target.value)}
          />
          <Input
            type="date"
            label={t("tasks.dueDate")}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <label className="flex min-h-[70px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(event) => setIncludeCancelled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>{t("tasks.includeCancelled")}</span>
          </label>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      <ReinforcementTaskTable
        tasks={tasks}
        loading={loading}
        canManage={canManage}
        onDuplicate={setDuplicateTask}
        onCancel={setCancelTask}
        total={total}
        currentPage={Math.floor(offset / 25) + 1}
        pageSize={25}
        onPageChange={(page) => setOffset((page - 1) * 25)}
      />

      <ReinforcementTaskDuplicateModal
        task={duplicateTask}
        isOpen={Boolean(duplicateTask)}
        onClose={() => setDuplicateTask(null)}
        onSubmit={handleDuplicate}
      />
      <ReinforcementTaskCancelModal
        task={cancelTask}
        isOpen={Boolean(cancelTask)}
        onClose={() => setCancelTask(null)}
        onSubmit={handleCancel}
      />
    </div>
  );
}
