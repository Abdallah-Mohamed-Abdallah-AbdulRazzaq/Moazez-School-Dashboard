"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Drawer, Tabs, Tab } from "@mui/material";
import { Menu, Plus, FileText, Save } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { AssignmentQuestion, Assignment, AssignmentAttachment } from "@/features/academics/curriculum/services/curriculumService";
import { ValidationErrors, PointsSummary } from "../types/types";
import QuestionOutlineItem from "@/features/academics/curriculum/components/QuestionOutlineItem";
import AssignmentSettingsPanel from "./AssignmentSettingsPanel";
import AttachmentsPanel from "./AttachmentsPanel";
import EmptyQuestionState from "./EmptyQuestionState";
import QuestionEditor from "@/features/academics/curriculum/components/QuestionEditor";
import type { QuestionType } from "../types/types";
import type { ReactNode } from "react";

interface MobileLayoutProps {
  questions: AssignmentQuestion[];
  selectedQuestionId: string | null;
  selectedQuestion: AssignmentQuestion | undefined;
  assignment: Assignment;
  attachments: AssignmentAttachment[];
  isReadOnly: boolean;
  pointsSummary: PointsSummary;
  validationErrors: ValidationErrors;
  isQuestionDirty?: boolean;
  isQuestionSaving?: boolean;
  showQuestionSave?: boolean;
  allowedQuestionTypes?: QuestionType[];
  requireBothLocalizedTexts?: boolean;
  showHomeworkFields?: boolean;
  showAttachmentLinks?: boolean;
  detailsInputMode?: "bilingual" | "single";
  sidebarDetails?: ReactNode;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, updates: Partial<AssignmentQuestion>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onUpdateAssignment: (updates: Partial<Assignment>) => void;
  onAutoDistributePoints: () => void;
  onUploadFile: (file: File) => Promise<void>;
  onAddLink?: (title: string, url: string) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => void;
  onSaveQuestion?: () => Promise<void>;
}

export default function MobileLayout({
  questions,
  selectedQuestionId,
  selectedQuestion,
  assignment,
  attachments,
  isReadOnly,
  pointsSummary,
  validationErrors,
  isQuestionDirty = false,
  isQuestionSaving = false,
  showQuestionSave = true,
  allowedQuestionTypes,
  requireBothLocalizedTexts = true,
  showHomeworkFields = false,
  showAttachmentLinks = true,
  detailsInputMode = "bilingual",
  sidebarDetails,
  onSelectQuestion,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onUpdateAssignment,
  onAutoDistributePoints,
  onUploadFile,
  onAddLink,
  onDeleteAttachment,
  onSaveQuestion,
}: MobileLayoutProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tCommon = useTranslations("common");
  const [mobileTab, setMobileTab] = useState<"questions" | "settings" | "attachments">("questions");
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <Tabs
          value={mobileTab}
          onChange={(_, newValue) => setMobileTab(newValue)}
          variant="fullWidth"
        >
          <Tab label={t("questions")} value="questions" />
          <Tab label={t("settings")} value="settings" />
          <Tab label={t("attachments")} value="attachments" />
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {mobileTab === "questions" && (
          <div className="flex flex-col h-full">
            {/* Questions Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <Button
                onClick={() => setQuestionsDrawerOpen(true)}
                variant="secondary"
                size="sm"
                leftIcon={<Menu className="w-4 h-4" />}
              >
                {t("questionsOutline")} ({questions.length})
              </Button>

              {!isReadOnly && selectedQuestion && showQuestionSave && onSaveQuestion && (
                <Button
                  onClick={onSaveQuestion}
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                  disabled={!isQuestionDirty || isQuestionSaving}
                >
                  {isQuestionSaving ? tCommon("saving") : tCommon("saveQuestion")}
                </Button>
              )}
            </div>

            {/* Question Editor Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedQuestion ? (
                <QuestionEditor
                  key={selectedQuestion.id}
                  question={selectedQuestion}
                  onChange={(updates) => onUpdateQuestion(selectedQuestion.id, updates)}
                  isReadOnly={isReadOnly}
                  validationErrors={validationErrors.questions?.[selectedQuestion.id]}
                  allowedQuestionTypes={allowedQuestionTypes}
                  requireBothLocalizedTexts={requireBothLocalizedTexts}
                  showHomeworkFields={showHomeworkFields}
                  detailsInputMode={detailsInputMode}
                />
              ) : (
                <EmptyQuestionState isReadOnly={isReadOnly} onAddQuestion={onAddQuestion} />
              )}
            </div>
          </div>
        )}

        {mobileTab === "settings" && (
          <div className="p-4">
            {sidebarDetails}
            <AssignmentSettingsPanel
              assignment={assignment}
              pointsSummary={pointsSummary}
              validationErrors={validationErrors}
              isReadOnly={isReadOnly}
              detailsInputMode={detailsInputMode}
              onUpdate={onUpdateAssignment}
              onAutoDistributePoints={onAutoDistributePoints}
            />
          </div>
        )}

        {mobileTab === "attachments" && (
          <div className="p-4">
            <AttachmentsPanel
              attachments={attachments}
              onUploadFile={onUploadFile}
              onAddLink={onAddLink}
              onDeleteAttachment={onDeleteAttachment}
              isReadOnly={isReadOnly}
              showLinkUpload={showAttachmentLinks}
            />
          </div>
        )}
      </div>

      {/* Questions Drawer */}
      <Drawer anchor="left" open={questionsDrawerOpen} onClose={() => setQuestionsDrawerOpen(false)}>
        <div className="w-80 h-full bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">{t("questionsOutline")}</h2>
              {!isReadOnly && (
                <Button
                  onClick={() => {
                    onAddQuestion();
                    setQuestionsDrawerOpen(false);
                  }}
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {t("addQuestion")}
                </Button>
              )}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t("noQuestionsYet")}</p>
            </div>
          ) : (
            <div className="p-2">
              {questions.map((q, index) => (
                <QuestionOutlineItem
                  key={q.id}
                  question={q}
                  index={index}
                  isSelected={selectedQuestionId === q.id}
                  onSelect={() => {
                    onSelectQuestion(q.id);
                    setQuestionsDrawerOpen(false);
                  }}
                  onMoveUp={() => onMoveQuestion(q.id, "up")}
                  onMoveDown={() => onMoveQuestion(q.id, "down")}
                  onDelete={() => onDeleteQuestion(q.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < questions.length - 1}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
