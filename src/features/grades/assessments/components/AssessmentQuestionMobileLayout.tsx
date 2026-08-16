"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Drawer, Tab, Tabs } from "@mui/material";
import { Menu, Plus, Save } from "lucide-react";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors, PointsSummary } from "@/features/academics/curriculum/types/types";
import Button from "@/components/ui/button/Button";
import QuestionOutlineItem from "@/features/academics/curriculum/components/QuestionOutlineItem";
import EmptyQuestionState from "@/features/academics/curriculum/components/EmptyQuestionState";
import QuestionEditor from "@/features/academics/curriculum/components/QuestionEditor";
import type { Assessment } from "../types";
import AssessmentQuestionSettingsPanel from "./AssessmentQuestionSettingsPanel";

interface AssessmentQuestionMobileLayoutProps {
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

export default function AssessmentQuestionMobileLayout({
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
}: AssessmentQuestionMobileLayoutProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tCommon = useTranslations("common");
  const [mobileTab, setMobileTab] = useState<"questions" | "settings">("questions");
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-white" style={{ borderColor: "var(--border-color)" }}>
        <Tabs value={mobileTab} onChange={(_event, value) => setMobileTab(value)} variant="fullWidth">
          <Tab label={t("questions")} value="questions" />
          <Tab label={t("settings")} value="settings" />
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50">
        {mobileTab === "questions" && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b bg-white p-4" style={{ borderColor: "var(--border-color)" }}>
              <Button
                onClick={() => setQuestionsDrawerOpen(true)}
                variant="secondary"
                size="sm"
                leftIcon={<Menu className="h-4 w-4" />}
              >
                {t("questionsOutline")} ({questions.length})
              </Button>

              {!isReadOnly && selectedQuestion && (
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

            <div className="flex-1 overflow-y-auto p-4">
              {selectedQuestion ? (
                <QuestionEditor
                  key={selectedQuestion.id}
                  question={selectedQuestion}
                  onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
                  isReadOnly={isReadOnly}
                  validationErrors={validationErrors.questions?.[selectedQuestion.id]}
                />
              ) : (
                <EmptyQuestionState isReadOnly={isReadOnly} onAddQuestion={onAddQuestion} />
              )}
            </div>
          </div>
        )}

        {mobileTab === "settings" && (
          <div className="p-4">
            <AssessmentQuestionSettingsPanel
              assessment={assessment}
              pointsSummary={pointsSummary}
              validationErrors={validationErrors}
              isReadOnly={isAssessmentReadOnly}
              onUpdate={onUpdateAssessment}
              onAutoDistributePoints={onAutoDistributePoints}
            />
          </div>
        )}
      </div>

      <Drawer anchor="left" open={questionsDrawerOpen} onClose={() => setQuestionsDrawerOpen(false)}>
        <div className="h-full w-80 bg-white">
          <div className="border-b p-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("questionsOutline")}</h2>
              {!isReadOnly && (
                <Button
                  onClick={() => {
                    onAddQuestion();
                    setQuestionsDrawerOpen(false);
                  }}
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {t("addQuestion")}
                </Button>
              )}
            </div>
          </div>

          <div className="p-2">
            {questions.map((question, index) => (
              <QuestionOutlineItem
                key={question.id}
                question={question}
                index={index}
                isSelected={selectedQuestionId === question.id}
                onSelect={() => {
                  onSelectQuestion(question.id);
                  setQuestionsDrawerOpen(false);
                }}
                onMoveUp={() => onMoveQuestion(question.id, "up")}
                onMoveDown={() => onMoveQuestion(question.id, "down")}
                onDelete={() => onDeleteQuestion(question.id)}
                canMoveUp={index > 0}
                canMoveDown={index < questions.length - 1}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
