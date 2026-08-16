import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast/Toast";
import {
  Assignment,
  AssignmentQuestion,
  AssignmentAttachment,
  fetchAssignmentById,
  updateAssignment,
  deleteAssignment,
  createAssignmentQuestion,
  updateAssignmentQuestion,
  deleteAssignmentQuestion,
  reorderAssignmentQuestions,
  bulkUpdateQuestionPoints,
  uploadAssignmentAttachmentFile,
  createAssignmentAttachmentLink,
  deleteAssignmentAttachment,
  fetchAssignmentQuestions,
  fetchAssignmentAttachments,
} from "@/features/academics/curriculum/services/curriculumService";
import { DEFAULT_NEW_QUESTION } from "@/features/academics/curriculum/libs/constants";
import { distributePointsEvenly } from "@/features/academics/curriculum/utils/points";
import { validateForPublish, hasValidationErrors } from "@/features/academics/curriculum/utils/validation";
import { ValidationErrors } from "../types/types";

interface UseAssignmentMutationsProps {
  assignment: Assignment | null;
  questions: AssignmentQuestion[];
  lessonId: string;
  setAssignment: (assignment: Assignment) => void;
  setQuestions: (questions: AssignmentQuestion[]) => void;
  setAttachments: React.Dispatch<React.SetStateAction<AssignmentAttachment[]>>;
  markDirty: () => void;
  clearDirty: () => void;
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors) => void;
}

export function useAssignmentMutations({
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
}: UseAssignmentMutationsProps) {
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tQuestions = useTranslations("academics.curriculum.questions");

  const saveAssignment = async () => {
    if (!assignment) return;

    if (hasValidationErrors(validationErrors)) {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSaving(true);
    try {
      await updateAssignment(assignment.id, {
        titleAr: assignment.titleAr?.trim(),
        titleEn: assignment.titleEn?.trim(),
        descriptionAr: assignment.descriptionAr?.trim() || undefined,
        descriptionEn: assignment.descriptionEn?.trim() || undefined,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore ?? 0,
        expectedTimeMinutes: assignment.expectedTimeMinutes,
      });

      setAssignment({
        ...assignment,
        titleAr: assignment.titleAr?.trim() || "",
        titleEn: assignment.titleEn?.trim() || "",
        descriptionAr: assignment.descriptionAr?.trim() || undefined,
        descriptionEn: assignment.descriptionEn?.trim() || undefined,
        expectedTimeMinutes: assignment.expectedTimeMinutes,
      });

      clearDirty();
      setValidationErrors({});
      showSuccess(tCommon("save_success"));
    } catch (error) {
      console.error("Failed to save assignment:", error);
      showError(tCommon("save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!assignment) return;

    if (!assignment.isPublished) {
      const errors = validateForPublish(assignment, questions, tValidation);
      if (errors.length > 0) {
        showWarning(tValidation("cannot_publish") + ":\n\n" + errors.join("\n"));
        return;
      }
    }

    const newPublishState = !assignment.isPublished;

    try {
      await updateAssignment(assignment.id, { isPublished: newPublishState });
      setAssignment({ ...assignment, isPublished: newPublishState });
      showSuccess(
        newPublishState ? tCommon("publish_success") : tCommon("unpublish_success")
      );
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      showError(tCommon("publish_failed"));
    }
  };

  const resetAssignment = async () => {
    if (!assignment) return;

    try {
      const found = await fetchAssignmentById(lessonId, assignment.id);
      if (found) {
        setAssignment(found);

        const qs = await fetchAssignmentQuestions(assignment.id);
        setQuestions(qs);

        const atts = await fetchAssignmentAttachments(assignment.id);
        setAttachments(atts);

        clearDirty();
        showSuccess(tCommon("reset_success"));
      }
    } catch (error) {
      console.error("Failed to reset assignment:", error);
      showError(tCommon("reset_failed"));
    }
  };

  const removeAssignment = async () => {
    if (!assignment) return;

    try {
      await deleteAssignment(assignment.id);
      clearDirty();
      return true;
    } catch (error) {
      console.error("Failed to delete assignment:", error);
      showError(tCommon("delete_failed"));
      return false;
    }
  };

  const addQuestion = async () => {
    if (!assignment) return;

    try {
      const newQuestion = await createAssignmentQuestion(assignment.id, DEFAULT_NEW_QUESTION);
      setQuestions([...questions, newQuestion]);
      markDirty();
      return newQuestion.id;
    } catch (error) {
      console.error("Failed to add question:", error);
      showError(tQuestions("add_question_failed"));
    }
  };

  const updateQuestion = async (questionId: string, updates: Partial<AssignmentQuestion>) => {
    try {
      await updateAssignmentQuestion(questionId, updates);
      setQuestions(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
      markDirty();
    } catch (error) {
      console.error("Failed to update question:", error);
      showError(tQuestions("update_question_failed"));
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      await deleteAssignmentQuestion(questionId);
      setQuestions(questions.filter((q) => q.id !== questionId));
      markDirty();
    } catch (error) {
      console.error("Failed to delete question:", error);
      showError(tQuestions("delete_question_failed"));
    }
  };

  const reorderQuestions = async (questionIds: string[]) => {
    if (!assignment) return;

    try {
      await reorderAssignmentQuestions(assignment.id, questionIds);
      const reordered = questionIds.map((id) => questions.find((q) => q.id === id)!).filter(Boolean);
      setQuestions(reordered);
      markDirty();
    } catch (error) {
      console.error("Failed to reorder questions:", error);
      showError(tQuestions("reorder_failed"));
    }
  };

  const autoDistributePoints = async () => {
    if (!assignment || questions.length === 0 || !assignment.maxScore) return;

    const distributedPoints = distributePointsEvenly(assignment.maxScore, questions.length);
    const updates = questions.map((q, index) => ({
      questionId: q.id,
      points: distributedPoints[index],
    }));

    try {
      await bulkUpdateQuestionPoints(assignment.id, updates);
      setQuestions(
        questions.map((q, index) => ({
          ...q,
          points: distributedPoints[index],
        }))
      );
      markDirty();
      showSuccess(tQuestions("points_distributed"));
    } catch (error) {
      console.error("Failed to auto distribute points:", error);
      showError(tQuestions("distribute_failed"));
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!assignment) return;

    try {
      const newAttachment = await uploadAssignmentAttachmentFile(assignment.id, file);
      setAttachments((prev) => [...prev, newAttachment]);
      markDirty();
      showSuccess(tCommon("upload_success"));
    } catch (error) {
      console.error("Failed to upload file:", error);
      showError(tCommon("upload_failed"));
      throw error;
    }
  };

  const addLinkAttachment = async (title: string, url: string) => {
    if (!assignment) return;

    try {
      const newAttachment = await createAssignmentAttachmentLink(assignment.id, { title, url });
      setAttachments((prev) => [...prev, newAttachment]);
      markDirty();
      showSuccess(tCommon("link_added"));
    } catch (error) {
      console.error("Failed to add link:", error);
      showError(tCommon("link_failed"));
      throw error;
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      await deleteAssignmentAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      markDirty();
      showSuccess(tCommon("delete_success"));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      showError(tCommon("delete_failed"));
    }
  };

  return {
    saving,
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
  };
}
