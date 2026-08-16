"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Plus, UserCheck, Users, UserX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import TextArea from "@/components/ui/input/TextArea";
import MainLoader from "@/components/ui/loaders/MainLoader";
import Modal from "@/components/ui/modal/Modal";
import { useToast } from "@/components/ui/toast/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { getNedaaApiErrorMessage } from "@/features/nedaa/utils/nedaaApiErrors";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import type { RoleDefinition } from "@/features/settings/types";
import PaginatedUserSelect from "@/features/settings/users/components/PaginatedUserSelect";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import { useNedaaAcademicStructure } from "@/features/nedaa/hooks/useNedaaAcademicStructure";
import {
  createDismissalStaffAssignment,
  deleteDismissalStaffAssignment,
  listDismissalGates,
  listDismissalStaffAssignments,
  updateDismissalStaffAssignment,
} from "@/features/nedaa/services/dismissalApiService";
import type {
  CreateDismissalStaffAssignmentPayload,
  DismissalStaffAssignment,
  DismissalStaffAssignmentsSummary,
  NedaaGate,
  UpdateDismissalStaffAssignmentPayload,
} from "@/features/nedaa/types/nedaa";
import {
  buildDismissalStaffAssignmentsListParams,
  type NedaaBooleanFilterValue,
} from "@/features/nedaa/utils/nedaaFilters";
import {
  getNedaaAcademicOptions,
  reconcileNedaaAcademicSelection,
  type NedaaAcademicSelection,
} from "@/features/nedaa/utils/nedaaAcademicOptions";

type StaffAssignmentFormState = {
  staffUserId: string;
  gateId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  startsAt: string;
  endsAt: string;
  notes: string;
  isLead: boolean;
  isActive: boolean;
};

interface StaffAssignmentTableRow extends Record<string, unknown> {
  staff: string;
  gate: string;
  scope: string;
  lead: string;
  active: string;
  assignment: DismissalStaffAssignment;
}

const STAFF_ASSIGNMENTS_PAGE_SIZE = 10;
const DISMISSAL_STAFF_ROLE_NAME = "Dismissal Staff";
const DISMISSAL_STAFF_ROLE_KEY = "dismissal_staff";

const emptyFormState: StaffAssignmentFormState = {
  staffUserId: "",
  gateId: "",
  stageId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
  startsAt: "",
  endsAt: "",
  notes: "",
  isLead: false,
  isActive: true,
};

const emptyAssignmentSummary: DismissalStaffAssignmentsSummary = {
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  leadCount: 0,
};

function toNullableId(value: string) {
  return value.trim() || null;
}

function toNullableDateTime(value: string) {
  return value.trim() ? new Date(value).toISOString() : null;
}

function createAssignmentPayload(
  form: StaffAssignmentFormState,
): CreateDismissalStaffAssignmentPayload {
  return {
    staffUserId: form.staffUserId.trim(),
    gateId: toNullableId(form.gateId),
    stageId: toNullableId(form.stageId),
    gradeId: toNullableId(form.gradeId),
    sectionId: toNullableId(form.sectionId),
    classroomId: toNullableId(form.classroomId),
    startsAt: toNullableDateTime(form.startsAt),
    endsAt: toNullableDateTime(form.endsAt),
    notes: form.notes.trim() || null,
    isLead: form.isLead,
    isActive: form.isActive,
  };
}

function updateAssignmentPayload(
  form: StaffAssignmentFormState,
): UpdateDismissalStaffAssignmentPayload {
  const editablePayload: UpdateDismissalStaffAssignmentPayload = {
    ...createAssignmentPayload(form),
  };
  delete editablePayload.staffUserId;
  return editablePayload;
}

function getAssignmentScopeLabel(assignment: DismissalStaffAssignment) {
  return (
    assignment.academicScope.classroom?.name ||
    assignment.academicScope.section?.name ||
    assignment.academicScope.grade?.name ||
    assignment.academicScope.stage?.name ||
    "-"
  );
}

function prependSelectedOption(
  options: SelectOption[],
  selectedId: string,
  selectedLabel?: string,
) {
  if (!selectedId || options.some((option) => option.value === selectedId)) {
    return options;
  }

  return [
    {
      value: selectedId,
      label: selectedLabel || selectedId,
      searchText: selectedId,
    },
    ...options,
  ];
}

function isDismissalStaffRole(role: RoleDefinition) {
  return (
    role.name.trim().toLowerCase() ===
      DISMISSAL_STAFF_ROLE_NAME.toLowerCase() ||
    role.key === DISMISSAL_STAFF_ROLE_KEY
  );
}

export default function NedaaStaffAssignmentsPage() {
  const t = useTranslations("nedaa");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("dismissal.staff.view");
  const canManage = hasPermission("dismissal.staff.manage");
  const {
    tree: academicTree,
    isLoading: isAcademicTreeLoading,
    error: academicTreeError,
    retry: retryAcademicTree,
  } = useNedaaAcademicStructure();
  const [assignments, setAssignments] = useState<DismissalStaffAssignment[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingAssignment, setEditingAssignment] =
    useState<DismissalStaffAssignment | null>(null);
  const [form, setForm] = useState<StaffAssignmentFormState>(emptyFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAssignment, setDeletingAssignment] =
    useState<DismissalStaffAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [gateOptionsSource, setGateOptionsSource] = useState<NedaaGate[]>([]);
  const [staffRoleId, setStaffRoleId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [staffUserIdFilter, setStaffUserIdFilter] = useState("");
  const [gateIdFilter, setGateIdFilter] = useState("");
  const [stageIdFilter, setStageIdFilter] = useState("");
  const [gradeIdFilter, setGradeIdFilter] = useState("");
  const [sectionIdFilter, setSectionIdFilter] = useState("");
  const [classroomIdFilter, setClassroomIdFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<NedaaBooleanFilterValue>("");
  const [leadFilter, setLeadFilter] = useState<NedaaBooleanFilterValue>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(STAFF_ASSIGNMENTS_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [assignmentSummary, setAssignmentSummary] =
    useState<DismissalStaffAssignmentsSummary>(emptyAssignmentSummary);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounce(searchInput, 350);
  const hasActiveFilters = Boolean(
    searchInput.trim() ||
    staffUserIdFilter ||
    gateIdFilter ||
    stageIdFilter ||
    gradeIdFilter ||
    sectionIdFilter ||
    classroomIdFilter ||
    activeFilter ||
    leadFilter,
  );

  useEffect(() => {
    let cancelled = false;

    if (!canView) {
      return () => {
        cancelled = true;
      };
    }

    void Promise.allSettled([
      listDismissalGates({ page: 1, limit: 100 }),
      fetchSettingsRoles({ page: 1, limit: 100 }),
    ]).then(async ([gatesResult, rolesResult]) => {
      if (cancelled) return;

      if (gatesResult.status === "fulfilled") {
        setGateOptionsSource(gatesResult.value.data);
      }

      if (rolesResult.status !== "fulfilled") {
        setStaffRoleId("");
        return;
      }

      const dismissalStaffRole =
        rolesResult.value.items.find(isDismissalStaffRole);
      if (!dismissalStaffRole) {
        setStaffRoleId("");
        return;
      }
      setStaffRoleId(dismissalStaffRole.id);
    });

    return () => {
      cancelled = true;
    };
  }, [canView]);

  useEffect(() => {
    let cancelled = false;

    if (!canView) {
      void Promise.resolve().then(() => setIsLoading(false));
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await listDismissalStaffAssignments(
          buildDismissalStaffAssignmentsListParams({
            q: debouncedSearch,
            staffUserId: staffUserIdFilter,
            gateId: gateIdFilter,
            stageId: stageIdFilter,
            gradeId: gradeIdFilter,
            sectionId: sectionIdFilter,
            classroomId: classroomIdFilter,
            active: activeFilter,
            lead: leadFilter,
            page,
            limit: pageSize,
          }),
        );
        if (!cancelled) {
          setAssignments(response.data);
          setTotalItems(response.summary.totalCount);
          setAssignmentSummary(response.summary);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_staff_assignments_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeFilter,
    canView,
    classroomIdFilter,
    debouncedSearch,
    gateIdFilter,
    gradeIdFilter,
    leadFilter,
    page,
    pageSize,
    refreshKey,
    sectionIdFilter,
    staffUserIdFilter,
    stageIdFilter,
    t,
  ]);

  const openEditForm = useCallback((assignment: DismissalStaffAssignment) => {
    setFormMode("edit");
    setEditingAssignment(assignment);
    setForm({
      staffUserId: "",
      gateId: assignment.gate?.id || "",
      stageId: assignment.academicScope.stage?.id || "",
      gradeId: assignment.academicScope.grade?.id || "",
      sectionId: assignment.academicScope.section?.id || "",
      classroomId: assignment.academicScope.classroom?.id || "",
      startsAt: assignment.startsAt ? assignment.startsAt.slice(0, 16) : "",
      endsAt: assignment.endsAt ? assignment.endsAt.slice(0, 16) : "",
      notes: assignment.notes || "",
      isLead: assignment.isLead,
      isActive: assignment.isActive,
    });
    setIsFormOpen(true);
  }, []);

  const assignmentRows = useMemo<StaffAssignmentTableRow[]>(
    () =>
      assignments.map((assignment) => ({
        staff: assignment.staff.displayName,
        gate: assignment.gate
          ? `${assignment.gate.name} (${assignment.gate.code})`
          : "-",
        scope: getAssignmentScopeLabel(assignment),
        lead: assignment.isLead ? t("table.yes") : t("table.no"),
        active: assignment.isActive ? t("table.yes") : t("table.no"),
        assignment,
      })),
    [assignments, t],
  );

  const assignmentColumns = useMemo<Column<StaffAssignmentTableRow>[]>(
    () => [
      {
        key: "staff",
        label: t("table.staff"),
        searchable: true,
        render: (_value, row) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.assignment.staff.displayName}
            </p>
            <p className="text-xs text-gray-500">
              {row.assignment.staff.email || "-"}
            </p>
          </div>
        ),
      },
      { key: "gate", label: t("table.gate"), searchable: true },
      { key: "scope", label: t("table.scope"), searchable: true },
      { key: "lead", label: t("table.lead") },
      { key: "active", label: t("table.active") },
      {
        key: "actions",
        label: t("table.actions"),
        sortable: false,
        render: (_value, row) => (
          <div className="flex justify-start gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!canManage}
              onClick={() => openEditForm(row.assignment)}
            >
              {tCommon("edit")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!canManage}
              onClick={() => setDeletingAssignment(row.assignment)}
            >
              {tCommon("delete")}
            </Button>
          </div>
        ),
      },
    ],
    [canManage, openEditForm, t, tCommon],
  );
  const gateOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.all_gates") },
      ...gateOptionsSource.map((gate) => ({
        value: gate.id,
        label: `${gate.name} (${gate.code})`,
        searchText: `${gate.id} ${gate.code} ${gate.campus || ""}`,
      })),
    ],
    [gateOptionsSource, t],
  );
  const filterAcademicSelection = useMemo<NedaaAcademicSelection>(
    () => ({
      stageId: stageIdFilter,
      gradeId: gradeIdFilter,
      sectionId: sectionIdFilter,
      classroomId: classroomIdFilter,
    }),
    [classroomIdFilter, gradeIdFilter, sectionIdFilter, stageIdFilter],
  );
  const formAcademicSelection = useMemo<NedaaAcademicSelection>(
    () => ({
      stageId: form.stageId,
      gradeId: form.gradeId,
      sectionId: form.sectionId,
      classroomId: form.classroomId,
    }),
    [form.classroomId, form.gradeId, form.sectionId, form.stageId],
  );
  const filterAcademicOptions = useMemo(
    () =>
      academicTree
        ? getNedaaAcademicOptions(academicTree, filterAcademicSelection, locale)
        : { stages: [], grades: [], sections: [], classrooms: [] },
    [academicTree, filterAcademicSelection, locale],
  );
  const formAcademicOptions = useMemo(
    () =>
      academicTree
        ? getNedaaAcademicOptions(academicTree, formAcademicSelection, locale)
        : { stages: [], grades: [], sections: [], classrooms: [] },
    [academicTree, formAcademicSelection, locale],
  );
  const stageOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: tCommon("all") },
      ...filterAcademicOptions.stages,
    ],
    [filterAcademicOptions.stages, tCommon],
  );
  const gradeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: tCommon("all") },
      ...filterAcademicOptions.grades,
    ],
    [filterAcademicOptions.grades, tCommon],
  );
  const sectionOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: tCommon("all") },
      ...filterAcademicOptions.sections,
    ],
    [filterAcademicOptions.sections, tCommon],
  );
  const classroomOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: tCommon("all") },
      ...filterAcademicOptions.classrooms,
    ],
    [filterAcademicOptions.classrooms, tCommon],
  );
  const formStageOptions = useMemo<SelectOption[]>(
    () =>
      prependSelectedOption(
        [{ value: "", label: tCommon("all") }, ...formAcademicOptions.stages],
        form.stageId,
        editingAssignment?.academicScope.stage?.name,
      ),
    [
      editingAssignment?.academicScope.stage?.name,
      form.stageId,
      formAcademicOptions.stages,
      tCommon,
    ],
  );
  const formGradeOptions = useMemo<SelectOption[]>(
    () =>
      prependSelectedOption(
        [{ value: "", label: tCommon("all") }, ...formAcademicOptions.grades],
        form.gradeId,
        editingAssignment?.academicScope.grade?.name,
      ),
    [
      editingAssignment?.academicScope.grade?.name,
      form.gradeId,
      formAcademicOptions.grades,
      tCommon,
    ],
  );
  const formSectionOptions = useMemo<SelectOption[]>(
    () =>
      prependSelectedOption(
        [{ value: "", label: tCommon("all") }, ...formAcademicOptions.sections],
        form.sectionId,
        editingAssignment?.academicScope.section?.name,
      ),
    [
      editingAssignment?.academicScope.section?.name,
      form.sectionId,
      formAcademicOptions.sections,
      tCommon,
    ],
  );
  const formClassroomOptions = useMemo<SelectOption[]>(
    () =>
      prependSelectedOption(
        [
          { value: "", label: tCommon("all") },
          ...formAcademicOptions.classrooms,
        ],
        form.classroomId,
        editingAssignment?.academicScope.classroom?.name,
      ),
    [
      editingAssignment?.academicScope.classroom?.name,
      form.classroomId,
      formAcademicOptions.classrooms,
      tCommon,
    ],
  );
  const activeOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.all_active_states") },
      { value: "true", label: t("filters.active_only") },
      { value: "false", label: t("filters.inactive_only") },
    ],
    [t],
  );
  const leadOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: t("filters.all_lead_states") },
      { value: "true", label: t("filters.lead_only") },
      { value: "false", label: t("filters.non_lead_only") },
    ],
    [t],
  );

  const resetFilters = () => {
    setSearchInput("");
    setStaffUserIdFilter("");
    setGateIdFilter("");
    setStageIdFilter("");
    setGradeIdFilter("");
    setSectionIdFilter("");
    setClassroomIdFilter("");
    setActiveFilter("");
    setLeadFilter("");
    setPage(1);
  };

  const updateAcademicFilters = (updates: Partial<NedaaAcademicSelection>) => {
    const nextSelection = { ...filterAcademicSelection, ...updates };
    const reconciled = academicTree
      ? reconcileNedaaAcademicSelection(academicTree, nextSelection)
      : nextSelection;
    setStageIdFilter(reconciled.stageId);
    setGradeIdFilter(reconciled.gradeId);
    setSectionIdFilter(reconciled.sectionId);
    setClassroomIdFilter(reconciled.classroomId);
    setPage(1);
  };

  const updateFormAcademicSelection = (
    updates: Partial<NedaaAcademicSelection>,
  ) => {
    const nextSelection = { ...formAcademicSelection, ...updates };
    const reconciled = academicTree
      ? reconcileNedaaAcademicSelection(academicTree, nextSelection)
      : nextSelection;
    setForm((current) => ({ ...current, ...reconciled }));
  };

  const academicSelectsDisabled = isAcademicTreeLoading || !academicTree;

  const confirmDeleteAssignment = async () => {
    if (!canManage || !deletingAssignment) return;

    setIsDeleting(true);
    try {
      await deleteDismissalStaffAssignment(deletingAssignment.id);
      setRefreshKey((current) => current + 1);
      showSuccess(t("messages.staff_assignment_deleted"));
      setDeletingAssignment(null);
    } catch {
      showError(t("messages.staff_assignment_delete_failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  function openCreateForm() {
    setFormMode("create");
    setEditingAssignment(null);
    setForm(emptyFormState);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingAssignment(null);
    setForm(emptyFormState);
  }

  const saveAssignment = async () => {
    if (!canManage) return;
    if (formMode === "create" && !form.staffUserId.trim()) {
      showError(t("staff_assignments.staff_user_required"));
      return;
    }

    setIsSaving(true);
    try {
      if (formMode === "edit" && editingAssignment) {
        await updateDismissalStaffAssignment(
          editingAssignment.id,
          updateAssignmentPayload(form),
        );
      } else {
        await createDismissalStaffAssignment(createAssignmentPayload(form));
      }
      setRefreshKey((current) => current + 1);
      showSuccess(
        formMode === "edit"
          ? t("messages.staff_assignment_updated")
          : t("messages.staff_assignment_created"),
      );
      closeForm();
    } catch (error) {
      showError(
        getNedaaApiErrorMessage(
          error,
          t,
          "messages.staff_assignment_save_failed",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!canView) return <NedaaAccessNotice />;
  if (!hasLoaded && isLoading) return <MainLoader />;
  if (loadError) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("staff_assignments.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("staff_assignments.subtitle")}
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={!canManage}
          onClick={openCreateForm}
        >
          {t("staff_assignments.add_assignment")}
        </Button>
      </div>

      {academicTreeError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t("messages.load_academic_structure_failed")}</span>
            <Button variant="outline" size="sm" onClick={retryAcademicTree}>
              {t("actions.retry_academic_structure")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: "total",
            value: assignmentSummary.totalCount,
            icon: Users,
            iconColor: "#2563eb",
            iconBgColor: "#dbeafe",
          },
          {
            key: "active",
            value: assignmentSummary.activeCount,
            icon: UserCheck,
            iconColor: "#059669",
            iconBgColor: "#d1fae5",
          },
          {
            key: "inactive",
            value: assignmentSummary.inactiveCount,
            icon: UserX,
            iconColor: "#dc2626",
            iconBgColor: "#fee2e2",
          },
          {
            key: "lead",
            value: assignmentSummary.leadCount,
            icon: Crown,
            iconColor: "#d97706",
            iconBgColor: "#fef3c7",
          },
        ].map((entry) => (
          <KPICardV2
            key={entry.key}
            title={t(`staff_assignments.summary.${entry.key}`)}
            value={entry.value}
            icon={entry.icon}
            iconColor={entry.iconColor}
            iconBgColor={entry.iconBgColor}
            showChart={false}
            className="bg-white"
          />
        ))}
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((current) => !current)}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters.show_filters")}
        toggleAriaLabel={t("filters.show_filters")}
        searchSlot={
          <Input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder={t("filters.search_staff_assignments_placeholder")}
          />
        }
        filtersSlot={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <PaginatedUserSelect
              label={t("filters.staff_user")}
              value={staffUserIdFilter}
              onChange={(value) => {
                setStaffUserIdFilter(value);
                setPage(1);
              }}
              roleId={staffRoleId}
              status="active"
              placeholder={tCommon("all")}
              disabled={!staffRoleId}
            />
            <Select
              label={t("table.gate")}
              value={gateIdFilter}
              onChange={(value) => {
                setGateIdFilter(value);
                setPage(1);
              }}
              options={gateOptions}
              searchable
              searchPlaceholder={t("table.gate")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
            <Select
              label={t("filters.stage")}
              value={stageIdFilter}
              onChange={(value) => updateAcademicFilters({ stageId: value })}
              options={stageOptions}
              disabled={academicSelectsDisabled}
              searchable
              searchPlaceholder={t("filters.stage")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
            <Select
              label={t("filters.grade")}
              value={gradeIdFilter}
              onChange={(value) => updateAcademicFilters({ gradeId: value })}
              options={gradeOptions}
              disabled={academicSelectsDisabled}
              searchable
              searchPlaceholder={t("filters.grade")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
            <Select
              label={t("filters.section")}
              value={sectionIdFilter}
              onChange={(value) => updateAcademicFilters({ sectionId: value })}
              options={sectionOptions}
              disabled={academicSelectsDisabled}
              searchable
              searchPlaceholder={t("filters.section")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
            <Select
              label={t("filters.classroom")}
              value={classroomIdFilter}
              onChange={(value) =>
                updateAcademicFilters({ classroomId: value })
              }
              options={classroomOptions}
              disabled={academicSelectsDisabled}
              searchable
              searchPlaceholder={t("filters.classroom")}
              noOptionsText={t("filters.no_options")}
              noResultsText={t("filters.no_results")}
            />
            <Select
              label={t("filters.active_state")}
              value={activeFilter}
              onChange={(value) => {
                setActiveFilter(value as NedaaBooleanFilterValue);
                setPage(1);
              }}
              options={activeOptions}
            />
            <Select
              label={t("filters.lead_state")}
              value={leadFilter}
              onChange={(value) => {
                setLeadFilter(value as NedaaBooleanFilterValue);
                setPage(1);
              }}
              options={leadOptions}
            />
          </div>
        }
        clearAction={
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("filters.clear_filters")}
          </Button>
        }
      />

      <DataTable
        columns={assignmentColumns}
        data={assignmentRows}
        itemsPerPage={pageSize}
        isLoading={isLoading}
        serverPagination={{
          enabled: true,
          currentPage: page,
          pageSize,
          totalItems,
          onPageChange: setPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          },
        }}
        emptyTitle={t("staff_assignments.empty_title")}
        emptyDescription={t("staff_assignments.empty_description")}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          formMode === "edit"
            ? t("staff_assignments.edit_title")
            : t("staff_assignments.create_title")
        }
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => void saveAssignment()}
              loading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? tCommon("saving") : tCommon("save")}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
          <PaginatedUserSelect
            label={t("staff_assignments.staff_user_id")}
            value={form.staffUserId}
            disabled={formMode === "edit" || !staffRoleId}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                staffUserId: value,
              }))
            }
            roleId={staffRoleId}
            status="active"
            placeholder={
              formMode === "edit"
                ? t("staff_assignments.staff_user_unchanged")
                : t("staff_assignments.staff_user_required")
            }
          />
          <Select
            label={t("staff_assignments.gate_id")}
            value={form.gateId}
            onChange={(value) =>
              setForm((current) => ({ ...current, gateId: value }))
            }
            options={gateOptions}
            searchable
            searchPlaceholder={t("table.gate")}
            noOptionsText={t("filters.no_options")}
            noResultsText={t("filters.no_results")}
          />
          <Select
            label={t("staff_assignments.stage_id")}
            value={form.stageId}
            onChange={(value) =>
              updateFormAcademicSelection({ stageId: value })
            }
            options={formStageOptions}
            disabled={academicSelectsDisabled}
            searchable
            searchPlaceholder={t("filters.stage")}
            noOptionsText={t("filters.no_options")}
            noResultsText={t("filters.no_results")}
          />
          <Select
            label={t("staff_assignments.grade_id")}
            value={form.gradeId}
            onChange={(value) =>
              updateFormAcademicSelection({ gradeId: value })
            }
            options={formGradeOptions}
            disabled={academicSelectsDisabled}
            searchable
            searchPlaceholder={t("filters.grade")}
            noOptionsText={t("filters.no_options")}
            noResultsText={t("filters.no_results")}
          />
          <Select
            label={t("staff_assignments.section_id")}
            value={form.sectionId}
            onChange={(value) =>
              updateFormAcademicSelection({ sectionId: value })
            }
            options={formSectionOptions}
            disabled={academicSelectsDisabled}
            searchable
            searchPlaceholder={t("filters.section")}
            noOptionsText={t("filters.no_options")}
            noResultsText={t("filters.no_results")}
          />
          <Select
            label={t("staff_assignments.classroom_id")}
            value={form.classroomId}
            onChange={(value) =>
              updateFormAcademicSelection({ classroomId: value })
            }
            options={formClassroomOptions}
            disabled={academicSelectsDisabled}
            searchable
            searchPlaceholder={t("filters.classroom")}
            noOptionsText={t("filters.no_options")}
            noResultsText={t("filters.no_results")}
          />
          <Input
            type="datetime-local"
            label={t("staff_assignments.starts_at")}
            value={form.startsAt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startsAt: event.target.value,
              }))
            }
          />
          <Input
            type="datetime-local"
            label={t("staff_assignments.ends_at")}
            value={form.endsAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, endsAt: event.target.value }))
            }
          />
          <div className="md:col-span-2">
            <TextArea
              label={t("settings.notes")}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.isLead}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isLead: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("staff_assignments.lead_assignment")}
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            {t("table.active")}
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingAssignment)}
        onClose={() => {
          if (!isDeleting) {
            setDeletingAssignment(null);
          }
        }}
        onConfirm={() => void confirmDeleteAssignment()}
        title={t("staff_assignments.delete_title")}
        description={t("staff_assignments.delete_description", {
          staffName: deletingAssignment?.staff.displayName || "",
        })}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        loading={isDeleting}
        severity="danger"
      />
    </div>
  );
}
