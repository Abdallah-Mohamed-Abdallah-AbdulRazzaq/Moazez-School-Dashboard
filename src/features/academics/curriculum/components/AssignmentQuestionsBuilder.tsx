"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  FileQuestion,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import AssignmentSummaryBar from "./AssignmentSummaryBar";
import { Assignment } from "@/features/academics/curriculum/services/curriculumService";
import { useAssignmentQuestionsManager } from "@/features/academics/curriculum/hooks/useAssignmentQuestionsManager";
import QuestionDialog from "./QuestionDialog";
import QuestionCard from "./QuestionCard";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface AssignmentQuestionsBuilderProps {
  assignment: Assignment;
  isReadOnly: boolean;
  onQuestionsChange?: () => void;
}

export default function AssignmentQuestionsBuilder({
  assignment,
  isReadOnly,
  onQuestionsChange,
}: AssignmentQuestionsBuilderProps) {
  const t = useTranslations("academics.curriculum.assignments");
  const tQuestions = useTranslations("academics.curriculum.questions");
  const tSuccess = useTranslations("success");
  const tErrors = useTranslations("errors");
  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(
    null
  );
  const showSnackbar = useCallback((message: string, type: "success" | "error") => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbar({ message, type });
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbar(null);
      snackbarTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
      }
    };
  }, []);
  const handleLoadError = useCallback(() => {
    showSnackbar(tErrors("load_failed"), "error");
  }, [showSnackbar, tErrors]);
  const {
    questions,
    loading,
    pointsSummary,
    editorOpen,
    editingQuestion,
    deleteDialogOpen,
    autoDistributeDialogOpen,
    isDistributing,
    openNewQuestion,
    openEditQuestion,
    closeEditor,
    promptDeleteQuestion,
    closeDeleteDialog,
    openAutoDistributeDialog,
    closeAutoDistributeDialog,
    saveQuestion,
    deleteQuestion,
    autoDistribute,
  } = useAssignmentQuestionsManager({
    assignment,
    onQuestionsChange,
    onLoadError: handleLoadError,
  });

  const handleSaveQuestion = async (data: Parameters<typeof saveQuestion>[0]) => {
    try {
      await saveQuestion(data);
    } catch {
      // QuestionDialog already keeps the drawer open on failure.
    }
  };

  const handleDeleteQuestion = async () => {
    const success = await deleteQuestion();
    if (!success) {
      showSnackbar(tErrors("delete_failed"), "error");
    }
  };

  const handleAutoDistribute = async () => {
    const success = await autoDistribute();
    if (success) {
      showSnackbar(tSuccess("pointsUpdated"), "success");
      return;
    }

    showSnackbar(tErrors("pointsUpdateFailed"), "error");
  };

  const canAutoDistribute =
    !isReadOnly &&
    questions.length > 0 &&
    pointsSummary.maxScore !== undefined &&
    pointsSummary.maxScore >= 0;

  if (loading) {
    return (
      <div className="p-6">
        <PartialLoader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Bar */}
      <AssignmentSummaryBar
        maxScore={pointsSummary.maxScore}
        totalPoints={pointsSummary.totalPoints}
        difference={pointsSummary.difference}
        isMatch={pointsSummary.isMatch}
        canAutoDistribute={canAutoDistribute}
        onAutoDistribute={openAutoDistributeDialog}
        isReadOnly={isReadOnly}
      />

      {/* Sticky Add Question Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{tQuestions("title")}</h3>
          {!isReadOnly && (
            <Button
              onClick={openNewQuestion}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {tQuestions("add_question")}
            </Button>
          )}
        </div>
      </div>

      {/* Questions List or Empty State */}
      {questions.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t("noQuestionsTitle")}
          </h4>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            {t("noQuestionsBody")}
          </p>
          {!isReadOnly && (
            <Button
              onClick={openNewQuestion}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("addFirstQuestion")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              isSelected={false}
              isReadOnly={isReadOnly}
              onClick={() => {
                if (!isReadOnly) {
                  openEditQuestion(question);
                }
              }}
              onEdit={() => openEditQuestion(question)}
              onDelete={() => promptDeleteQuestion(question)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <QuestionDialog
          isOpen={editorOpen}
          onClose={closeEditor}
          onSave={handleSaveQuestion}
          question={editingQuestion}
          isReadOnly={isReadOnly}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteQuestion}
        title={tQuestions("delete_question")}
        description={tQuestions("delete_question_confirm")}
        confirmLabel={tQuestions("delete_question")}
        cancelLabel="Cancel"
        severity="danger"
      />

      <ConfirmDialog
        isOpen={autoDistributeDialogOpen}
        onClose={closeAutoDistributeDialog}
        onConfirm={handleAutoDistribute}
        title={tQuestions("confirm_auto_distribute_title")}
        description={tQuestions("confirm_auto_distribute_body")}
        confirmLabel={tQuestions("auto_distribute")}
        cancelLabel="Cancel"
        loading={isDistributing}
        severity="warning"
      />

      {snackbar && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
            snackbar.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white z-50`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}
