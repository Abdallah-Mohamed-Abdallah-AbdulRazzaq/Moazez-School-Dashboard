"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ClipboardList,
  Send,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  Users,
  AlertTriangle,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import ChartCard from "@/components/ui/chart-card/ChartCard";
import Select, { SelectOption } from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "@/features/behavior/shared/hooks/useBehaviorYearTermContext";
import { getBehaviorOverview } from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchAllStudents,
  fetchStudentsWithEnrollmentForContext,
} from "@/features/students-guardians/students/services/studentsService";
import { validateDateRange } from "@/features/behavior/shared/utils/behaviorUiRules";
import type {
  BehaviorOverviewFilters,
  BehaviorOverviewResponse,
  BehaviorOverviewRecentItem,
  BehaviorType,
  BehaviorSeverity,
  BehaviorStatus,
} from "@/features/behavior/types";

// ─── Loading / Error / Empty states ────────────────────────────────────────
function StatePanel({ title, loading }: { title: string; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      {loading && (
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary-color)", borderTopColor: "transparent" }} />
      )}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{title}</p>
    </div>
  );
}

// ─── Status / Type badge ───────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  draft:     { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-700)", border: "var(--color-neutral-200)" },
  submitted: { bg: "#fef3c7", fg: "#78350f", border: "#fde68a" },
  approved:  { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  rejected:  { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
  cancelled: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-500)", border: "var(--color-neutral-200)" },
};

function Badge({ label, colors }: { label: string; colors: { bg: string; fg: string; border: string } }) {
  return (
    <span
      className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.fg, borderColor: colors.border }}
    >
      {label}
    </span>
  );
}

// ─── Severity bar colors ───────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

// ─── Chart Y-axis tick for horizontal bars ─────────────────────────────────
function CategoryTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={0} dy={4} textAnchor="end" fill="var(--text-secondary)" fontSize="12">
        {payload?.value ?? ""}
      </text>
    </g>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
interface OverviewFiltersState {
  classroomId?: string;
  studentId?: string;
  type?: "positive" | "negative";
  severity?: "low" | "medium" | "high" | "critical";
  status?: "draft" | "submitted" | "approved" | "rejected" | "cancelled";
  occurredFrom?: string;
  occurredTo?: string;
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function BehaviorOverviewPage() {
  const t = useTranslations("behavior.overview");
  const tBehavior = useTranslations("behavior");
  const tStatus = useTranslations("behavior.status");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { yearId, termId } = useBehaviorYearTermContext();

  const { showError } = useToast();

  const [data, setData] = useState<BehaviorOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<OverviewFiltersState>({
    classroomId: undefined,
    studentId: undefined,
    type: undefined,
    severity: undefined,
    status: undefined,
    occurredFrom: undefined,
    occurredTo: undefined,
  });

  const [scopeSelection, setScopeSelection] = useState({
    stageId: "",
    gradeId: "",
    sectionId: "",
  });

  // Dropdown options state
  const [structure, setStructure] = useState<StructureTree | null>(null);
  const [allStudents, setAllStudents] = useState<SelectOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<SelectOption[]>([]);
  const [, setFetchingOptions] = useState(false);

  // Load structure tree classrooms and all students
  useEffect(() => {
    if (!yearId || !termId) return;

    let cancelled = false;
    void Promise.resolve().then(() => setFetchingOptions(true));

    const loadOptions = async () => {
      try {
        const [tree, studentsRes] = await Promise.all([
          fetchStructureTree(yearId, termId),
          fetchAllStudents(),
        ]);

        if (cancelled) return;

        setStructure(tree);

        // Map all loaded students
        const studOpts: SelectOption[] = studentsRes.map((s) => ({
          value: s.id,
          label: isRTL
            ? (s.full_name_ar || s.full_name_en || s.student_id || s.id)
            : (s.full_name_en || s.full_name_ar || s.student_id || s.id),
          searchText: `${s.full_name_en || ""} ${s.full_name_ar || ""} ${s.student_id || ""}`,
        }));
        setAllStudents(studOpts);

        setStudentOptions(studOpts);
      } catch (err) {
        console.error("Failed to load behavior overview dropdown options:", err);
        showError(tBehavior("messages.loadError") || "Failed to load options");
      } finally {
        if (!cancelled) setFetchingOptions(false);
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [yearId, termId, isRTL, showError, tBehavior]);

  const stageOptions = useMemo<SelectOption[]>(
    () => (structure?.stages ?? []).map((stage) => ({
      value: stage.id,
      label: isRTL ? (stage.nameAr || stage.name) : (stage.nameEn || stage.name),
    })),
    [structure, isRTL],
  );
  const gradeOptions = useMemo<SelectOption[]>(
    () => (structure?.grades ?? [])
      .filter((grade) => !scopeSelection.stageId || grade.stageId === scopeSelection.stageId)
      .map((grade) => ({ value: grade.id, label: isRTL ? (grade.nameAr || grade.name) : (grade.nameEn || grade.name) })),
    [scopeSelection.stageId, structure, isRTL],
  );
  const sectionOptions = useMemo<SelectOption[]>(
    () => (structure?.sections ?? [])
      .filter((section) => !scopeSelection.gradeId || section.gradeId === scopeSelection.gradeId)
      .map((section) => ({ value: section.id, label: isRTL ? (section.nameAr || section.name) : (section.nameEn || section.name) })),
    [scopeSelection.gradeId, structure, isRTL],
  );
  const classroomOptions = useMemo<SelectOption[]>(
    () => (structure?.classrooms ?? [])
      .filter((classroom) => !scopeSelection.sectionId || classroom.sectionId === scopeSelection.sectionId)
      .map((classroom) => ({ value: classroom.id, label: isRTL ? (classroom.nameAr || classroom.name) : (classroom.nameEn || classroom.name) })),
    [scopeSelection.sectionId, structure, isRTL],
  );

  // Update student options when classroomId changes
  useEffect(() => {
    if (!yearId || !termId) return;

    let cancelled = false;
    const selectedClassroom = filters.classroomId;

    if (!selectedClassroom) {
      void Promise.resolve().then(() => setStudentOptions(allStudents));
      return;
    }

    void Promise.resolve().then(() => setFetchingOptions(true));
    const updateClassroomStudents = async () => {
      try {
        const res = (
          await fetchStudentsWithEnrollmentForContext(yearId)
        ).filter(
          (student) => student.enrollment?.classroomId === selectedClassroom,
        );
        
        if (cancelled) return;

        const filteredStuds: SelectOption[] = res.map((s) => ({
          value: s.id,
          label: isRTL
            ? (s.full_name_ar || s.full_name_en || s.student_id || s.id)
            : (s.full_name_en || s.full_name_ar || s.student_id || s.id),
          searchText: `${s.full_name_en || ""} ${s.full_name_ar || ""} ${s.student_id || ""}`,
        }));

        setStudentOptions(filteredStuds);
      } catch (err) {
        console.error("Failed to update students by classroom:", err);
        setStudentOptions([]);
      } finally {
        if (!cancelled) setFetchingOptions(false);
      }
    };

    void updateClassroomStudents();

    return () => {
      cancelled = true;
    };
  }, [filters.classroomId, allStudents, yearId, termId, isRTL]);

  const load = useCallback(async () => {
    if (!yearId || !termId) return;

    // Clean payload: do not send empty strings or undefined keys
    const cleanPayload = Object.fromEntries(
      Object.entries({
        academicYearId: yearId,
        termId,
        ...filters,
      }).filter(([, value]) => value !== undefined && value !== "")
    ) as BehaviorOverviewFilters;

    setLoading(true);
    setError(null);
    try {
      const res = await getBehaviorOverview(cleanPayload);
      setData(res);
    } catch (error) {
      setError(
        behaviorUiError(error, "Failed to load overview data", tBehavior).message,
      );
    } finally {
      setLoading(false);
    }
  }, [
    yearId,
    termId,
    filters,
    tBehavior,
  ]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Reset only filters, preserving academicYearId and termId
  const handleReset = () => {
    setScopeSelection({ stageId: "", gradeId: "", sectionId: "" });
    setFilters({
      classroomId: undefined,
      studentId: undefined,
      type: undefined,
      severity: undefined,
      status: undefined,
      occurredFrom: undefined,
      occurredTo: undefined,
    });
  };

  const handleStageChange = (stageId: string) => {
    setScopeSelection({ stageId, gradeId: "", sectionId: "" });
    setFilters((prev) => ({ ...prev, classroomId: undefined, studentId: undefined }));
  };

  const handleGradeChange = (gradeId: string) => {
    setScopeSelection((prev) => ({ ...prev, gradeId, sectionId: "" }));
    setFilters((prev) => ({ ...prev, classroomId: undefined, studentId: undefined }));
  };

  const handleSectionChange = (sectionId: string) => {
    setScopeSelection((prev) => ({ ...prev, sectionId }));
    setFilters((prev) => ({ ...prev, classroomId: undefined, studentId: undefined }));
  };

  const handleClassroomChange = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      classroomId: val || undefined,
      studentId: undefined, // Clear selected student on classroom change
    }));
  };

  const handleDateFromChange = (date: Date | null) => {
    const nextOccurredFrom = date ? date.toISOString() : undefined;
    if (nextOccurredFrom && filters.occurredTo && !validateDateRange(nextOccurredFrom, filters.occurredTo)) {
      showError(tBehavior("errors.invalidDateRange") || "From date cannot be after To date");
      return;
    }
    setFilters((prev) => ({ ...prev, occurredFrom: nextOccurredFrom }));
  };

  const handleDateToChange = (date: Date | null) => {
    const nextOccurredTo = date ? date.toISOString() : undefined;
    if (nextOccurredTo && filters.occurredFrom && !validateDateRange(filters.occurredFrom, nextOccurredTo)) {
      showError(tBehavior("errors.invalidDateRange") || "To date cannot be before From date");
      return;
    }
    setFilters((prev) => ({ ...prev, occurredTo: nextOccurredTo }));
  };

  // Only show full-screen loading on initial fetch (when data is null)
  const isInitialLoading = loading && !data;

  if (isInitialLoading) return <StatePanel title={t("title")} loading />;
  if (error && !data) return <StatePanel title={error} />;
  if (!data) return <StatePanel title={t("noData")} />;

  const { records, severity, review, points, categories, recentActivity, topStudents } = data;

  // ─── Section 1: Records KPI Bar ──────────────────────────────────────────
  const recordCards = [
    { label: t("totalRecords"), value: records.total, icon: ClipboardList, fg: "var(--color-neutral-700)", bg: "var(--color-neutral-100)" },
    { label: t("submitted"),    value: records.submitted, icon: Send,          fg: "var(--color-warning-700)", bg: "var(--color-warning-100)" },
    { label: t("approved"),     value: records.approved,  icon: CheckCircle2,  fg: "var(--color-success-700)", bg: "var(--color-success-100)" },
    { label: t("rejected"),     value: records.rejected,  icon: XCircle,       fg: "var(--color-accent-700)",  bg: "var(--color-accent-100)" },
    { label: t("positive"),     value: records.positive,  icon: ThumbsUp,      fg: "#16a34a",                 bg: "#dcfce7" },
    { label: t("negative"),     value: records.negative,  icon: ThumbsDown,    fg: "#dc2626",                 bg: "#fef2f2" },
  ];

  // ─── Section 3: Severity chart data ──────────────────────────────────────
  const severityData = [
    { name: t("low"),      value: severity.low },
    { name: t("medium"),   value: severity.medium },
    { name: t("high"),     value: severity.high },
    { name: t("critical"), value: severity.critical },
  ];

  // ─── Section 4: Top categories chart data ────────────────────────────────
  const topCatData = categories.topCategories.map((cat) => ({
    name: isRTL ? cat.nameAr : (cat.code + " – " + cat.nameEn),
    records: cat.totalRecords,
    points: cat.totalPoints,
    type: cat.type,
  }));

  // ─── Section 5: Top students chart data ──────────────────────────────────
  const topStudentData = topStudents.map((s) => ({
    name: isRTL ? (s.student.nameAr || s.student.displayName) : s.student.displayName,
    totalPoints: s.totalPoints,
    positivePoints: s.positivePoints,
    negativePoints: s.negativePoints,
  }));

  const approvedCount = Math.round(review.reviewed * review.approvalRate);
  const rejectedCount = Math.round(review.reviewed * review.rejectionRate);
  const pendingCount = review.pendingReview;

  const reviewPieData = [
    { name: t("approved") || "Approved", value: approvedCount, color: "#16a34a" },
    { name: t("rejected") || "Rejected", value: rejectedCount, color: "#ef4444" },
    { name: t("pendingReview") || "Pending", value: pendingCount, color: "#f59e0b" },
  ].filter((item) => item.value > 0); // Only render slices for non-zero counts

  const totalReviewsCount = approvedCount + rejectedCount + pendingCount;

  const typeOptions = [
    { value: "", label: tBehavior("filters.allTypes") || (isRTL ? "جميع الأنواع" : "All Types") },
    { value: "positive", label: tBehavior("type.positive") || (isRTL ? "إيجابي" : "Positive") },
    { value: "negative", label: tBehavior("type.negative") || (isRTL ? "سلبي" : "Negative") },
  ];

  const severityOptions = [
    { value: "", label: isRTL ? "جميع مستويات الخطورة" : "All Severities" },
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
    { value: "critical", label: t("critical") },
  ];

  const statusOptions = [
    { value: "", label: tBehavior("filters.allStatuses") || (isRTL ? "جميع الحالات" : "All Statuses") },
    { value: "draft", label: t("draft") },
    { value: "submitted", label: t("submitted") },
    { value: "approved", label: t("approved") },
    { value: "rejected", label: t("rejected") },
    { value: "cancelled", label: t("cancelled") },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* ── Row 0: Filters Card ────────────────────────────────────────── */}
      <div
        className="rounded-2xl border shadow-sm p-6 space-y-4"
        style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("filters.title") || "Filters"}
          </div>
          {(scopeSelection.stageId ||
            scopeSelection.gradeId ||
            scopeSelection.sectionId ||
            filters.classroomId ||
            filters.studentId ||
            filters.type ||
            filters.severity ||
            filters.status ||
            filters.occurredFrom ||
            filters.occurredTo) && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<X className="w-4 h-4" />}
              onClick={handleReset}
            >
              {t("filters.clear") || "Clear Filters"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {/* Academic hierarchy */}
          <Select label={isRTL ? "المرحلة" : "Stage"} placeholder={isRTL ? "كل المراحل" : "All stages"} value={scopeSelection.stageId} onChange={handleStageChange} options={[{ value: "", label: isRTL ? "كل المراحل" : "All stages" }, ...stageOptions]} searchable selectSize="sm" />
          <Select label={isRTL ? "الصف" : "Grade"} placeholder={isRTL ? "كل الصفوف" : "All grades"} value={scopeSelection.gradeId} onChange={handleGradeChange} options={[{ value: "", label: isRTL ? "كل الصفوف" : "All grades" }, ...gradeOptions]} disabled={!scopeSelection.stageId} searchable selectSize="sm" />
          <Select label={isRTL ? "الشعبة" : "Section"} placeholder={isRTL ? "كل الشعب" : "All sections"} value={scopeSelection.sectionId} onChange={handleSectionChange} options={[{ value: "", label: isRTL ? "كل الشعب" : "All sections" }, ...sectionOptions]} disabled={!scopeSelection.gradeId} searchable selectSize="sm" />
          {/* Classroom */}
          <Select
            label={t("filters.classroom") || "Classroom"}
            placeholder={t("filters.allClassrooms") || "All Classrooms"}
            value={filters.classroomId ?? ""}
            onChange={handleClassroomChange}
            options={[
              { value: "", label: t("filters.allClassrooms") || (isRTL ? "جميع الفصول" : "All Classrooms") },
              ...classroomOptions,
            ]}
            disabled={!scopeSelection.sectionId}
            searchable
            selectSize="sm"
          />

          {/* Student */}
          <Select
            label={t("filters.student") || "Student"}
            placeholder={t("filters.allStudents") || "All Students"}
            value={filters.studentId ?? ""}
            onChange={(val) => setFilters((prev) => ({ ...prev, studentId: val || undefined }))}
            options={[
              { value: "", label: t("filters.allStudents") || (isRTL ? "جميع الطلاب" : "All Students") },
              ...studentOptions,
            ]}
            searchable
            selectSize="sm"
            noResultsText={isRTL ? "لم يتم العثور على طلاب" : "No students found"}
          />

          {/* Type */}
          <Select
            label={tBehavior("filters.type") || (isRTL ? "النوع" : "Type")}
            value={filters.type ?? ""}
            onChange={(val) => setFilters((prev) => ({ ...prev, type: (val as BehaviorType) || undefined }))}
            options={typeOptions}
            selectSize="sm"
          />

          {/* Severity */}
          <Select
            label={tBehavior("record.severity") || (isRTL ? "مستوى الخطورة" : "Severity")}
            value={filters.severity ?? ""}
            onChange={(val) => setFilters((prev) => ({ ...prev, severity: (val as BehaviorSeverity) || undefined }))}
            options={severityOptions}
            selectSize="sm"
          />

          {/* Status */}
          <Select
            label={tBehavior("filters.status") || (isRTL ? "الحالة" : "Status")}
            value={filters.status ?? ""}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: (val as BehaviorStatus) || undefined }))}
            options={statusOptions}
            selectSize="sm"
          />

          {/* Date From */}
          <DatePicker
            label={t("filters.dateFrom") || "Date From"}
            value={filters.occurredFrom ? new Date(filters.occurredFrom) : null}
            onChange={handleDateFromChange}
            inputSize="sm"
          />

          {/* Date To */}
          <DatePicker
            label={t("filters.dateTo") || "Date To"}
            value={filters.occurredTo ? new Date(filters.occurredTo) : null}
            onChange={handleDateToChange}
            inputSize="sm"
          />
        </div>
      </div>

      {/* ── Row 1: Records KPI bar ──────────────────────────────────────── */}
      <div
        className="rounded-2xl border shadow-sm p-4"
        style={{ backgroundColor: "var(--card-background)", borderColor: "var(--border-color)" }}
      >
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{t("recordsSummary")}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recordCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                  <Icon className="w-5 h-5" style={{ color: card.fg }} />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</div>
                  <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 2: Points Summary ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICardV2
          title={t("totalPoints")}
          value={points.totalPoints}
          icon={Star}
          iconColor="#7c3aed"
          iconBgColor="#ede9fe"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("positivePoints")}
          value={points.positivePoints}
          valuePrefix="+"
          icon={TrendingUp}
          iconColor="#16a34a"
          iconBgColor="#dcfce7"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("negativePoints")}
          value={points.negativePoints}
          icon={AlertTriangle}
          iconColor="#dc2626"
          iconBgColor="#fef2f2"
          showChart={false}
          className="h-full"
        />
        <KPICardV2
          title={t("avgPerStudent")}
          value={points.averagePointsPerStudent}
          icon={Users}
          iconColor="#0284c7"
          iconBgColor="#e0f2fe"
          showChart={false}
          className="h-full"
        />
      </div>

      {/* ── Row 3: Review Status + Severity ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Review Status */}
        <div
          className="rounded-2xl border shadow-sm p-6 flex flex-col justify-between"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)", minHeight: "360px" }}
        >
          <div>
            <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("reviewStatus")}</div>
            <div className="h-48 relative">
              {totalReviewsCount === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reviewPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {reviewPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface-color)",
                          borderColor: "var(--border-color)",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {totalReviewsCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      {t("totalRecords") || "Total"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Clean Legend */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("approved")}</span>
              </div>
              <span className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>{approvedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("rejected")}</span>
              </div>
              <span className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>{rejectedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("pendingReview")}</span>
              </div>
              <span className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>{pendingCount}</span>
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <ChartCard title={t("severityBreakdown")} showPeriodFilter={false}>
          <div className="h-64">
            {severityData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={70} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                    formatter={(value) => [`${value}`, t("records")]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name.toLowerCase()] ?? SEVERITY_COLORS.low} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 4: Top Categories ───────────────────────────────────────── */}
      <ChartCard title={t("topCategories")} showPeriodFilter={false}>
        <div className="h-72">
          {topCatData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCatData} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                  formatter={(value, name) => [`${value}`, name === "records" ? t("records") : t("points")]}
                />
                <Bar dataKey="records" radius={[0, 6, 6, 0]}>
                  {topCatData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "positive" ? "#16a34a" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* ── Row 5: Top Students + Recent Activity ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Students */}
        <ChartCard title={t("topStudents")} showPeriodFilter={false}>
          <div className="h-72">
            {topStudentData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudentData} layout="vertical" margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={<CategoryTick />} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)", borderRadius: "12px" }}
                    formatter={(value, name) => {
                      const label = name === "positivePoints" ? t("positivePoints") : name === "negativePoints" ? t("negativePoints") : t("totalPoints");
                      return [`${value}`, label];
                    }}
                  />
                  <Bar dataKey="positivePoints" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="negativePoints" stackId="a" fill="#ef4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Recent Activity */}
        <div
          className="rounded-2xl border shadow-sm p-6"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t("recentActivity")}</div>
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noData")}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {recentActivity.map((item) => (
                <RecentActivityRow key={item.id} item={item} locale={locale} tStatus={tStatus} t={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recent activity row component ─────────────────────────────────────────
function RecentActivityRow({
  item,
  locale,
  tStatus,
  t,
}: {
  item: BehaviorOverviewRecentItem;
  locale: string;
  tStatus: (key: string) => string;
  t: (key: string) => string;
}) {
  const isRTL = locale === "ar";
  const statusColors = STATUS_COLORS[item.status] ?? STATUS_COLORS.draft;
  const typeColors = item.type === "positive"
    ? { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" }
    : { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short", day: "numeric" }) : null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-[var(--color-neutral-50)]"
      style={{ borderColor: "var(--border-color)" }}
    >
      {/* Points indicator */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          backgroundColor: item.type === "positive" ? "#dcfce7" : "#fef2f2",
          color: item.type === "positive" ? "#14532d" : "#991b1b",
        }}
      >
        {item.points > 0 ? `+${item.points}` : item.points}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={tStatus(item.status)} colors={statusColors} />
          <Badge label={t(item.type)} colors={typeColors} />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {item.severity}
          </span>
        </div>
        <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>
          {fmt(item.occurredAt)} {item.submittedAt && `· ${isRTL ? "قُدم" : "submitted"} ${fmt(item.submittedAt)}`}
        </div>
      </div>

      {/* Status dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: statusColors.fg }}
      />
    </div>
  );
}
