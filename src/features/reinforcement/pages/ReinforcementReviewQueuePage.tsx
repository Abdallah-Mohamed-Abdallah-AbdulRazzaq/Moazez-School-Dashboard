"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import ReinforcementReviewDetailsDrawer from "../components/ReinforcementReviewDetailsDrawer";
import ReinforcementReviewActionModal from "../components/ReinforcementReviewActionModal";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import {
  approveReinforcementSubmission,
  getReinforcementReviewItem,
  listReinforcementReviewQueue,
  rejectReinforcementSubmission,
} from "../services/reinforcementReviewsService";
import { listReinforcementTasks } from "../services/reinforcementTasksService";
import { grantXpForReinforcementReview } from "../services/reinforcementXpService";
import type {
  ReinforcementReviewItem,
  ReinforcementReviewStatus,
} from "../types";

const getLocalizedValue = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) {
      return val;
    }
  }
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

function mapGenericOption(
  record: unknown,
  locale: string,
): SelectOption | null {
  const rec = toRecord(record);
  if (!rec) return null;

  const id = getLocalizedValue(rec, ["id", "value"]);
  if (!id) return null;

  const nameEn =
    getLocalizedValue(rec, [
      "nameEn",
      "fullNameEn",
      "full_name_en",
      "name",
      "label",
    ]) ?? id;
  const nameAr =
    getLocalizedValue(rec, [
      "nameAr",
      "fullNameAr",
      "full_name_ar",
      "name",
      "label",
    ]) ?? nameEn;
  return {
    value: id,
    label: locale === "ar" ? nameAr : nameEn,
  };
}

function mapStudentOption(
  record: unknown,
  locale: string,
): SelectOption | null {
  const rec = toRecord(record);
  if (!rec) return null;

  const id = getLocalizedValue(rec, ["studentId", "id", "student_id"]);
  if (!id) return null;

  const nameEn =
    getLocalizedValue(rec, ["nameEn", "fullNameEn", "full_name_en", "name"]) ??
    id;
  const nameAr =
    getLocalizedValue(rec, ["nameAr", "fullNameAr", "full_name_ar", "name"]) ??
    nameEn;
  return {
    value: id,
    label: locale === "ar" ? nameAr : nameEn,
    searchText: `${nameEn} ${nameAr} ${id}`,
  };
}

type FilterRecord = Record<string, unknown>;

const recordsFrom = (value: unknown): FilterRecord[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is FilterRecord =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];

const relationIdFor = (
  record: FilterRecord,
  relation: "stage" | "grade" | "section" | "classroom",
): string | undefined => {
  const direct = record[`${relation}Id`] || record[`${relation}_id`];
  if (typeof direct === "string") return direct;
  const nested = record[relation];
  if (nested && typeof nested === "object") {
    const nestedId = (nested as { id?: unknown }).id;
    if (typeof nestedId === "string") return nestedId;
  }
  return undefined;
};

const filterByRelation = (
  records: FilterRecord[],
  relation: "stage" | "grade" | "section" | "classroom",
  parentId?: string,
): FilterRecord[] => {
  if (!parentId) return [];
  return records.filter((record) => {
    const relationId = relationIdFor(record, relation);
    return !relationId || relationId === parentId;
  });
};

const mapValueOption = (
  value: unknown,
  locale: string,
): SelectOption | null => {
  if (typeof value === "string") {
    return { value, label: value };
  }
  return mapGenericOption(value, locale);
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

const STATUS_BADGE_STYLES: Record<ReinforcementReviewStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ReinforcementReviewQueuePage() {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, isInitializing: academicContextLoading } =
    useAcademicYearTermLayoutContext();

  const canView = hasPermission("reinforcement.reviews.view");
  const canManage = hasPermission("reinforcement.reviews.manage");

  const {
    values,
    setValue,
    page,
    pageSize,
    setPage,
    setPageSize,
    rawSearchValue,
    setRawSearch,
    clearAll,
  } = useReinforcementUrlFilters({
    paramKeys: [
      "studentId",
      "source",
      "taskId",
      "stageId",
      "gradeId",
      "sectionId",
      "classroomId",
      "status",
      "search",
      "submittedFrom",
      "submittedTo",
    ],
    defaults: {},
    debounceKey: "search",
  });

  const [items, setItems] = useState<ReinforcementReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(
    null,
  );

  // Drawer and action states
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] =
    useState<ReinforcementReviewItem | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionLoading, setActionLoading] = useState(false);
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState("");
  const [xpGranting, setXpGranting] = useState(false);
  const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);

  // Dropdown options states
  const [studentsOptions, setStudentsOptions] = useState<SelectOption[]>([]);
  const [stageRecords, setStageRecords] = useState<FilterRecord[]>([]);
  const [gradeRecords, setGradeRecords] = useState<FilterRecord[]>([]);
  const [sectionRecords, setSectionRecords] = useState<FilterRecord[]>([]);
  const [classroomRecords, setClassroomRecords] = useState<FilterRecord[]>([]);
  const [sourceRecords, setSourceRecords] = useState<unknown[]>([]);
  const [taskRecords, setTaskRecords] = useState<FilterRecord[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(canView);

  // Load filter options
  useEffect(() => {
    if (!canView || !academicYearId || !termId) {
      void Promise.resolve().then(() => setOptionsLoading(false));
      return;
    }

    let active = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const opts = await getReinforcementFilterOptions({
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
        });
        if (!active) return;

        if (opts.students) {
          setStudentsOptions(
            opts.students
              .map((s) => mapStudentOption(s, locale))
              .filter((s): s is SelectOption => s !== null),
          );
        }
        setStageRecords(recordsFrom(opts.stages));
        setGradeRecords(recordsFrom(opts.grades));
        setSectionRecords(recordsFrom(opts.sections));
        setClassroomRecords(recordsFrom(opts.classrooms));
        setSourceRecords(opts.sources || []);

        const taskOptions = opts.tasks
          ? Promise.resolve(recordsFrom(opts.tasks))
          : listReinforcementTasks({
              academicYearId: academicYearId || undefined,
              termId: termId || undefined,
              limit: 100,
              offset: 0,
            }).then((response) =>
              response.items.map((item) => item as unknown as FilterRecord),
            );
        void taskOptions
          .then((records) => {
            if (active) setTaskRecords(records);
          })
          .catch(() => {
            if (active) setTaskRecords([]);
          });
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        if (active) setOptionsLoading(false);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, [academicYearId, canView, locale, termId]);

  const stageOptions = useMemo(
    () =>
      stageRecords
        .map((record) => mapGenericOption(record, locale))
        .filter(Boolean) as SelectOption[],
    [locale, stageRecords],
  );
  const gradeOptions = useMemo(
    () =>
      filterByRelation(gradeRecords, "stage", values.stageId)
        .map((record) => mapGenericOption(record, locale))
        .filter(Boolean) as SelectOption[],
    [gradeRecords, locale, values.stageId],
  );
  const sectionOptions = useMemo(
    () =>
      filterByRelation(sectionRecords, "grade", values.gradeId)
        .map((record) => mapGenericOption(record, locale))
        .filter(Boolean) as SelectOption[],
    [locale, sectionRecords, values.gradeId],
  );
  const classroomOptions = useMemo(
    () =>
      filterByRelation(classroomRecords, "section", values.sectionId)
        .map((record) => mapGenericOption(record, locale))
        .filter(Boolean) as SelectOption[],
    [classroomRecords, locale, values.sectionId],
  );
  const sourceOptions = useMemo(
    () =>
      sourceRecords
        .map((record) => mapValueOption(record, locale))
        .filter((record): record is SelectOption => record !== null),
    [locale, sourceRecords],
  );
  const taskOptions = useMemo(
    () =>
      taskRecords
        .map((record) => {
          const id = getLocalizedValue(record, ["id", "taskId"]);
          if (!id) return null;
          const title = getLocalizedValue(
            record,
            locale === "ar"
              ? ["titleAr", "titleEn", "nameAr", "nameEn"]
              : ["titleEn", "titleAr", "nameEn", "nameAr"],
          );
          return { value: id, label: title || id };
        })
        .filter((record): record is SelectOption => record !== null),
    [locale, taskRecords],
  );

  const params = useMemo(
    () => ({
      academicYearId: academicYearId || undefined,
      termId: termId || undefined,
      studentId: values.studentId || undefined,
      source: values.source || undefined,
      taskId: values.taskId || undefined,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      status: values.status || undefined,
      search: values.search || undefined,
      submittedFrom: values.submittedFrom || undefined,
      submittedTo: values.submittedTo || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [
      academicYearId,
      termId,
      values.studentId,
      values.source,
      values.taskId,
      values.stageId,
      values.gradeId,
      values.sectionId,
      values.classroomId,
      values.status,
      values.search,
      values.submittedFrom,
      values.submittedTo,
      page,
      pageSize,
    ],
  );

  const refreshQueue = useCallback(async () => {
    if (!canView) return;

    setError(null);

    // Date validation
    if (
      values.submittedFrom &&
      values.submittedTo &&
      values.submittedFrom > values.submittedTo
    ) {
      setDateValidationError(
        t("rewardsModule.overview.errors.invalidDates") ||
          "Start date cannot be after end date",
      );
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setDateValidationError(null);
    setLoading(true);

    try {
      const response = await listReinforcementReviewQueue(params);
      setItems(response.items);
      setTotal(response.total ?? response.items.length);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      setItems([]);
      setTotal(0);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t, values.submittedFrom, values.submittedTo]);

  useEffect(() => {
    void Promise.resolve().then(refreshQueue);
  }, [refreshQueue]);

  // Drawer details fetch effect
  useEffect(() => {
    if (!selectedSubmissionId || !canView) return;
    let active = true;
    const fetchDetails = async () => {
      setSelectedReview(null);
      setDrawerLoading(true);
      setDrawerError(null);
      try {
        const details = await getReinforcementReviewItem(selectedSubmissionId);
        if (active) {
          setSelectedReview(details);
        }
      } catch (err) {
        if (active) {
          setDrawerError(
            err instanceof Error ? err.message : "Failed to load details",
          );
        }
      } finally {
        if (active) setDrawerLoading(false);
      }
    };
    void fetchDetails();
    return () => {
      active = false;
    };
  }, [selectedSubmissionId, canView, drawerRefreshTrigger]);

  const handleActionSubmit = async (payload: {
    note?: string;
    noteAr?: string;
  }) => {
    if (!selectedSubmissionId) return;
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        const updated = await approveReinforcementSubmission(
          selectedSubmissionId,
          payload,
        );
        setSelectedReview(updated);
        showSuccess(t("reviews.messages.approved"));
        setActionModalOpen(false);
        // Show XP grant prompt after successful approval
        setXpModalOpen(true);
      } else {
        const updated = await rejectReinforcementSubmission(
          selectedSubmissionId,
          payload,
        );
        setSelectedReview(updated);
        showSuccess(t("reviews.messages.rejected"));
        setActionModalOpen(false);
      }
      await refreshQueue();
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : t("reviews.messages.error");
      showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleXpGrant = async () => {
    if (!selectedSubmissionId) return;
    const parsedAmount = Number(xpAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showError(t("validation.xpAmountRequired"));
      return;
    }
    setXpGranting(true);
    try {
      const payload = { amount: parsedAmount };
      await grantXpForReinforcementReview(selectedSubmissionId, payload);
      showSuccess(t("reviews.detail.xpGranted"));
      setXpModalOpen(false);
      setXpAmount("");
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
    } finally {
      setXpGranting(false);
    }
  };

  const handleXpSkip = () => {
    setXpModalOpen(false);
    setXpAmount("");
  };

  const handleClearFilters = () => {
    clearAll();
  };

  const handleApprove = useCallback(
    async (item: ReinforcementReviewItem) => {
      try {
        await approveReinforcementSubmission(item.id, {});
        showSuccess(t("reviews.messages.approved"));
        await refreshQueue();
      } catch (nextError) {
        const message =
          nextError instanceof Error
            ? nextError.message
            : t("reviews.messages.error");
        showError(message);
      }
    },
    [refreshQueue, showSuccess, showError, t],
  );

  const handleReject = useCallback(
    async (item: ReinforcementReviewItem) => {
      try {
        await rejectReinforcementSubmission(item.id, {});
        showSuccess(t("reviews.messages.rejected"));
        await refreshQueue();
      } catch (nextError) {
        const message =
          nextError instanceof Error
            ? nextError.message
            : t("reviews.messages.error");
        showError(message);
      }
    },
    [refreshQueue, showSuccess, showError, t],
  );

  const columns: Column<ReinforcementReviewItem>[] = useMemo(
    () => [
      {
        key: "student",
        label: t("reviews.table.student"),
        searchable: true,
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const student = row.student as Record<string, unknown>;
          const fullName = student
            ? (student.name as string) ||
              (student.nameEn as string) ||
              `${(student.firstName as string) || ""} ${(student.lastName as string) || ""}`.trim()
            : "";
          const name =
            locale === "ar"
              ? (student?.nameAr as string) || fullName || "-"
              : fullName || (student?.nameAr as string) || "-";
          return <span className="font-medium text-gray-900">{name}</span>;
        },
      },
      {
        key: "task",
        label: t("reviews.table.task"),
        searchable: true,
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const task = row.task as Record<string, unknown>;
          const title =
            locale === "ar"
              ? (task?.titleAr as string) || (task?.titleEn as string) || "-"
              : (task?.titleEn as string) || (task?.titleAr as string) || "-";
          return <span className="text-gray-700">{title}</span>;
        },
      },
      {
        key: "stage",
        label: t("reviews.table.stage"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const stage = row.stage as Record<string, unknown>;
          const title =
            locale === "ar"
              ? (stage?.titleAr as string) || (stage?.titleEn as string) || "-"
              : (stage?.titleEn as string) || (stage?.titleAr as string) || "-";
          return <span className="text-gray-700">{title}</span>;
        },
      },
      {
        key: "status",
        label: t("reviews.table.status"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          const reviewStatus = row.status as ReinforcementReviewStatus;
          const badgeClass =
            STATUS_BADGE_STYLES[reviewStatus] || "bg-gray-100 text-gray-700";
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {t(`reviews.status.${reviewStatus}`)}
            </span>
          );
        },
      },
      {
        key: "submittedAt",
        label: t("reviews.table.submittedAt"),
        render: (_value: unknown, row: ReinforcementReviewItem) => {
          if (!row.submittedAt) return <span className="text-gray-400">-</span>;
          const parsed = new Date(row.submittedAt);
          if (isNaN(parsed.getTime()))
            return <span className="text-gray-400">-</span>;
          return (
            <span className="text-gray-700">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                dateStyle: "medium",
              }).format(parsed)}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: t("reviews.table.actions"),
        render: (_value: unknown, row: ReinforcementReviewItem) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSubmissionId(row.id);
                setDrawerOpen(true);
              }}
            >
              {t("reviews.actions.viewDetail")}
            </Button>
            {canManage && row.status === "submitted" ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(row);
                  }}
                >
                  {t("reviews.actions.approve")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(row);
                  }}
                >
                  {t("reviews.actions.reject")}
                </Button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [locale, t, canManage, handleApprove, handleReject],
  );

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <ReinforcementPageHeader
        title={t("reviews.title")}
        description={t("reviews.description")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={refreshQueue}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      {/* Filters section */}
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {t("rewardsModule.overview.filtersTitle") || "Filters"}
        </h2>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 items-end">
          <Select
            label={t("reviews.table.stage") || "Stage"}
            value={values.stageId || ""}
            onChange={(val) => {
              setValue("stageId", val);
              setValue("gradeId", "");
              setValue("sectionId", "");
              setValue("classroomId", "");
              setValue("studentId", "");
            }}
            options={[
              { value: "", label: t("filters.allStages") || "All stages" },
              ...stageOptions,
            ]}
            searchable
            disabled={optionsLoading || academicContextLoading || !termId}
          />

          <Select
            label={t("reviews.table.grade") || "Grade"}
            value={values.gradeId || ""}
            onChange={(val) => {
              setValue("gradeId", val);
              setValue("sectionId", "");
              setValue("classroomId", "");
              setValue("studentId", "");
            }}
            options={[
              { value: "", label: t("filters.allGrades") || "All grades" },
              ...gradeOptions,
            ]}
            searchable
            disabled={optionsLoading || !values.stageId}
          />

          <Select
            label={t("reviews.table.section") || "Section"}
            value={values.sectionId || ""}
            onChange={(val) => {
              setValue("sectionId", val);
              setValue("classroomId", "");
              setValue("studentId", "");
            }}
            options={[
              { value: "", label: t("filters.allSections") || "All sections" },
              ...sectionOptions,
            ]}
            searchable
            disabled={optionsLoading || !values.gradeId}
          />

          <Select
            label={t("reviews.table.classroom") || "Classroom"}
            value={values.classroomId || ""}
            onChange={(val) => {
              setValue("classroomId", val);
              setValue("studentId", "");
            }}
            options={[
              {
                value: "",
                label: t("filters.allClassrooms") || "All classrooms",
              },
              ...classroomOptions,
            ]}
            searchable
            disabled={optionsLoading || !values.sectionId}
          />

          <Select
            label={t("rewardsModule.redemptions.create.student") || "Student"}
            value={values.studentId || ""}
            onChange={(val) => setValue("studentId", val)}
            options={studentsOptions}
            searchable
            placeholder={
              t("rewardsModule.overview.allStudents") || "All Students"
            }
            disabled={optionsLoading}
          />

          <Select
            label={t("reviews.table.task") || "Task"}
            value={values.taskId || ""}
            onChange={(val) => setValue("taskId", val)}
            options={[
              { value: "", label: t("filters.allTasks") || "All tasks" },
              ...taskOptions,
            ]}
            searchable
            disabled={optionsLoading}
          />

          <Select
            label={t("reviews.table.source") || "Source"}
            value={values.source || ""}
            onChange={(val) => setValue("source", val)}
            options={[
              { value: "", label: t("filters.allSources") || "All sources" },
              ...sourceOptions,
            ]}
            searchable
            disabled={optionsLoading}
          />

          <Select
            label={t("reviews.table.status") || "Status"}
            value={values.status || ""}
            onChange={(val) => setValue("status", val)}
            options={[
              { value: "", label: t("filters.allStatuses") || "All" },
              {
                value: "submitted",
                label: t("reviews.status.submitted") || "Submitted",
              },
              {
                value: "approved",
                label: t("reviews.status.approved") || "Approved",
              },
              {
                value: "rejected",
                label: t("reviews.status.rejected") || "Rejected",
              },
            ]}
          />

          <Input
            type="date"
            label={t("rewardsModule.overview.dateFrom") || "Date From"}
            value={values.submittedFrom || ""}
            onChange={(e) => setValue("submittedFrom", e.target.value)}
          />

          <Input
            type="date"
            label={t("rewardsModule.overview.dateTo") || "Date To"}
            value={values.submittedTo || ""}
            onChange={(e) => setValue("submittedTo", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 items-center">
          <Input
            type="text"
            label={t("filters.search") || "Search"}
            placeholder={t("filters.searchPlaceholder") || "Search..."}
            value={rawSearchValue}
            onChange={(e) => setRawSearch(e.target.value)}
          />

          {Object.values(values).some(Boolean) ? (
            <div className="flex justify-end h-10 items-end">
              <Button variant="secondary" onClick={handleClearFilters}>
                {t("rewardsModule.overview.clearFilters") || "Clear Filters"}
              </Button>
            </div>
          ) : null}
        </div>

        {dateValidationError ? (
          <p className="text-xs text-red-600 font-medium">
            {dateValidationError}
          </p>
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

      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <DataTable<ReinforcementReviewItem>
          columns={columns}
          data={items}
          isLoading={loading}
          skeletonRows={pageSize}
          searchQuery={values.search}
          onRowClick={(row) => {
            setSelectedSubmissionId(row.id);
            setDrawerOpen(true);
          }}
          serverPagination={{
            enabled: true,
            currentPage: page,
            pageSize,
            totalItems: total,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </section>

      {/* Details Drawer */}
      <ReinforcementReviewDetailsDrawer
        isOpen={drawerOpen}
        review={selectedReview}
        loading={drawerLoading}
        error={drawerError}
        canManage={canManage}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSubmissionId(null);
          setSelectedReview(null);
        }}
        onRetry={() => setDrawerRefreshTrigger((prev) => prev + 1)}
        onAction={(action) => {
          setActionType(action);
          setActionModalOpen(true);
        }}
      />

      {/* Action Modal */}
      <ReinforcementReviewActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        actionType={actionType}
        loading={actionLoading}
      />

      {/* XP Grant Modal */}
      <Modal
        isOpen={xpModalOpen}
        onClose={handleXpSkip}
        title={t("reviews.detail.grantXp")}
        description={t("reviews.detail.grantXpDescription")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleXpSkip}>
              {t("actions.skip")}
            </Button>
            <Button loading={xpGranting} onClick={handleXpGrant}>
              {t("actions.grantXp")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2" dir={locale === "ar" ? "rtl" : "ltr"}>
          <Input
            type="number"
            label={t("xp.amount")}
            placeholder="10"
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            min={1}
          />
        </div>
      </Modal>
    </div>
  );
}
