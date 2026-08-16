"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import Input from "@/components/ui/input/Input";
import { QuestionOption } from "@/features/academics/curriculum/services/curriculumService";

export interface QuestionOptionRowErrors {
  ar?: string;
  en?: string;
}

interface QuestionOptionRowProps {
  option: QuestionOption;
  isMCQSingle: boolean;
  isReadOnly: boolean;
  radioGroupName?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTextChange: (id: string, ar: string, en: string) => void;
  onCorrectChange: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  errors?: QuestionOptionRowErrors;
  singleTextMode?: boolean;
  t: (key: string) => string;
}

export default function QuestionOptionRow({
  option,
  isMCQSingle,
  isReadOnly,
  radioGroupName = "correct-option",
  canMoveUp,
  canMoveDown,
  onTextChange,
  onCorrectChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  errors,
  singleTextMode = false,
  t,
}: QuestionOptionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-border rounded-lg p-3 bg-white ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {!isReadOnly && (
          <button
            {...attributes}
            {...listeners}
            className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            aria-label={t("reorder_option")}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        <div className="mt-2">
          {isMCQSingle ? (
            <input
              type="radio"
              name={radioGroupName}
              checked={option.isCorrect}
              onChange={() => onCorrectChange(option.id, true)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
          ) : (
            <input
              type="checkbox"
              checked={option.isCorrect}
              onChange={(event) => onCorrectChange(option.id, event.target.checked)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
          )}
        </div>

        <div className="flex-1 space-y-2">
          {singleTextMode ? (
            <Input
              value={option.textEn || option.textAr}
              onChange={(event) => onTextChange(option.id, event.target.value, event.target.value)}
              placeholder={t("option_text")}
              disabled={isReadOnly}
              error={errors?.en || errors?.ar}
            />
          ) : (
            <>
              <Input
                value={option.textAr}
                onChange={(event) => onTextChange(option.id, event.target.value, option.textEn)}
                placeholder={`${t("option_text")} (\u0639\u0631\u0628\u064a)`}
                disabled={isReadOnly}
                error={errors?.ar}
              />
              <Input
                value={option.textEn}
                onChange={(event) => onTextChange(option.id, option.textAr, event.target.value)}
                placeholder={`${t("option_text")} (English)`}
                disabled={isReadOnly}
                error={errors?.en}
              />
            </>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => onMoveUp(option.id)}
              disabled={!canMoveUp}
              className={`p-1 rounded ${
                canMoveUp
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              aria-label={t("move_up")}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMoveDown(option.id)}
              disabled={!canMoveDown}
              className={`p-1 rounded ${
                canMoveDown
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              aria-label={t("move_down")}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isReadOnly && (
          <button
            onClick={() => onRemove(option.id)}
            className="mt-2 p-1 text-red-600 hover:bg-red-50 rounded"
            aria-label={t("remove_option")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
