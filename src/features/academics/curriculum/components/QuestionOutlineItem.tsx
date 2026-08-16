"use client";

import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { validateQuestion } from "@/features/academics/curriculum/utils/validation";

interface QuestionOutlineItemProps {
  question: AssignmentQuestion;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReadOnly: boolean;
}

export default function QuestionOutlineItem({
  question,
  index,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  isReadOnly,
}: QuestionOutlineItemProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  const displayText =
    (locale === "ar" ? question.questionTextAr : question.questionTextEn) ||
    question.mediaTitle ||
    question.mediaFileName;

  const isValid = () => {
    return Object.keys(validateQuestion(question, tValidation)).length === 0;
  };

  const valid = isValid();

  return (
    <div
      className={`mb-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? valid
            ? "border-primary bg-primary/5"
            : "border-red-500 bg-red-50"
          : valid
          ? "border-gray-200 hover:border-gray-300 bg-white"
          : "border-red-300 hover:border-red-400 bg-red-50/50"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">
              {t("question")} {index + 1}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                question.questionType === "MCQ_SINGLE"
                  ? "bg-blue-100 text-blue-700"
                  : question.questionType === "MCQ_MULTI"
                  ? "bg-purple-100 text-purple-700"
                  : question.questionType === "TRUE_FALSE"
                  ? "bg-green-100 text-green-700"
                  : question.questionType === "FILL_IN_BLANK"
                  ? "bg-amber-100 text-amber-700"
                  : question.questionType === "MATCHING"
                  ? "bg-cyan-100 text-cyan-700"
                  : question.questionType === "MEDIA"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t(`question_types.${question.questionType}`)}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {question.points} {t("points")}
            </span>
          </div>
          <p className="text-sm text-gray-900 truncate">{displayText || t("question_text")}</p>
        </div>

        <div className="flex items-center gap-1">
          {valid ? (
            <CheckCircle className="w-4 h-4 text-green-600" aria-label={t("configured")} />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600" aria-label={t("needs_correct")} />
          )}

          {!isReadOnly && (
            <div className="flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={!canMoveUp}
                className={`p-0.5 ${
                  canMoveUp
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                aria-label={t("move_up")}
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={!canMoveDown}
                className={`p-0.5 ${
                  canMoveDown
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                aria-label={t("move_down")}
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="mt-2 text-xs text-red-600 hover:text-red-700"
        >
          {t("delete_question")}
        </button>
      )}
    </div>
  );
}
