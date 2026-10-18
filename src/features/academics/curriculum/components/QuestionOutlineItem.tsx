"use client";

import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, AlertCircle, ChevronUp, ChevronDown, MoreVertical, Trash2 } from "lucide-react";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { validateQuestion } from "@/features/academics/curriculum/utils/validation";
import Button from "@/components/ui/button/Button";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import type { QuestionValidationError } from "../types/types";

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
  isLegacyReadOnly?: boolean;
  validationErrors?: QuestionValidationError;
  validationPending?: boolean;
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
  isLegacyReadOnly = false,
  validationErrors,
  validationPending = false,
}: QuestionOutlineItemProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");
  const tGrades = useTranslations("academics.grades.questions");
  const locale = useLocale();
  const tBuilder = useTranslations("academics.curriculum.assignmentBuilder");

  const displayText =
    (locale === "ar" ? question.questionTextAr : question.questionTextEn) ||
    question.mediaTitle ||
    question.mediaFileName;

  const valid = Object.values(validationErrors ?? validateQuestion(question, tValidation)).filter(Boolean).length === 0;

  return (
    <div className={`mb-2 rounded-lg border transition-colors motion-reduce:transition-none ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 bg-white hover:border-gray-300"}`}>
      <div className="flex items-start gap-1 p-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className="min-w-0 flex-1 rounded-md p-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{t("question")} {index + 1}</span>
            <span>{question.points} {t("points")}</span>
          </span>
          <span className="mb-2 line-clamp-2 break-words text-sm leading-6 text-gray-900">{displayText || t("question_text")}</span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="rounded bg-gray-100 px-1.5 py-0.5">{t(`question_types.${question.questionType}`)}</span>
            {isLegacyReadOnly && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">{tGrades("legacyReadOnly")}</span>}
            {!validationPending && (
              <span className={`inline-flex items-center gap-1 ${valid ? "text-emerald-800" : "text-amber-800"}`}>
                {valid ? <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                {valid ? t("configured") : tBuilder("needsAttention")}
              </span>
            )}
          </span>
        </button>
        {!isReadOnly && (
          <DropdownMenu
            trigger={<Button type="button" variant="ghost" size="sm" aria-label={tBuilder("questionActions", { number: index + 1 })} className="min-h-10 min-w-10 !px-2 focus-visible:ring-2 focus-visible:ring-primary"><MoreVertical className="h-4 w-4" aria-hidden="true" /></Button>}
            items={[{ value: "delete", label: t("delete_question"), icon: <Trash2 className="h-4 w-4" />, tone: "danger", onClick: onDelete }]}
          />
        )}
      </div>
      {!isReadOnly && (
        <div className="flex justify-end gap-1 border-t border-gray-100 px-2 py-1">
          <Button type="button" variant="ghost" size="sm" onClick={onMoveUp} disabled={!canMoveUp} aria-label={t("move_up")} className="min-h-10 min-w-10 !px-2 focus-visible:ring-2 focus-visible:ring-primary"><ChevronUp className="h-4 w-4" aria-hidden="true" /></Button>
          <Button type="button" variant="ghost" size="sm" onClick={onMoveDown} disabled={!canMoveDown} aria-label={t("move_down")} className="min-h-10 min-w-10 !px-2 focus-visible:ring-2 focus-visible:ring-primary"><ChevronDown className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
      )}
    </div>
  );
}
