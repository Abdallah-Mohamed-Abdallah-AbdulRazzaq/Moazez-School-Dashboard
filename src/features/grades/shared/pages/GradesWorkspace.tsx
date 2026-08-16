"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { Column } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import {
  fetchAssessmentSubmissionReview,
  fetchGradesFiltersData,
  fetchGradeItemDetail,
  saveAssessmentSubmissionCorrection,
  updateGradeItem,
} from "../../gradebook/services/gradesGradebookService";
import { describeGradesApiError, mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import {
  approveAssessment,
  bulkUpdateAssessmentGrades,
  deleteAssessment,
  fetchAssessmentRoster,
  getAssessmentTypeLabelKey,
  lockAssessment,
  publishAssessment,
  updateAssessment,
} from "../../assessments/services/gradesAssessmentsService";
import {
  fetchAssessments,
  fetchGradesOverview,
  fetchOverviewGradebook,
} from "../../overview/services/gradesOverviewService";
import type { Assessment } from "../../overview/types";
import type { AssessmentDeliveryMode, CreateAssessmentPayload, ExamScopeType, GradeItemStatus, GradebookStudentRow, ScopeEntityOption } from "../../shared/types";
import GradesFiltersPanel from "../components/GradesFiltersPanel";
import GradesAnalyticsSection from "../../analytics/components/GradesAnalyticsSection";
import GradesOverviewSection from "../../overview/components/GradesOverviewSection";
import GradesAssessmentsSection from "../../assessments/components/GradesAssessmentsSection";
import GradesGradebookSection from "../../gradebook/components/GradesGradebookSection";
import CreateAssessmentDialog from "../../assessments/components/CreateAssessmentDialog";
import EditGradeDialog from "../../gradebook/components/EditGradeDialog";
import ReviewAssessmentSubmissionDialog from "../../gradebook/components/ReviewAssessmentSubmissionDialog";
import BulkGradeEntryDialog from "../../assessments/components/BulkGradeEntryDialog";
import { fetchGradesAnalytics } from "../../analytics/services/gradesAnalyticsService";
import type { GradesAnalyticsReport } from "../../analytics/types";
import type { AssessmentSubmissionReview } from "../../shared/types";
import GradesGlobalExportModal from "../components/export/GradesGlobalExportModal";
import {
  exportGradesData,
  formatGradesExportDate,
  generateGradesExportFilename,
  type ExportColumn,
  type GradesExportFormat,
} from "../utils/gradesExport";
import { useGradesYearTermLayoutContext } from "@/features/grades/hooks/GradesYearTermLayoutContext";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchSubjectAllocations, type SubjectAllocation } from "@/features/academics/subjects/services/subjectsService";
import {
  isGradeEntryAvailable,
  isSubmissionReviewAvailable,
} from "../utils/assessmentWorkflow";

interface GradesWorkspaceProps {
  view: "overview" | "assessments" | "gradebook";
}

type GradebookTableRow = GradebookStudentRow & Record<string, unknown>;
type GradesOverviewExportDataset =
  | "summary"
  | "assessments"
  | "analytics_distribution";
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
type AssessmentWorkflowAction = "publish" | "approve" | "lock";

const getScopePath = (
  entities: Record<ExamScopeType, ScopeEntityOption[]>,
  scopeType: ExamScopeType,
  scopeId: string,
): Partial<Record<ExamScopeType, string>> => {
  const path: Partial<Record<ExamScopeType, string>> = {};
  let currentType: ExamScopeType | undefined = scopeType;
  let currentId = scopeId;

  while (currentType && currentType !== "school" && currentId) {
    path[currentType] = currentId;
    const entity = entities[currentType]?.find((item) => item.id === currentId);
    const parentType: ExamScopeType | undefined = currentType === "classroom" ? "section" : currentType === "section" ? "grade" : currentType === "grade" ? "stage" : undefined;
    if (!parentType || !entity?.parentId) break;
    currentType = parentType;
    currentId = entity.parentId;
  }

  return path;
};

export default function GradesWorkspace({ view }: GradesWorkspaceProps) {
  const t = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const {
    academicYearId,
    termId,
    termStatus,
    selectedAcademicYear,
    selectedTerm,
    isInitializing,
  } = useGradesYearTermLayoutContext();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isSavingSubmissionCorrection, setIsSavingSubmissionCorrection] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [assessmentActionId, setAssessmentActionId] = useState<string | null>(null);
  const [assessmentActionType, setAssessmentActionType] = useState<"publish" | "approve" | "lock" | "bulk" | "delete" | null>(null);

  const [scopeTypes, setScopeTypes] = useState<ExamScopeType[]>([]);
  const [scopeEntitiesByType, setScopeEntitiesByType] = useState<Record<ExamScopeType, ScopeEntityOption[]>>({
    school: [],
    stage: [],
    grade: [],
    section: [],
    classroom: [],
  });
  const [allSubjects, setAllSubjects] = useState<Array<{ id: string; name: string; nameAr: string; nameEn: string }>>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocation[]>([]);
  const [selectedScopeType, setSelectedScopeType] = useState<ExamScopeType>("school");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [selectedScopeIds, setSelectedScopeIds] = useState<Partial<Record<ExamScopeType, string>>>({});
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<AssessmentDeliveryMode | "">("");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rows, setRows] = useState<GradebookStudentRow[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalAssessments: 0,
    classAverage: 0,
    highestAverage: 0,
    lowestAverage: 0,
    completionRate: 0,
  });
  const [trend, setTrend] = useState<Array<{ label: string; average: number }>>([]);
  const [gradeRule, setGradeRule] = useState<{ passMark: number } | null>(null);
  const [overviewEmptyState, setOverviewEmptyState] = useState<{ reason: string; message: string } | null>(null);
  const [analyticsReport, setAnalyticsReport] = useState<GradesAnalyticsReport>({
    kpis: { classAverage: 0, passRate: 0, completionRate: 0, failingStudents: 0 },
    distribution: [],
    assessmentPerformance: [],
    topStudents: [],
    lowestStudents: [],
  });

  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [assessmentWorkflowConfirmation, setAssessmentWorkflowConfirmation] = useState<{
    assessment: Assessment;
    action: AssessmentWorkflowAction;
  } | null>(null);
  const [editGradeState, setEditGradeState] = useState<{ assessment: Assessment; row: GradebookStudentRow; comment?: string } | null>(null);
  const [submissionReviewState, setSubmissionReviewState] = useState<AssessmentSubmissionReview | null>(null);
  const [assessmentApiError, setAssessmentApiError] = useState<{ field?: string; message: string } | null>(null);
  const [gradeApiError, setGradeApiError] = useState<{ field?: string; message: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedOverviewExportDataset, setSelectedOverviewExportDataset] =
    useState<GradesOverviewExportDataset>("summary");
  const [bulkEntryState, setBulkEntryState] = useState<{
    assessment: Assessment;
    rows: Array<{ studentId: string; studentNameEn: string; studentNameAr: string; classroomName?: string; score: number | null; status: GradeItemStatus; comment?: string }>;
  } | null>(null);

  const isReadOnly = termStatus === "closed";
  const canManageAssessments = hasPermission("grades.assessments.manage");
  const canPublishAssessments = hasPermission("grades.assessments.publish");
  const canApproveAssessments = hasPermission("grades.assessments.approve");
  const canLockAssessments = hasPermission("grades.assessments.lock");
  const canManageGradeItems = hasPermission("grades.items.manage");
  const canManageQuestions = hasPermission("grades.questions.manage");
  const canViewSubmissions = hasPermission("grades.submissions.view");
  const canReviewSubmissions = hasPermission("grades.submissions.review");
  const filtersHydratedRef = useRef(false);
  const filtersContextRef = useRef<string | null>(null);
  const showSubjectFilter = true;

  const replaceQuery = useCallback((nextParams: URLSearchParams) => {
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `?${nextQuery}` : `/${locale}/grades`, { scroll: false });
  }, [locale, router, searchParams]);

  const availableScopeEntities = useMemo(
    () => scopeEntitiesByType[selectedScopeType] || [],
    [scopeEntitiesByType, selectedScopeType],
  );

  const subjects = useMemo(() => {
    const gradeId = selectedScopeIds.grade || (selectedScopeType === "grade" ? selectedScopeId : "");
    const stageId = selectedScopeIds.stage || (selectedScopeType === "stage" ? selectedScopeId : "");
    const gradeIds = gradeId
      ? new Set([gradeId])
      : stageId
        ? new Set(
          (scopeEntitiesByType.grade || [])
            .filter((grade) => grade.parentId === stageId)
            .map((grade) => grade.id),
        )
        : null;
    const allocatedSubjectIds = new Set(
      subjectAllocations
        .filter((allocation) => !gradeIds || gradeIds.has(allocation.gradeId))
        .map((allocation) => allocation.subjectId),
    );
    return allSubjects.filter((subject) => allocatedSubjectIds.has(subject.id));
  }, [allSubjects, scopeEntitiesByType.grade, selectedScopeId, selectedScopeIds.grade, selectedScopeIds.stage, selectedScopeType, subjectAllocations]);

  useEffect(() => {
    const loadFilters = async () => {
      if (!academicYearId || !termId) return;
      const contextKey = `${academicYearId}:${termId}`;
      if (filtersContextRef.current === contextKey) return;
      setIsDataLoading(true);
      try {
        const [data, allocations] = await Promise.all([
          fetchGradesFiltersData(academicYearId, termId),
          fetchSubjectAllocations(termId),
        ]);
        filtersContextRef.current = contextKey;
        setScopeTypes(data.scopeTypes);
        setScopeEntitiesByType(data.scopeEntities);
        setAllSubjects(data.subjects);
        setSubjectAllocations(allocations);

        const urlScopeType = (searchParams.get("scopeType") as ExamScopeType) || data.scopeTypes[0] || "school";
        const nextScopeType = data.scopeTypes.includes(urlScopeType) ? urlScopeType : data.scopeTypes[0] || "school";
        const availableEntities = data.scopeEntities[nextScopeType] || [];
        const urlScopeId = searchParams.get("scopeId") || "";
        const nextScopeId = availableEntities.some((entity) => entity.id === urlScopeId)
          ? urlScopeId
          : availableEntities[0]?.id || "";
        const urlSubjectId = searchParams.get("subjectId") || "";
        const nextSubjectId = data.subjects.some((subject) => subject.id === urlSubjectId)
          ? urlSubjectId
          : data.subjects[0]?.id || "";
        const urlDeliveryMode = searchParams.get("deliveryMode");
        const nextDeliveryMode =
          urlDeliveryMode === "SCORE_ONLY" || urlDeliveryMode === "QUESTION_BASED"
            ? urlDeliveryMode
            : "";

        setSelectedScopeType(nextScopeType);
        setSelectedScopeId(nextScopeId);
        setSelectedScopeIds(getScopePath(data.scopeEntities, nextScopeType, nextScopeId));
        setSelectedSubjectId(nextSubjectId);
        setSelectedDeliveryMode(nextDeliveryMode);
        filtersHydratedRef.current = true;
      } catch {
        showError(tCommon("error_loading"));
      } finally {
        setIsDataLoading(false);
      }
    };

    void loadFilters();
  }, [academicYearId, searchParams, showError, tCommon, termId]);

  useEffect(() => {
    if (!subjects.some((subject) => subject.id === selectedSubjectId)) {
      void Promise.resolve().then(() => {
        setSelectedSubjectId(subjects[0]?.id || "");
      });
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    if (!filtersHydratedRef.current || !academicYearId || !termId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("year", academicYearId);
    params.set("term", termId);
    params.set("scopeType", selectedScopeType);
    if (selectedScopeId) params.set("scopeId", selectedScopeId);
    else params.delete("scopeId");
    if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
    else params.delete("subjectId");
    if (view === "assessments" && selectedDeliveryMode) params.set("deliveryMode", selectedDeliveryMode);
    else params.delete("deliveryMode");
    replaceQuery(params);
  }, [academicYearId, replaceQuery, searchParams, selectedDeliveryMode, selectedScopeId, selectedScopeType, selectedSubjectId, termId, view]);

  const refreshGradebook = useCallback(async () => {
    if (!academicYearId || !termId || (selectedScopeType !== "school" && !selectedScopeId) || !selectedSubjectId) {
      setAssessments([]);
      setRows([]);
      setTrend([]);
      return;
    }

    setIsDataLoading(true);
    try {
      if (view === "assessments") {
        const scopedAssessments = await fetchAssessments(academicYearId, termId, {
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          includeDrafts: true,
          deliveryMode: selectedDeliveryMode || undefined,
        });
        setAssessments(scopedAssessments);
        setRows([]);
        setSummary({ totalStudents: 0, totalAssessments: 0, classAverage: 0, highestAverage: 0, lowestAverage: 0, completionRate: 0 });
        setTrend([]);
        setGradeRule(null);
        setOverviewEmptyState(null);
        setAnalyticsReport({ kpis: { classAverage: 0, passRate: 0, completionRate: 0, failingStudents: 0 }, distribution: [], assessmentPerformance: [], topStudents: [], lowestStudents: [] });
        return;
      }

      const filters = {
        scopeType: selectedScopeType,
        scopeId: selectedScopeId,
        subjectId: selectedSubjectId,
        includeDrafts: true,
      };

      const [gradebook, scopedAssessments, overview, analytics] = await Promise.all([
        fetchOverviewGradebook(academicYearId, termId, filters),
        fetchAssessments(academicYearId, termId, filters),
        fetchGradesOverview(academicYearId, termId, filters),
        fetchGradesAnalytics(academicYearId, termId, filters),
      ]);

      setAssessments(scopedAssessments);
      setRows(gradebook.rows);
      setSummary(overview.summary);
      setTrend(overview.trend);
      setGradeRule(overview.rule);
      setOverviewEmptyState(overview.emptyState);
      setAnalyticsReport(analytics);
    } catch {
      showError(tCommon("error_loading"));
    } finally {
      setIsDataLoading(false);
    }
  }, [academicYearId, selectedDeliveryMode, selectedScopeId, selectedScopeType, selectedSubjectId, showError, tCommon, termId, view]);

  useEffect(() => {
    void Promise.resolve().then(refreshGradebook);
  }, [refreshGradebook]);

  const openEditGradeDialog = useCallback(async (assessment: Assessment, row: GradebookStudentRow) => {
    if (assessment.deliveryMode === "QUESTION_BASED") {
      if (!canReviewSubmissions) return;
      try {
        const review = await fetchAssessmentSubmissionReview(
          academicYearId,
          termId,
          assessment.id,
          row.studentId,
        );
        setSubmissionReviewState(review);
      } catch (error) {
        showError(t(`errors.${mapGradesApiError(error)}`));
      }
      return;
    }

    if (!canManageGradeItems) return;
    const detail = await fetchGradeItemDetail(academicYearId, termId, assessment.id, row.studentId);
    setGradeApiError(null);
    setEditGradeState({ assessment, row, comment: detail?.comment });
  }, [academicYearId, canManageGradeItems, canReviewSubmissions, showError, t, termId]);

  const handleSaveAssessment = async (payload: CreateAssessmentPayload) => {
    if (!canManageAssessments) return;
    try {
      setIsCreatingAssessment(true);
      setAssessmentApiError(null);
      await updateAssessment(academicYearId, termId, editingAssessment!.id, payload);
      setEditingAssessment(null);
      await refreshGradebook();
      showSuccess(t("messages.assessmentUpdated"));
    } catch (error) {
      const descriptor = describeGradesApiError(error);
      const message = t(`errors.${descriptor.key}`);
      setAssessmentApiError({ field: descriptor.field, message });
      showError(message);
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete || !canManageAssessments) return;
    try {
      setAssessmentActionId(assessmentToDelete.id);
      setAssessmentActionType("delete");
      await deleteAssessment(academicYearId, termId, assessmentToDelete.id);
      setAssessmentToDelete(null);
      await refreshGradebook();
      showSuccess(t("messages.assessmentDeleted"));
    } catch (error) {
      showError(t(`errors.${mapGradesApiError(error)}`));
    } finally {
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const handleSaveGrade = async (payload: { score: number | null; status: GradeItemStatus; comment?: string }) => {
    if (!editGradeState || !canManageGradeItems) return;
    try {
      setIsSavingGrade(true);
      setGradeApiError(null);
      await updateGradeItem(academicYearId, termId, {
        assessmentId: editGradeState.assessment.id,
        studentId: editGradeState.row.studentId,
        score: payload.score,
        status: payload.status,
        comment: payload.comment,
      });
      setEditGradeState(null);
      await refreshGradebook();
      showSuccess(t("messages.gradeSaved"));
    } catch (error) {
      const descriptor = describeGradesApiError(error);
      const message = t(`errors.${descriptor.key}`);
      setGradeApiError({ field: descriptor.field, message });
      showError(message);
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleSaveSubmissionCorrection = async (
    answers: Array<{ answerId: string; awardedPoints: number | null; teacherComment?: string }>,
  ) => {
    if (!submissionReviewState || !canReviewSubmissions) return;
    try {
      setIsSavingSubmissionCorrection(true);
      await saveAssessmentSubmissionCorrection(
        academicYearId,
        termId,
        submissionReviewState.assessment.id,
        submissionReviewState.submission.studentId,
        answers,
      );
      setSubmissionReviewState(null);
      await refreshGradebook();
      showSuccess(t("messages.questionsCorrected"));
    } catch (error) {
      showError(t(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsSavingSubmissionCorrection(false);
    }
  };

  const openBulkEntryDialog = async (assessment: Assessment) => {
    if (!canManageGradeItems) return;
    try {
      setAssessmentActionId(assessment.id);
      setAssessmentActionType("bulk");
      setIsBulkLoading(true);
      const roster = await fetchAssessmentRoster(academicYearId, termId, assessment.id);
      setBulkEntryState({ assessment, rows: roster });
    } catch (error) {
      showError(t(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsBulkLoading(false);
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const handleBulkSave = async (items: Array<{ studentId: string; score: number | null; status: GradeItemStatus; comment?: string }>) => {
    if (!bulkEntryState || !canManageGradeItems) return;
    try {
      setIsBulkSaving(true);
      await bulkUpdateAssessmentGrades(academicYearId, termId, bulkEntryState.assessment.id, items);
      setBulkEntryState(null);
      await refreshGradebook();
      showSuccess(t("messages.bulkGradesSaved"));
    } catch (error) {
      showError(t(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleAssessmentAction = async (assessmentId: string, type: "publish" | "approve" | "lock") => {
    if (
      (type === "publish" && !canPublishAssessments) ||
      (type === "approve" && !canApproveAssessments) ||
      (type === "lock" && !canLockAssessments)
    ) return;
    try {
      setAssessmentActionId(assessmentId);
      setAssessmentActionType(type);
      if (type === "publish") await publishAssessment(academicYearId, termId, assessmentId);
      if (type === "approve") await approveAssessment(academicYearId, termId, assessmentId);
      if (type === "lock") await lockAssessment(academicYearId, termId, assessmentId);
      await refreshGradebook();
      showSuccess(t(`messages.assessment${type === "publish" ? "Published" : type === "approve" ? "Approved" : "Locked"}`));
    } catch (error) {
      showError(t(`errors.${mapGradesApiError(error)}`));
    } finally {
      setAssessmentActionId(null);
      setAssessmentActionType(null);
    }
  };

  const requestAssessmentWorkflowConfirmation = (assessmentId: string, action: AssessmentWorkflowAction) => {
    const assessment = assessments.find((candidate) => candidate.id === assessmentId);
    if (assessment) setAssessmentWorkflowConfirmation({ assessment, action });
  };

  const gradebookColumns = useMemo<Column<GradebookTableRow>[]>(() => {
    const baseColumns = [
      {
        key: "studentName",
        label: t("table.student"),
        sticky: true,
        render: (_value: unknown, row: GradebookStudentRow) => (
          <div className="font-medium" style={{ color: "var(--text-primary)" }}>
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
        ),
      },
      {
        key: "classroomName",
        label: t("table.classroom"),
        render: (_value: unknown, row: GradebookStudentRow) => row.classroomName || t("table.notAssigned"),
      },
    ];

    const assessmentColumns = assessments.map((assessment) => ({
      key: assessment.id,
      label: locale === "ar" ? assessment.titleAr : assessment.title,
      sortable: false,
      render: (_value: unknown, row: GradebookStudentRow) => {
        const score = row.scoresByAssessmentId[assessment.id];
        const status = row.statusByAssessmentId[assessment.id];
        const isQuestionBased = assessment.deliveryMode === "QUESTION_BASED";
        const hasRequiredPermission = isQuestionBased
          ? canReviewSubmissions
          : canManageGradeItems;
        const isAssessmentActionAvailable = isQuestionBased
          ? isSubmissionReviewAvailable(assessment)
          : isGradeEntryAvailable(assessment);
        const isDisabled =
          isReadOnly ||
          !hasRequiredPermission ||
          !isAssessmentActionAvailable;
        const disabledReason = assessment.isLocked
          ? t("workflow.reasons.locked")
          : isReadOnly
            ? t("workflow.reasons.termClosed")
            : !hasRequiredPermission
              ? t("workflow.reasons.permission")
              : undefined;
        let label = isQuestionBased ? t("table.openReview") : t("table.missing");
        let cellStyle = {
          borderColor: "var(--warning-bg)",
          backgroundColor: "var(--warning-bg)",
          color: "var(--warning-text)",
        };
        if (status === "absent") {
          label = t("table.absent");
          cellStyle = {
            borderColor: "var(--error-bg)",
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
          };
        } else if (status === "entered" && score != null) {
          label = `${score}/${assessment.maxScore}`;
          cellStyle = {
            borderColor: "var(--success-bg)",
            backgroundColor: "var(--success-bg)",
            color: "var(--success-text)",
          };
        }

        return (
          <button
            type="button"
            onClick={() => void openEditGradeDialog(assessment, row)}
            disabled={isDisabled}
            title={disabledReason}
            className="min-w-[72px] rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={cellStyle}
          >
            {label}
          </button>
        );
      },
    }));

    return [
      ...baseColumns,
      ...assessmentColumns,
      {
        key: "average",
        label: t("table.average"),
        render: (value: unknown) => <span className="font-semibold">{formatPercent(Number(value || 0))}</span>,
      },
      {
        key: "completion",
        label: t("table.completion"),
        render: (_value: unknown, row: GradebookStudentRow) =>
          row.totalItems > 0 ? `${row.completedItems}/${row.totalItems}` : "-",
      },
    ];
  }, [assessments, canManageGradeItems, canReviewSubmissions, isReadOnly, locale, openEditGradeDialog, t]);

  const tableRows: GradebookTableRow[] = rows.map((row) => ({
    ...row,
    studentName: locale === "ar" ? row.studentNameAr : row.studentNameEn,
    completion: row.completedItems,
    ...Object.fromEntries(assessments.map((assessment) => [assessment.id, row.scoresByAssessmentId[assessment.id]])),
  }));

  const selectedScopeEntity = availableScopeEntities.find((entity) => entity.id === selectedScopeId);
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);
  const selectedContextText =
    selectedScopeEntity && selectedSubject
      ? t("filters.activeContext", {
          subject: locale === "ar" ? selectedSubject.nameAr : selectedSubject.nameEn,
          scope: locale === "ar" ? selectedScopeEntity.nameAr : selectedScopeEntity.nameEn,
        })
      : selectedScopeEntity
        ? locale === "ar" ? selectedScopeEntity.nameAr : selectedScopeEntity.nameEn
        : null;

  const visibleAssessments = view === "overview" ? assessments.slice(0, 6) : assessments;
  const getLocalizedText = useCallback(
    (valueAr: string | undefined, valueEn: string | undefined) =>
      locale === "ar" ? valueAr || valueEn || "" : valueEn || valueAr || "",
    [locale],
  );

  const getLocalizedAssessmentTitle = useCallback(
    (assessment: Assessment) =>
      locale === "ar"
        ? assessment.titleAr || assessment.title
        : assessment.title || assessment.titleAr,
    [locale],
  );

  const getStatusLabel = useCallback(
    (status: GradeItemStatus) => {
      if (status === "absent") return t("table.absent");
      if (status === "entered") return t("dialogs.editGrade.statuses.entered");
      return t("table.pending");
    },
    [t],
  );

  const getApprovalStatusLabel = useCallback(
    (status: Assessment["approvalStatus"]) => {
      if (status === "approved") return t("actions.approve");
      if (status === "published") return t("actions.publish");
      return tCommon("unsaved");
    },
    [t, tCommon],
  );

  const getDeliveryModeLabel = useCallback(
    (deliveryMode: Assessment["deliveryMode"]) =>
      deliveryMode === "QUESTION_BASED"
        ? t("dialogs.createAssessment.deliveryModes.questionBased")
        : t("dialogs.createAssessment.deliveryModes.scoreOnly"),
    [t],
  );

  const getScopeTypeEnglishLabel = useCallback((scopeType: ExamScopeType) => {
    const labels: Record<ExamScopeType, string> = {
      school: "Whole School",
      stage: "Stage",
      grade: "Grade",
      section: "Section",
      classroom: "Classroom",
    };
    return labels[scopeType];
  }, []);

  const getCurrentViewEnglishLabel = useCallback(() => {
    const labels: Record<GradesWorkspaceProps["view"], string> = {
      overview: "Overview",
      assessments: "Assessments",
      gradebook: "Gradebook",
    };
    return labels[view];
  }, [view]);

  const getCurrentViewLocalizedLabel = useCallback(
    () => t(`tabs.${view}`),
    [t, view],
  );

  const getOverviewDatasetLocalizedLabel = useCallback(
    (dataset: GradesOverviewExportDataset) => t(`export.datasets.${dataset}.label`),
    [t],
  );

  const getOverviewDatasetLocalizedDescription = useCallback(
    (dataset: GradesOverviewExportDataset) =>
      t(`export.datasets.${dataset}.description`),
    [t],
  );

  const getOverviewDatasetEnglishLabel = useCallback(
    (dataset: GradesOverviewExportDataset) => {
      const labels: Record<GradesOverviewExportDataset, string> = {
        summary: "Summary",
        assessments: "Assessments",
        analytics_distribution: "Analytics Distribution",
      };
      return labels[dataset];
    },
    [],
  );

  const localizedMetadata = useMemo(
    () => ({
      yearName: getLocalizedText(
        selectedAcademicYear?.nameAr,
        selectedAcademicYear?.nameEn || selectedAcademicYear?.name,
      ),
      termName: getLocalizedText(
        selectedTerm?.nameAr,
        selectedTerm?.nameEn || selectedTerm?.name,
      ),
      scopeTypeName: t(`filters.scopeTypes.${selectedScopeType}`),
      scopeName: selectedScopeEntity
        ? getLocalizedText(selectedScopeEntity.nameAr, selectedScopeEntity.nameEn)
        : "",
      subjectName: selectedSubject
        ? getLocalizedText(selectedSubject.nameAr, selectedSubject.nameEn)
        : "",
      viewName: getCurrentViewLocalizedLabel(),
      exportDate: formatGradesExportDate(locale),
    }),
    [
      getCurrentViewLocalizedLabel,
      getLocalizedText,
      locale,
      selectedAcademicYear,
      selectedScopeEntity,
      selectedScopeType,
      selectedSubject,
      selectedTerm,
      t,
    ],
  );

  const englishMetadata = useMemo(
    () => ({
      yearName: selectedAcademicYear?.nameEn || selectedAcademicYear?.name || "",
      termName: selectedTerm?.nameEn || selectedTerm?.name || "",
      scopeTypeName: getScopeTypeEnglishLabel(selectedScopeType),
      scopeName: selectedScopeEntity?.nameEn || "",
      subjectName: selectedSubject?.nameEn || "",
      viewName: getCurrentViewEnglishLabel(),
      exportDate: formatGradesExportDate("en"),
    }),
    [
      getCurrentViewEnglishLabel,
      getScopeTypeEnglishLabel,
      selectedAcademicYear,
      selectedScopeEntity,
      selectedScopeType,
      selectedSubject,
      selectedTerm,
    ],
  );

  const overviewDatasetOptions = useMemo(
    () => [
      {
        value: "summary",
        label: getOverviewDatasetLocalizedLabel("summary"),
        description: getOverviewDatasetLocalizedDescription("summary"),
      },
      {
        value: "assessments",
        label: getOverviewDatasetLocalizedLabel("assessments"),
        description: getOverviewDatasetLocalizedDescription("assessments"),
      },
      {
        value: "analytics_distribution",
        label: getOverviewDatasetLocalizedLabel("analytics_distribution"),
        description: getOverviewDatasetLocalizedDescription("analytics_distribution"),
      },
    ],
    [
      getOverviewDatasetLocalizedDescription,
      getOverviewDatasetLocalizedLabel,
    ],
  );

  const buildOverviewSummaryExport = useCallback(() => {
    const rowsForExport = [
      { metric: t("kpis.students"), value: summary.totalStudents },
      { metric: t("kpis.assessments"), value: summary.totalAssessments },
      { metric: t("kpis.classAverage"), value: formatPercent(summary.classAverage) },
      { metric: t("kpis.completionRate"), value: formatPercent(summary.completionRate) },
      { metric: t("summaryPanel.highest"), value: formatPercent(summary.highestAverage) },
      { metric: t("summaryPanel.lowest"), value: formatPercent(summary.lowestAverage) },
      { metric: t("summaryPanel.passMark"), value: `${gradeRule?.passMark ?? 50}%` },
      ...trend.map((point) => ({
        metric: `${t("trend.average")} - ${point.label}`,
        value: formatPercent(point.average),
      })),
    ];

    return {
      title: getOverviewDatasetLocalizedLabel("summary"),
      filename: generateGradesExportFilename(
        "grades-overview-summary",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "metric", label: t("export.columns.metric") },
        { key: "value", label: t("export.columns.value") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Overview Summary",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("summary"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "summary",
        },
        summary: {
          ...summary,
          passMark: gradeRule?.passMark ?? 50,
        },
        trend,
      },
      count:
        trend.length > 0 || assessments.length > 0 || rows.length > 0
          ? rowsForExport.length
          : 0,
    };
  }, [
    academicYearId,
    assessments.length,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    gradeRule?.passMark,
    rows.length,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    summary,
    t,
    termId,
    trend,
    view,
  ]);

  const buildAssessmentsRows = useCallback(
    (sourceAssessments: Assessment[]) =>
      sourceAssessments.map((assessment) => ({
        id: assessment.id,
        title: getLocalizedAssessmentTitle(assessment),
        titleEn: assessment.title,
        titleAr: assessment.titleAr,
        type: t(`assessmentTypes.${getAssessmentTypeLabelKey(assessment.type)}`),
        deliveryMode: getDeliveryModeLabel(assessment.deliveryMode),
        date: assessment.date,
        weight: `${assessment.weight}%`,
        maxScore: assessment.maxScore,
        approvalStatus: getApprovalStatusLabel(assessment.approvalStatus),
        locked: assessment.isLocked ? tCommon("yes") : tCommon("no"),
        scopeType: t(`filters.scopeTypes.${assessment.scopeType}`),
        scopeId: assessment.scopeId,
        sectionId: assessment.sectionId || "",
        classroomId: assessment.classroomId || "",
        subjectId: assessment.subjectId,
        termId: assessment.termId,
      })),
    [
      getApprovalStatusLabel,
      getDeliveryModeLabel,
      getLocalizedAssessmentTitle,
      t,
      tCommon,
    ],
  );

  const buildAssessmentsJsonRows = useCallback(
    (sourceAssessments: Assessment[]) =>
      sourceAssessments.map((assessment) => ({
        id: assessment.id,
        titleEn: assessment.title,
        titleAr: assessment.titleAr,
        type: assessment.type,
        deliveryMode: assessment.deliveryMode,
        date: assessment.date,
        weight: assessment.weight,
        maxScore: assessment.maxScore,
        scopeType: assessment.scopeType,
        scopeId: assessment.scopeId,
        sectionId: assessment.sectionId || null,
        classroomId: assessment.classroomId || null,
        approvalStatus: assessment.approvalStatus,
        isLocked: assessment.isLocked,
        subjectId: assessment.subjectId,
        termId: assessment.termId,
      })),
    [],
  );

  const buildOverviewAssessmentsExport = useCallback(() => {
    const rowsForExport = buildAssessmentsRows(visibleAssessments);
    return {
      title: getOverviewDatasetLocalizedLabel("assessments"),
      filename: generateGradesExportFilename(
        "grades-overview-assessments",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "id", label: t("export.columns.assessmentId") },
        { key: "title", label: t("export.columns.title") },
        { key: "titleEn", label: t("export.columns.titleEn") },
        { key: "titleAr", label: t("export.columns.titleAr") },
        { key: "type", label: t("export.columns.type") },
        { key: "deliveryMode", label: t("export.columns.deliveryMode") },
        { key: "date", label: t("export.columns.date") },
        { key: "weight", label: t("export.columns.weight") },
        { key: "maxScore", label: t("export.columns.maxScore") },
        { key: "approvalStatus", label: t("export.columns.approvalStatus") },
        { key: "locked", label: t("export.columns.locked") },
        { key: "scopeType", label: t("export.columns.scopeType") },
        { key: "scopeId", label: t("export.columns.scopeId") },
        { key: "sectionId", label: t("export.columns.sectionId") },
        { key: "classroomId", label: t("export.columns.classroomId") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Overview Assessments",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("assessments"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "assessments",
        },
        assessments: buildAssessmentsJsonRows(visibleAssessments),
      },
      count: visibleAssessments.length,
    };
  }, [
    academicYearId,
    buildAssessmentsJsonRows,
    buildAssessmentsRows,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
    visibleAssessments,
  ]);

  const buildOverviewDistributionExport = useCallback(() => {
    const rowsForExport = analyticsReport.distribution.map((item) => ({
      label: item.label,
      count: item.count,
    }));

    return {
      title: getOverviewDatasetLocalizedLabel("analytics_distribution"),
      filename: generateGradesExportFilename(
        "grades-overview-distribution",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "label", label: t("export.columns.band") },
        { key: "count", label: t("export.columns.count") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Analytics Distribution",
        metadata: {
          ...englishMetadata,
          datasetName: getOverviewDatasetEnglishLabel("analytics_distribution"),
        },
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
          dataset: "analytics_distribution",
        },
        distribution: analyticsReport.distribution,
      },
      count: analyticsReport.distribution.some((item) => item.count > 0)
        ? rowsForExport.length
        : 0,
    };
  }, [
    academicYearId,
    analyticsReport.distribution,
    englishMetadata,
    getOverviewDatasetEnglishLabel,
    getOverviewDatasetLocalizedLabel,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildAssessmentsViewExport = useCallback(() => {
    const rowsForExport = buildAssessmentsRows(assessments);

    return {
      title: t("export.datasets.assessmentsView.label"),
      filename: generateGradesExportFilename(
        "grades-assessments",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "id", label: t("export.columns.assessmentId") },
        { key: "title", label: t("export.columns.title") },
        { key: "titleEn", label: t("export.columns.titleEn") },
        { key: "titleAr", label: t("export.columns.titleAr") },
        { key: "type", label: t("export.columns.type") },
        { key: "deliveryMode", label: t("export.columns.deliveryMode") },
        { key: "date", label: t("export.columns.date") },
        { key: "weight", label: t("export.columns.weight") },
        { key: "maxScore", label: t("export.columns.maxScore") },
        { key: "approvalStatus", label: t("export.columns.approvalStatus") },
        { key: "locked", label: t("export.columns.locked") },
        { key: "scopeType", label: t("export.columns.scopeType") },
        { key: "scopeId", label: t("export.columns.scopeId") },
        { key: "sectionId", label: t("export.columns.sectionId") },
        { key: "classroomId", label: t("export.columns.classroomId") },
        { key: "subjectId", label: t("export.columns.subjectId") },
        { key: "termId", label: t("export.columns.termId") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Assessments",
        metadata: englishMetadata,
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
        },
        assessments: buildAssessmentsJsonRows(assessments),
      },
      count: rowsForExport.length,
    };
  }, [
    academicYearId,
    assessments,
    buildAssessmentsJsonRows,
    buildAssessmentsRows,
    englishMetadata,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const buildGradebookViewExport = useCallback(() => {
    const dynamicColumns = assessments.map((assessment) => ({
      key: `assessment_${assessment.id}`,
      label: getLocalizedAssessmentTitle(assessment),
    }));

    const rowsForExport = rows.map((row) => {
      const dynamicValues = Object.fromEntries(
        assessments.map((assessment) => {
          const score = row.scoresByAssessmentId[assessment.id];
          const status = row.statusByAssessmentId[assessment.id];
          const value =
            status === "entered" && score != null
              ? `${score}/${assessment.maxScore}`
              : getStatusLabel(status);
          return [`assessment_${assessment.id}`, value];
        }),
      );

      return {
        studentId: row.studentId,
        studentName: locale === "ar" ? row.studentNameAr : row.studentNameEn,
        studentNameEn: row.studentNameEn,
        studentNameAr: row.studentNameAr,
        classroomName: row.classroomName || t("table.notAssigned"),
        average: formatPercent(row.average),
        completion: `${row.completedItems}/${row.totalItems}`,
        ...dynamicValues,
      };
    });

    return {
      title: t("export.datasets.gradebook.label"),
      filename: generateGradesExportFilename(
        "grades-gradebook",
        termId,
        selectedScopeId,
      ),
      columns: [
        { key: "studentId", label: t("export.columns.studentId") },
        { key: "studentName", label: t("export.columns.studentName") },
        { key: "studentNameEn", label: t("export.columns.studentNameEn") },
        { key: "studentNameAr", label: t("export.columns.studentNameAr") },
        { key: "classroomName", label: t("table.classroom") },
        ...dynamicColumns,
        { key: "average", label: t("table.average") },
        { key: "completion", label: t("table.completion") },
      ] satisfies ExportColumn[],
      rows: rowsForExport,
      jsonData: {
        title: "Grades Gradebook",
        metadata: englishMetadata,
        filters: {
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          subjectId: selectedSubjectId,
          view,
        },
        assessments: assessments.map((assessment) => ({
          id: assessment.id,
          titleEn: assessment.title,
          titleAr: assessment.titleAr,
          maxScore: assessment.maxScore,
          date: assessment.date,
          type: assessment.type,
        })),
        students: rows.map((row) => ({
          studentId: row.studentId,
          studentNameEn: row.studentNameEn,
          studentNameAr: row.studentNameAr,
          classroomName: row.classroomName || null,
          scoresByAssessmentId: row.scoresByAssessmentId,
          statusByAssessmentId: row.statusByAssessmentId,
          average: row.average,
          completedItems: row.completedItems,
          totalItems: row.totalItems,
        })),
      },
      count: rowsForExport.length,
    };
  }, [
    academicYearId,
    assessments,
    englishMetadata,
    getLocalizedAssessmentTitle,
    getStatusLabel,
    locale,
    rows,
    selectedScopeId,
    selectedScopeType,
    selectedSubjectId,
    t,
    termId,
    view,
  ]);

  const currentExportPayload = useMemo(() => {
    if (view === "overview") {
      switch (selectedOverviewExportDataset) {
        case "assessments":
          return buildOverviewAssessmentsExport();
        case "analytics_distribution":
          return buildOverviewDistributionExport();
        case "summary":
        default:
          return buildOverviewSummaryExport();
      }
    }

    if (view === "assessments") {
      return buildAssessmentsViewExport();
    }

    return buildGradebookViewExport();
  }, [
    buildAssessmentsViewExport,
    buildGradebookViewExport,
    buildOverviewAssessmentsExport,
    buildOverviewDistributionExport,
    buildOverviewSummaryExport,
    selectedOverviewExportDataset,
    view,
  ]);

  const handleExport = async (format: GradesExportFormat) => {
    const localizedDatasetName =
      view === "overview"
        ? getOverviewDatasetLocalizedLabel(selectedOverviewExportDataset)
        : undefined;
    const englishDatasetName =
      view === "overview"
        ? getOverviewDatasetEnglishLabel(selectedOverviewExportDataset)
        : undefined;

    exportGradesData({
      title: currentExportPayload.title,
      metadata: {
        ...localizedMetadata,
        ...(localizedDatasetName ? { datasetName: localizedDatasetName } : {}),
      },
      filename: currentExportPayload.filename,
      format,
      columns: currentExportPayload.columns,
      rows: currentExportPayload.rows,
      jsonData:
        format === "json" && currentExportPayload.jsonData
          ? {
              ...(currentExportPayload.jsonData as Record<string, unknown>),
              metadata: {
                ...englishMetadata,
                ...(englishDatasetName ? { datasetName: englishDatasetName } : {}),
              },
            }
          : currentExportPayload.jsonData,
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: "var(--surface-secondary)" }}
    >
      <div className="space-y-6 p-6">
        <GradesFiltersPanel
          scopeTypes={scopeTypes}
          scopeEntities={availableScopeEntities}
          subjects={subjects}
          selectedScopeType={selectedScopeType}
          selectedScopeId={selectedScopeId}
          scopeEntitiesByType={scopeEntitiesByType}
          selectedScopeIds={selectedScopeIds}
          onHierarchyChange={(type, id) => {
            const next: Partial<Record<ExamScopeType, string>> = { ...selectedScopeIds, [type]: id };
            if (type === "stage") {
              next.grade = "";
              next.section = "";
              next.classroom = "";
            } else if (type === "grade") {
              next.section = "";
              next.classroom = "";
            } else if (type === "section") {
              next.classroom = "";
            }
            setSelectedScopeIds(next);
            setSelectedScopeType(type);
            setSelectedScopeId(id);
          }}
          selectedSubjectId={selectedSubjectId}
          selectedDeliveryMode={view === "assessments" ? selectedDeliveryMode : undefined}
          onScopeTypeChange={(scopeType) => {
            setSelectedScopeType(scopeType);
            const nextScopeId = (scopeEntitiesByType[scopeType] || [])[0]?.id || "";
            setSelectedScopeId(nextScopeId);
            setSelectedScopeIds(getScopePath(scopeEntitiesByType, scopeType, nextScopeId));
          }}
          onScopeIdChange={(scopeId) => {
            setSelectedScopeId(scopeId);
            setSelectedScopeIds(getScopePath(scopeEntitiesByType, selectedScopeType, scopeId));
          }}
          onSubjectChange={setSelectedSubjectId}
          onDeliveryModeChange={view === "assessments" ? setSelectedDeliveryMode : undefined}
          selectedContextText={selectedContextText}
          isReadOnly={isReadOnly}
          showSubjectFilter={showSubjectFilter}
          onExport={() => setIsExportModalOpen(true)}
          isExportDisabled={!currentExportPayload.count}
          onCreateAssessment={canManageAssessments ? () => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("year", academicYearId);
            params.set("term", termId);
            params.set("scopeType", selectedScopeType);
            if (selectedScopeId) params.set("scopeId", selectedScopeId);
            else params.delete("scopeId");
            params.set("subjectId", selectedSubjectId);
            router.push(`/${locale}/grades/assessments/new?${params.toString()}`);
          } : undefined}
        />

        {view === "overview" && (
          <>
            <GradesOverviewSection
              summary={summary}
              trend={trend}
              gradeRule={gradeRule}
              emptyState={overviewEmptyState}
              assessments={visibleAssessments}
              isReadOnly={isReadOnly}
              canManageAssessments={canManageAssessments}
              canPublishAssessments={canPublishAssessments}
              canApproveAssessments={canApproveAssessments}
              canLockAssessments={canLockAssessments}
              canManageGradeItems={canManageGradeItems}
              canManageQuestions={canManageQuestions}
              isBulkLoading={isBulkLoading}
              assessmentActionId={assessmentActionId}
              assessmentActionType={assessmentActionType}
              onBulkEntry={(assessment) => void openBulkEntryDialog(assessment)}
              onPublish={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "publish")}
              onApprove={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "approve")}
              onLock={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "lock")}
              onEdit={(assessment) => {
                setAssessmentApiError(null);
                setEditingAssessment(assessment);
              }}
              onManageQuestions={(assessment) => {
                const params = searchParams.toString();
                const path = `/${locale}/grades/assessments/${assessment.id}/questions`;
                router.push(params ? `${path}?${params}` : path);
              }}
            />
            <GradesAnalyticsSection isLoading={isDataLoading} report={analyticsReport} />
          </>
        )}

        {view === "assessments" && (
          <GradesAssessmentsSection
            assessments={visibleAssessments}
            isReadOnly={isReadOnly}
            canManageAssessments={canManageAssessments}
            canPublishAssessments={canPublishAssessments}
            canApproveAssessments={canApproveAssessments}
            canLockAssessments={canLockAssessments}
            canManageGradeItems={canManageGradeItems}
            canManageQuestions={canManageQuestions}
            canViewSubmissions={canViewSubmissions}
            isBulkLoading={isBulkLoading}
            assessmentActionId={assessmentActionId}
            assessmentActionType={assessmentActionType}
            onBulkEntry={(assessment) => void openBulkEntryDialog(assessment)}
            onPublish={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "publish")}
            onApprove={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "approve")}
            onLock={(assessmentId) => requestAssessmentWorkflowConfirmation(assessmentId, "lock")}
            onEdit={(assessment) => {
              setAssessmentApiError(null);
              setEditingAssessment(assessment);
            }}
            onDelete={setAssessmentToDelete}
            onManageQuestions={(assessment) => {
              const params = searchParams.toString();
              const path = `/${locale}/grades/assessments/${assessment.id}/questions`;
              router.push(params ? `${path}?${params}` : path);
            }}
            onViewSubmissions={(assessment) => {
              const params = searchParams.toString();
              const path = `/${locale}/grades/assessments/${assessment.id}/submissions`;
              router.push(params ? `${path}?${params}` : path);
            }}
          />
        )}

        {view === "gradebook" && (
          <GradesGradebookSection
            isLoading={isDataLoading}
            hasAssessments={assessments.length > 0}
            rows={tableRows}
            columns={gradebookColumns}
          />
        )}
      </div>

      <CreateAssessmentDialog
        key={editingAssessment ? `edit-assessment-${editingAssessment.id}` : "edit-assessment-closed"}
        isOpen={!!editingAssessment}
        onClose={() => setEditingAssessment(null)}
        onSubmit={handleSaveAssessment}
        termId={termId}
        scopeTypes={scopeTypes}
        scopeEntitiesByType={scopeEntitiesByType}
        subjects={subjects}
        selectedScopeType={selectedScopeType}
        selectedScopeId={selectedScopeId}
        selectedSubjectId={selectedSubjectId}
        isSubmitting={isCreatingAssessment}
        mode="edit"
        initialAssessment={editingAssessment}
        apiError={assessmentApiError}
      />

      <EditGradeDialog
        key={editGradeState ? `${editGradeState.assessment.id}-${editGradeState.row.studentId}` : "edit-grade-closed"}
        isOpen={!!editGradeState}
        onClose={() => setEditGradeState(null)}
        onSubmit={handleSaveGrade}
        assessment={editGradeState?.assessment || null}
        studentName={editGradeState ? (locale === "ar" ? editGradeState.row.studentNameAr : editGradeState.row.studentNameEn) : ""}
        initialScore={editGradeState ? editGradeState.row.scoresByAssessmentId[editGradeState.assessment.id] : null}
        initialStatus={editGradeState ? editGradeState.row.statusByAssessmentId[editGradeState.assessment.id] : "missing"}
        initialComment={editGradeState?.comment}
        apiError={gradeApiError}
        isSubmitting={isSavingGrade}
      />

      <ReviewAssessmentSubmissionDialog
        key={
          submissionReviewState
            ? `${submissionReviewState.assessment.id}-${submissionReviewState.submission.studentId}`
            : "review-submission-closed"
        }
        isOpen={!!submissionReviewState}
        onClose={() => setSubmissionReviewState(null)}
        review={submissionReviewState}
        onSubmit={handleSaveSubmissionCorrection}
        isSubmitting={isSavingSubmissionCorrection}
      />

      <GradesGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={currentExportPayload.count}
        emptyStateMessage={t("export.errors.noData")}
        datasetOptions={view === "overview" ? overviewDatasetOptions : undefined}
        selectedDataset={
          view === "overview" ? selectedOverviewExportDataset : undefined
        }
        onDatasetChange={
          view === "overview"
            ? (value) =>
                setSelectedOverviewExportDataset(
                  value as GradesOverviewExportDataset,
                )
            : undefined
        }
      />

      <BulkGradeEntryDialog
        key={bulkEntryState ? `${bulkEntryState.assessment.id}-${bulkEntryState.rows.length}` : "bulk-grade-entry-closed"}
        isOpen={!!bulkEntryState}
        onClose={() => setBulkEntryState(null)}
        onSubmit={handleBulkSave}
        assessment={bulkEntryState?.assessment || null}
        rows={bulkEntryState?.rows || []}
        isSubmitting={isBulkSaving}
      />

      <ConfirmDialog
        isOpen={!!assessmentToDelete}
        onClose={() => setAssessmentToDelete(null)}
        onConfirm={() => void handleDeleteAssessment()}
        title={t("dialogs.deleteAssessment.title")}
        description={t("dialogs.deleteAssessment.description", {
          assessment: assessmentToDelete ? (locale === "ar" ? assessmentToDelete.titleAr : assessmentToDelete.title) : "",
        })}
        confirmLabel={t("dialogs.deleteAssessment.confirm")}
        cancelLabel={t("dialogs.deleteAssessment.cancel")}
        loading={assessmentActionType === "delete" && !!assessmentActionId}
        severity="danger"
      />
      <ConfirmDialog
        isOpen={!!assessmentWorkflowConfirmation}
        onClose={() => setAssessmentWorkflowConfirmation(null)}
        onConfirm={() => {
          if (!assessmentWorkflowConfirmation) return;
          const { assessment, action } = assessmentWorkflowConfirmation;
          void handleAssessmentAction(assessment.id, action).finally(() =>
            setAssessmentWorkflowConfirmation(null),
          );
        }}
        title={t(`dialogs.workflow.${assessmentWorkflowConfirmation?.action || "publish"}.title`)}
        description={t(`dialogs.workflow.${assessmentWorkflowConfirmation?.action || "publish"}.description`, {
          assessment: assessmentWorkflowConfirmation
            ? locale === "ar"
              ? assessmentWorkflowConfirmation.assessment.titleAr
              : assessmentWorkflowConfirmation.assessment.title
            : "",
        })}
        confirmLabel={t(`actions.${assessmentWorkflowConfirmation?.action || "publish"}`)}
        cancelLabel={tCommon("cancel")}
        loading={!!assessmentActionId}
        severity={assessmentWorkflowConfirmation?.action === "lock" ? "warning" : "info"}
      />
    </div>
  );
}
