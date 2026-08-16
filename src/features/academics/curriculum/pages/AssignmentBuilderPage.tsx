"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { useToast } from "@/components/ui/toast/Toast";
import {
  Assignment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";
import { useAssignmentData } from "@/features/academics/curriculum/hooks/useAssignmentData";
import { useAssignmentMutations } from "@/features/academics/curriculum/hooks/useAssignmentMutations";
import {
  validateAssignment,
  validateQuestion,
} from "@/features/academics/curriculum/utils/validation";
import { calculatePointsSummary } from "@/features/academics/curriculum/utils/points";
import { ValidationErrors } from "../types";
import BuilderHeader from "@/features/academics/curriculum/components/BuilderHeader";
import DesktopLayout from "@/features/academics/curriculum/components/DesktopLayout";
import MobileLayout from "@/features/academics/curriculum/components/MobileLayout";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { AccessDenied } from "@/components/ui";
import { usePermissions } from "@/hooks/usePermissions";

interface AssignmentBuilderPageProps {
  lessonId: string;
  assignmentId?: string;
}

export default function AssignmentBuilderPage({
  lessonId,
  assignmentId,
}: AssignmentBuilderPageProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tValidation = useTranslations("validation");
  const tQuestions = useTranslations("academics.curriculum.questions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const guardedRouter = useGuardedRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));
  const { hasPermission } = usePermissions();
  const canViewAssignment = assignmentId
    ? hasPermission("homework.assignments.view")
    : hasPermission("homework.assignments.manage");
  const canManageAssignment = hasPermission("homework.assignments.manage");

  // Get term context from URL params
  const termStatus = searchParams.get("termStatus") as "open" | "closed" | null;
  const isReadOnly = termStatus === "closed" || !canManageAssignment;

  // State
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  // Draft state management for assignment
  const [assignmentDraft, setAssignmentDraft] = useState<Assignment | null>(
    null,
  );
  const [lastSavedAssignment, setLastSavedAssignment] =
    useState<Assignment | null>(null);
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);

  // Draft state management for selected question
  const [questionDraft, setQuestionDraft] = useState<AssignmentQuestion | null>(
    null,
  );
  const [lastSavedQuestion, setLastSavedQuestion] =
    useState<AssignmentQuestion | null>(null);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);
  const lastInitializedAssignmentId = useRef<string | null>(null);

  // Confirm dialogs state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type:
      | "delete"
      | "reset"
      | "deleteQuestion"
      | "autoDistribute"
      | "switchQuestion"
      | null;
    questionId?: string;
    targetQuestionId?: string;
  }>({
    isOpen: false,
    type: null,
  });

  // Dirty state management
  const { markDirty, clearDirty } = useDirtyKey(
    `assignment-builder:${assignmentId || "new"}:${lessonId}`,
  );

  // Data fetching
  const {
    assignment,
    questions,
    attachments,
    loading,
    creatingDraft,
    error,
    createDraft,
    setAssignment,
    setQuestions,
    setAttachments,
  } = useAssignmentData({ lessonId, assignmentId });

  // Mutations
  const {
    saveAssignment,
    togglePublish,
    resetAssignment,
    removeAssignment,
    addQuestion,
    updateQuestion,
    removeQuestion,
    reorderQuestions,
    autoDistributePoints,
    uploadAttachment,
    addLinkAttachment,
    removeAttachment,
  } = useAssignmentMutations({
    assignment,
    questions,
    lessonId,
    setAssignment,
    setQuestions,
    setAttachments,
    markDirty,
    clearDirty,
    validationErrors,
    setValidationErrors,
  });

  const { showError, showSuccess } = useToast();

  // Compute dirty states
  const isAssignmentDirty = useMemo(() => {
    if (!assignmentDraft || !lastSavedAssignment) return false;
    return (
      JSON.stringify(assignmentDraft) !== JSON.stringify(lastSavedAssignment)
    );
  }, [assignmentDraft, lastSavedAssignment]);

  const isQuestionDirty = useMemo(() => {
    if (!questionDraft || !lastSavedQuestion) return false;
    return JSON.stringify(questionDraft) !== JSON.stringify(lastSavedQuestion);
  }, [questionDraft, lastSavedQuestion]);

  // Overall dirty state for navigation guard
  const isDirty = isAssignmentDirty || isQuestionDirty;

  // Initialize assignment draft when assignment loads
  useEffect(() => {
    if (assignment && lastInitializedAssignmentId.current !== assignment.id) {
      setAssignmentDraft(assignment);
      setLastSavedAssignment(assignment);
      lastInitializedAssignmentId.current = assignment.id;
    }
  }, [assignment]);

  // Initialize question draft when selected question changes
  useEffect(() => {
    if (selectedQuestionId) {
      const question = questions.find((q) => q.id === selectedQuestionId);
      if (question) {
        void Promise.resolve().then(() => {
          setQuestionDraft(question);
          setLastSavedQuestion(question);
        });
      }
    } else {
      void Promise.resolve().then(() => setQuestionDraft(null));
      void Promise.resolve().then(() => setLastSavedQuestion(null));
    }
  }, [selectedQuestionId, questions]);

  // Select first question when questions load
  useEffect(() => {
    if (questions.length > 0 && !selectedQuestionId) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setSelectedQuestionId(questions[0].id);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, selectedQuestionId]);

  // Update global dirty tracking
  useEffect(() => {
    if (isDirty) {
      markDirty();
    } else {
      clearDirty();
    }
  }, [isDirty, markDirty, clearDirty]);

  // Validate on changes
  useEffect(() => {
    if (assignment && questions.length > 0) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        const errors = validateAssignment(assignment, questions, tValidation);
        setValidationErrors(errors);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, questions.length, tValidation]);

  // Handlers
  const handleBack = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const curriculumId = params.get("curriculumId");
    params.delete("curriculumId");
    const query = params.toString();
    const curriculumPath = curriculumId
      ? `/${locale}/academics/curriculum/${curriculumId}`
      : `/${locale}/academics/curriculum`;
    guardedRouter.push(`${curriculumPath}${query ? `?${query}` : ""}`);
  }, [guardedRouter, locale, searchParams]);

  const handleSaveAssignment = useCallback(async () => {
    if (isReadOnly || !assignmentDraft || !isAssignmentDirty) return;

    setIsAssignmentSaving(true);
    try {
      await saveAssignment();
      setLastSavedAssignment(assignmentDraft);
      showSuccess(tCommon("save_success"));
    } catch (error) {
      console.error("Failed to save assignment:", error);
      showError(tCommon("save_failed"));
    } finally {
      setIsAssignmentSaving(false);
    }
  }, [
    assignmentDraft,
    isAssignmentDirty,
    isReadOnly,
    saveAssignment,
    showSuccess,
    showError,
    tCommon,
  ]);

  const handleSaveQuestion = useCallback(async () => {
    if (isReadOnly || !questionDraft || !isQuestionDirty) return;

    // Validate before saving
    const errors = validateQuestion(questionDraft, tValidation);
    if (Object.keys(errors).length > 0) {
      setValidationErrors({ questions: { [questionDraft.id]: errors } });
      showError(tValidation("fix_errors_before_save"));
      return;
    }

    setIsQuestionSaving(true);
    try {
      await updateQuestion(questionDraft.id, questionDraft);
      setLastSavedQuestion(questionDraft);

      // Update the question in the questions array
      setQuestions(
        questions.map((q) => (q.id === questionDraft.id ? questionDraft : q)),
      );

      showSuccess(tCommon("save_success"));
    } catch (error) {
      console.error("Failed to save question:", error);
      showError(tCommon("save_failed"));
    } finally {
      setIsQuestionSaving(false);
    }
  }, [
    questionDraft,
    isQuestionDirty,
    isReadOnly,
    updateQuestion,
    questions,
    setQuestions,
    showSuccess,
    showError,
    tCommon,
    tValidation,
  ]);

  const handlePublishToggle = useCallback(async () => {
    if (isReadOnly) return;

    // Check if there are unsaved changes
    if (isDirty) {
      showError(t("mustSaveBeforePublish"));
      return;
    }

    await togglePublish();
  }, [togglePublish, isDirty, isReadOnly, showError, t]);

  const handleDelete = useCallback(async () => {
    if (isReadOnly || !assignment) return;
    setConfirmDialog({ isOpen: true, type: "delete" });
  }, [assignment, isReadOnly]);

  const handleConfirmDelete = useCallback(async () => {
    if (isReadOnly) return;

    const success = await removeAssignment();
    setConfirmDialog({ isOpen: false, type: null });
    if (success) {
      handleBack();
    }
  }, [isReadOnly, removeAssignment, handleBack]);

  const handleReset = useCallback(async () => {
    if (isReadOnly || !assignment) return;
    setConfirmDialog({ isOpen: true, type: "reset" });
  }, [assignment, isReadOnly]);

  const handleConfirmReset = useCallback(async () => {
    if (isReadOnly) return;

    await resetAssignment();
    setConfirmDialog({ isOpen: false, type: null });
    if (questions.length > 0) {
      setSelectedQuestionId(questions[0].id);
    } else {
      setSelectedQuestionId(null);
    }
  }, [isReadOnly, resetAssignment, questions]);

  const handleAddQuestion = useCallback(async () => {
    if (isReadOnly) return;

    const newQuestionId = await addQuestion();
    if (newQuestionId) {
      setSelectedQuestionId(newQuestionId);
    }
  }, [addQuestion, isReadOnly]);

  const handleUpdateQuestion = useCallback(
    (questionId: string, updates: Partial<AssignmentQuestion>) => {
      if (isReadOnly) return;
      if (!questionDraft || questionDraft.id !== questionId) return;

      // Update draft immediately (no API call)
      const updatedQuestion: AssignmentQuestion = {
        ...questionDraft,
        ...updates,
      };
      setQuestionDraft(updatedQuestion);
    },
    [isReadOnly, questionDraft],
  );

  const handleDeleteQuestion = useCallback(
    async (questionId: string) => {
      if (isReadOnly) return;
      setConfirmDialog({ isOpen: true, type: "deleteQuestion", questionId });
    },
    [isReadOnly],
  );

  const handleConfirmDeleteQuestion = useCallback(async () => {
    if (isReadOnly) return;
    if (!confirmDialog.questionId) return;

    await removeQuestion(confirmDialog.questionId);
    const newQuestions = questions.filter(
      (q) => q.id !== confirmDialog.questionId,
    );
    if (selectedQuestionId === confirmDialog.questionId) {
      setSelectedQuestionId(
        newQuestions.length > 0 ? newQuestions[0].id : null,
      );
    }
    setConfirmDialog({ isOpen: false, type: null });
  }, [
    confirmDialog.questionId,
    isReadOnly,
    removeQuestion,
    questions,
    selectedQuestionId,
  ]);

  const handleMoveQuestion = useCallback(
    async (questionId: string, direction: "up" | "down") => {
      if (isReadOnly) return;

      const index = questions.findIndex((q) => q.id === questionId);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === questions.length - 1)
      ) {
        return;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      const newQuestions = [...questions];
      [newQuestions[index], newQuestions[newIndex]] = [
        newQuestions[newIndex],
        newQuestions[index],
      ];

      await reorderQuestions(newQuestions.map((q) => q.id));
    },
    [isReadOnly, questions, reorderQuestions],
  );

  const handleUpdateAssignment = useCallback(
    (updates: Partial<Assignment>) => {
      if (isReadOnly) return;
      if (!assignmentDraft) return;

      // Update draft immediately (no API call)
      const updatedAssignment: Assignment = { ...assignmentDraft, ...updates };
      setAssignmentDraft(updatedAssignment);

      // Also update the main assignment state for UI consistency
      setAssignment(updatedAssignment);
    },
    [assignmentDraft, isReadOnly, setAssignment],
  );

  const handleAutoDistributePoints = useCallback(async () => {
    if (isReadOnly) return;
    if (!assignment || questions.length === 0 || !assignment.maxScore) return;
    setConfirmDialog({ isOpen: true, type: "autoDistribute" });
  }, [assignment, isReadOnly, questions]);

  const handleConfirmAutoDistribute = useCallback(async () => {
    if (isReadOnly) return;

    await autoDistributePoints();
    setConfirmDialog({ isOpen: false, type: null });
  }, [autoDistributePoints, isReadOnly]);

  // Handle question selection with unsaved changes guard
  const handleSelectQuestion = useCallback(
    (questionId: string) => {
      if (isQuestionDirty) {
        // Show confirmation dialog
        setConfirmDialog({
          isOpen: true,
          type: "switchQuestion",
          targetQuestionId: questionId,
        });
      } else {
        // Switch directly
        setSelectedQuestionId(questionId);
      }
    },
    [isQuestionDirty],
  );

  const handleSaveAndSwitch = useCallback(async () => {
    if (isReadOnly) return;

    await handleSaveQuestion();

    // Only switch if save was successful (no longer dirty)
    if (confirmDialog.targetQuestionId && !isQuestionDirty) {
      setSelectedQuestionId(confirmDialog.targetQuestionId);
      setConfirmDialog({ isOpen: false, type: null });
    }
  }, [
    confirmDialog.targetQuestionId,
    handleSaveQuestion,
    isQuestionDirty,
    isReadOnly,
  ]);

  const handleDiscardAndSwitch = useCallback(() => {
    if (confirmDialog.targetQuestionId) {
      // Discard changes by resetting to last saved
      if (lastSavedQuestion) {
        setQuestionDraft(lastSavedQuestion);
      }
      setSelectedQuestionId(confirmDialog.targetQuestionId);
      setConfirmDialog({ isOpen: false, type: null });
    }
  }, [confirmDialog.targetQuestionId, lastSavedQuestion]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <MainLoader />
      </div>
    );
  }

  if (!canViewAssignment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <AccessDenied className="max-w-md" />
      </div>
    );
  }

  // Error state
  if (error || (assignmentId && !assignment)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">{t("notFound")}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {t("backToLesson")}
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("createDraftTitle")}
          </h1>
          <p className="mt-3 text-sm text-gray-600">{t("createDraftBody")}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleBack}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("backToLesson")}
            </button>
            <button
              onClick={createDraft}
              disabled={creatingDraft || isReadOnly}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingDraft ? t("creatingDraft") : t("createDraftAction")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
  const pointsSummary = calculatePointsSummary(
    assignment.maxScore || 0,
    questions,
  );

  // Get confirm dialog props based on type
  const getConfirmDialogProps = () => {
    switch (confirmDialog.type) {
      case "delete":
        return {
          title: t("confirmDelete"),
          description: t("confirmDelete"),
          confirmLabel: tCommon("delete"),
          cancelLabel: tCommon("cancel"),
          severity: "danger" as const,
          onConfirm: handleConfirmDelete,
        };
      case "reset":
        return {
          title: t("confirmReset"),
          description: t("confirmReset"),
          confirmLabel: tCommon("reset"),
          cancelLabel: tCommon("cancel"),
          severity: "warning" as const,
          onConfirm: handleConfirmReset,
        };
      case "deleteQuestion":
        return {
          title: tValidation("delete_question_confirm"),
          description: tValidation("delete_question_confirm"),
          confirmLabel: tCommon("delete"),
          cancelLabel: tCommon("cancel"),
          severity: "danger" as const,
          onConfirm: handleConfirmDeleteQuestion,
        };
      case "autoDistribute":
        return {
          title: tQuestions("confirm_auto_distribute_title"),
          description: tValidation("confirm_auto_distribute_body"),
          confirmLabel: tQuestions("auto_distribute"),
          cancelLabel: tCommon("cancel"),
          severity: "warning" as const,
          onConfirm: handleConfirmAutoDistribute,
        };
      case "switchQuestion":
        return {
          title: tCommon("unsavedChanges"),
          description: tCommon("unsavedChangesMessage"),
          confirmLabel: tCommon("saveAndSwitch"),
          cancelLabel: tCommon("cancel"),
          severity: "warning" as const,
          onConfirm: handleSaveAndSwitch,
          secondaryAction: {
            label: tCommon("discardAndSwitch"),
            onClick: handleDiscardAndSwitch,
          },
        };
      default:
        return {
          title: "",
          description: "",
          confirmLabel: tCommon("confirm"),
          cancelLabel: tCommon("cancel"),
          severity: "default" as const,
          onConfirm: () => {},
        };
    }
  };

  const confirmDialogProps = getConfirmDialogProps();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <BuilderHeader
        assignment={assignment}
        isReadOnly={isReadOnly}
        isDirty={isDirty}
        isAssignmentDirty={isAssignmentDirty}
        isQuestionDirty={isQuestionDirty}
        isAssignmentSaving={isAssignmentSaving}
        isQuestionSaving={isQuestionSaving}
        onBack={handleBack}
        onSaveAssignment={handleSaveAssignment}
        onPublishToggle={handlePublishToggle}
        onDelete={handleDelete}
        onReset={handleReset}
      />

      {/* Main Content */}
      {isMobile ? (
        <MobileLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={questionDraft || selectedQuestion}
          assignment={assignmentDraft || assignment}
          attachments={attachments}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={handleSelectQuestion}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onMoveQuestion={handleMoveQuestion}
          onUpdateAssignment={handleUpdateAssignment}
          onAutoDistributePoints={handleAutoDistributePoints}
          onUploadFile={uploadAttachment}
          onAddLink={addLinkAttachment}
          onDeleteAttachment={removeAttachment}
          onSaveQuestion={handleSaveQuestion}
        />
      ) : (
        <DesktopLayout
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          selectedQuestion={questionDraft || selectedQuestion}
          assignment={assignmentDraft || assignment}
          attachments={attachments}
          isReadOnly={isReadOnly}
          pointsSummary={pointsSummary}
          validationErrors={validationErrors}
          isQuestionDirty={isQuestionDirty}
          isQuestionSaving={isQuestionSaving}
          onSelectQuestion={handleSelectQuestion}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onMoveQuestion={handleMoveQuestion}
          onUpdateAssignment={handleUpdateAssignment}
          onAutoDistributePoints={handleAutoDistributePoints}
          onUploadFile={uploadAttachment}
          onAddLink={addLinkAttachment}
          onDeleteAttachment={removeAttachment}
          onSaveQuestion={handleSaveQuestion}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null })}
        onConfirm={confirmDialogProps.onConfirm}
        title={confirmDialogProps.title}
        description={confirmDialogProps.description}
        confirmLabel={confirmDialogProps.confirmLabel}
        cancelLabel={confirmDialogProps.cancelLabel}
        severity={confirmDialogProps.severity}
      />

      {/* Switch Question Dialog with Discard Option */}
      {confirmDialog.type === "switchQuestion" && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">
              {tCommon("unsavedChanges")}
            </h3>
            <p className="text-gray-600 mb-6">
              {tCommon("unsavedChangesMessage")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndSwitch}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                {tCommon("saveAndSwitch")}
              </button>
              <button
                onClick={handleDiscardAndSwitch}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {tCommon("discardAndSwitch")}
              </button>
              <button
                onClick={() => setConfirmDialog({ isOpen: false, type: null })}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
