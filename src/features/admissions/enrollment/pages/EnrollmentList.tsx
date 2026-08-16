"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CheckCircle, Plus, Search, Users, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import { AdmissionsAccessDenied } from "@/features/admissions/shared/components/AdmissionsAccessGuard";
import { useAdmissionsAcademicSelection } from "@/features/admissions/shared/hooks/useAdmissionsAcademicSelection";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchStudentById, fetchStudents } from "@/features/students-guardians/students/services/studentsApiService";
import type { Student } from "@/features/students-guardians/students/types";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchEnrollmentAcademicYears, fetchEnrollments } from "../api/enrollmentApi";
import type { AcademicYearDto, EnrollmentDto, EnrollmentStatusDto } from "../api/enrollmentDtos";
import EnrollmentDetailsDrawer from "../components/EnrollmentDetailsDrawer";
import EnrollmentPlacementDialog from "../components/EnrollmentPlacementDialog";
import EnrollmentWorkflowDialog from "../components/EnrollmentWorkflowDialog";
import { mapEnrollment, studentDisplayName } from "../model/enrollmentMappers";
import type { EnrollmentRecord } from "../model/enrollment";

interface Option { id: string; name: string; parentId?: string }

export default function EnrollmentList() {
  const t = useTranslations("admissions.enrollment"); const locale = useLocale();
  const tContext = useTranslations("admissions.context_bar");
  const [now] = useState(() => Date.now());
  const academicSelection = useAdmissionsAcademicSelection();
  const { yearId, termId } = academicSelection;
  const { hasPermission } = usePermissions();
  const canView = hasPermission("students.enrollments.view"); const canViewStudents = hasPermission("students.records.view"); const canManage = hasPermission("students.enrollments.manage"); const canManageLifecycle = hasPermission("students.lifecycle.manage");
  const [dtos, setDtos] = useState<EnrollmentDto[]>([]); const [students, setStudents] = useState<Student[]>([]); const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map()); const [academicYears, setAcademicYears] = useState<AcademicYearDto[]>([]);
  const [grades, setGrades] = useState<Option[]>([]); const [sections, setSections] = useState<Option[]>([]); const [classrooms, setClassrooms] = useState<Option[]>([]);
  const [isLoadingStructure, setIsLoadingStructure] = useState(true);
  const [structureError, setStructureError] = useState("");
  const resolvedStudentIds = useRef(new Set<string>());
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [search, setSearch] = useState(""); const [status, setStatus] = useState<EnrollmentStatusDto | "all">("all"); const [selected, setSelected] = useState<EnrollmentRecord | null>(null); const [placementOpen, setPlacementOpen] = useState(false); const [editing, setEditing] = useState<EnrollmentRecord | null>(null); const [workflow, setWorkflow] = useState<"transfer" | "withdraw" | "promote" | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    if (!canView || academicSelection.isLoading) return;
    if (!yearId) {
      setDtos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [nextEnrollments, nextYears] = await Promise.all([
        fetchEnrollments({
          academicYearId: yearId,
          status: status === "all" ? undefined : status,
        }),
        fetchEnrollmentAcademicYears(),
      ]);
      setDtos(nextEnrollments);
      setAcademicYears(nextYears);
    } catch {
      setError(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [academicSelection.isLoading, canView, status, t, yearId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => { if (!canViewStudents) return; void fetchStudents().then(setStudents).catch(() => setStudents([])); }, [canViewStudents]);
  useEffect(() => {
    if (!canViewStudents || dtos.length === 0) return; let active = true;
    const missing = [...new Set(dtos.map((item) => item.studentId))].filter((id) => !resolvedStudentIds.current.has(id));
    missing.forEach((id) => resolvedStudentIds.current.add(id));
    void Promise.all(missing.map(async (id) => { try { return [id, await fetchStudentById(id)] as const; } catch { return [id, undefined] as const; } })).then((entries) => { if (!active) return; setStudentMap((current) => { const next = new Map(current); entries.forEach(([id, student]) => { if (student) next.set(id, student); }); return next; }); });
    return () => { active = false; };
  }, [canViewStudents, dtos]);
  useEffect(() => {
    if (!yearId || !termId) return;

    let cancelled = false;
    void fetchStructureTree(yearId, termId)
      .then((tree) => {
        if (cancelled) return;
        const name = (item: { name?: string; nameAr?: string; nameEn?: string }) =>
          locale === "ar"
            ? item.nameAr || item.name || t("details.not_available")
            : item.nameEn || item.name || t("details.not_available");
        setGrades(tree.grades.map((item) => ({ id: item.id, name: name(item) })));
        setSections(tree.sections.map((item) => ({ id: item.id, name: name(item), parentId: item.gradeId })));
        setClassrooms(tree.classrooms.map((item) => ({ id: item.id, name: name(item), parentId: item.sectionId })));
      })
      .catch(() => {
        if (cancelled) return;
        setGrades([]);
        setSections([]);
        setClassrooms([]);
        setStructureError(t("context.structure_load_error"));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStructure(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, termId, yearId, t]);

  const records = useMemo(() => dtos.map((dto) => mapEnrollment(dto, studentDisplayName(studentMap.get(dto.studentId), locale))), [dtos, locale, studentMap]);
  const visible = useMemo(() => records.filter((item) => !search || [item.studentName, item.academicYear, item.grade, item.section, item.classroom].some((value) => value.toLowerCase().includes(search.toLowerCase()))), [records, search]);
  const thisWeek = records.filter((item) => now - new Date(item.enrollmentDate).getTime() <= 7 * 86400000).length;
  const selectedAcademicYear = academicSelection.academicYears.find((year) => year.id === yearId) ?? null;
  const selectedTerm = academicSelection.terms.find((term) => term.id === termId) ?? null;
  const hasActiveFilters = Boolean(search || status !== "all");
  const placementStructureReady =
    grades.length > 0 && sections.length > 0 && classrooms.length > 0;
  const newEnrollmentUnavailableReason = academicSelection.isLoading
    ? t("context.loading")
    : !yearId || !termId
      ? t("context.selection_required")
      : isLoadingStructure
        ? t("context.structure_loading")
        : structureError || (!placementStructureReady ? t("context.structure_missing") : "");
  const resetPlacementContext = () => {
    setSelected(null);
    setEditing(null);
    setPlacementOpen(false);
    setGrades([]);
    setSections([]);
    setClassrooms([]);
    setIsLoadingStructure(true);
    setStructureError("");
  };
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
  };
  const columns = [
    { key: "studentName", label: t("student_name") }, { key: "status", label: t("details.fields.status"), render: (value: unknown) => t(`status.${String(value)}`) }, { key: "academicYear", label: t("academic_year") }, { key: "grade", label: t("grade") }, { key: "section", label: t("section") }, { key: "classroom", label: t("classroom") }, { key: "enrollmentDate", label: t("enrolled_date"), render: (value: unknown) => new Date(String(value)).toLocaleDateString(locale) },
  ];
  if (!canView) return <AdmissionsAccessDenied />;
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3"><KPICardV2 title={t("total_enrolled")} value={records.length} icon={Users} iconColor="#3b82f6" iconBgColor="#dbeafe" /><KPICardV2 title={t("status.active")} value={records.filter((item) => item.status === "active").length} icon={CheckCircle} iconColor="#10b981" iconBgColor="#d1fae5" /><KPICardV2 title={t("this_week")} value={thisWeek} icon={Calendar} iconColor="#8b5cf6" iconBgColor="#ede9fe" /></div>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-bold">{t("title")}</h2><p className="text-sm text-gray-500">{t("subtitle")}</p></div>
      {canManage && (
        <div className="flex max-w-sm flex-col items-start gap-1 sm:items-end">
          <Button
            type="button"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={Boolean(newEnrollmentUnavailableReason)}
            aria-describedby={newEnrollmentUnavailableReason ? "new-enrollment-guidance" : undefined}
            title={newEnrollmentUnavailableReason || undefined}
            onClick={() => { setEditing(null); setPlacementOpen(true); }}
          >
            {t("actions.new_enrollment")}
          </Button>
          {newEnrollmentUnavailableReason && (
            <p
              id="new-enrollment-guidance"
              role={structureError ? "alert" : "status"}
              className={`text-xs sm:text-end ${
                structureError ? "text-red-700" : "text-amber-700"
              }`}
            >
              {newEnrollmentUnavailableReason}
            </p>
          )}
        </div>
      )}
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{tContext("title")}</h3>
      <p className="mb-3 text-sm text-gray-600">{t("context.scope_help")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label={tContext("academic_year")}
          value={yearId || ""}
          options={academicSelection.academicYears.map((year) => ({ value: year.id, label: locale === "ar" ? year.nameAr || year.name : year.nameEn || year.name }))}
          disabled={academicSelection.isLoading}
          onChange={(nextYearId) => {
            resetPlacementContext();
            void academicSelection.setYearId(nextYearId);
          }}
        />
        <Select
          label={tContext("term")}
          value={termId || ""}
          options={academicSelection.terms.map((term) => ({ value: term.id, label: locale === "ar" ? term.nameAr || term.name : term.nameEn || term.name }))}
          disabled={academicSelection.isLoading || !yearId}
          onChange={(nextTermId) => {
            resetPlacementContext();
            academicSelection.setTermId(nextTermId);
          }}
        />
      </div>
      {academicSelection.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {academicSelection.error === "failed_to_load_terms"
            ? tContext("errors.failed_to_load_terms")
            : tContext("errors.failed_to_load")}
        </p>
      )}
    </div>
    <FilterPanel
      searchSlot={<div className="max-w-md flex-1"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_placeholder")} aria-label={t("search_placeholder")} leftIcon={<Search className="h-4 w-4" />} /></div>}
      filtersSlot={<Select label={t("details.fields.status")} value={status} onChange={(value) => setStatus(value as EnrollmentStatusDto | "all")} options={[{ value: "all", label: t("status.all") }, { value: "active", label: t("status.active") }, { value: "completed", label: t("status.completed") }, { value: "withdrawn", label: t("status.withdrawn") }]} />}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((current) => !current)}
      clearAction={<Button type="button" variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFilters}>{t("clear_filters")}</Button>}
      hasActiveFilters={hasActiveFilters}
      toggleTitle={t("filters")}
      toggleAriaLabel={t("filters")}
    />
    {error ? (
      <div className="rounded-xl bg-red-50 p-5 text-red-700">{error}<Button type="button" variant="ghost" size="sm" className="ms-3 text-red-700" onClick={() => void load()}>{t("actions.retry")}</Button></div>
    ) : loading ? (
      <DataTable columns={columns} data={[]} isLoading skeletonRows={6} showPagination={false} />
    ) : visible.length === 0 ? (
      <div className="rounded-xl bg-white">
        <EmptyState
          message={hasActiveFilters ? t("no_match") : t("no_enrollments")}
          action={hasActiveFilters ? <Button type="button" variant="ghost" onClick={clearFilters}>{t("clear_filters")}</Button> : undefined}
        />
      </div>
    ) : (
      <DataTable columns={columns} data={visible as (EnrollmentRecord & { [key: string]: unknown })[]} onRowClick={setSelected} searchQuery={search} />
    )}
    <EnrollmentDetailsDrawer enrollment={selected} onClose={() => setSelected(null)} canManage={canManage} canManageLifecycle={canManageLifecycle} onEdit={(item) => { setEditing(item); setPlacementOpen(true); }} onLifecycle={(action, item) => { setSelected(item); setWorkflow(action); }} />
    <EnrollmentPlacementDialog key={`${editing?.id ?? "new"}-${placementOpen}`} open={placementOpen} enrollment={editing} students={students} academicYear={selectedAcademicYear} term={selectedTerm} grades={grades} sections={sections} classrooms={classrooms} onClose={() => setPlacementOpen(false)} onSuccess={load} />
    <EnrollmentWorkflowDialog action={workflow} enrollment={selected} sections={sections} classrooms={classrooms} academicYears={academicYears} onClose={() => setWorkflow(null)} onSuccess={load} />
  </div>;
}
