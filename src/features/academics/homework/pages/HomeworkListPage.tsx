"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/input/DatePicker";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { listHomeworkAssignments } from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkAssignmentUiModel,
  HomeworkAssignmentListFilters,
} from "@/features/academics/homework/services/homeworkApi.types";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import HomeworkLifecycleMenu from "@/features/academics/homework/components/HomeworkLifecycleMenu";
import {
  cancelHomeworkAssignment,
  closeHomeworkAssignment,
  publishHomeworkAssignment,
} from "@/features/academics/homework/services/homeworkService";
import {
  homeworkLifecycle,
  type HomeworkLifecycleAction,
} from "@/features/academics/homework/utils/homeworkLifecycle";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  type Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchTeacherAllocations,
  fetchTeachers,
  type Teacher,
  type TeacherAllocation,
} from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import {
  buildHomeworkListFilters,
  resetHomeworkListFilterParams,
  updateHomeworkListFilterParams,
  type HomeworkListFilterValues,
} from "@/features/academics/homework/utils/homeworkListFilters";
import { formatDateTime } from "@/utils/formatters/dateTime";

type HomeworkAssignmentTableRow = HomeworkAssignmentUiModel & {
  [key: string]: unknown;
};

interface HomeworkFilterSources {
  classrooms: StructureTree["classrooms"];
  teachers: Teacher[];
  subjects: Subject[];
  allocations: TeacherAllocation[];
}

const emptyHomeworkFilterSources: HomeworkFilterSources = {
  classrooms: [],
  teachers: [],
  subjects: [],
  allocations: [],
};

const emptyHomeworkFilterValues: HomeworkListFilterValues = {
  search: "",
  status: "",
  mode: "",
  classroomId: "",
  teacherUserId: "",
  teacherSubjectAllocationId: "",
  dueFrom: "",
  dueTo: "",
};

const HOMEWORK_SEARCH_DEBOUNCE_MS = 350;

function formatFilterDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFilterDate(value: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function localizedName(
  locale: string,
  entity?: { nameAr?: string; nameEn?: string; name?: string } | null,
) {
  if (!entity) return "";
  return locale === "ar"
    ? entity.nameAr || entity.nameEn || entity.name || ""
    : entity.nameEn || entity.nameAr || entity.name || "";
}

function teacherName(locale: string, teacher?: Teacher) {
  return locale === "ar"
    ? teacher?.nameAr || teacher?.nameEn || ""
    : teacher?.nameEn || teacher?.nameAr || "";
}

function statusClass(status: HomeworkAssignmentUiModel["status"]) {
  if (status === "published") return "bg-green-100 text-green-700";
  if (status === "closed") return "bg-gray-200 text-gray-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "archived") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function modeLabelKey(mode: HomeworkAssignmentUiModel["mode"]) {
  if (mode === "writing_task") return "writingTask";
  return mode;
}

export default function HomeworkListPage() {
  const locale = useLocale();
  const t = useTranslations("academics.homework.list");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const { hasPermission } = usePermissions();
  const { academicYearId, termId, termStatus, isInitializing } =
    useAcademicYearTermLayoutContext();
  const canView = hasPermission("homework.assignments.view");
  const canManage = hasPermission("homework.assignments.manage");
  const canViewSubmissions = hasPermission("homework.submissions.view");
  const canViewGradeSync =
    hasPermission("homework.assignments.view") &&
    hasPermission("grades.items.view");
  const [items, setItems] = useState<HomeworkAssignmentUiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<HomeworkListFilterValues>(
    () => ({
      search: searchParams.get("search") || "",
      status: searchParams.get("homeworkStatus") || "",
      mode: searchParams.get("mode") || "",
      classroomId: searchParams.get("classroom") || "",
      teacherUserId: searchParams.get("teacher") || "",
      teacherSubjectAllocationId: searchParams.get("allocation") || "",
      dueFrom: searchParams.get("dueFrom") || "",
      dueTo: searchParams.get("dueTo") || "",
    }),
  );
  const debouncedSearch = useDebounce(
    filterValues.search,
    HOMEWORK_SEARCH_DEBOUNCE_MS,
  );
  const [filterSources, setFilterSources] = useState<HomeworkFilterSources>(
    emptyHomeworkFilterSources,
  );
  const [isLoadingFilterSources, setIsLoadingFilterSources] = useState(false);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [pendingHomeworkId, setPendingHomeworkId] = useState<string | null>(
    null,
  );
  const [lifecycleConfirmation, setLifecycleConfirmation] = useState<{
    homeworkId: string;
    action: HomeworkLifecycleAction;
  } | null>(null);
  const tableRows = useMemo<HomeworkAssignmentTableRow[]>(
    () => items.map((homework) => ({ ...homework })),
    [items],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("filters.allStatuses") },
      { value: "draft", label: t("statuses.draft") },
      { value: "published", label: t("statuses.published") },
      { value: "closed", label: t("statuses.closed") },
      { value: "cancelled", label: t("statuses.cancelled") },
      { value: "archived", label: t("statuses.archived") },
    ],
    [t],
  );

  const modeOptions = useMemo(
    () => [
      { value: "", label: t("filters.allModes") },
      { value: "homework", label: t("modes.homework") },
      { value: "worksheet", label: t("modes.worksheet") },
      { value: "writing_task", label: t("modes.writingTask") },
      { value: "quiz", label: t("modes.quiz") },
      { value: "reading", label: t("modes.reading") },
      { value: "project", label: t("modes.project") },
    ],
    [t],
  );

  const classroomOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.allClassrooms") },
      ...filterSources.classrooms.map((classroom) => ({
        value: classroom.id,
        label: localizedName(locale, classroom) || classroom.id,
      })),
    ],
    [filterSources.classrooms, locale, t],
  );

  const teacherOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.allTeachers") },
      ...filterSources.teachers.map((teacher) => ({
        value: teacher.id,
        label: teacherName(locale, teacher) || teacher.id,
      })),
    ],
    [filterSources.teachers, locale, t],
  );

  const allocationOptions = useMemo<SelectOption[]>(() => {
    const classroomNames = new Map(
      filterSources.classrooms.map((classroom) => [
        classroom.id,
        localizedName(locale, classroom),
      ]),
    );
    const teacherNames = new Map(
      filterSources.teachers.map((teacher) => [teacher.id, teacherName(locale, teacher)]),
    );
    const subjectNames = new Map(
      filterSources.subjects.map((subject) => [
        subject.id,
        localizedName(locale, subject),
      ]),
    );

    return [
      { value: "", label: t("filters.allTeacherAllocations") },
      ...filterSources.allocations
        .filter((allocation) =>
          filterValues.classroomId
            ? allocation.classroomId === filterValues.classroomId
            : true,
        )
        .filter((allocation) =>
          filterValues.teacherUserId
            ? allocation.teacherId === filterValues.teacherUserId
            : true,
        )
        .map((allocation) => {
          const label = [
            allocation.teacherId ? teacherNames.get(allocation.teacherId) : "",
            subjectNames.get(allocation.subjectId),
            allocation.classroomId
              ? classroomNames.get(allocation.classroomId)
              : "",
          ]
            .filter(Boolean)
            .join(" · ");

          return {
            value: allocation.id,
            label: label || allocation.id,
            searchText: `${label} ${allocation.id}`,
          };
        }),
    ];
  }, [
    filterSources.allocations,
    filterSources.classrooms,
    filterSources.subjects,
    filterSources.teachers,
    locale,
    t,
    filterValues.classroomId,
    filterValues.teacherUserId,
  ]);

  const filters = useMemo<HomeworkAssignmentListFilters>(
    () => buildHomeworkListFilters({ academicYearId, termId, searchParams }),
    [academicYearId, searchParams, termId],
  );

  const openHomeworkTab = useCallback(
    (homeworkId: string, tab: "submissions" | "grade-sync") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(
        `/${locale}/academics/homework/${homeworkId}?${params.toString()}`,
      );
    },
    [locale, router, searchParams],
  );

  const columns = useMemo<Column<HomeworkAssignmentTableRow>[]>(() => {
    const cols: Column<HomeworkAssignmentTableRow>[] = [
      {
        key: "title",
        label: t("table.title"),
        render: (_, item) => (
          <>
            <div className="font-medium text-gray-900">
              {item.title || t("untitled")}
            </div>
            <div className="text-xs text-gray-500">
              {t(`modes.${modeLabelKey(item.mode)}`)}
            </div>
          </>
        ),
      },
      {
        key: "status",
        label: t("table.status"),
        render: (_, item) => (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}
          >
            {t(`statuses.${item.status}`)}
          </span>
        ),
      },
      {
        key: "classroomName",
        label: t("table.context"),
        render: (_, item) => (
          <div className="text-gray-600">
            <div>{item.classroomName || t("allAssignedTargets")}</div>
            <div className="text-xs">
              {item.subjectName || item.teacherName || ""}
            </div>
          </div>
        ),
      },
      {
        key: "dueAt",
        label: t("table.due"),
        render: (_, item) => (
          <div className="text-gray-600">
            {item.dueAt
              ? new Date(item.dueAt).toLocaleString(locale)
              : t("notSet")}
          </div>
        ),
      },
      {
        key: "createdAt",
        label: t("table.createdAt"),
        render: (_, item) => (
          <div className="text-gray-600">
            {item.createdAt
              ? formatDateTime(item.createdAt, locale)
              : t("notSet")}
          </div>
        ),
      },
      {
        key: "content",
        label: t("table.content"),
        sortable: false,
        render: (_, item) => (
          <div className="text-gray-600">
            {t("contentSummary", {
              questions: item.questionCount,
              attachments: item.attachmentCount,
            })}
          </div>
        ),
      },
    ];

    if (
      canViewSubmissions ||
      canViewGradeSync ||
      (canManage && termStatus !== "closed")
    ) {
      cols.push({
        key: "actions",
        label: t("actions.menu"),
        sortable: false,
        render: (_, item) => (
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {canViewSubmissions && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                title={t("actions.openSubmissions")}
                onClick={() => openHomeworkTab(item.id, "submissions")}
                leftIcon={<ClipboardCheck className="h-4 w-4" />}
              >
                {t("actions.submissions")}
              </Button>
            )}
            {canViewGradeSync && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                title={t("actions.openGradeSync")}
                onClick={() => openHomeworkTab(item.id, "grade-sync")}
                leftIcon={<GraduationCap className="h-4 w-4" />}
              >
                {t("actions.gradeSync")}
              </Button>
            )}
            {canManage && termStatus !== "closed" && (
              <HomeworkLifecycleMenu
                actions={homeworkLifecycle(item.status).actions}
                labels={{
                  menu: t("actions.menu"),
                  publish: t("actions.publish"),
                  close: t("actions.close"),
                  cancel: t("actions.cancel"),
                }}
                isPending={pendingHomeworkId === item.id}
                onAction={(action) =>
                  setLifecycleConfirmation({
                    homeworkId: item.id,
                    action,
                  })
                }
              />
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [
    canManage,
    canViewGradeSync,
    canViewSubmissions,
    termStatus,
    t,
    locale,
    pendingHomeworkId,
    openHomeworkTab,
  ]);

  useEffect(() => {
    if (isInitializing || !canView) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await listHomeworkAssignments(filters);
        setItems(response.items);
        setMeta(response.meta);
      } catch (error) {
        showError(t("errors.loadFailed", { message: getHomeworkErrorMessage(error, tHomeworkError) }));
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [canView, filters, isInitializing, showError, t, tHomeworkError]);

  useEffect(() => {
    if (!canView || !academicYearId || !termId || isInitializing) {
      void Promise.resolve().then(() => {
        setFilterSources(emptyHomeworkFilterSources);
      });
      return;
    }

    let isActive = true;
    const loadFilterSources = async () => {
      setIsLoadingFilterSources(true);
      try {
        const [structure, teachers, subjects, allocations] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchTeachers(),
          fetchSubjects(),
          fetchTeacherAllocations(termId),
        ]);
        if (!isActive) return;
        setFilterSources({
          classrooms: structure.classrooms,
          teachers,
          subjects,
          allocations,
        });
      } catch (error) {
        if (isActive) {
          showError(
            t("errors.filtersLoadFailed", {
              message: getHomeworkErrorMessage(error, tHomeworkError),
            }),
          );
        }
      } finally {
        if (isActive) setIsLoadingFilterSources(false);
      }
    };

    void loadFilterSources();
    return () => {
      isActive = false;
    };
  }, [academicYearId, canView, isInitializing, showError, t, tHomeworkError, termId]);

  const updateFilters = useCallback((updates: Partial<HomeworkListFilterValues>) => {
    const nextFilters = { ...filterValues, ...updates };
    setFilterValues(nextFilters);

    if ("search" in updates) return;

    const params = updateHomeworkListFilterParams(
      new URLSearchParams(searchParams.toString()),
      { ...nextFilters, search: debouncedSearch },
    );
    if (params.toString() !== searchParams.toString()) {
      router.replace(`/${locale}/academics/homework?${params.toString()}`);
    }
  }, [debouncedSearch, filterValues, locale, router, searchParams]);

  useEffect(() => {
    if (filterValues.search !== debouncedSearch) return;

    const params = updateHomeworkListFilterParams(
      new URLSearchParams(searchParams.toString()),
      { ...filterValues, search: debouncedSearch },
    );
    if (params.toString() !== searchParams.toString()) {
      router.replace(`/${locale}/academics/homework?${params.toString()}`);
    }
  }, [debouncedSearch, filterValues, locale, router, searchParams]);

  const resetFilters = useCallback(() => {
    setFilterValues(emptyHomeworkFilterValues);
    const params = resetHomeworkListFilterParams(
      new URLSearchParams(searchParams.toString()),
    );
    if (params.toString() !== searchParams.toString()) {
      router.replace(`/${locale}/academics/homework?${params.toString()}`);
    }
  }, [locale, router, searchParams]);

  const hasActiveFilters = Object.values(filterValues).some(Boolean);

  const runLifecycleAction = async () => {
    if (!lifecycleConfirmation) return;
    const { homeworkId, action } = lifecycleConfirmation;
    setPendingHomeworkId(homeworkId);
    try {
      const updated =
        action === "publish"
          ? await publishHomeworkAssignment(homeworkId)
          : action === "close"
            ? await closeHomeworkAssignment(homeworkId)
            : await cancelHomeworkAssignment(homeworkId);
      setItems((current) =>
        current.map((homework) =>
          homework.id === homeworkId ? updated : homework,
        ),
      );
    } catch (error) {
      showError(
        t("errors.lifecycleFailed", { message: getHomeworkErrorMessage(error, tHomeworkError) }),
      );
    } finally {
      setPendingHomeworkId(null);
      setLifecycleConfirmation(null);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="border-b border-border bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">
                {t("title")}
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">{t("description")}</p>
          </div>
          {canManage && (
            <Button
            onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("tab");
                router.push(
                  `/${locale}/academics/homework/new${params.toString() ? `?${params.toString()}` : ""}`,
                );
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {t("actions.newHomework")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <Input
              value={filterValues.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder={t("filters.searchPlaceholder")}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={filterValues.status}
              onChange={(status) => updateFilters({ status })}
              options={statusOptions}
            />
            <Select
              value={filterValues.mode}
              onChange={(mode) => updateFilters({ mode })}
              options={modeOptions}
            />
            <Button
              variant="secondary"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
              leftIcon={<RefreshCcw className="h-4 w-4" />}
            >
              {t("actions.reset")}
            </Button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select
              label={t("filters.classroom")}
              value={filterValues.classroomId}
              onChange={(classroomId) =>
                updateFilters({ classroomId, teacherSubjectAllocationId: "" })
              }
              options={classroomOptions}
              disabled={isLoadingFilterSources}
              searchable
            />
            <Select
              label={t("filters.teacher")}
              value={filterValues.teacherUserId}
              onChange={(teacherUserId) =>
                updateFilters({ teacherUserId, teacherSubjectAllocationId: "" })
              }
              options={teacherOptions}
              disabled={isLoadingFilterSources}
              searchable
            />
            <Select
              label={t("filters.teacherAllocation")}
              value={filterValues.teacherSubjectAllocationId}
              onChange={(teacherSubjectAllocationId) =>
                updateFilters({ teacherSubjectAllocationId })
              }
              options={allocationOptions}
              disabled={isLoadingFilterSources}
              searchable
            />
            <DatePicker
              label={t("filters.dueFrom")}
              value={getFilterDate(filterValues.dueFrom)}
              onChange={(date) =>
                updateFilters({ dueFrom: date ? formatFilterDate(date) : "" })
              }
              maxDate={getFilterDate(filterValues.dueTo) ?? undefined}
            />
            <DatePicker
              label={t("filters.dueTo")}
              value={getFilterDate(filterValues.dueTo)}
              onChange={(date) =>
                updateFilters({ dueTo: date ? formatFilterDate(date) : "" })
              }
              minDate={getFilterDate(filterValues.dueFrom) ?? undefined}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tableRows}
          isLoading={isLoading}
          emptyTitle={t("empty")}
          onRowClick={(item) => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("tab");
            router.push(
              `/${locale}/academics/homework/${item.id}${params.toString() ? `?${params.toString()}` : ""}`,
            );
          }}
          serverPagination={{
            enabled: true,
            currentPage: meta.page,
            pageSize: meta.limit,
            totalItems: meta.total,
            onPageChange: (page) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", page.toString());
              router.push(`/${locale}/academics/homework?${params.toString()}`);
            },
            onPageSizeChange: (pageSize) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("limit", pageSize.toString());
              params.delete("page");
              router.push(`/${locale}/academics/homework?${params.toString()}`);
            },
          }}
        />
      </div>
      <ConfirmDialog
        isOpen={!!lifecycleConfirmation}
        onClose={() => setLifecycleConfirmation(null)}
        onConfirm={() => void runLifecycleAction()}
        title={t("confirm.title")}
        description={t("confirm.description", {
          action: lifecycleConfirmation
            ? t(`actions.${lifecycleConfirmation.action}`)
            : "",
        })}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.back")}
        loading={!!pendingHomeworkId}
        severity={
          lifecycleConfirmation?.action === "cancel" ? "danger" : "warning"
        }
      />
    </div>
  );
}
