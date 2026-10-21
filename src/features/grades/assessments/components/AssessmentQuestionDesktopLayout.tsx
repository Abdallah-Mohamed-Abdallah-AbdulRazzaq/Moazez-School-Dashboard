"use client";

import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors, PointsSummary } from "@/features/academics/curriculum/types/types";
import BuilderSettingsSidebar from "@/features/academics/curriculum/components/BuilderSettingsSidebar";
import BuilderValidationSummary from "@/features/academics/curriculum/components/BuilderValidationSummary";
import Button from "@/components/ui/button/Button";
import QuestionsOutline from "@/features/academics/curriculum/components/QuestionsOutline";
import EmptyQuestionState from "@/features/academics/curriculum/components/EmptyQuestionState";
import QuestionEditor, { type QuestionEditorQuestion } from "@/features/academics/curriculum/components/QuestionEditor";
import type { Assessment, ExamScopeType, ScopeEntityOption, ScopeOption } from "../types";
import AssessmentQuestionSettingsPanel from "./AssessmentQuestionSettingsPanel";
import { ASSESSMENT_AUTHORING_QUESTION_TYPES } from "../utils/assessmentQuestionAvailability";

interface AssessmentQuestionDesktopLayoutProps {
  questions: AssignmentQuestion[];
  selectedQuestionId: string | null;
  selectedQuestion: QuestionEditorQuestion | undefined;
  assessment: Assessment;
  termLabel: string;
  scopeTypes: ExamScopeType[];
  scopeEntitiesByType: Record<ExamScopeType, ScopeEntityOption[]>;
  subjects: Array<Pick<ScopeOption, "id" | "nameAr" | "nameEn">>;
  isReadOnly: boolean;
  isAssessmentReadOnly: boolean;
  pointsSummary: PointsSummary;
  validationErrors: ValidationErrors;
  isQuestionDirty: boolean;
  isQuestionSaving: boolean;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, updates: Partial<QuestionEditorQuestion>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onUpdateAssessment: (updates: Partial<Assessment>) => void;
  onAutoDistributePoints: () => void;
  onSaveQuestion: () => Promise<void>;
  isQuestionReadOnly: (question: AssignmentQuestion) => boolean;
  isAutoDistributeDisabled: boolean;
}

export default function AssessmentQuestionDesktopLayout({
  questions,
  selectedQuestionId,
  selectedQuestion,
  assessment,
  termLabel,
  scopeTypes,
  scopeEntitiesByType,
  subjects,
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
  isQuestionReadOnly,
  isAutoDistributeDisabled,
}: AssessmentQuestionDesktopLayoutProps) {
  const tCommon = useTranslations("common");
  const selectedQuestionReadOnly = isReadOnly
    || Boolean(selectedQuestion && isQuestionReadOnly(selectedQuestion));

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <QuestionsOutline
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        isReadOnly={isReadOnly}
        validationErrors={validationErrors.questions}
        onSelectQuestion={onSelectQuestion}
        onAddQuestion={onAddQuestion}
        onMoveQuestion={onMoveQuestion}
        onDeleteQuestion={onDeleteQuestion}
        isQuestionReadOnly={isQuestionReadOnly}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-x bg-gray-50" style={{ borderColor: "var(--border-color)" }}>
        {selectedQuestion ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: "var(--border-color)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {tCommon("edit")} {tCommon("question")}
              </h2>
              {!selectedQuestionReadOnly && (
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

            <div className="flex-1 overflow-y-auto p-4 xl:p-6">
              <BuilderValidationSummary questions={questions} validationErrors={validationErrors} onSelectQuestion={onSelectQuestion} />
              <QuestionEditor
                key={selectedQuestion.id}
                question={selectedQuestion}
                onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
                isReadOnly={selectedQuestionReadOnly}
                allowQuestionImages
                allowedQuestionTypes={ASSESSMENT_AUTHORING_QUESTION_TYPES}
                requirementField="required"
                validationErrors={validationErrors.questions?.[selectedQuestion.id]}
              />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <BuilderValidationSummary questions={questions} validationErrors={validationErrors} onSelectQuestion={onSelectQuestion} />
            <EmptyQuestionState isReadOnly={isReadOnly} onAddQuestion={onAddQuestion} />
          </div>
        )}
      </div>

      <BuilderSettingsSidebar validationErrors={validationErrors}>
        <div className="p-6">
          <AssessmentQuestionSettingsPanel
            assessment={assessment}
            termLabel={termLabel}
            scopeTypes={scopeTypes}
            scopeEntitiesByType={scopeEntitiesByType}
            subjects={subjects}
            pointsSummary={pointsSummary}
            validationErrors={validationErrors}
            isReadOnly={isAssessmentReadOnly}
            onUpdate={onUpdateAssessment}
            onAutoDistributePoints={onAutoDistributePoints}
            isAutoDistributeDisabled={isAutoDistributeDisabled}
          />
        </div>
      </BuilderSettingsSidebar>
    </div>
  );
}
