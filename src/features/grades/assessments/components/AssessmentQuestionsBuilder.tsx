"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileQuestion, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import AssignmentSummaryBar from "@/features/academics/curriculum/components/AssignmentSummaryBar";
import QuestionCard from "@/features/academics/curriculum/components/QuestionCard";
import QuestionDrawer from "@/features/academics/curriculum/components/QuestionDrawer";
import { distributePoints } from "@/features/academics/curriculum/utils/distributePoints";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { Assessment, AssessmentQuestion } from "../types";

interface AssessmentQuestionsBuilderProps {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  isReadOnly: boolean;
  isLoading: boolean;
  onCreateQuestion: (payload: Partial<AssignmentQuestion>) => Promise<void>;
  onUpdateQuestion: (questionId: string, payload: Partial<AssignmentQuestion>) => Promise<void>;
  onDeleteQuestion: (questionId: string) => Promise<void>;
  onBulkUpdatePoints: (updates: Array<{ questionId: string; points: number }>) => Promise<void>;
}

export default function AssessmentQuestionsBuilder({
  assessment,
  questions,
  isReadOnly,
  isLoading,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onBulkUpdatePoints,
}: AssessmentQuestionsBuilderProps) {
  const t = useTranslations("academics.grades.questions");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<AssessmentQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  const pointsSummary = useMemo(() => {
    const totalPoints = questions.reduce((sum, item) => sum + item.points, 0);
    const difference = assessment.maxScore - totalPoints;
    return {
      totalPoints,
      difference,
      isMatch: difference === 0,
    };
  }, [assessment.maxScore, questions]);

  const handleSave = async (payload: Partial<AssignmentQuestion>) => {
    setIsSaving(true);
    try {
      if (editingQuestion) {
        await onUpdateQuestion(editingQuestion.id, payload);
      } else {
        await onCreateQuestion(payload);
      }
      setEditingQuestion(null);
      setIsDrawerOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoDistribute = async () => {
    setIsDistributing(true);
    try {
      const distributed = distributePoints(
        assessment.maxScore,
        questions.map((question) => ({
          id: question.id,
          points: question.points,
          order: question.order,
        })),
      );
      await onBulkUpdatePoints(
        distributed.map((item) => ({
          questionId: item.id,
          points: item.points,
        })),
      );
    } finally {
      setIsDistributing(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}
      >
        <div className="flex justify-center py-6">
          <PartialLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssignmentSummaryBar
        maxScore={assessment.maxScore}
        totalPoints={pointsSummary.totalPoints}
        difference={pointsSummary.difference}
        isMatch={pointsSummary.isMatch}
        canAutoDistribute={!isReadOnly && questions.length > 0 && !isDistributing}
        onAutoDistribute={() => void handleAutoDistribute()}
        isReadOnly={isReadOnly}
      />

      <div className="rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
          <div>
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</div>
          </div>
          {!isReadOnly && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingQuestion(null);
                setIsDrawerOpen(true);
              }}
            >
              {t("add")}
            </Button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}>
              <FileQuestion className="h-7 w-7" />
            </div>
            <div className="mb-2 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("emptyTitle")}</div>
            <div className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>{t("emptyDescription")}</div>
            {!isReadOnly && (
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => {
                  setEditingQuestion(null);
                  setIsDrawerOpen(true);
                }}
              >
                {t("addFirst")}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question as AssignmentQuestion}
                index={index}
                isSelected={false}
                isReadOnly={isReadOnly}
                onClick={() => {
                  if (!isReadOnly) {
                    setEditingQuestion(question);
                    setIsDrawerOpen(true);
                  }
                }}
                onEdit={() => {
                  setEditingQuestion(question);
                  setIsDrawerOpen(true);
                }}
                onDelete={() => setQuestionToDelete(question)}
              />
            ))}
          </div>
        )}
      </div>

      <QuestionDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          if (isSaving) return;
          setIsDrawerOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSave}
        question={(editingQuestion ?? null) as AssignmentQuestion | null}
        isReadOnly={isReadOnly || isSaving}
      />

      <ConfirmDialog
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={() => {
          if (!questionToDelete) return;
          void onDeleteQuestion(questionToDelete.id).then(() => setQuestionToDelete(null));
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
