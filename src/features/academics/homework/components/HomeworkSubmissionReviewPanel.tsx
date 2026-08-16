"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Menu,
  RefreshCcw,
  Save,
  Search,
  X,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import FilePreviewModal, {
  FilePreviewThumbnail,
  type PreviewAttachment,
} from "@/components/ui/file-preview-modal";
import { AccessDenied, ConfirmDialog } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import {
  bulkReviewHomeworkSubmissionAnswers,
  fetchHomeworkSubmission,
  listHomeworkQuestions,
  listHomeworkSubmissionAnswers,
  listHomeworkSubmissionAttachments,
  listHomeworkSubmissions,
  getHomeworkGradeSyncStatus,
  reviewHomeworkSubmission,
  reviewHomeworkSubmissionAnswer,
  syncHomeworkSubmissionGrade,
} from "@/features/academics/homework/services/homeworkService";
import type {
  HomeworkAssignmentStatus,
  BackendHomeworkCounters,
  HomeworkGradeSyncStatusUiModel,
  HomeworkSubmissionAnswerUiModel,
  HomeworkSubmissionAttachmentUiModel,
  HomeworkSubmissionListFilters,
  HomeworkSubmissionsPaginationUiModel,
  HomeworkSubmissionUiModel,
} from "@/features/academics/homework/services/homeworkApi.types";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import {
  buildHomeworkSubmissionReviewRequest,
  calculateAnswerScoreRollup,
  calculateProspectiveAnswerScoreRollup,
  chunkHomeworkAnswerReviews,
  isHomeworkAnswerReviewable,
  isHomeworkFinalReviewable,
  requiredAnswerReviewsComplete,
  validateHomeworkAnswerDraft,
  validateProspectiveAnswerScoreRollup,
} from "@/features/academics/homework/utils/homeworkReview";

const REVIEW_NOTE_MAX_LENGTH = 2000;
const SEARCH_MAX_LENGTH = 200;
const DEFAULT_PAGE_SIZE = 25;

interface HomeworkSubmissionReviewPanelProps {
  homeworkId: string;
  totalMarks: number | null;
  assignmentStatus: HomeworkAssignmentStatus;
  isGraded: boolean;
  counters?: BackendHomeworkCounters;
}

type ReviewDraft = {
  score: string;
  feedback: string;
};

type SubmissionReviewDraft = {
  awardedMarks: string;
  reviewNote: string;
};

type SubmissionStatusFilter =
  | "all"
  | NonNullable<HomeworkSubmissionListFilters["status"]>;

function statusClass(status: string) {
  if (status === "reviewed") return "bg-green-100 text-green-700";
  if (status === "submitted") return "bg-blue-100 text-blue-700";
  if (status === "late") return "bg-amber-100 text-amber-700";
  if (status === "draft") return "bg-gray-100 text-gray-700";
  return "bg-slate-100 text-slate-700";
}

function formatMaybeDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString(locale);
}

function scoreText(score?: number | null, maxScore?: number) {
  if (score == null && maxScore === undefined) return "-";
  if (maxScore === undefined) return String(score ?? "-");
  return `${score ?? "-"} / ${maxScore}`;
}

function normalizeStatus(status: string | undefined) {
  return status?.toLowerCase() ?? "submitted";
}

function scoreDraftValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

function drawerFocusableElements(container: HTMLDivElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  );
}

export default function HomeworkSubmissionReviewPanel({
  homeworkId,
  totalMarks,
  assignmentStatus,
  isGraded,
  counters,
}: HomeworkSubmissionReviewPanelProps) {
  const locale = useLocale();
  const t = useTranslations("academics.homework.review");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const { hasPermission } = usePermissions();
  const canView = hasPermission("homework.submissions.view");
  const canManage = hasPermission("homework.assignments.manage");
  const canViewGradeSyncStatus =
    hasPermission("homework.assignments.view") &&
    hasPermission("grades.items.view");
  const canSync = canManage && hasPermission("grades.items.manage");
  const canDownloadFiles = hasPermission("files.downloads.view");
  const { showError, showSuccess } = useToast();
  const [submissions, setSubmissions] = useState<HomeworkSubmissionUiModel[]>(
    [],
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [answers, setAnswers] = useState<HomeworkSubmissionAnswerUiModel[]>([]);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [attachments, setAttachments] = useState<
    HomeworkSubmissionAttachmentUiModel[]
  >([]);
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewAttachment | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isSavingSubmissionReview, setIsSavingSubmissionReview] =
    useState(false);
  const [isSyncingSubmission, setIsSyncingSubmission] = useState(false);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(
    null,
  );
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [submissionReviewDraft, setSubmissionReviewDraft] =
    useState<SubmissionReviewDraft>({
      awardedMarks: "",
      reviewNote: "",
    });
  const [statusFilter, setStatusFilter] =
    useState<SubmissionStatusFilter>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] =
    useState<HomeworkSubmissionsPaginationUiModel>({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
    });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const drawerCloseButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [gradeSyncStatus, setGradeSyncStatus] =
    useState<HomeworkGradeSyncStatusUiModel | null>(null);
  const visibleGradeSyncStatus = canViewGradeSyncStatus
    ? gradeSyncStatus
    : null;

  const selectedSubmission = useMemo(
    () =>
      submissions.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ?? null,
    [selectedSubmissionId, submissions],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("filters.statuses.all") },
      { value: "pending_review", label: t("filters.statuses.pendingReview") },
      { value: "submitted", label: t("filters.statuses.submitted") },
      { value: "late", label: t("filters.statuses.late") },
      { value: "reviewed", label: t("filters.statuses.reviewed") },
    ],
    [t],
  );

  const pageSizeOptions = useMemo(
    () => [
      { value: "10", label: "10" },
      { value: "25", label: "25" },
      { value: "50", label: "50" },
      { value: "100", label: "100" },
    ],
    [],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / Math.max(1, pagination.limit)),
  );

  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(
    pagination.total,
    pagination.page * pagination.limit,
  );

  const reviewNoteLength = submissionReviewDraft.reviewNote.length;
  const effectiveTotalMarks = selectedSubmission?.totalMarks ?? totalMarks;
  const hasQuestions = questions.length > 0;
  const answerScoreRollup = useMemo(
    () => calculateAnswerScoreRollup(answers),
    [answers],
  );
  const answerReviewable = Boolean(
    selectedSubmission &&
    isHomeworkAnswerReviewable(assignmentStatus, selectedSubmission.status),
  );
  const finalReviewable = Boolean(
    selectedSubmission &&
    isHomeworkFinalReviewable(assignmentStatus, selectedSubmission.status),
  );
  const requiredReviewsAreComplete = useMemo(
    () => requiredAnswerReviewsComplete(questions, answers),
    [answers, questions],
  );
  const requiredAnswerProgress = useMemo(() => {
    const requiredQuestions = questions.filter(
      (question) => question.isRequired,
    );
    return {
      total: requiredQuestions.length,
      reviewed: requiredQuestions.filter((question) =>
        answers.some(
          (answer) =>
            answer.questionId === question.id && Boolean(answer.reviewedAt),
        ),
      ).length,
    };
  }, [answers, questions]);

  const answerDraftValues = useMemo(
    () =>
      new Map(
        answers.map((answer) => {
          const draft = drafts[answer.id];
          return [
            answer.id,
            {
              score: draft?.score.trim() ? Number(draft.score) : null,
              feedback: draft?.feedback ?? null,
              maxScore: answer.maxScore,
            },
          ] as const;
        }),
      ),
    [answers, drafts],
  );
  const answerErrors = useMemo(
    () =>
      Object.fromEntries(
        answers.map((answer) => [
          answer.id,
          validateHomeworkAnswerDraft(answerDraftValues.get(answer.id) ?? {}),
        ]),
      ),
    [answerDraftValues, answers],
  );
  const prospectiveRollup = useMemo(
    () => calculateProspectiveAnswerScoreRollup(answers, answerDraftValues),
    [answerDraftValues, answers],
  );
  const prospectiveRollupError = validateProspectiveAnswerScoreRollup(
    prospectiveRollup,
    effectiveTotalMarks,
  );

  const submissionStatusLabel = useCallback(
    (status: string | undefined) => {
      switch (normalizeStatus(status)) {
        case "late":
          return t("statuses.late");
        case "reviewed":
          return t("statuses.reviewed");
        case "pending_review":
          return t("statuses.pendingReview");
        case "submitted":
        default:
          return t("statuses.submitted");
      }
    },
    [t],
  );

  const isSubmissionReviewDirty =
    selectedSubmission !== null &&
    (submissionReviewDraft.awardedMarks !==
      scoreDraftValue(selectedSubmission.awardedMarks) ||
      submissionReviewDraft.reviewNote !==
        (selectedSubmission.reviewNote ?? ""));

  const isAnswerReviewDirty = useCallback(
    (answer: HomeworkSubmissionAnswerUiModel) => {
      const draft = drafts[answer.id];
      return (
        (draft?.score ?? "") !== scoreDraftValue(answer.score) ||
        (draft?.feedback ?? "") !== (answer.feedback ?? "")
      );
    },
    [drafts],
  );

  const dirtyAnswerCount = useMemo(
    () => answers.filter(isAnswerReviewDirty).length,
    [answers, isAnswerReviewDirty],
  );
  const hasUnsavedChanges = isSubmissionReviewDirty || dirtyAnswerCount > 0;

  const discardReviewChanges = useCallback(() => {
    setDrafts(
      Object.fromEntries(
        answers.map((answer) => [
          answer.id,
          {
            score: scoreDraftValue(answer.score),
            feedback: answer.feedback ?? "",
          },
        ]),
      ),
    );
    setSubmissionReviewDraft({
      awardedMarks: scoreDraftValue(selectedSubmission?.awardedMarks),
      reviewNote: selectedSubmission?.reviewNote ?? "",
    });
  }, [answers, selectedSubmission]);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
    requestAnimationFrame(() => drawerTriggerRef.current?.focus());
  }, []);

  const openMobileDrawer = useCallback((trigger: HTMLButtonElement) => {
    drawerTriggerRef.current = trigger;
    setIsMobileDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const keepFocusInDrawer = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const focusableElements = drawerFocusableElements(drawerPanelRef.current);
      if (focusableElements.length === 0) return;
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };
    window.addEventListener("keydown", keepFocusInDrawer);
    drawerCloseButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", keepFocusInDrawer);
  }, [closeMobileDrawer, isMobileDrawerOpen]);

  const parsedAwardedMarks = submissionReviewDraft.awardedMarks.trim()
    ? Number(submissionReviewDraft.awardedMarks)
    : undefined;
  const finalReviewResult = selectedSubmission
    ? buildHomeworkSubmissionReviewRequest({
        assignmentStatus,
        submissionStatus: selectedSubmission.status,
        hasQuestions,
        isGraded,
        totalMarks: effectiveTotalMarks,
        awardedMarks: parsedAwardedMarks,
        reviewNote: submissionReviewDraft.reviewNote,
        hasUnsavedAnswerChanges: dirtyAnswerCount > 0,
        requiredReviewsComplete: requiredReviewsAreComplete,
      })
    : { errors: { submission: "notReviewable" as const } };
  const finalReviewErrors =
    "errors" in finalReviewResult ? finalReviewResult.errors : {};
  const reviewNoteError = finalReviewErrors.reviewNote
    ? t(`validation.${finalReviewErrors.reviewNote}`, {
        max: REVIEW_NOTE_MAX_LENGTH,
      })
    : undefined;
  const awardedMarksError = finalReviewErrors.awardedMarks
    ? t(`validation.${finalReviewErrors.awardedMarks}`, {
        max: effectiveTotalMarks ?? "-",
      })
    : undefined;
  const canSaveSubmissionReview =
    canManage && finalReviewable && "request" in finalReviewResult;
  const selectedAwardedMarks = selectedSubmission?.awardedMarks;
  const observableSyncMaximum =
    visibleGradeSyncStatus?.gradeAssessment?.maxMarks;
  const hasValidAwardedMarks =
    typeof selectedAwardedMarks === "number" &&
    Number.isFinite(selectedAwardedMarks) &&
    selectedAwardedMarks >= 0 &&
    (effectiveTotalMarks == null || selectedAwardedMarks <= effectiveTotalMarks);
  const needsGradeAssessmentLink =
    canViewGradeSyncStatus && visibleGradeSyncStatus?.linked !== true;
  const canSyncSelectedSubmission = Boolean(
    canSync &&
    selectedSubmission &&
    normalizeStatus(selectedSubmission.status) === "reviewed" &&
    hasValidAwardedMarks &&
    (!needsGradeAssessmentLink &&
        (observableSyncMaximum == null ||
          selectedAwardedMarks <= observableSyncMaximum)),
  );

  const visibleSubmissionSummary = useMemo(() => {
    return submissions.reduce(
      (summary, submission) => {
        const status = normalizeStatus(submission.status);
        summary.total += 1;
        if (status === "reviewed") summary.reviewed += 1;
        if (status === "submitted" || status === "late") summary.pending += 1;
        if (status === "late" || submission.isLate) summary.late += 1;
        return summary;
      },
      { total: 0, pending: 0, late: 0, reviewed: 0 },
    );
  }, [submissions]);
  const submissionSummary = counters
    ? {
        total:
          (counters.submitted ?? 0) +
          (counters.late ?? 0) +
          (counters.reviewed ?? 0),
        pending: (counters.submitted ?? 0) + (counters.late ?? 0),
        late: counters.late ?? 0,
        reviewed: counters.reviewed ?? 0,
      }
    : visibleSubmissionSummary;

  const updateSelectedSubmission = useCallback(
    (updated: HomeworkSubmissionUiModel) => {
      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === updated.id ? updated : submission,
        ),
      );
      setSubmissionReviewDraft({
        awardedMarks:
          updated.awardedMarks === undefined
            ? ""
            : String(updated.awardedMarks),
        reviewNote: updated.reviewNote ?? "",
      });
    },
    [],
  );

  const loadSubmissions = useCallback(async () => {
    if (!canView) return;
    setIsLoadingSubmissions(true);
    try {
      const filters: HomeworkSubmissionListFilters = {
        page,
        limit,
        ...(statusFilter === "all" ? {} : { status: statusFilter }),
        ...(appliedSearch.trim() ? { search: appliedSearch.trim() } : {}),
      };
      const result = await listHomeworkSubmissions(homeworkId, filters);
      const nextSubmissions = result.items;
      setSubmissions(nextSubmissions);
      setPagination(result.pagination);
      setSelectedSubmissionId((current) =>
        current &&
        nextSubmissions.some((submission) => submission.id === current)
          ? current
          : (nextSubmissions[0]?.id ?? null),
      );
    } catch (error) {
      showError(
        t("errors.loadSubmissions", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
      setPagination({ page, limit, total: 0 });
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, [
    appliedSearch,
    canView,
    homeworkId,
    limit,
    page,
    showError,
    statusFilter,
    t,
    tHomeworkError,
  ]);

  const loadSubmissionDetail = useCallback(
    async (submissionId: string) => {
      setIsLoadingDetail(true);
      try {
        const [nextSubmission, nextAnswers, nextAttachments] =
          await Promise.all([
            fetchHomeworkSubmission(homeworkId, submissionId),
            listHomeworkSubmissionAnswers(homeworkId, submissionId),
            listHomeworkSubmissionAttachments(homeworkId, submissionId),
          ]);
        updateSelectedSubmission(nextSubmission);
        setAnswers(nextAnswers);
        setAttachments(nextAttachments);
        setDrafts(
          Object.fromEntries(
            nextAnswers.map((answer) => [
              answer.id,
              {
                score: scoreDraftValue(answer.score),
                feedback: answer.feedback ?? "",
              },
            ]),
          ),
        );
      } catch (error) {
        showError(
          t("errors.loadDetail", {
            message: getHomeworkErrorMessage(error, tHomeworkError),
          }),
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [homeworkId, showError, t, tHomeworkError, updateSelectedSubmission],
  );

  useEffect(() => {
    void Promise.resolve().then(loadSubmissions);
  }, [loadSubmissions]);

  useEffect(() => {
    let active = true;
    const loadQuestions = async () => {
      try {
        const list = await listHomeworkQuestions(homeworkId);
        if (active) {
          setQuestions(list);
        }
      } catch {
        // Quietly fail
      }
    };
    void loadQuestions();
    return () => {
      active = false;
    };
  }, [homeworkId]);

  useEffect(() => {
    if (!canViewGradeSyncStatus) return;
    let active = true;
    void getHomeworkGradeSyncStatus(homeworkId)
      .then((status) => {
        if (active) setGradeSyncStatus(status);
      })
      .catch(() => {
        if (active) setGradeSyncStatus(null);
      });
    return () => {
      active = false;
    };
  }, [canViewGradeSyncStatus, homeworkId]);

  useEffect(() => {
    if (!selectedSubmissionId || !canView) return;
    void Promise.resolve().then(() =>
      loadSubmissionDetail(selectedSubmissionId),
    );
  }, [canView, loadSubmissionDetail, selectedSubmissionId]);

  const getQuestionTypeLabel = useCallback(
    (type?: string) => {
      switch (type) {
        case "MCQ_SINGLE":
          return t("questionTypes.singleChoice");
        case "MCQ_MULTI":
          return t("questionTypes.multipleChoice");
        case "TRUE_FALSE":
          return t("questionTypes.trueFalse");
        case "SHORT_ANSWER":
          return t("questionTypes.shortAnswer");
        case "ESSAY":
          return t("questionTypes.essay");
        default:
          return type || "";
      }
    },
    [t],
  );

  const renderAnswerContent = useCallback(
    (answer: HomeworkSubmissionAnswerUiModel) => {
      const question = questions.find((q) => q.id === answer.questionId);

      if (!question) {
        return (
          <div className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
            {answer.answerText || t("answers.noAnswer")}
          </div>
        );
      }

      const isChoice =
        question.questionType === "MCQ_SINGLE" ||
        question.questionType === "MCQ_MULTI" ||
        question.questionType === "TRUE_FALSE";

      if (isChoice && question.options && question.options.length > 0) {
        const selectedOptionIds = answer.selectedOptionIds || [];
        const isMulti = question.questionType === "MCQ_MULTI";

        return (
          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);
                const isCorrect = option.isCorrect;

                let boxClass =
                  "flex items-center gap-3 rounded-lg border p-3 text-sm transition ";

                if (isSelected) {
                  if (isCorrect) {
                    boxClass += "border-green-300 bg-green-50 text-green-900";
                  } else {
                    boxClass += "border-red-300 bg-red-50 text-red-900";
                  }
                } else {
                  if (isCorrect) {
                    boxClass +=
                      "border-dashed border-green-300 bg-white text-green-800";
                  } else {
                    boxClass +=
                      "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
                  }
                }

                return (
                  <div key={option.id} className={boxClass}>
                    {isMulti ? (
                      isSelected ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-green-600 text-white shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded border-2 border-gray-300 bg-white shrink-0" />
                      )
                    ) : isSelected ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-white shrink-0" />
                    )}

                    <span className="flex-1 font-medium">
                      {option.textEn || option.textAr || ""}
                    </span>

                    {isSelected && (
                      <span className="shrink-0 flex items-center">
                        {isCorrect ? (
                          <Check className="h-4 w-4 text-green-600 stroke-[3]" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 stroke-[3]" />
                        )}
                      </span>
                    )}
                    {!isSelected && isCorrect && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100/80 px-2 py-0.5 rounded-full">
                        {t("answers.correct")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("answers.studentAnswer")}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800 font-medium leading-relaxed">
              {answer.answerText || (
                <span className="italic text-gray-400">
                  {t("answers.noAnswer")}
                </span>
              )}
            </p>
          </div>

          {question.expectedAnswer && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
                {t("answers.modelAnswer")}
              </h4>
              <p className="text-sm font-medium text-indigo-950">
                {question.expectedAnswer}
              </p>
            </div>
          )}
        </div>
      );
    },
    [questions, t],
  );

  const hasActiveFilters =
    statusFilter !== "all" || Boolean(appliedSearch.trim());

  const applySearch = useCallback(() => {
    setPage(1);
    setAppliedSearch(searchDraft.trim().slice(0, SEARCH_MAX_LENGTH));
  }, [searchDraft]);

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setSearchDraft("");
    setAppliedSearch("");
    setPage(1);
  }, []);

  const selectSubmission = useCallback(
    (submissionId: string) => {
      const nextSubmission = submissions.find(
        (submission) => submission.id === submissionId,
      );
      setSelectedSubmissionId(submissionId);
      setSubmissionReviewDraft({
        awardedMarks: scoreDraftValue(nextSubmission?.awardedMarks),
        reviewNote: nextSubmission?.reviewNote ?? "",
      });
      setAnswers([]);
      setAttachments([]);
      setDrafts({});
    },
    [submissions],
  );

  const requestSubmissionSelection = useCallback(
    (submissionId: string) => {
      if (submissionId === selectedSubmissionId) return;
      if (hasUnsavedChanges) {
        setPendingSubmissionId(submissionId);
        setShowDiscardDialog(true);
        return;
      }
      selectSubmission(submissionId);
    },
    [hasUnsavedChanges, selectSubmission, selectedSubmissionId],
  );

  const discardAndSelectSubmission = useCallback(() => {
    if (pendingSubmissionId) {
      selectSubmission(pendingSubmissionId);
    }
    setPendingSubmissionId(null);
    setShowDiscardDialog(false);
  }, [pendingSubmissionId, selectSubmission]);

  const closeDiscardDialog = useCallback(() => {
    setPendingSubmissionId(null);
    setShowDiscardDialog(false);
  }, []);

  const renderSidebarContent = useCallback(
    (isDrawer = false) => (
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {t("submissions.title")}
              </h2>
              <p className="text-xs text-gray-500">
                {t("submissions.range", {
                  start: rangeStart,
                  end: rangeEnd,
                  total: pagination.total,
                })}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadSubmissions()}
              loading={isLoadingSubmissions}
              disabled={hasUnsavedChanges}
              leftIcon={<RefreshCcw className="h-4 w-4" />}
            >
              {t("actions.refresh")}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <Select
              label={t("filters.status")}
              value={statusFilter}
              options={statusOptions}
              onChange={(value) => {
                setPage(1);
                setStatusFilter(value as SubmissionStatusFilter);
              }}
              selectSize="sm"
              disabled={hasUnsavedChanges}
            />
            <Select
              label={t("filters.limit")}
              value={String(limit)}
              options={pageSizeOptions}
              onChange={(value) => {
                setPage(1);
                setLimit(Number(value));
              }}
              selectSize="sm"
              disabled={hasUnsavedChanges}
            />
            <div className="flex gap-2">
              <Input
                label={t("filters.search")}
                value={searchDraft}
                maxLength={SEARCH_MAX_LENGTH}
                onChange={(event) =>
                  setSearchDraft(event.target.value.slice(0, SEARCH_MAX_LENGTH))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
                placeholder={t("filters.searchPlaceholder")}
                helperText={t("filters.searchLimit", {
                  count: searchDraft.length,
                  max: SEARCH_MAX_LENGTH,
                })}
                inputSize="sm"
                leftIcon={<Search className="h-4 w-4" />}
                disabled={hasUnsavedChanges}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={applySearch}
                  disabled={hasUnsavedChanges}
                >
                  {t("actions.search")}
                </Button>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={hasUnsavedChanges}
                className="w-full"
              >
                {t("actions.clearFilters")}
              </Button>
            )}
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto p-2"
          aria-busy={isLoadingSubmissions}
        >
          {isLoadingSubmissions && (
            <div className="space-y-2 p-1" role="status" aria-live="polite">
              <span className="sr-only">{t("submissions.loading")}</span>
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-lg border border-gray-100 p-3"
                >
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}
          {!isLoadingSubmissions && submissions.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              {hasActiveFilters
                ? t("submissions.emptyFiltered")
                : t("submissions.empty")}
            </div>
          )}
          {!isLoadingSubmissions &&
            submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => {
                  requestSubmissionSelection(submission.id);
                  if (isDrawer) {
                    closeMobileDrawer();
                  }
                }}
                aria-current={
                  selectedSubmissionId === submission.id ? "true" : undefined
                }
                className={`mb-2 w-full cursor-pointer rounded-lg border border-border p-3 text-left transition-colors duration-200 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedSubmissionId === submission.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {submission.studentName}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatMaybeDate(submission.submittedAt, locale)}
                    </div>
                    {submission.studentNumber && (
                      <div className="mt-1 text-xs text-gray-400">
                        {submission.studentNumber}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(
                      submission.status,
                    )}`}
                  >
                    {submissionStatusLabel(submission.status)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {scoreText(
                    submission.awardedMarks,
                    submission.totalMarks ?? totalMarks ?? undefined,
                  )}
                </div>
                {submission.isLate && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    {t("submissions.late")}
                  </div>
                )}
              </button>
            ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3 bg-white">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              pagination.page <= 1 || isLoadingSubmissions || hasUnsavedChanges
            }
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-xs font-medium text-gray-500">
            {t("pagination.page", {
              page: pagination.page,
              totalPages,
            })}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={
              pagination.page >= totalPages ||
              isLoadingSubmissions ||
              hasUnsavedChanges
            }
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            {t("pagination.next")}
          </Button>
        </div>
      </div>
    ),
    [
      closeMobileDrawer,
      submissions,
      selectedSubmissionId,
      isLoadingSubmissions,
      statusFilter,
      limit,
      searchDraft,
      pagination,
      totalPages,
      locale,
      t,
      rangeStart,
      rangeEnd,
      statusOptions,
      pageSizeOptions,
      totalMarks,
      applySearch,
      clearFilters,
      hasActiveFilters,
      hasUnsavedChanges,
      loadSubmissions,
      requestSubmissionSelection,
      submissionStatusLabel,
    ],
  );

  const updateDraft = (answerId: string, updates: Partial<ReviewDraft>) => {
    setDrafts((current) => ({
      ...current,
      [answerId]: {
        score: current[answerId]?.score ?? "",
        feedback: current[answerId]?.feedback ?? "",
        ...updates,
      },
    }));
  };

  const saveAnswerReview = async (answerId: string) => {
    if (!selectedSubmissionId || !canManage || !answerReviewable) return;
    const answer = answers.find((item) => item.id === answerId);
    if (!answer || !isAnswerReviewDirty(answer)) return;
    const draft = drafts[answerId];
    const parsedScore = draft?.score.trim() ? Number(draft.score) : null;
    const errors = validateHomeworkAnswerDraft({
      score: parsedScore,
      feedback: draft?.feedback,
      maxScore: answer.maxScore,
    });
    const nextRollup = calculateProspectiveAnswerScoreRollup(
      answers,
      new Map([[answerId, { score: parsedScore }]]),
    );
    const rollupError = validateProspectiveAnswerScoreRollup(
      nextRollup,
      effectiveTotalMarks,
    );
    if (errors.score || errors.feedback || rollupError) {
      showError(
        t(`validation.${errors.score ?? errors.feedback ?? rollupError}`),
      );
      return;
    }
    setPendingAnswerId(answerId);
    try {
      const updated = await reviewHomeworkSubmissionAnswer(
        homeworkId,
        selectedSubmissionId,
        answerId,
        {
          score: parsedScore,
          feedback: draft?.feedback.trim() || null,
        },
      );
      setAnswers((current) =>
        current.map((answer) => (answer.id === answerId ? updated : answer)),
      );
      setDrafts((current) => ({
        ...current,
        [answerId]: {
          score: scoreDraftValue(updated.score),
          feedback: updated.feedback ?? "",
        },
      }));
      showSuccess(t("messages.answerSaved"));
    } catch (error) {
      showError(
        t("errors.saveAnswer", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setPendingAnswerId(null);
    }
  };

  const saveAllReviews = async () => {
    if (
      !selectedSubmissionId ||
      !canManage ||
      !answerReviewable ||
      dirtyAnswerCount === 0
    )
      return;
    const reviewItems = answers.filter(isAnswerReviewDirty).map((answer) => {
      const draft = drafts[answer.id];
      const parsedScore = draft?.score.trim() ? Number(draft.score) : null;
      return {
        answerId: answer.id,
        score: parsedScore,
        feedback: draft?.feedback.trim() || null,
      };
    });
    const firstInvalid = answers.filter(isAnswerReviewDirty).find((answer) => {
      const errors = answerErrors[answer.id];
      return errors?.score || errors?.feedback;
    });
    if (firstInvalid || prospectiveRollupError) {
      const errors = firstInvalid ? answerErrors[firstInvalid.id] : undefined;
      showError(
        t(
          `validation.${errors?.score ?? errors?.feedback ?? prospectiveRollupError}`,
        ),
      );
      return;
    }
    setIsBulkSaving(true);
    let completedBatches = 0;
    try {
      const updatedAnswers: HomeworkSubmissionAnswerUiModel[] = [];
      for (const batch of chunkHomeworkAnswerReviews(reviewItems)) {
        const updatedBatch = await bulkReviewHomeworkSubmissionAnswers(
          homeworkId,
          selectedSubmissionId,
          batch,
        );
        updatedAnswers.push(...updatedBatch);
        completedBatches += 1;
      }
      setAnswers((current) => {
        const updatedById = new Map(
          updatedAnswers.map((answer) => [answer.id, answer]),
        );
        return current.map((answer) => updatedById.get(answer.id) ?? answer);
      });
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          updatedAnswers.map((answer) => [
            answer.id,
            {
              score: scoreDraftValue(answer.score),
              feedback: answer.feedback ?? "",
            },
          ]),
        ),
      }));
      showSuccess(t("messages.allSaved"));
    } catch (error) {
      if (completedBatches > 0) {
        try {
          const reloadedAnswers = await listHomeworkSubmissionAnswers(
            homeworkId,
            selectedSubmissionId,
          );
          setAnswers(reloadedAnswers);
          setDrafts(
            Object.fromEntries(
              reloadedAnswers.map((answer) => [
                answer.id,
                {
                  score: scoreDraftValue(answer.score),
                  feedback: answer.feedback ?? "",
                },
              ]),
            ),
          );
          showError(
            t("errors.saveAllPartiallyApplied", {
              message: getHomeworkErrorMessage(error, tHomeworkError),
            }),
          );
          return;
        } catch (reloadError) {
          showError(
            t("errors.saveAllRecoveryFailed", {
              saveMessage: getHomeworkErrorMessage(error, tHomeworkError),
              reloadMessage: getHomeworkErrorMessage(
                reloadError,
                tHomeworkError,
              ),
            }),
          );
          return;
        }
      }
      showError(
        t("errors.saveAll", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setIsBulkSaving(false);
    }
  };

  const saveSubmissionReview = async () => {
    if (
      !selectedSubmissionId ||
      !canSaveSubmissionReview ||
      !("request" in finalReviewResult)
    )
      return;
    setIsSavingSubmissionReview(true);
    try {
      const updated = await reviewHomeworkSubmission(
        homeworkId,
        selectedSubmissionId,
        finalReviewResult.request,
      );
      updateSelectedSubmission(updated);
      showSuccess(t("messages.submissionSaved"));
    } catch (error) {
      showError(
        t("errors.saveSubmission", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setIsSavingSubmissionReview(false);
    }
  };

  const syncSelectedSubmission = async () => {
    if (!selectedSubmissionId || !canSyncSelectedSubmission) return;
    setIsSyncingSubmission(true);
    try {
      await syncHomeworkSubmissionGrade(homeworkId, selectedSubmissionId);
      showSuccess(t("messages.synced"));
      await loadSubmissions();
    } catch (error) {
      showError(
        t("errors.sync", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setIsSyncingSubmission(false);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label={t("summary.total")}
          value={submissionSummary.total}
        />
        <SummaryCard
          label={t("summary.pending")}
          value={submissionSummary.pending}
        />
        <SummaryCard label={t("summary.late")} value={submissionSummary.late} />
        <SummaryCard
          label={t("summary.reviewed")}
          value={submissionSummary.reviewed}
        />
      </div>

      {hasUnsavedChanges && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
          aria-live="polite"
        >
          <span>
            {t("messages.unsavedChanges", { count: dirtyAnswerCount })}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {dirtyAnswerCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void saveAllReviews()}
                disabled={!answerReviewable || Boolean(prospectiveRollupError)}
              >
                {t("actions.saveAll")}
              </Button>
            )}
            {isSubmissionReviewDirty && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void saveSubmissionReview()}
                disabled={!canSaveSubmissionReview}
              >
                {t("actions.saveChanges")}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={discardReviewChanges}
            >
              {t("actions.discardChanges")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid min-h-[calc(100vh-270px)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block rounded-lg border border-border bg-white overflow-hidden">
          {renderSidebarContent(false)}
        </aside>

        <section className="min-w-0 rounded-lg border border-border bg-white">
          {!selectedSubmission ? (
            <div className="flex flex-col h-full min-h-[420px] items-center justify-center gap-4 p-6 text-center text-sm text-gray-500">
              <span>{t("detail.selectSubmission")}</span>
              <Button
                variant="primary"
                size="sm"
                className="lg:hidden"
                onClick={(event) => openMobileDrawer(event.currentTarget)}
                leftIcon={<Menu className="h-4 w-4" />}
              >
                {t("actions.viewStudents")}
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="lg:hidden shrink-0"
                      onClick={(event) => openMobileDrawer(event.currentTarget)}
                      leftIcon={<Menu className="h-4 w-4" />}
                    >
                      {t("actions.students")}
                    </Button>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {selectedSubmission.studentName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {t("detail.submittedAt", {
                          date: formatMaybeDate(
                            selectedSubmission.submittedAt,
                            locale,
                          ),
                        })}
                      </p>
                      {selectedSubmission.studentNumber && (
                        <p className="text-xs text-gray-400">
                          {selectedSubmission.studentNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-wrap gap-2">
                      {canManage && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void saveAllReviews()}
                          loading={isBulkSaving}
                          disabled={
                            !answerReviewable ||
                            dirtyAnswerCount === 0 ||
                            Boolean(prospectiveRollupError)
                          }
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {t("actions.saveAll")}
                        </Button>
                      )}
                      {canSync && (
                        <div className="flex flex-col items-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => void syncSelectedSubmission()}
                            loading={isSyncingSubmission}
                            disabled={!canSyncSelectedSubmission}
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            {t("actions.syncSubmission")}
                          </Button>
                        </div>
                      )}
                    </div>
                    {!canSyncSelectedSubmission && (
                      <ul className="space-y-1 text-xs text-gray-500">
                        {normalizeStatus(selectedSubmission?.status) !== "reviewed" && (
                          <li>{t("guidance.syncUnavailable")}</li>
                        )}
                        {!hasValidAwardedMarks && (
                          <li>{t("guidance.validAwardedScore")}</li>
                        )}
                        {needsGradeAssessmentLink && (
                          <li>{t("guidance.gradeAssessmentLinkRequired")}</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {isLoadingDetail ? (
                  <div
                    className="space-y-4 p-1"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="sr-only">{t("detail.loading")}</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Array.from({ length: 3 }, (_, index) => (
                        <div
                          key={index}
                          className="animate-pulse rounded-lg border border-gray-100 bg-gray-50 p-4"
                        >
                          <div className="h-3 w-1/2 rounded bg-gray-200" />
                          <div className="mt-4 h-6 w-2/3 rounded bg-gray-100" />
                        </div>
                      ))}
                    </div>
                    {Array.from({ length: 3 }, (_, index) => (
                      <div
                        key={index}
                        className="animate-pulse rounded-lg border border-gray-100 p-4"
                      >
                        <div className="h-4 w-1/3 rounded bg-gray-200" />
                        <div className="mt-3 h-20 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* Status Card */}
                      <div className="rounded-lg border border-border bg-gray-50 p-4 flex flex-col justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t("detail.status")}
                        </span>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border border-transparent ${statusClass(selectedSubmission.status)}`}
                          >
                            {submissionStatusLabel(selectedSubmission.status)}
                          </span>
                        </div>
                      </div>

                      {/* Reviewed At Card */}
                      <div className="rounded-lg border border-border bg-gray-50 p-4 flex flex-col justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t("detail.reviewedAt")}
                        </span>
                        <div className="mt-2 text-sm font-semibold text-gray-800">
                          {selectedSubmission.reviewedAt ? (
                            <span className="flex items-center gap-1.5 text-green-700">
                              <CheckCircle2 className="h-4 w-4" />
                              {formatMaybeDate(
                                selectedSubmission.reviewedAt,
                                locale,
                              )}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-gray-500">
                              <Clock className="h-4 w-4" />
                              {t("detail.pendingReview")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Card */}
                      <div className="rounded-lg border border-border bg-gray-50 p-4 flex flex-col justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          {t("detail.score")}
                        </span>
                        <div className="mt-2 flex items-baseline gap-1 text-sm font-bold text-gray-900">
                          <span className="text-lg text-primary">
                            {selectedSubmission.awardedMarks !== undefined &&
                            selectedSubmission.awardedMarks !== null
                              ? selectedSubmission.awardedMarks
                              : "-"}
                          </span>
                          <span className="text-xs text-gray-400">
                            / {selectedSubmission.totalMarks ?? totalMarks}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedSubmission.bodyText && (
                      <div className="rounded-lg border border-border bg-slate-50/50 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {selectedSubmission.studentName
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {selectedSubmission.studentName}
                          </span>
                          <span className="text-xs text-gray-400">
                            • {t("detail.bodyText")}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium leading-relaxed text-gray-700">
                          {selectedSubmission.bodyText}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-border p-4">
                      <div className="mb-3 flex flex-col gap-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {t("submissionReview.title")}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {t("submissionReview.description")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Input
                          label={t("submissionReview.awardedMarks")}
                          type="number"
                          min={0}
                          max={
                            selectedSubmission.totalMarks ??
                            totalMarks ??
                            undefined
                          }
                          step="0.01"
                          value={
                            hasQuestions
                              ? answerScoreRollup
                              : submissionReviewDraft.awardedMarks
                          }
                          error={awardedMarksError}
                          onChange={(event) =>
                            setSubmissionReviewDraft((current) => ({
                              ...current,
                              awardedMarks: event.target.value,
                            }))
                          }
                          disabled={
                            !canManage ||
                            !finalReviewable ||
                            hasQuestions ||
                            !isGraded
                          }
                        />
                        <TextArea
                          label={t("submissionReview.reviewNote")}
                          value={submissionReviewDraft.reviewNote}
                          rows={2}
                          maxLength={REVIEW_NOTE_MAX_LENGTH + 1}
                          resize="vertical"
                          error={reviewNoteError}
                          helperText={t("submissionReview.reviewNoteLimit", {
                            count: reviewNoteLength,
                            max: REVIEW_NOTE_MAX_LENGTH,
                          })}
                          onChange={(event) =>
                            setSubmissionReviewDraft((current) => ({
                              ...current,
                              reviewNote: event.target.value,
                            }))
                          }
                          disabled={!canManage || !finalReviewable}
                        />
                        {canManage && (
                          <Button
                            onClick={() => void saveSubmissionReview()}
                            loading={isSavingSubmissionReview}
                            disabled={!canSaveSubmissionReview}
                            leftIcon={<Save className="h-4 w-4" />}
                          >
                            {t("actions.saveSubmission")}
                          </Button>
                        )}
                      </div>
                      {finalReviewErrors.answers && (
                        <p className="mt-2 text-sm text-red-600">
                          {t(`validation.${finalReviewErrors.answers}`)}
                        </p>
                      )}
                      {!finalReviewable && (
                        <p className="mt-2 text-sm text-gray-500">
                          {t("validation.readOnly")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("answers.title")}
                      </h3>
                      {requiredAnswerProgress.total > 0 && (
                        <p className="text-sm text-gray-600">
                          {t(
                            "guidance.requiredProgress",
                            requiredAnswerProgress,
                          )}
                        </p>
                      )}
                      {answers.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                          {t("answers.empty")}
                        </div>
                      )}
                      {answers.map((answer) => {
                        const question = questions.find(
                          (q) => q.id === answer.questionId,
                        );
                        return (
                          <article
                            key={answer.id}
                            className="rounded-lg border border-border p-4 bg-white shadow-sm"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-gray-100 pb-3 mb-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {question && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                      {getQuestionTypeLabel(
                                        question.questionType,
                                      )}
                                    </span>
                                  )}
                                  {answer.isCorrect === true && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 border border-green-200">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                      {t("answers.correct")}
                                    </span>
                                  )}
                                  {answer.isCorrect === false && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                                      <X className="h-3 w-3 stroke-[3]" />
                                      {t("answers.incorrect")}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                                  {answer.prompt}
                                </h4>
                              </div>
                              <div className="shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700">
                                {scoreText(answer.score, answer.maxScore)}
                              </div>
                            </div>

                            {renderAnswerContent(answer)}
                            <div className="flex flex-col gap-3 mt-3">
                              <Input
                                label={t("answers.score")}
                                type="number"
                                min={0}
                                max={answer.maxScore}
                                step={0.01}
                                value={drafts[answer.id]?.score ?? ""}
                                error={
                                  answerErrors[answer.id]?.score
                                    ? t(
                                        `validation.${answerErrors[answer.id].score}`,
                                        {
                                          max: answer.maxScore ?? "-",
                                        },
                                      )
                                    : prospectiveRollupError &&
                                        isAnswerReviewDirty(answer)
                                      ? t(
                                          `validation.${prospectiveRollupError}`,
                                          {
                                            max: effectiveTotalMarks ?? "-",
                                          },
                                        )
                                      : undefined
                                }
                                onChange={(event) =>
                                  updateDraft(answer.id, {
                                    score: event.target.value,
                                  })
                                }
                                disabled={!canManage || !answerReviewable}
                              />
                              <TextArea
                                label={t("answers.feedback")}
                                value={drafts[answer.id]?.feedback ?? ""}
                                rows={2}
                                maxLength={REVIEW_NOTE_MAX_LENGTH + 1}
                                resize="vertical"
                                error={
                                  answerErrors[answer.id]?.feedback
                                    ? t(
                                        `validation.${answerErrors[answer.id].feedback}`,
                                        {
                                          max: REVIEW_NOTE_MAX_LENGTH,
                                        },
                                      )
                                    : undefined
                                }
                                onChange={(event) =>
                                  updateDraft(answer.id, {
                                    feedback: event.target.value,
                                  })
                                }
                                disabled={!canManage || !answerReviewable}
                              />
                              {canManage && (
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    void saveAnswerReview(answer.id)
                                  }
                                  loading={pendingAnswerId === answer.id}
                                  disabled={
                                    !answerReviewable ||
                                    !isAnswerReviewDirty(answer) ||
                                    Boolean(answerErrors[answer.id]?.score) ||
                                    Boolean(
                                      answerErrors[answer.id]?.feedback,
                                    ) ||
                                    Boolean(prospectiveRollupError)
                                  }
                                  leftIcon={<Save className="h-4 w-4" />}
                                >
                                  {t("actions.saveAnswer")}
                                </Button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t("attachments.title")}
                      </h3>
                      {attachments.length === 0 && (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                          {t("attachments.empty")}
                        </div>
                      )}
                      <div className="grid gap-3 md:grid-cols-2">
                        {attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            disabled={!canDownloadFiles || !attachment.fileId}
                            onClick={() =>
                              setPreviewAttachment({
                                id: attachment.fileId ?? attachment.id,
                                name: attachment.title,
                                size: Number(attachment.sizeBytes) || 0,
                                type: attachment.mimeType ?? "",
                                url: attachment.url,
                              })
                            }
                            className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {canDownloadFiles && attachment.fileId ? (
                              <FilePreviewThumbnail
                                alt={attachment.title}
                                fileId={attachment.fileId}
                              />
                            ) : (
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-gray-900">
                                {attachment.title}
                              </span>
                              <span className="block truncate text-xs text-gray-500">
                                {attachment.filename ||
                                  attachment.mimeType ||
                                  "-"}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </section>
        <ConfirmDialog
          isOpen={showDiscardDialog}
          onClose={closeDiscardDialog}
          onConfirm={discardAndSelectSubmission}
          title={t("unsavedChanges.title")}
          description={t("unsavedChanges.description")}
          confirmLabel={t("unsavedChanges.discard")}
          cancelLabel={t("unsavedChanges.stay")}
          severity="warning"
        />
        <FilePreviewModal
          attachment={previewAttachment}
          isOpen={previewAttachment !== null}
          onClose={() => setPreviewAttachment(null)}
        />
        {/* Mobile Drawer Overlay */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={closeMobileDrawer}
            />
            {/* Drawer Panel */}
            <div
              ref={drawerPanelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("actions.students")}
              className={`fixed inset-y-0 w-full max-w-[345px] bg-white shadow-2xl transition-transform duration-300 flex flex-col
              ${locale === "ar" ? "right-0 border-l border-border" : "left-0 border-r border-border"}`}
            >
              <div className="flex items-center justify-between border-b border-border p-4 bg-slate-50">
                <span className="font-bold text-gray-900 text-sm">
                  {t("submissions.title")}
                </span>
                <button
                  type="button"
                  ref={drawerCloseButtonRef}
                  aria-label={t("actions.closeStudents")}
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  onClick={closeMobileDrawer}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                {renderSidebarContent(true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
