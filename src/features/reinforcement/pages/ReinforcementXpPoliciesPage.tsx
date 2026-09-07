"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Filter, Plus, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import Select, { type SelectOption } from "@/components/ui/input/Select";
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
import XpPolicyForm from "../components/XpPolicyForm";
import XpPolicyTable from "../components/XpPolicyTable";
import { useReinforcementUrlFilters } from "../hooks/useReinforcementUrlFilters";
import {
  createXpPolicy,
  getEffectiveXpPolicy,
  listXpPolicies,
  patchXpPolicy,
} from "../services/reinforcementXpService";
import { getReinforcementFilterOptions } from "../services/reinforcementFilterOptionsService";
import { describeXpPolicyApiError } from "../utils/xpPolicyApiErrors";
import type {
  CreateXpPolicyPayload,
  ReinforcementFilterOptions,
  XpPolicy,
  XpPolicyScopeType,
} from "../types";

interface EffectiveStudentOption extends SelectOption {
  enrollmentId?: string;
}

const SCOPE_FILTER_LEVELS = {
  stage: ["stage"],
  grade: ["stage", "grade"],
  section: ["stage", "grade", "section"],
  classroom: ["stage", "grade", "section", "classroom"],
  student: ["stage", "grade", "section", "classroom", "student"],
} satisfies Record<Exclude<XpPolicyScopeType, "school">, string[]>;

const stringFrom = (
  record: unknown,
  keys: string[],
): string | undefined => {
  if (!record || typeof record !== "object") return undefined;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
};

const enrollmentIdFrom = (record: unknown): string | undefined => {
  if (!record || typeof record !== "object") return undefined;
  const source = record as Record<string, unknown>;
  return (
    stringFrom(source, ["enrollmentId"]) ||
    stringFrom(source.enrollment, ["id", "enrollmentId"])
  );
};

const studentIdFrom = (record: unknown): string | undefined =>
  stringFrom(record, ["value", "studentId", "id", "student_id"]);

const studentNameFrom = (record: unknown, locale: string): string => {
  const primaryKeys =
    locale === "ar"
      ? ["nameAr", "full_name_ar", "fullNameAr", "name", "nameEn"]
      : ["nameEn", "full_name_en", "fullNameEn", "name", "nameAr"];
  return (
    stringFrom(record, primaryKeys) ||
    stringFrom(record, ["code", "admissionNo", "student_id", "value", "id"]) ||
    ""
  );
};

const buildEffectiveStudentOptions = (
  options: ReinforcementFilterOptions,
  locale: string,
): EffectiveStudentOption[] => {
  const source =
    options.scopeTargets?.student?.length
      ? options.scopeTargets.student
      : Array.isArray(options.students)
        ? options.students
        : [];
  const seen = new Set<string>();
  return source.reduce<EffectiveStudentOption[]>((items, item) => {
    const value = studentIdFrom(item);
    if (!value || seen.has(value)) return items;
    seen.add(value);
    const label = studentNameFrom(item, locale) || value;
    items.push({
      value,
      label,
      enrollmentId: enrollmentIdFrom(item),
      searchText: `${label} ${stringFrom(item, ["student_id", "code", "admissionNo"]) || ""}`,
    });
    return items;
  }, []);
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

export default function ReinforcementXpPoliciesPage() {
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
    paramKeys: ["stageId", "gradeId", "sectionId", "classroomId", "studentId", "enrollmentId"],
    defaults: {},
  });

  // Academic year and term come from the shared layout context.
  const context: ReinforcementAcademicContextValue = useMemo(
    () => ({
      academicYearId,
      termId,
      stageId: values.stageId || undefined,
      gradeId: values.gradeId || undefined,
      sectionId: values.sectionId || undefined,
      classroomId: values.classroomId || undefined,
      studentId: values.studentId || undefined,
      enrollmentId: values.enrollmentId || undefined,
    }),
    [academicYearId, termId, values.stageId, values.gradeId, values.sectionId, values.classroomId, values.studentId, values.enrollmentId],
  );

  const [scopeType, setScopeType] = useState<XpPolicyScopeType | "">("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [policies, setPolicies] = useState<XpPolicy[]>([]);
  const [policyTargetOptions, setPolicyTargetOptions] = useState<
    ReinforcementFilterOptions["scopeTargets"]
  >({});
  const [policyTargetOptionsError, setPolicyTargetOptionsError] = useState(false);
  const [effectivePolicy, setEffectivePolicy] = useState<XpPolicy | null>(null);
  const [effectivePolicyStudentLabel, setEffectivePolicyStudentLabel] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<XpPolicy | null>(null);
  const [isEffectiveStudentPickerOpen, setIsEffectiveStudentPickerOpen] =
    useState(false);
  const [effectiveStudentOptions, setEffectiveStudentOptions] = useState<
    EffectiveStudentOption[]
  >([]);
  const [effectiveStudentId, setEffectiveStudentId] = useState("");
  const [effectiveStudentsLoading, setEffectiveStudentsLoading] =
    useState(false);
  const [effectiveStudentsError, setEffectiveStudentsError] = useState<
    string | null
  >(null);

  const canView = hasPermission("reinforcement.xp.view");
  const canManage = hasPermission("reinforcement.xp.manage");
  const scopedTargetIds: Partial<
    Record<Exclude<XpPolicyScopeType, "school">, string | undefined>
  > = {
    stage: context.stageId,
    grade: context.gradeId,
    section: context.sectionId,
    classroom: context.classroomId,
    student: context.studentId,
  };
  const scopeKey =
    scopeType && scopeType !== "school"
      ? scopedTargetIds[scopeType]
      : undefined;
  const visibleScopeFilters =
    scopeType && scopeType !== "school"
      ? SCOPE_FILTER_LEVELS[scopeType]
      : [];

  const resetFilters = () => {
    ["stageId", "gradeId", "sectionId", "classroomId", "studentId", "enrollmentId"]
      .forEach((key) => setValue(key, ""));
    setScopeType("");
    setActiveFilter("all");
    setIncludeDeleted(false);
  };

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      termId: context.termId,
      scopeType: scopeType || undefined,
      scopeKey: scopeKey || undefined,
      isActive:
        activeFilter === "all" ? undefined : activeFilter === "active",
      includeDeleted: includeDeleted || undefined,
    }),
    [
      activeFilter,
      context.academicYearId,
      context.termId,
      includeDeleted,
      scopeKey,
      scopeType,
    ],
  );

  useEffect(() => {
      void Promise.resolve().then(() => setEffectivePolicy(null));
      void Promise.resolve().then(() => {
        setEffectivePolicyStudentLabel(null);
      });
  }, [
    activeFilter,
    context.academicYearId,
    context.termId,
    includeDeleted,
    scopeKey,
    scopeType,
  ]);

  const refreshPolicies = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listXpPolicies(params);
      setPolicies(response.items);
    } catch (nextError) {
      const message = t(describeXpPolicyApiError(nextError).messageKey);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, params, showError, t]);

  const loadPolicyTargetOptions = useCallback(async () => {
    if (!context.academicYearId || !context.termId) {
      setPolicyTargetOptions({});
      setPolicyTargetOptionsError(false);
      return;
    }

    setPolicyTargetOptionsError(false);
    try {
      const options = await getReinforcementFilterOptions({
        academicYearId: context.academicYearId,
        termId: context.termId,
      });
      setPolicyTargetOptions(options.scopeTargets || {});
    } catch {
      setPolicyTargetOptions({});
      setPolicyTargetOptionsError(true);
    }
  }, [context.academicYearId, context.termId]);

  useEffect(() => {
    void Promise.resolve().then(refreshPolicies);
  }, [refreshPolicies]);

  useEffect(() => {
    void Promise.resolve().then(loadPolicyTargetOptions);
  }, [loadPolicyTargetOptions]);

  const handleCreate = async (payload: CreateXpPolicyPayload) => {
    try {
      await createXpPolicy(payload);
      showSuccess(t("xp.messages.policyCreated"));
      setIsCreateOpen(false);
      await refreshPolicies();
    } catch (nextError) {
      const message = t(describeXpPolicyApiError(nextError).messageKey);
      showError(message);
      throw nextError;
    }
  };

  const handleEdit = async (payload: CreateXpPolicyPayload) => {
    if (!editingPolicy?.id) return;
    try {
      await patchXpPolicy(editingPolicy.id, payload);
      showSuccess(t("xp.messages.policyPatched"));
      setEditingPolicy(null);
      await refreshPolicies();
    } catch (nextError) {
      const message = t(describeXpPolicyApiError(nextError).messageKey);
      showError(message);
      throw nextError;
    }
  };

  const loadEffectiveStudents = useCallback(async () => {
    if (!context.academicYearId || !context.termId) return;
    setEffectiveStudentsLoading(true);
    setEffectiveStudentsError(null);
    try {
      const filterOptions = await getReinforcementFilterOptions({
        academicYearId: context.academicYearId,
        termId: context.termId,
      });
      setEffectiveStudentOptions(
        buildEffectiveStudentOptions(filterOptions, locale),
      );
    } catch (nextError) {
      const message = t(describeXpPolicyApiError(nextError).messageKey);
      setEffectiveStudentsError(message);
      showError(message);
    } finally {
      setEffectiveStudentsLoading(false);
    }
  }, [context.academicYearId, context.termId, locale, showError, t]);

  useEffect(() => {
    if (!isEffectiveStudentPickerOpen) return;
      void Promise.resolve().then(() => setEffectiveStudentId(""));
      void Promise.resolve().then(loadEffectiveStudents);
  }, [isEffectiveStudentPickerOpen, loadEffectiveStudents]);

  const openEffectiveStudentPicker = () => {
    if (!context.academicYearId) {
      showError(t("xp.validation.academicYearRequired"));
      return;
    }
    if (!context.termId) {
      showError(t("xp.validation.termRequired"));
      return;
    }
    setEffectiveStudentsError(null);
    setIsEffectiveStudentPickerOpen(true);
  };

  const lookupEffectivePolicy = async () => {
    if (!context.termId) {
      showError(t("xp.validation.termRequired"));
      return;
    }
    const selectedStudent = effectiveStudentOptions.find(
      (item) => item.value === effectiveStudentId,
    );
    if (!selectedStudent) {
      showError(t("xp.validation.studentRequired"));
      return;
    }
    if (!selectedStudent.enrollmentId) {
      showError(t("xp.validation.studentEnrollmentRequired"));
      return;
    }
    try {
      setEffectivePolicy(
        await getEffectiveXpPolicy({
          academicYearId: context.academicYearId,
          termId: context.termId,
          studentId: selectedStudent.value,
        }),
      );
      setEffectivePolicyStudentLabel(selectedStudent.label);
      setIsEffectiveStudentPickerOpen(false);
      showSuccess(t("xp.messages.effectiveLoaded"));
    } catch (nextError) {
      const message = t(describeXpPolicyApiError(nextError).messageKey);
      showError(message);
    }
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  const displayedPolicies = effectivePolicy ? [effectivePolicy] : policies;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("xp.policiesTitle")}
        description={t("xp.policiesDescription")}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={loading}
              onClick={refreshPolicies}
            >
              {t("actions.refresh")}
            </Button>
            {canManage ? (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                {t("xp.createPolicy")}
              </Button>
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
              <h2 className="text-base font-semibold text-gray-900">
                {t("xp.policyFilters")}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {t("xp.policyFiltersDescription")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("xp.clearFilters")}
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label={t("xp.scopeType")}
            value={scopeType}
            onChange={(value) => setScopeType(value as XpPolicyScopeType | "")}
            options={[
              { value: "", label: t("xp.allScopes") },
              { value: "school", label: t("assignmentScope.school") },
              { value: "stage", label: t("assignmentScope.stage") },
              { value: "grade", label: t("assignmentScope.grade") },
              { value: "section", label: t("assignmentScope.section") },
              { value: "classroom", label: t("assignmentScope.classroom") },
              { value: "student", label: t("assignmentScope.student") },
            ]}
          />
          <Select
            label={t("xp.activeStatus")}
            value={activeFilter}
            onChange={(value) =>
              setActiveFilter(value as "all" | "active" | "inactive")
            }
            options={[
              { value: "all", label: t("xp.allStatuses") },
              { value: "active", label: t("activeState.active") },
              { value: "inactive", label: t("activeState.inactive") },
            ]}
          />
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{t("xp.includeDeleted")}</span>
          </label>
          <Button
            type="button"
            variant="secondary"
            className="self-end"
            onClick={openEffectiveStudentPicker}
          >
            {t("xp.lookupEffectivePolicy")}
          </Button>
        </div>
        {scopeType && scopeType !== "school" ? (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
            <ReinforcementAcademicContextFilter
              value={context}
              showAcademicYearTerm={false}
              showSubject={false}
              showStage={visibleScopeFilters.includes("stage")}
              showGrade={visibleScopeFilters.includes("grade")}
              showSection={visibleScopeFilters.includes("section")}
              showClassroom={visibleScopeFilters.includes("classroom")}
              showStudent={visibleScopeFilters.includes("student")}
              onChange={(selection: ReinforcementAcademicContextSelection) => {
                setValue("stageId", selection.stageId || "");
                setValue("gradeId", selection.gradeId || "");
                setValue("sectionId", selection.sectionId || "");
                setValue("classroomId", selection.classroomId || "");
                setValue("studentId", selection.studentId || "");
                setValue("enrollmentId", selection.enrollmentId || "");
              }}
            />
          </div>
        ) : null}
        {policyTargetOptionsError ? (
          <p className="border-t border-gray-100 px-4 py-3 text-sm text-amber-700" role="status">
            {t("xp.filterOptionsUnavailable")}
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

      {effectivePolicy ? (
        <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>{t("xp.effectivePolicyFilterTitle")}</strong>
              <span className="ms-1">
                {t("xp.effectivePolicyFilterDescription", {
                  student:
                    effectivePolicyStudentLabel || t("common.student"),
                })}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setEffectivePolicy(null);
                setEffectivePolicyStudentLabel(null);
              }}
            >
              {t("xp.clearEffectivePolicyFilter")}
            </Button>
          </div>
        </section>
      ) : null}

      <XpPolicyTable
        policies={displayedPolicies}
        scopeOptions={policyTargetOptions}
        loading={effectivePolicy ? false : loading}
        canManage={effectivePolicy ? false : canManage}
        onEdit={setEditingPolicy}
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={t("xp.createPolicy")}
        description={t("xp.createPolicyDescription")}
        size="xl"
      >
        <XpPolicyForm
          academicYearId={academicYearId}
          termId={termId}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
      <Modal
        isOpen={Boolean(editingPolicy)}
        onClose={() => setEditingPolicy(null)}
        title={t("xp.updatePolicy")}
        description={t("xp.updatePolicyDescription")}
        size="xl"
      >
        {editingPolicy ? (
          <XpPolicyForm
            key={editingPolicy.id}
            academicYearId={academicYearId}
            termId={termId}
            mode="edit"
            initialPolicy={editingPolicy}
            onSubmit={handleEdit}
            onCancel={() => setEditingPolicy(null)}
          />
        ) : null}
      </Modal>
      <Modal
        isOpen={isEffectiveStudentPickerOpen}
        onClose={() => setIsEffectiveStudentPickerOpen(false)}
        title={t("xp.effectivePolicyStudentModal.title")}
        description={t("xp.effectivePolicyStudentModal.description")}
        size="md"
      >
        <div className="space-y-4">
          {effectiveStudentsError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {effectiveStudentsError}
            </div>
          ) : null}
          <Select
            label={t("xp.effectivePolicyStudentModal.student")}
            value={effectiveStudentId}
            onChange={setEffectiveStudentId}
            options={effectiveStudentOptions}
            disabled={effectiveStudentsLoading}
            searchable
            searchPlaceholder={t("common.search")}
            noOptionsText={
              effectiveStudentsLoading
                ? t("common.loading")
                : t("xp.effectivePolicyStudentModal.noStudents")
            }
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEffectiveStudentPickerOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={loadEffectiveStudents}
              loading={effectiveStudentsLoading}
            >
              {t("common.retry")}
            </Button>
            <Button
              type="button"
              onClick={lookupEffectivePolicy}
              disabled={effectiveStudentsLoading}
            >
              {t("xp.lookupEffectivePolicy")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
