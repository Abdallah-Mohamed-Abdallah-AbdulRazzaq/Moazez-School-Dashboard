"use client";

import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { AssignmentQuestion, Assignment, AssignmentAttachment } from "@/features/academics/curriculum/services/curriculumService";
import { ValidationErrors, PointsSummary } from "../types/types";
import Button from "@/components/ui/button/Button";
import QuestionsOutline from "@/features/academics/curriculum/components/QuestionsOutline";
import AssignmentSettingsPanel from "@/features/academics/curriculum/components/AssignmentSettingsPanel";
import AttachmentsPanel from "@/features/academics/curriculum/components/AttachmentsPanel";
import EmptyQuestionState from "@/features/academics/curriculum/components/EmptyQuestionState";
import QuestionEditor from "@/features/academics/curriculum/components/QuestionEditor";
import type { QuestionType } from "../types/types";
import type { ReactNode } from "react";

interface DesktopLayoutProps {
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

export default function DesktopLayout({
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
}: DesktopLayoutProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Left Sidebar - Questions Outline */}
      <QuestionsOutline
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        isReadOnly={isReadOnly}
        onSelectQuestion={onSelectQuestion}
        onAddQuestion={onAddQuestion}
        onMoveQuestion={onMoveQuestion}
        onDeleteQuestion={onDeleteQuestion}
      />

      {/* Center - Question Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-border">
        {selectedQuestion ? (
          <div className="h-full flex flex-col">
            {/* Question Editor Header */}
            <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {tCommon("edit")} {tCommon("question")}
              </h2>
              {!isReadOnly && showQuestionSave && onSaveQuestion && (
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
            <div className="flex-1 overflow-y-auto p-6">
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
            </div>
          </div>
        ) : (
          <div className="p-6">
            <EmptyQuestionState isReadOnly={isReadOnly} onAddQuestion={onAddQuestion} />
          </div>
        )}
      </div>

      {/* Right Panel - Settings + Attachments */}
      <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {sidebarDetails}
          {/* Assignment Settings */}
          <AssignmentSettingsPanel
            assignment={assignment}
            pointsSummary={pointsSummary}
            validationErrors={validationErrors}
            isReadOnly={isReadOnly}
            detailsInputMode={detailsInputMode}
            onUpdate={onUpdateAssignment}
            onAutoDistributePoints={onAutoDistributePoints}
          />

          {/* Attachments */}
          <AttachmentsPanel
            attachments={attachments}
            onUploadFile={onUploadFile}
            onAddLink={onAddLink}
            onDeleteAttachment={onDeleteAttachment}
            isReadOnly={isReadOnly}
            showLinkUpload={showAttachmentLinks}
          />
        </div>
      </div>
    </div>
  );
}
