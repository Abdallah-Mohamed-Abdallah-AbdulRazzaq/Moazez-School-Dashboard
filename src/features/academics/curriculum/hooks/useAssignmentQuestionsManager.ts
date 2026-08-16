import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Assignment,
  AssignmentQuestion,
  bulkUpdateQuestionPoints,
  createAssignmentQuestion,
  deleteAssignmentQuestion,
  fetchAssignmentQuestions,
  updateAssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";
import { distributePoints } from "@/features/academics/curriculum/utils/distributePoints";

interface UseAssignmentQuestionsManagerProps {
  assignment: Assignment;
  onQuestionsChange?: () => void;
  onLoadError?: () => void;
}

export function useAssignmentQuestionsManager({
  assignment,
  onQuestionsChange,
  onLoadError,
}: UseAssignmentQuestionsManagerProps) {
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssignmentQuestion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<AssignmentQuestion | null>(null);
  const [autoDistributeDialogOpen, setAutoDistributeDialogOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const loadQuestions = useCallback(async (notifyOnError = true) => {
    try {
      setLoading(true);
      const data = await fetchAssignmentQuestions(assignment.id);
      setQuestions(data);
      return true;
    } catch (error) {
      console.error("Failed to load questions:", error);
      if (notifyOnError) {
        onLoadError?.();
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [assignment.id, onLoadError]);

  useEffect(() => {
    void Promise.resolve().then(() => loadQuestions());
  }, [loadQuestions]);

  const pointsSummary = useMemo(() => {
    const maxScore = assignment.maxScore ?? 0;
    const totalPoints = questions.reduce((sum, question) => sum + (question.points || 0), 0);
    const difference = maxScore - totalPoints;

    return {
      maxScore,
      totalPoints,
      difference,
      isMatch: difference === 0,
    };
  }, [assignment.maxScore, questions]);

  const openNewQuestion = useCallback(() => {
    setEditingQuestion(null);
    setEditorOpen(true);
  }, []);

  const openEditQuestion = useCallback((question: AssignmentQuestion) => {
    setEditingQuestion(question);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingQuestion(null);
  }, []);

  const promptDeleteQuestion = useCallback((question: AssignmentQuestion) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  }, []);

  const openAutoDistributeDialog = useCallback(() => {
    setAutoDistributeDialogOpen(true);
  }, []);

  const closeAutoDistributeDialog = useCallback(() => {
    setAutoDistributeDialogOpen(false);
  }, []);

  const saveQuestion = useCallback(
    async (data: Partial<AssignmentQuestion>) => {
      try {
        let savedQuestion: AssignmentQuestion;

        if (editingQuestion) {
          savedQuestion = await updateAssignmentQuestion(editingQuestion.id, data);
          setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
              question.id === savedQuestion.id ? savedQuestion : question
            )
          );
        } else {
          savedQuestion = await createAssignmentQuestion(
            assignment.id,
            data as Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">
          );
          setQuestions((currentQuestions) =>
            [...currentQuestions, savedQuestion].sort((left, right) => left.order - right.order)
          );
        }

        closeEditor();
        onQuestionsChange?.();
        void loadQuestions(false);
        return true;
      } catch (error) {
        console.error("Failed to save question:", error);
        throw error;
      }
    },
    [assignment.id, closeEditor, editingQuestion, loadQuestions, onQuestionsChange]
  );

  const deleteQuestion = useCallback(async () => {
    if (!questionToDelete) {
      return false;
    }

    try {
      const deletedQuestionId = questionToDelete.id;
      await deleteAssignmentQuestion(deletedQuestionId);
      setQuestions((currentQuestions) =>
        currentQuestions.filter((question) => question.id !== deletedQuestionId)
      );
      closeDeleteDialog();
      onQuestionsChange?.();
      void loadQuestions(false);
      return true;
    } catch (error) {
      console.error("Failed to delete question:", error);
      return false;
    }
  }, [closeDeleteDialog, loadQuestions, onQuestionsChange, questionToDelete]);

  const autoDistribute = useCallback(async () => {
    if (questions.length === 0 || pointsSummary.maxScore === undefined) {
      return false;
    }

    setIsDistributing(true);
    const originalPoints = questions.map((question) => ({
      id: question.id,
      points: question.points,
    }));

    try {
      const distributed = distributePoints(
        pointsSummary.maxScore,
        questions.map((question) => ({
          id: question.id,
          points: question.points,
          order: question.order,
        }))
      );

      const updatedQuestions = questions.map((question) => {
        const distributedQuestion = distributed.find((item) => item.id === question.id);
        return distributedQuestion
          ? { ...question, points: distributedQuestion.points }
          : question;
      });
      setQuestions(updatedQuestions);

      await bulkUpdateQuestionPoints(
        assignment.id,
        distributed.map((item) => ({
          questionId: item.id,
          points: item.points,
        }))
      );

      closeAutoDistributeDialog();
      onQuestionsChange?.();
      return true;
    } catch (error) {
      console.error("Failed to distribute points:", error);

      const rolledBackQuestions = questions.map((question) => {
        const original = originalPoints.find((item) => item.id === question.id);
        return original ? { ...question, points: original.points } : question;
      });
      setQuestions(rolledBackQuestions);
      return false;
    } finally {
      setIsDistributing(false);
    }
  }, [
    assignment.id,
    closeAutoDistributeDialog,
    onQuestionsChange,
    pointsSummary.maxScore,
    questions,
  ]);

  return {
    questions,
    loading,
    pointsSummary,
    editorOpen,
    editingQuestion,
    deleteDialogOpen,
    questionToDelete,
    autoDistributeDialogOpen,
    isDistributing,
    loadQuestions,
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
  };
}
