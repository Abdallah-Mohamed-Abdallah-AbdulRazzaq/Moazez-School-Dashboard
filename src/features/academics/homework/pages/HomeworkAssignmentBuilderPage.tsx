"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Ban,
  CheckCircle2,
  CircleStop,
  Loader2,
  RotateCcw,
  Save,
  Send,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/components/ui/toast/Toast";
import type {
  Assignment,
  AssignmentAttachment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";
import DesktopLayout from "@/features/academics/curriculum/components/DesktopLayout";
import MobileLayout from "@/features/academics/curriculum/components/MobileLayout";
import { DEFAULT_NEW_QUESTION } from "@/features/academics/curriculum/libs/constants";
import { calculatePointsSummary } from "@/features/academics/curriculum/utils/points";
import { distributePointsEvenly } from "@/features/academics/curriculum/utils/points";
import type { ValidationErrors } from "@/features/academics/curriculum/types/types";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  cancelHomeworkAssignment,
  closeHomeworkAssignment,
  createHomeworkAttachment,
  createHomeworkQuestion,
  deleteHomeworkAttachment,
  deleteHomeworkQuestion,
  fetchHomeworkAssignment,
  listHomeworkAttachments,
  listHomeworkQuestions,
  publishHomeworkAssignment,
  reorderHomeworkQuestion,
  updateHomeworkAssignment,
  updateHomeworkQuestion,
} from "@/features/academics/homework/services/homeworkService";
import { uploadHomeworkFile } from "@/features/academics/homework/services/homeworkFilesService";

const HOMEWORK_QUESTION_TYPES = [
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
] as const;
import type { HomeworkAssignmentUiModel } from "@/features/academics/homework/services/homeworkApi.types";
import {
  mapBuilderAssignmentToHomeworkUpdate,
  mapHomeworkUiToBuilderAssignment,
} from "@/features/academics/homework/services/homeworkMappers";
import { getHomeworkErrorMessage } from "@/features/academics/homework/services/homeworkErrors";
import {
  validateHomeworkAssignment,
  validateHomeworkQuestion,
} from "@/features/academics/homework/utils/homeworkValidation";
import {
  homeworkLifecycle,
  type HomeworkLifecycleAction,
} from "@/features/academics/homework/utils/homeworkLifecycle";
import HomeworkGradeSyncPanel from "@/features/academics/homework/components/HomeworkGradeSyncPanel";
import HomeworkSubmissionReviewPanel from "@/features/academics/homework/components/HomeworkSubmissionReviewPanel";
import HomeworkAssignmentDetailsCard from "@/features/academics/homework/components/HomeworkAssignmentDetailsCard";

interface HomeworkAssignmentBuilderPageProps {
  homeworkId: string;
}

type HomeworkDetailTab = "builder" | "submissions" | "grade-sync";

function statusClass(status: HomeworkAssignmentUiModel["status"]) {
  if (status === "published") return "bg-green-100 text-green-700";
  if (status === "closed") return "bg-gray-200 text-gray-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "archived") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function isTemporaryQuestion(questionId: string) {
  return questionId.startsWith("temp-question-");
}

export default function HomeworkAssignmentBuilderPage({
  homeworkId,
}: HomeworkAssignmentBuilderPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));
  const tValidation = useTranslations("validation");
  const tHomework = useTranslations("academics.homework.builder");
  const tHomeworkError = useTranslations("academics.homework.errorMessages");
  const { termStatus } = useAcademicYearTermLayoutContext();
  const { hasPermission } = usePermissions();
  const canView = hasPermission("homework.assignments.view");
  const canManage = hasPermission("homework.assignments.manage");
  const { showError, showSuccess } = useToast();
  const [homework, setHomework] = useState<HomeworkAssignmentUiModel | null>(
    null,
  );
  const [assignmentDraft, setAssignmentDraft] = useState<Assignment | null>(
    null,
  );
  const [lastSavedAssignment, setLastSavedAssignment] =
    useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [questionDraft, setQuestionDraft] = useState<AssignmentQuestion | null>(
    null,
  );
  const [lastSavedQuestionsById, setLastSavedQuestionsById] = useState<
    Record<string, AssignmentQuestion>
  >({});
  const [lastSavedQuestionOrder, setLastSavedQuestionOrder] = useState<
    Record<string, number>
  >({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    HomeworkLifecycleAction | "reset" | "deleteQuestion" | null
  >(null);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
  const [tempQuestionCounter, setTempQuestionCounter] = useState(0);
  const rawTab = searchParams.get("tab");
  const activeTab: HomeworkDetailTab =
    rawTab === "submissions" || rawTab === "grade-sync" ? rawTab : "builder";

  const lifecycle = homework ? homeworkLifecycle(homework.status) : null;
  const lifecycleActions = lifecycle?.actions ?? [];
  const canRunLifecycleAction = termStatus !== "closed" && canManage;
  const isReadOnly = !canRunLifecycleAction || !lifecycle?.isEditable;

  const applyReloadedHomework = useCallback(
    (
      nextHomework: HomeworkAssignmentUiModel,
      nextQuestions: AssignmentQuestion[],
      nextAttachments: AssignmentAttachment[],
    ) => {
      const nextAssignment = mapHomeworkUiToBuilderAssignment(nextHomework);
      setHomework(nextHomework);
      setAssignmentDraft(nextAssignment);
      setLastSavedAssignment(nextAssignment);
      setQuestions(nextQuestions);
      setLastSavedQuestionsById(
        Object.fromEntries(
          nextQuestions.map((question) => [question.id, question]),
        ),
      );
      setLastSavedQuestionOrder(
        Object.fromEntries(
          nextQuestions.map((question) => [question.id, question.order]),
        ),
      );
      setAttachments(nextAttachments);
      setSelectedQuestionId((current) =>
        current && nextQuestions.some((question) => question.id === current)
          ? current
          : nextQuestions[0]?.id || null,
      );
    },
    [],
  );

  const reloadHomework = useCallback(async () => {
    const [nextHomework, nextQuestions, nextAttachments] = await Promise.all([
      fetchHomeworkAssignment(homeworkId),
      listHomeworkQuestions(homeworkId),
      listHomeworkAttachments(homeworkId),
    ]);
    applyReloadedHomework(nextHomework, nextQuestions, nextAttachments);
  }, [applyReloadedHomework, homeworkId]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await reloadHomework();
    } catch (error) {
      showError(
        tHomework("errors.loadFailed", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [reloadHomework, showError, tHomework, tHomeworkError]);

  useEffect(() => {
    if (!canView) return;
    void Promise.resolve().then(refresh);
  }, [canView, refresh]);

  useEffect(() => {
    if (!selectedQuestionId) {
      void Promise.resolve().then(() => setQuestionDraft(null));
      return;
    }
    const selected =
      questions.find((question) => question.id === selectedQuestionId) || null;
    void Promise.resolve().then(() => setQuestionDraft(selected));
  }, [questions, selectedQuestionId]);

  useEffect(() => {
    if (!assignmentDraft || !homework) return;
    void Promise.resolve().then(() => {
      setValidationErrors(
        validateHomeworkAssignment(assignmentDraft, questions, tValidation, {
          isGraded: homework.isGraded,
          publishAt: homework.publishAt,
        }),
      );
    });
  }, [assignmentDraft, homework, questions, tValidation]);

  const isAssignmentDirty = useMemo(() => {
    if (!assignmentDraft || !lastSavedAssignment) return false;
    return (
      JSON.stringify(assignmentDraft) !== JSON.stringify(lastSavedAssignment)
    );
  }, [assignmentDraft, lastSavedAssignment]);

  const dirtyQuestions = useMemo(
    () =>
      questions.filter((question) => {
        if (isTemporaryQuestion(question.id)) return true;
        const lastSavedQuestion = lastSavedQuestionsById[question.id];
        return (
          !lastSavedQuestion ||
          JSON.stringify(question) !== JSON.stringify(lastSavedQuestion)
        );
      }),
    [lastSavedQuestionsById, questions],
  );

  const isQuestionDirty = dirtyQuestions.length > 0;

  const deletedQuestionIds = useMemo(
    () =>
      Object.keys(lastSavedQuestionsById).filter(
        (questionId) =>
          !questions.some((question) => question.id === questionId),
      ),
    [lastSavedQuestionsById, questions],
  );

  const isQuestionOrderDirty = useMemo(
    () =>
      questions.some(
        (question) =>
          !isTemporaryQuestion(question.id) &&
          lastSavedQuestionOrder[question.id] !== question.order,
      ),
    [lastSavedQuestionOrder, questions],
  );

  const isDirty =
    isAssignmentDirty ||
    isQuestionDirty ||
    isQuestionOrderDirty ||
    deletedQuestionIds.length > 0;

  const pointsSummary = useMemo(
    () => calculatePointsSummary(assignmentDraft?.maxScore || 0, questions),
    [assignmentDraft?.maxScore, questions],
  );

  const selectedQuestion =
    questionDraft ||
    questions.find((question) => question.id === selectedQuestionId);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    router.push(
      `/${locale}/academics/homework${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const setActiveTab = (tab: HomeworkDetailTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "builder") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(
      `/${locale}/academics/homework/${homeworkId}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const handleSaveAssignment = async () => {
    if (!assignmentDraft || !homework || isReadOnly || !isDirty) return;

    const nextAssignmentErrors = validateHomeworkAssignment(
      assignmentDraft,
      questions,
      tValidation,
      { isGraded: homework.isGraded, publishAt: homework.publishAt },
    );
    if (Object.keys(nextAssignmentErrors).length > 0) {
      setValidationErrors(nextAssignmentErrors);
      showError(tHomework("errors.fixAssignmentValidation"));
      return;
    }

    const nextQuestionErrors: NonNullable<ValidationErrors["questions"]> = {};
    dirtyQuestions.forEach((question) => {
      const errors = validateHomeworkQuestion(question, tValidation);
      if (Object.keys(errors).length > 0) {
        nextQuestionErrors[question.id] = errors;
      }
    });
    if (Object.keys(nextQuestionErrors).length > 0) {
      setValidationErrors((current) => ({
        ...current,
        questions: {
          ...(current.questions || {}),
          ...nextQuestionErrors,
        },
      }));
      setSelectedQuestionId(Object.keys(nextQuestionErrors)[0]);
      showError(tHomework("errors.fixQuestionValidation"));
      return;
    }

    setIsAssignmentSaving(true);
    let hasStartedQuestionMutation = false;
    try {
      let savedQuestions = [...questions];

      for (const questionId of deletedQuestionIds) {
        hasStartedQuestionMutation = true;
        await deleteHomeworkQuestion(homeworkId, questionId);
      }

      if (isAssignmentDirty) {
        const nextHomework = await updateHomeworkAssignment(
          homeworkId,
          mapBuilderAssignmentToHomeworkUpdate(assignmentDraft),
        );
        const nextAssignment = mapHomeworkUiToBuilderAssignment(nextHomework);
        setHomework(nextHomework);
        setAssignmentDraft(nextAssignment);
        setLastSavedAssignment(nextAssignment);
      }

      for (const question of dirtyQuestions) {
        hasStartedQuestionMutation = true;
        const saved = isTemporaryQuestion(question.id)
          ? await createHomeworkQuestion(homeworkId, question)
          : await updateHomeworkQuestion(homeworkId, question.id, question);
        savedQuestions = savedQuestions.map((current) =>
          current.id === question.id ? saved : current,
        );
        if (selectedQuestionId === question.id) {
          setSelectedQuestionId(saved.id);
          setQuestionDraft(saved);
        }
      }

      const hasQuestionOrderChanges = savedQuestions.some(
        (question) =>
          !isTemporaryQuestion(question.id) &&
          lastSavedQuestionOrder[question.id] !== question.order,
      );

      if (hasQuestionOrderChanges) {
        const changedQuestions = savedQuestions.filter(
          (question) =>
            !isTemporaryQuestion(question.id) &&
            lastSavedQuestionOrder[question.id] !== question.order,
        );
        for (const question of changedQuestions) {
          hasStartedQuestionMutation = true;
          await reorderHomeworkQuestion(
            homeworkId,
            question.id,
            question.order,
          );
        }
      }

      setQuestions(savedQuestions);
      setLastSavedQuestionsById(
        Object.fromEntries(
          savedQuestions.map((question) => [question.id, question]),
        ),
      );
      setLastSavedQuestionOrder(
        Object.fromEntries(
          savedQuestions.map((question) => [question.id, question.order]),
        ),
      );
      setValidationErrors(
        validateHomeworkAssignment(
          assignmentDraft,
          savedQuestions,
          tValidation,
          { isGraded: homework.isGraded, publishAt: homework.publishAt },
        ),
      );
      showSuccess(tHomework("messages.homeworkSaved"));
    } catch (error) {
      if (hasStartedQuestionMutation) {
        try {
          await reloadHomework();
          showError(
            tHomework("errors.questionSavePartiallyApplied", {
              message: getHomeworkErrorMessage(error, tHomeworkError),
            }),
          );
        } catch (reloadError) {
          showError(
            tHomework("errors.questionSaveRecoveryFailed", {
              saveMessage: getHomeworkErrorMessage(error, tHomeworkError),
              reloadMessage: getHomeworkErrorMessage(reloadError, tHomeworkError),
            }),
          );
        }
        return;
      }
      showError(
        tHomework("errors.homeworkSaveFailed", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (isReadOnly || !assignmentDraft) return;
    const nextCounter = tempQuestionCounter + 1;
    setTempQuestionCounter(nextCounter);
    const newQuestion: AssignmentQuestion = {
      ...DEFAULT_NEW_QUESTION,
      id: `temp-question-${nextCounter}`,
      assignmentId: homeworkId,
      order: questions.length + 1,
      createdAt: new Date().toISOString(),
      options: DEFAULT_NEW_QUESTION.options.map((option, index) => ({
        ...option,
        id: `temp-option-${nextCounter}-${index + 1}`,
      })),
    };
    setQuestions((current) => [...current, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
  };

  const handleUpdateQuestionDraft = (
    questionId: string,
    updates: Partial<AssignmentQuestion>,
  ) => {
    if (isReadOnly || !questionDraft || questionDraft.id !== questionId) return;
    const nextQuestion = { ...questionDraft, ...updates };
    setQuestionDraft(nextQuestion);
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? nextQuestion : question,
      ),
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (isReadOnly) return;
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );
    setSelectedQuestionId(null);
  };

  const resetDraft = () => {
    if (!lastSavedAssignment) return;
    const savedQuestions = Object.values(lastSavedQuestionsById).sort(
      (left, right) => left.order - right.order,
    );
    setAssignmentDraft(lastSavedAssignment);
    setQuestions(savedQuestions);
    setQuestionDraft(null);
    setSelectedQuestionId(savedQuestions[0]?.id || null);
    setValidationErrors({});
    setConfirmAction(null);
  };

  const handleMoveQuestion = async (
    questionId: string,
    direction: "up" | "down",
  ) => {
    if (isReadOnly) return;
    const index = questions.findIndex((question) => question.id === questionId);
    if (
      index < 0 ||
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }
    const next = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const reordered = next.map((question, orderIndex) => ({
      ...question,
      order: orderIndex + 1,
    }));
    setQuestions(reordered);
  };

  const handleUploadFile = async (file: File) => {
    if (isReadOnly) return;
    try {
      const fileId = await uploadHomeworkFile(file);
      const attachment = await createHomeworkAttachment(homeworkId, {
        fileId,
        title: file.name,
      });
      setAttachments((current) => [...current, attachment]);
    } catch (error) {
      showError(
        tHomework("errors.attachmentUploadFailed", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isReadOnly) return;
    try {
      await deleteHomeworkAttachment(homeworkId, attachmentId);
      setAttachments((current) =>
        current.filter((attachment) => attachment.id !== attachmentId),
      );
    } catch (error) {
      showError(
        tHomework("errors.attachmentDeleteFailed", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    }
  };

  const autoDistributeQuestionPoints = () => {
    if (!assignmentDraft?.maxScore || questions.length === 0) return;
    const distributedPoints = distributePointsEvenly(
      assignmentDraft.maxScore,
      questions.length,
    );
    setQuestions((current) =>
      current.map((question, index) => ({
        ...question,
        points: distributedPoints[index] ?? question.points,
      })),
    );
  };

  const runLifecycleAction = async () => {
    if (
      !confirmAction ||
      confirmAction === "deleteQuestion" ||
      confirmAction === "reset" ||
      !canRunLifecycleAction ||
      !lifecycle?.actions.includes(confirmAction)
    )
      return;
    try {
      const nextHomework =
        confirmAction === "publish"
          ? await publishHomeworkAssignment(homeworkId)
          : confirmAction === "close"
            ? await closeHomeworkAssignment(homeworkId)
            : await cancelHomeworkAssignment(homeworkId);
      setHomework(nextHomework);
      setAssignmentDraft(mapHomeworkUiToBuilderAssignment(nextHomework));
      setLastSavedAssignment(mapHomeworkUiToBuilderAssignment(nextHomework));
      showSuccess(tHomework(`messages.${confirmAction}Completed`));
    } catch (error) {
      showError(
        tHomework("errors.lifecycleFailed", {
          message: getHomeworkErrorMessage(error, tHomeworkError),
        }),
      );
    } finally {
      setConfirmAction(null);
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  if (isLoading || !homework || !assignmentDraft) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-border bg-white px-4 py-4 shadow-sm md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="mb-1 text-sm text-gray-500 hover:text-gray-900"
            >
              {tHomework("actions.backToHomework")}
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-lg font-semibold text-gray-900">
                {assignmentDraft.titleEn ||
                  assignmentDraft.titleAr ||
                  tHomework("untitled")}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(homework.status)}`}
              >
                {tHomework(`statuses.${homework.status}`)}
              </span>
              {isAssignmentSaving && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {tHomework("states.saving")}
                </span>
              )}
              {!isAssignmentSaving && !isDirty && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {tHomework("states.saved")}
                </span>
              )}
            </div>
          </div>
          {activeTab === "builder" &&
            (lifecycle?.isEditable ||
              (canRunLifecycleAction && lifecycleActions.length > 0)) && (
              <div className="flex flex-wrap gap-2">
                {lifecycle?.isEditable && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isDirty || isAssignmentSaving}
                      onClick={() => void handleSaveAssignment()}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      {tHomework("actions.save")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isDirty || isAssignmentSaving}
                      onClick={() => setConfirmAction("reset")}
                      leftIcon={<RotateCcw className="h-4 w-4" />}
                    >
                      {tHomework("actions.reset")}
                    </Button>
                  </>
                )}
                {lifecycleActions.includes("publish") && (
                  <Button
                    size="sm"
                    disabled={isDirty || isAssignmentSaving}
                    title={
                      isDirty
                        ? tHomework("states.saveBeforePublish")
                        : undefined
                    }
                    onClick={() => setConfirmAction("publish")}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    {tHomework("actions.publish")}
                  </Button>
                )}
                {lifecycleActions.includes("close") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmAction("close")}
                    leftIcon={<CircleStop className="h-4 w-4" />}
                  >
                    {tHomework("actions.close")}
                  </Button>
                )}
                {lifecycleActions.includes("cancel") && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmAction("cancel")}
                    leftIcon={<Ban className="h-4 w-4" />}
                  >
                    {tHomework("actions.cancel")}
                  </Button>
                )}
              </div>
            )}
        </div>
        <nav className="mt-4 pt-4 flex gap-2 overflow-x-auto">
          {(
            [
              ["builder", tHomework("tabs.builder")],
              ["submissions", tHomework("tabs.submissions")],
              ["grade-sync", tHomework("tabs.gradeSync")],
            ] as Array<[HomeworkDetailTab, string]>
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "submissions" ? (
        <HomeworkSubmissionReviewPanel
          homeworkId={homeworkId}
          totalMarks={homework.totalMarks}
          assignmentStatus={homework.status}
          isGraded={homework.isGraded}
          counters={homework.counters}
        />
      ) : activeTab === "grade-sync" ? (
        <HomeworkGradeSyncPanel
          homeworkId={homeworkId}
          homework={homework}
          isGraded={homework.isGraded}
        />
      ) : isMobile ? (
        <MobileLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={selectedQuestion}
          assignment={assignmentDraft}
          attachments={attachments}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          showQuestionSave={false}
          allowedQuestionTypes={[...HOMEWORK_QUESTION_TYPES]}
          requireBothLocalizedTexts={false}
          showHomeworkFields
          showAttachmentLinks={false}
          detailsInputMode="single"
          sidebarDetails={<HomeworkAssignmentDetailsCard homework={homework} />}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) => {
            setTargetQuestionId(questionId);
            setConfirmAction("deleteQuestion");
          }}
          onMoveQuestion={(questionId, direction) =>
            void handleMoveQuestion(questionId, direction)
          }
          onUpdateAssignment={(updates) =>
            setAssignmentDraft((current) =>
              current ? { ...current, ...updates } : current,
            )
          }
          onAutoDistributePoints={autoDistributeQuestionPoints}
          onUploadFile={handleUploadFile}
          onDeleteAttachment={(attachmentId) =>
            void handleDeleteAttachment(attachmentId)
          }
        />
      ) : (
        <DesktopLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={selectedQuestion}
          assignment={assignmentDraft}
          attachments={attachments}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          showQuestionSave={false}
          allowedQuestionTypes={[...HOMEWORK_QUESTION_TYPES]}
          requireBothLocalizedTexts={false}
          showHomeworkFields
          showAttachmentLinks={false}
          detailsInputMode="single"
          sidebarDetails={<HomeworkAssignmentDetailsCard homework={homework} />}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) => {
            setTargetQuestionId(questionId);
            setConfirmAction("deleteQuestion");
          }}
          onMoveQuestion={(questionId, direction) =>
            void handleMoveQuestion(questionId, direction)
          }
          onUpdateAssignment={(updates) =>
            setAssignmentDraft((current) =>
              current ? { ...current, ...updates } : current,
            )
          }
          onAutoDistributePoints={autoDistributeQuestionPoints}
          onUploadFile={handleUploadFile}
          onDeleteAttachment={(attachmentId) =>
            void handleDeleteAttachment(attachmentId)
          }
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          setTargetQuestionId(null);
        }}
        onConfirm={() => {
          if (confirmAction === "deleteQuestion" && targetQuestionId) {
            handleDeleteQuestion(targetQuestionId);
            setConfirmAction(null);
            setTargetQuestionId(null);
            return;
          }
          if (confirmAction === "reset") {
            resetDraft();
            return;
          }
          void runLifecycleAction();
        }}
        title={
          confirmAction === "deleteQuestion"
            ? tHomework("confirm.deleteQuestionTitle")
            : confirmAction === "reset"
              ? tHomework("confirm.resetTitle")
              : tHomework("confirm.actionTitle")
        }
        description={
          confirmAction === "deleteQuestion"
            ? tHomework("confirm.deleteQuestionDescription")
            : confirmAction === "reset"
              ? tHomework("confirm.resetDescription")
              : tHomework("confirm.lifecycleDescription", {
                  action: confirmAction
                    ? tHomework(`lifecycleActions.${confirmAction}`)
                    : tHomework("lifecycleActions.continue"),
                })
        }
        confirmLabel={
          confirmAction === "cancel"
            ? tHomework("confirm.cancelHomework")
            : tHomework("confirm.confirm")
        }
        cancelLabel={tHomework("confirm.back")}
        severity={
          confirmAction === "cancel" ||
          confirmAction === "deleteQuestion" ||
          confirmAction === "reset"
            ? "danger"
            : "warning"
        }
      />
    </div>
  );
}
