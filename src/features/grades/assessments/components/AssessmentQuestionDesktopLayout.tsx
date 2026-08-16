"use client";

import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors, PointsSummary } from "@/features/academics/curriculum/types/types";
import Button from "@/components/ui/button/Button";
import QuestionsOutline from "@/features/academics/curriculum/components/QuestionsOutline";
import EmptyQuestionState from "@/features/academics/curriculum/components/EmptyQuestionState";
import QuestionEditor from "@/features/academics/curriculum/components/QuestionEditor";
import type { Assessment } from "../types";
import AssessmentQuestionSettingsPanel from "./AssessmentQuestionSettingsPanel";

interface AssessmentQuestionDesktopLayoutProps {
  questions: AssignmentQuestion[];
  selectedQuestionId: string | null;
  selectedQuestion: AssignmentQuestion | undefined;
  assessment: Assessment;
  isReadOnly: boolean;
  isAssessmentReadOnly: boolean;
  pointsSummary: PointsSummary;
  validationErrors: ValidationErrors;
  isQuestionDirty: boolean;
  isQuestionSaving: boolean;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, updates: Partial<AssignmentQuestion>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onUpdateAssessment: (updates: Partial<Assessment>) => void;
  onAutoDistributePoints: () => void;
  onSaveQuestion: () => Promise<void>;
}

export default function AssessmentQuestionDesktopLayout({
  questions,
  selectedQuestionId,
  selectedQuestion,
  assessment,
  isReadOnly,
  isAssessmentReadOnly,
  pointsSummary,
  validationErrors,
  isQuestionDirty,
  isQuestionSaving,
  onSelectQuestion,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onUpdateAssessment,
  onAutoDistributePoints,
  onSaveQuestion,
}: AssessmentQuestionDesktopLayoutProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-0 flex-1">
      <QuestionsOutline
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        isReadOnly={isReadOnly}
        onSelectQuestion={onSelectQuestion}
        onAddQuestion={onAddQuestion}
        onMoveQuestion={onMoveQuestion}
        onDeleteQuestion={onDeleteQuestion}
      />

      <div className="min-h-0 flex-1 overflow-y-auto border-x bg-gray-50" style={{ borderColor: "var(--border-color)" }}>
        {selectedQuestion ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: "var(--border-color)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {tCommon("edit")} {tCommon("question")}
              </h2>
              {!isReadOnly && (
                <Button
                  onClick={onSaveQuestion}
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                  disabled={!isQuestionDirty || isQuestionSaving}
                >
                  {isQuestionSaving ? tCommon("saving") : tCommon("saveQuestion")}
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <QuestionEditor
                key={selectedQuestion.id}
                question={selectedQuestion}
                onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
                isReadOnly={isReadOnly}
                validationErrors={validationErrors.questions?.[selectedQuestion.id]}
              />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyQuestionState isReadOnly={isReadOnly} onAddQuestion={onAddQuestion} />
          </div>
        )}
      </div>

      <div className="min-h-0 w-96 overflow-y-auto border-l bg-white" style={{ borderColor: "var(--border-color)" }}>
        <div className="p-6">
          <AssessmentQuestionSettingsPanel
            assessment={assessment}
            pointsSummary={pointsSummary}
            validationErrors={validationErrors}
            isReadOnly={isAssessmentReadOnly}
            onUpdate={onUpdateAssessment}
            onAutoDistributePoints={onAutoDistributePoints}
          />
        </div>
      </div>
    </div>
  );
}
