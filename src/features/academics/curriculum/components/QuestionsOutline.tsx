"use client";

import { useTranslations } from "next-intl";
import { Plus, FileText } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ValidationErrors } from "../types/types";
import QuestionOutlineItem from "./QuestionOutlineItem";

interface QuestionsOutlineProps {
  questions: AssignmentQuestion[];
  selectedQuestionId: string | null;
  isReadOnly: boolean;
  validationErrors?: ValidationErrors["questions"];
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
  onDeleteQuestion: (questionId: string) => void;
  isQuestionReadOnly?: (question: AssignmentQuestion) => boolean;
}

export default function QuestionsOutline({
  questions,
  selectedQuestionId,
  isReadOnly,
  onSelectQuestion,
  onAddQuestion,
  onMoveQuestion,
  onDeleteQuestion,
  isQuestionReadOnly,
  validationErrors,
}: QuestionsOutlineProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");

  return (
    <div className="min-h-0 w-64 shrink-0 overflow-y-auto bg-white xl:w-72">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{t("questionsOutline")}</h2>
          {!isReadOnly && (
            <Button
              onClick={onAddQuestion}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              aria-label={t("addQuestion")}
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
          {!isReadOnly && (
            <Button
              onClick={onAddQuestion}
              variant="secondary"
              size="sm"
              className="mt-3"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t("addFirstQuestion")}
            </Button>
          )}
        </div>
      ) : (
        <div className="p-2">
          {questions.map((q, index) => (
            <QuestionOutlineItem
              key={q.id}
              question={q}
              index={index}
              isSelected={selectedQuestionId === q.id}
              onSelect={() => onSelectQuestion(q.id)}
              onMoveUp={() => onMoveQuestion(q.id, "up")}
              onMoveDown={() => onMoveQuestion(q.id, "down")}
              onDelete={() => onDeleteQuestion(q.id)}
              canMoveUp={index > 0}
              canMoveDown={index < questions.length - 1}
              isReadOnly={isReadOnly || (isQuestionReadOnly?.(q) ?? false)}
              validationErrors={validationErrors?.[q.id]}
              isLegacyReadOnly={isQuestionReadOnly?.(q) ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
