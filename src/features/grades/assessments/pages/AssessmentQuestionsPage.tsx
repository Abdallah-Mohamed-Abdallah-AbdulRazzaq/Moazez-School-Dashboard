"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import MainLoader from "@/components/ui/loaders/MainLoader";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors } from "@/features/academics/curriculum/types/types";
import { calculatePointsSummary } from "@/features/academics/curriculum/utils/points";
import { validateQuestion } from "@/features/academics/curriculum/utils/validation";
import AssessmentQuestionBuilderHeader from "../components/AssessmentQuestionBuilderHeader";
import AssessmentQuestionDesktopLayout from "../components/AssessmentQuestionDesktopLayout";
import AssessmentQuestionMobileLayout from "../components/AssessmentQuestionMobileLayout";
import {
  bulkUpdateAssessmentQuestionPoints,
  AssessmentQuestionsCreationError,
  createAssessmentQuestion,
  createAssessmentWithQuestions,
  deleteAssessmentQuestion,
  fetchAssessmentById,
  fetchAssessmentQuestions,
  reorderAssessmentQuestions,
  updateAssessment,
  updateAssessmentQuestion,
} from "../services/gradesAssessmentsService";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import type { Assessment, AssessmentQuestion, AssessmentType } from "../types";
import { useGradesRouteYearTerm } from "@/features/grades/hooks/useGradesRouteYearTerm";
import { canEditAssessmentQuestions } from "../utils/assessmentContract";
import { distributeQuestionPoints } from "../utils/distributeQuestionPoints";
import { formatLocalDateOnly } from "../../shared/utils/dateOnly";

interface AssessmentQuestionsPageProps {
  assessmentId?: string;
  mode?: "create" | "edit";
}

function validateAssessmentDraft(
  assessment: Assessment,
  questions: AssessmentQuestion[],
  tValidation: (key: string) => string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const general: string[] = [];

  if (!assessment.titleAr.trim()) {
    errors.titleAr = tValidation("required_ar");
  }
  if (!assessment.title.trim()) {
    errors.titleEn = tValidation("required_en");
  }
  if (assessment.maxScore <= 0) {
    errors.maxScore = tValidation("invalid_max_score");
  }
  if (
    assessment.expectedTimeMinutes != null &&
    (!Number.isFinite(assessment.expectedTimeMinutes) ||
      !Number.isInteger(assessment.expectedTimeMinutes) ||
      assessment.expectedTimeMinutes < 1)
  ) {
    errors.expectedTimeMinutes = tValidation("invalid_expected_time");
  }
  if (questions.length === 0) {
    general.push(tValidation("at_least_one_question"));
  }

  const questionErrors: Record<
    string,
    ReturnType<typeof validateQuestion>
  > = {};
  questions.forEach((question) => {
    const nextErrors = validateQuestion(
      question as AssignmentQuestion,
      tValidation,
    );
    if (Object.keys(nextErrors).length > 0) {
      questionErrors[question.id] = nextErrors;
    }
  });

  if (Object.keys(questionErrors).length > 0) {
    errors.questions = questionErrors;
  }
  if (general.length > 0) {
    errors.general = general;
  }

  return errors;
}

export default function AssessmentQuestionsPage({
  assessmentId,
  mode = "edit",
}: AssessmentQuestionsPageProps) {
  const t = useTranslations("academics.grades.questions");
  const tGrades = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"), {
    noSsr: true,
    defaultMatches: false,
  });
  const { showError, showSuccess } = useToast();
  const { hasPermission } = usePermissions();
  const {
    academicYearId,
    termId,
    termStatus,
    isInitializing: isLoading,
  } = useGradesRouteYearTerm();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState<Assessment | null>(
    null,
  );
  const [lastSavedAssessment, setLastSavedAssessment] =
    useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [questionDraft, setQuestionDraft] = useState<AssessmentQuestion | null>(
    null,
  );
  const [lastSavedQuestion, setLastSavedQuestion] =
    useState<AssessmentQuestion | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<
    string | null
  >(null);
  const [tempQuestionCounter, setTempQuestionCounter] = useState(0);
  const scopeTypeParam =
    (searchParams.get("scopeType") as Assessment["scopeType"]) || "school";
  const scopeIdParam = searchParams.get("scopeId") || "";
  const subjectIdParam = searchParams.get("subjectId") || "";
  const typeParam = (searchParams.get("type") as AssessmentType) || "QUIZ";
  const titleParam = searchParams.get("title") || "";
  const titleArParam = searchParams.get("titleAr") || "";
  const dateParam =
    searchParams.get("date") || formatLocalDateOnly(new Date());
  const weightParam = Number(searchParams.get("weight") || "15");
  const maxScoreParam = Number(searchParams.get("maxScore") || "20");
  const isCreateMode = mode === "create";
  const canManageAssessments = hasPermission("grades.assessments.manage");
  const canManageQuestions = hasPermission("grades.questions.manage");
  const canEditQuestions = isCreateMode
    ? canManageAssessments
    : canManageQuestions;
  const isReadOnly = isCreateMode
    ? termStatus === "closed"
    : !canEditAssessmentQuestions(assessment, termStatus);
  const isQuestionReadOnly = isReadOnly || !canEditQuestions;
  const isAssessmentReadOnly = isReadOnly || !canManageAssessments;
  const isTemporaryQuestionId = (questionId: string) => questionId.startsWith("temp-question-");

  // Question builders are focused flows: they keep year/term in the route
  // and intentionally stay outside the shared grades ContextBar layout.

  const refresh = useCallback(async () => {
    if (!academicYearId || !termId || !assessmentId) {
      return;
    }

    setIsDataLoading(true);
    try {
      const [nextAssessment, nextQuestions] = await Promise.all([
        fetchAssessmentById(academicYearId, termId, assessmentId),
        fetchAssessmentQuestions(academicYearId, termId, assessmentId),
      ]);
      setAssessment(nextAssessment);
      setAssessmentDraft(nextAssessment);
      setLastSavedAssessment(nextAssessment);
      setQuestions(nextQuestions);
      setSelectedQuestionId((current) =>
        current && nextQuestions.some((question) => question.id === current)
          ? current
          : nextQuestions[0]?.id || null,
      );
    } catch {
      showError(tCommon("error_loading"));
    } finally {
      setIsDataLoading(false);
    }
  }, [academicYearId, assessmentId, showError, tCommon, termId]);

  useEffect(() => {
    if (!isCreateMode || !termId || assessmentDraft) {
      return;
    }

    const baseAssessment: Assessment = {
      id: "draft-assessment",
      termId,
      scopeType: scopeTypeParam,
      scopeId: scopeIdParam,
      subjectId: subjectIdParam,
      title: titleParam,
      titleAr: titleArParam,
      type: typeParam,
      deliveryMode: "QUESTION_BASED",
      date: dateParam,
      weight:
        Number.isFinite(weightParam) && weightParam > 0 ? weightParam : 15,
      maxScore:
        Number.isFinite(maxScoreParam) && maxScoreParam > 0
          ? maxScoreParam
          : 20,
      expectedTimeMinutes: undefined,
      approvalStatus: "draft",
      isLocked: false,
    };
    void Promise.resolve().then(() => {
      setAssessment(baseAssessment);
      setAssessmentDraft(baseAssessment);
      setLastSavedAssessment(baseAssessment);
      setQuestions([]);
      setSelectedQuestionId(null);
      setIsDataLoading(false);
    });
  }, [
    assessmentDraft,
    dateParam,
    isCreateMode,
    maxScoreParam,
    scopeIdParam,
    scopeTypeParam,
    subjectIdParam,
    termId,
    titleArParam,
    titleParam,
    typeParam,
    weightParam,
  ]);

  useEffect(() => {
    if (isCreateMode) {
      return;
    }

    void Promise.resolve().then(refresh);
  }, [isCreateMode, refresh]);

  useEffect(() => {
    if (!isCreateMode || !termId) {
      return;
    }
    void Promise.resolve().then(() => {
      setAssessment((current) =>
        current
          ? {
              ...current,
              termId,
              scopeType: scopeTypeParam || current.scopeType,
              scopeId: scopeIdParam || current.scopeId,
              subjectId: subjectIdParam || current.subjectId,
            }
          : current,
      );
      setAssessmentDraft((current) =>
        current
          ? {
              ...current,
              termId,
              scopeType: scopeTypeParam || current.scopeType,
              scopeId: scopeIdParam || current.scopeId,
              subjectId: subjectIdParam || current.subjectId,
            }
          : current,
      );
    });
  }, [isCreateMode, scopeIdParam, scopeTypeParam, subjectIdParam, termId]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!selectedQuestionId) {
      void Promise.resolve().then(() => {
        setQuestionDraft(null);
        setLastSavedQuestion(null);
      });
      return;
    }
    const selectedQuestion =
      questions.find((question) => question.id === selectedQuestionId) || null;
    void Promise.resolve().then(() => {
      setQuestionDraft(selectedQuestion);
      setLastSavedQuestion(selectedQuestion);
    });
  }, [selectedQuestionId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!selectedQuestionId) {
      return;
    }
    const selectedQuestion =
      questions.find((question) => question.id === selectedQuestionId) || null;
    if (!selectedQuestion) {
      void Promise.resolve().then(() => {
        setQuestionDraft(null);
        setLastSavedQuestion(null);
      });
      return;
    }
    void Promise.resolve().then(() => {
      setQuestionDraft((current) =>
        current && current.id === selectedQuestion.id
          ? current
          : selectedQuestion,
      );
      setLastSavedQuestion((current) =>
        current && current.id === selectedQuestion.id
          ? current
          : selectedQuestion,
      );
    });
  }, [questions, selectedQuestionId]);

  const pointsSummary = useMemo(
    () =>
      calculatePointsSummary(
        assessmentDraft?.maxScore || 0,
        questions as AssignmentQuestion[],
      ),
    [assessmentDraft?.maxScore, questions],
  );

  useEffect(() => {
    if (!assessmentDraft) return;
    void Promise.resolve().then(() => {
      setValidationErrors(
        validateAssessmentDraft(assessmentDraft, questions, tValidation),
      );
    });
  }, [assessmentDraft, questions, tValidation]);

  const isAssessmentDirty = useMemo(() => {
    if (!assessmentDraft || !lastSavedAssessment) return false;
    return (
      JSON.stringify(assessmentDraft) !== JSON.stringify(lastSavedAssessment)
    );
  }, [assessmentDraft, lastSavedAssessment]);

  const isQuestionDirty = useMemo(() => {
    if (!questionDraft || !lastSavedQuestion) return false;
    return JSON.stringify(questionDraft) !== JSON.stringify(lastSavedQuestion);
  }, [questionDraft, lastSavedQuestion]);

  const canSaveAssessment = useMemo(() => {
    if (isCreateMode) {
      return Boolean(
        assessmentDraft?.title.trim() ||
        assessmentDraft?.titleAr.trim() ||
        questions.length > 0,
      );
    }
    return isAssessmentDirty;
  }, [assessmentDraft, isAssessmentDirty, isCreateMode, questions.length]);

  const handleBack = () => {
    const params = searchParams.toString();
    const path = isCreateMode
      ? `/${locale}/grades/assessments/new`
      : `/${locale}/grades/assessments`;
    router.push(params ? `${path}?${params}` : path);
  };

  const handleSaveAssessment = async () => {
    if (!canManageAssessments) return;
    if (
      !assessmentDraft ||
      (!isCreateMode && !assessment) ||
      (!isCreateMode && !isAssessmentDirty)
    )
      return;
    const nextValidationErrors = validateAssessmentDraft(
      assessmentDraft,
      questions,
      tValidation,
    );
    setValidationErrors(nextValidationErrors);
    if (
      Object.keys(nextValidationErrors).length > 0 ||
      (nextValidationErrors.general && nextValidationErrors.general.length > 0)
    ) {
      showError(tValidation("fix_errors_before_save"));
      return;
    }
    try {
      setIsAssignmentSaving(true);
      if (isCreateMode) {
        const createdAssessment = await createAssessmentWithQuestions(
          academicYearId,
          {
            assessment: {
              termId,
              scopeType: assessmentDraft.scopeType,
              scopeId: assessmentDraft.scopeId,
              subjectId: assessmentDraft.subjectId,
              title: assessmentDraft.title,
              titleAr: assessmentDraft.titleAr,
                type: assessmentDraft.type,
              deliveryMode: "QUESTION_BASED",
              date: assessmentDraft.date,
              weight: assessmentDraft.weight,
              maxScore: assessmentDraft.maxScore,
              expectedTimeMinutes: assessmentDraft.expectedTimeMinutes,
            },
            questions: questions.map((question, index) => ({
              ...question,
              order: index + 1,
            })),
          },
        );

        showSuccess(tGrades("messages.assessmentCreated"));
        const params = searchParams.toString();
        const path = `/${locale}/grades/assessments/${createdAssessment.id}/questions`;
        router.replace(params ? `${path}?${params}` : path);
        return;
      }

      const nextAssessment = await updateAssessment(
        academicYearId,
        termId,
        assessment!.id,
        {
          termId,
          scopeType: assessmentDraft.scopeType,
          scopeId: assessmentDraft.scopeId,
          subjectId: assessment!.subjectId,
          title: assessmentDraft.title,
          titleAr: assessmentDraft.titleAr,
            type: assessment!.type,
          deliveryMode: assessment!.deliveryMode,
          date: assessmentDraft.date,
          weight: assessment!.weight,
          maxScore: assessmentDraft.maxScore,
          expectedTimeMinutes: assessmentDraft.expectedTimeMinutes,
        },
      );
      setAssessment(nextAssessment);
      setAssessmentDraft(nextAssessment);
      setLastSavedAssessment(nextAssessment);
      showSuccess(tCommon("save_success"));
    } catch (error) {
      showError(
        tGrades(`errors.${mapGradesApiError(error)}`),
      );
      if (error instanceof AssessmentQuestionsCreationError) {
        const params = searchParams.toString();
        const path = `/${locale}/grades/assessments/${error.assessmentId}/questions`;
        router.replace(params ? `${path}?${params}` : path);
      }
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!canEditQuestions) return;
    const nextIndex = tempQuestionCounter + 1;
    setTempQuestionCounter(nextIndex);
    const tempId = `temp-question-${nextIndex}`;
    const nextQuestion: AssessmentQuestion = {
      id: tempId,
      assessmentId: assessmentId || "draft-assessment",
      assignmentId: assessmentId || "draft-assessment",
      createdAt: new Date().toISOString(),
      order: questions.length + 1,
      questionTextAr: "",
      questionTextEn: "",
      questionType: "MCQ_SINGLE",
      points: 1,
      options: [
        {
          id: `opt-${nextIndex}-1`,
          textAr: "",
          textEn: "",
          isCorrect: true,
          order: 1,
        },
        {
          id: `opt-${nextIndex}-2`,
          textAr: "",
          textEn: "",
          isCorrect: false,
          order: 2,
        },
      ],
    };
    setQuestions((current) => [...current, nextQuestion]);
    setSelectedQuestionId(tempId);
    setQuestionDraft(nextQuestion);
    setLastSavedQuestion(nextQuestion);
  };

  const handleUpdateQuestionDraft = (
    questionId: string,
    updates: Partial<AssignmentQuestion>,
  ) => {
    if (!canEditQuestions) return;
    if (!questionDraft || questionDraft.id !== questionId) return;
    const nextQuestion = { ...questionDraft, ...updates };
    setQuestionDraft(nextQuestion);
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question,
      ),
    );
  };

  const handleSaveQuestion = async () => {
    if (!canEditQuestions) return;
    if (!questionDraft || !isQuestionDirty) return;
    const errors = validateQuestion(
      questionDraft as AssignmentQuestion,
      tValidation,
    );
    if (Object.keys(errors).length > 0) {
      setValidationErrors((current) => ({
        ...current,
        questions: {
          ...(current.questions || {}),
          [questionDraft.id]: errors,
        },
      }));
      showError(tValidation("fix_errors_before_save"));
      return;
    }

    try {
      if (isCreateMode) {
        setQuestions((current) =>
          current.map((question) =>
            question.id === questionDraft.id ? questionDraft : question,
          ),
        );
        setLastSavedQuestion(questionDraft);
        showSuccess(tCommon("save_success"));
        return;
      }
      setIsQuestionSaving(true);
      const saved = isTemporaryQuestionId(questionDraft.id)
        ? await createAssessmentQuestion(
            academicYearId,
            termId,
            assessmentId!,
            questionDraft,
          )
        : await updateAssessmentQuestion(
            academicYearId,
            termId,
            questionDraft.id,
            questionDraft,
          );
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionDraft.id ? saved : question,
        ),
      );
      setSelectedQuestionId(saved.id);
      setQuestionDraft(saved);
      setLastSavedQuestion(saved);
      const nextAssessment = await fetchAssessmentById(
        academicYearId,
        termId,
        assessmentId!,
      );
      if (nextAssessment) {
        setAssessment(nextAssessment);
        setAssessmentDraft(nextAssessment);
        setLastSavedAssessment(nextAssessment);
      }
      showSuccess(tCommon("save_success"));
    } catch (error) {
      showError(
        tGrades(`errors.${mapGradesApiError(error)}`),
      );
    } finally {
      setIsQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!canEditQuestions) return;
    if (isCreateMode || isTemporaryQuestionId(questionId)) {
      setQuestions((current) =>
        current
          .filter((question) => question.id !== questionId)
          .map((question, index) => ({ ...question, order: index + 1 })),
      );
      setSelectedQuestionId((current) =>
        current === questionId ? null : current,
      );
      showSuccess(t("messages.deleted"));
      return;
    }
    try {
      await deleteAssessmentQuestion(academicYearId, termId, questionId);
      await refresh();
      showSuccess(t("messages.deleted"));
    } catch (error) {
      showError(
        tGrades(`errors.${mapGradesApiError(error)}`),
      );
    }
  };

  const handleMoveQuestion = async (
    questionId: string,
    direction: "up" | "down",
  ) => {
    if (!canEditQuestions) return;
    const index = questions.findIndex((question) => question.id === questionId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...questions];
    [reordered[index], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[index],
    ];
    if (isCreateMode) {
      setQuestions(
        reordered.map((question, orderIndex) => ({
          ...question,
          order: orderIndex + 1,
        })),
      );
      return;
    }
    if (reordered.some((question) => isTemporaryQuestionId(question.id))) {
      setQuestions(
        reordered.map((question, orderIndex) => ({
          ...question,
          order: orderIndex + 1,
        })),
      );
      return;
    }
    await reorderAssessmentQuestions(
      academicYearId,
      termId,
      assessmentId!,
      reordered.map((question) => question.id),
    );
    setQuestions(
      reordered.map((question, orderIndex) => ({
        ...question,
        order: orderIndex + 1,
      })),
    );
  };

  const handleAutoDistributePoints = async () => {
    if (!canEditQuestions) return;
    const maxScore = assessmentDraft?.maxScore || 0;
    const questionCount = questions.length;
    if (maxScore <= 0 || questionCount === 0) return;

    const updates = distributeQuestionPoints(
      maxScore,
      questions.map((question) => question.id),
    );
    if (isCreateMode || updates.some((update) => isTemporaryQuestionId(update.questionId))) {
      setQuestions((current) =>
        current.map((question) => {
          const nextUpdate = updates.find(
            (item) => item.questionId === question.id,
          );
          return nextUpdate
            ? { ...question, points: nextUpdate.points }
            : question;
        }),
      );
      setAssessmentDraft((current) =>
        current ? { ...current, maxScore } : current,
      );
      showSuccess(t("messages.pointsUpdated"));
      return;
    }
    await bulkUpdateAssessmentQuestionPoints(
      academicYearId,
      termId,
      assessmentId!,
      updates,
    );
    await refresh();
    showSuccess(t("messages.pointsUpdated"));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gray-50">
      {assessment && (
        <AssessmentQuestionBuilderHeader
          assessment={assessmentDraft || assessment}
          isReadOnly={isQuestionReadOnly && isAssessmentReadOnly}
          isAssessmentDirty={isAssessmentDirty}
          isQuestionDirty={isQuestionDirty}
          isAssignmentSaving={isAssignmentSaving}
          isQuestionSaving={isQuestionSaving}
          onBack={handleBack}
          saveLabel={
            isCreateMode ? tGrades("actions.createAssessment") : undefined
          }
          canSaveAssessment={canSaveAssessment && canManageAssessments}
          onSaveAssessment={() => void handleSaveAssessment()}
        />
      )}

      {!assessment ? (
        <div className="p-6">
          <div
            className="rounded-xl border p-6 text-sm"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-secondary)",
            }}
          >
            {isCreateMode ? tGrades("emptyState.selectFilters") : t("notFound")}
          </div>
        </div>
      ) : !isCreateMode && assessment.deliveryMode !== "QUESTION_BASED" ? (
        <div className="p-6">
          <div
            className="rounded-xl border p-6 text-sm"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-secondary)",
            }}
          >
            {t("notQuestionBased")}
          </div>
        </div>
      ) : isDataLoading && questions.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <MainLoader />
        </div>
      ) : isMobile ? (
        <AssessmentQuestionMobileLayout
          questions={questions as AssignmentQuestion[]}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={
            (questionDraft ||
              questions.find(
                (question) => question.id === selectedQuestionId,
              )) as AssignmentQuestion | undefined
          }
          assessment={assessmentDraft || assessment}
          isReadOnly={isQuestionReadOnly}
          isAssessmentReadOnly={isAssessmentReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) =>
            setConfirmDeleteQuestionId(questionId)
          }
          onMoveQuestion={(questionId, direction) =>
            void handleMoveQuestion(questionId, direction)
          }
          onUpdateAssessment={(updates) =>
            setAssessmentDraft((current) =>
              current ? { ...current, ...updates } : current,
            )
          }
          onAutoDistributePoints={() => void handleAutoDistributePoints()}
          onSaveQuestion={handleSaveQuestion}
        />
      ) : (
        <AssessmentQuestionDesktopLayout
          questions={questions as AssignmentQuestion[]}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={
            (questionDraft ||
              questions.find(
                (question) => question.id === selectedQuestionId,
              )) as AssignmentQuestion | undefined
          }
          assessment={assessmentDraft || assessment}
          isReadOnly={isQuestionReadOnly}
          isAssessmentReadOnly={isAssessmentReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={setSelectedQuestionId}
          onAddQuestion={() => void handleAddQuestion()}
          onUpdateQuestion={handleUpdateQuestionDraft}
          onDeleteQuestion={(questionId) =>
            setConfirmDeleteQuestionId(questionId)
          }
          onMoveQuestion={(questionId, direction) =>
            void handleMoveQuestion(questionId, direction)
          }
          onUpdateAssessment={(updates) =>
            setAssessmentDraft((current) =>
              current ? { ...current, ...updates } : current,
            )
          }
          onAutoDistributePoints={() => void handleAutoDistributePoints()}
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteQuestionId}
        onClose={() => setConfirmDeleteQuestionId(null)}
        onConfirm={() => {
          if (!confirmDeleteQuestionId) return;
          void handleDeleteQuestion(confirmDeleteQuestionId).then(() =>
            setConfirmDeleteQuestionId(null),
          );
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("deleteCancel")}
        severity="danger"
      />
    </div>
  );
}
