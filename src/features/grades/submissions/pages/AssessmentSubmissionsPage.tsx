"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { DataTable, Input, Select, type Column } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { fetchGradesFiltersData } from "../../gradebook/services/gradesGradebookService";
import { fetchAssessmentQuestions } from "../../assessments/services/gradesAssessmentsService";
import type { AssessmentQuestion, ScopeEntityOption } from "../../shared/types";
import AutomaticCorrectionDialog, {
  type AutomaticCorrectionScope,
} from "../components/AutomaticCorrectionDialog";
import ManualCorrectionWarning from "../components/ManualCorrectionWarning";
import {
  runAutomaticCorrectionBatch,
  type AutomaticCorrectionBatchProgress,
  type AutomaticCorrectionBatchResult,
} from "../services/automaticCorrectionBatch";
import { listAssessmentSubmissions } from "../services/gradesSubmissionsService";
import type { GradeSubmissionRow, SubmissionListFilters, SubmissionScopeSelection, SubmissionStatus } from "../types";
import { EMPTY_SUBMISSION_SCOPE, changeSubmissionGrade, changeSubmissionSection, getSubmissionClassrooms, getSubmissionSections, toSubmissionListFilters } from "../utils/submissionFilters";
import { buildAssessmentsHref, buildSubmissionDetailHref } from "../utils/submissionNavigation";
import { submissionStatusMessageKey } from "../utils/submissionStatus";

interface SubmissionTableRow extends GradeSubmissionRow {
  [key: string]: unknown;
}

function automaticCorrectionFilters(
  scope: AutomaticCorrectionScope,
  selection: SubmissionScopeSelection,
  status: SubmissionStatus | "",
  search: string,
): SubmissionListFilters {
  return scope === "all"
    ? { status: "submitted" }
    : toSubmissionListFilters(selection, status, search);
}

function indexQuestions(questions: AssessmentQuestion[]) {
  return Object.fromEntries(questions.map((question) => [question.id, question]));
}

interface CorrectionRunRequest {
  assessmentId: string;
  academicYearId: string;
  termId: string;
  submissionIds: readonly string[];
  onProgress: (progress: AutomaticCorrectionBatchProgress) => void;
}

async function executeCorrectionRun(
  request: CorrectionRunRequest,
): Promise<AutomaticCorrectionBatchResult> {
  const questions = await fetchAssessmentQuestions(
    request.academicYearId,
    request.termId,
    request.assessmentId,
  );
  return runAutomaticCorrectionBatch({
    submissionIds: request.submissionIds,
    definitionsByQuestionId: indexQuestions(questions),
    onProgress: request.onProgress,
  });
}

export default function AssessmentSubmissionsPage({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("academics.grades.submissions");
  const errorT = useTranslations("academics.grades.errors");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const [rows, setRows] = useState<SubmissionTableRow[]>([]);
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeSelection, setScopeSelection] = useState<SubmissionScopeSelection>(EMPTY_SUBMISSION_SCOPE);
  const [scopeOptions, setScopeOptions] = useState<{ grades: ScopeEntityOption[]; sections: ScopeEntityOption[]; classrooms: ScopeEntityOption[] }>({ grades: [], sections: [], classrooms: [] });
  const [scopeWarning, setScopeWarning] = useState<string | null>(null);
  const [isScopeLoading, setIsScopeLoading] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionScope, setCorrectionScope] = useState<AutomaticCorrectionScope>("filtered");
  const [correctionTargets, setCorrectionTargets] = useState<string[]>([]);
  const [isCorrectionPreviewLoading, setIsCorrectionPreviewLoading] = useState(false);
  const [isCorrectionRunning, setIsCorrectionRunning] = useState(false);
  const [correctionProgress, setCorrectionProgress] = useState<AutomaticCorrectionBatchProgress | null>(null);
  const [correctionResult, setCorrectionResult] = useState<AutomaticCorrectionBatchResult | null>(null);
  const sections = useMemo(() => getSubmissionSections(scopeOptions.sections, scopeSelection.gradeId), [scopeOptions.sections, scopeSelection.gradeId]);
  const classrooms = useMemo(() => getSubmissionClassrooms(scopeOptions.classrooms, scopeSelection.sectionId), [scopeOptions.classrooms, scopeSelection.sectionId]);
  const assessmentsHref = buildAssessmentsHref({ locale, context: searchParams });
  const canAutoCorrect = hasPermission("grades.submissions.review")
    && hasPermission("grades.questions.view");

  const statusOptions = useMemo(() => [
    { value: "", label: t("allStatuses") },
    ...(["in_progress", "submitted", "corrected"] as const).map((value) => ({
      value,
      label: t(`statuses.${submissionStatusMessageKey(value)}`),
    })),
  ], [t]);

  const columns = useMemo<Column<SubmissionTableRow>[]>(() => [
    {
      key: "student",
      label: t("student"),
      sortable: false,
      render: (_value, row) => (
        <span className="font-medium">
          {locale === "ar" ? row.student?.nameAr || row.student?.nameEn : row.student?.nameEn}
        </span>
      ),
    },
    {
      key: "grade",
      label: t("grade"),
      sortable: false,
      render: (_value, row) => row.enrollment?.gradeName || "-",
    },
    {
      key: "section",
      label: t("section"),
      sortable: false,
      render: (_value, row) => row.enrollment?.sectionName || "-",
    },
    {
      key: "classroom",
      label: t("class"),
      sortable: false,
      render: (_value, row) => row.enrollment?.classroomName || "-",
    },
    {
      key: "status",
      label: t("status"),
      sortable: false,
      render: (_value, row) => t(`statuses.${submissionStatusMessageKey(row.status)}`),
    },
    {
      key: "progress",
      label: t("progress"),
      sortable: false,
      render: (_value, row) => `${row.progress.answeredCount}/${row.progress.totalQuestions}`,
    },
    {
      key: "pending",
      label: t("pending"),
      sortable: false,
      render: (_value, row) => row.progress.pendingCorrectionCount > 0
        ? <ManualCorrectionWarning pendingCount={row.progress.pendingCorrectionCount} compact />
        : 0,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (_value, row) => (
        <div className="text-end" data-row-action>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(buildSubmissionDetailHref({ locale, submissionId: row.id, source: "assessment-submissions", assessmentId, context: searchParams }))}
          >
            {t("open")}
          </Button>
        </div>
      ),
    },
  ], [assessmentId, locale, router, searchParams, t]);

  useEffect(() => {
    const year = searchParams.get("year");
    const term = searchParams.get("term");
    if (!year || !term) { setScopeWarning(t("filterOptionsUnavailable")); return; }
    const controller = new AbortController();
    setIsScopeLoading(true);
    void fetchGradesFiltersData(year, term)
      .then(({ grades, sections: nextSections, classrooms: nextClassrooms }) => {
        if (controller.signal.aborted) return;
        setScopeOptions({ grades, sections: nextSections, classrooms: nextClassrooms });
        setScopeWarning(null);
      })
      .catch(() => { if (!controller.signal.aborted) setScopeWarning(t("filterOptionsUnavailable")); })
      .finally(() => { if (!controller.signal.aborted) setIsScopeLoading(false); });
    return () => controller.abort();
  }, [searchParams, t]);

  const loadSubmissions = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listAssessmentSubmissions(assessmentId, toSubmissionListFilters(scopeSelection, status, debouncedSearch));
      if (!signal.aborted) setRows(response.items.map((row) => ({ ...row })));
    } catch (requestError) {
      if (!signal.aborted) setError(errorT(mapGradesApiError(requestError)));
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [assessmentId, debouncedSearch, errorT, scopeSelection, status]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadSubmissions(controller.signal));
    return () => controller.abort();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!isCorrectionOpen) return;
    const controller = new AbortController();
    setIsCorrectionPreviewLoading(true);
    setCorrectionTargets([]);
    const filters = automaticCorrectionFilters(
      correctionScope,
      scopeSelection,
      status,
      debouncedSearch,
    );
    void listAssessmentSubmissions(assessmentId, filters)
      .then(({ items }) => {
        if (!controller.signal.aborted) {
          setCorrectionTargets(items.filter((row) => row.status === "submitted").map((row) => row.id));
        }
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(errorT(mapGradesApiError(requestError)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCorrectionPreviewLoading(false);
      });
    return () => controller.abort();
  }, [assessmentId, correctionScope, debouncedSearch, errorT, isCorrectionOpen, scopeSelection, status]);

  const runCorrection = async (submissionIds: readonly string[]) => {
    if (submissionIds.length === 0 || isCorrectionRunning) return;
    setIsCorrectionRunning(true);
    setCorrectionProgress(null);
    setError(null);
    try {
      const nextResult = await executeCorrectionRun({
        assessmentId,
        academicYearId: searchParams.get("year") ?? "",
        termId: searchParams.get("term") ?? "",
        submissionIds,
        onProgress: setCorrectionProgress,
      });
      setCorrectionResult(nextResult);
      await loadSubmissions(new AbortController().signal);
    } catch (requestError) {
      setError(errorT(mapGradesApiError(requestError)));
    } finally {
      setIsCorrectionRunning(false);
    }
  };

  const openAutomaticCorrection = () => {
    setCorrectionScope("filtered");
    setCorrectionProgress(null);
    setCorrectionResult(null);
    setIsCorrectionOpen(true);
  };

  const changeCorrectionScope = (nextScope: AutomaticCorrectionScope) => {
    setCorrectionScope(nextScope);
    setCorrectionProgress(null);
    setCorrectionResult(null);
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{t("title")}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAutoCorrect ? (
            <Button variant="primary" onClick={openAutomaticCorrection}>
              {t("autoCorrection.open")}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            leftIcon={locale === "ar"
              ? <ArrowRight className="h-4 w-4" aria-hidden="true" />
              : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => router.push(assessmentsHref)}
          >
            {t("backToAssessments")}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select
          value={status}
          onChange={(value) => setStatus(value as SubmissionStatus | "")}
          options={statusOptions}
          placeholder={t("allStatuses")}
          aria-label={t("status")}
        />
        <Select value={scopeSelection.gradeId} onChange={(gradeId) => setScopeSelection((current) => changeSubmissionGrade(current, gradeId))} options={[{ value: "", label: t("allGrades") }, ...scopeOptions.grades.map((item) => ({ value: item.id, label: locale === "ar" ? item.nameAr : item.nameEn }))]} aria-label={t("grade")} disabled={isScopeLoading || !!scopeWarning} />
        <Select value={scopeSelection.sectionId} onChange={(sectionId) => setScopeSelection((current) => changeSubmissionSection(current, sectionId))} options={[{ value: "", label: t("allSections") }, ...sections.map((item) => ({ value: item.id, label: locale === "ar" ? item.nameAr : item.nameEn }))]} aria-label={t("section")} disabled={isScopeLoading || !scopeSelection.gradeId || !!scopeWarning} />
        <Select value={scopeSelection.classroomId} onChange={(classroomId) => setScopeSelection((current) => ({ ...current, classroomId }))} options={[{ value: "", label: t("allClassrooms") }, ...classrooms.map((item) => ({ value: item.id, label: locale === "ar" ? item.nameAr : item.nameEn }))]} aria-label={t("classroom")} disabled={isScopeLoading || !scopeSelection.sectionId || !!scopeWarning} />
        <Button variant="secondary" onClick={() => { setScopeSelection(EMPTY_SUBMISSION_SCOPE); setStatus(""); setSearch(""); }}>{t("resetFilters")}</Button>
      </div>
      {scopeWarning ? <div className="border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3 text-sm text-[var(--warning-text)]">{scopeWarning}</div> : null}
      {error ? <div className="border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error-text)]">{error}</div> : null}
      {!error ? (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          showPagination={false}
          showDensityToggle={false}
          emptyTitle={t("empty")}
          emptyDescription={t("subtitle")}
          searchQuery={search}
        />
      ) : null}
      <AutomaticCorrectionDialog
        isOpen={isCorrectionOpen}
        scope={correctionScope}
        eligibleCount={correctionTargets.length}
        isPreviewLoading={isCorrectionPreviewLoading}
        isRunning={isCorrectionRunning}
        progress={correctionProgress}
        result={correctionResult}
        onScopeChange={changeCorrectionScope}
        onConfirm={() => void runCorrection(correctionTargets)}
        onRetryFailed={() => void runCorrection(correctionResult?.failedSubmissionIds ?? [])}
        onClose={() => {
          if (!isCorrectionRunning) setIsCorrectionOpen(false);
        }}
      />
    </div>
  );
}
