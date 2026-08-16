"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { useQuestionFormState } from "@/features/academics/curriculum/hooks/useQuestionFormState";
import {
  normalizeQuestionText,
  validateQuestion,
} from "@/features/academics/curriculum/utils/validation";
import QuestionOptionRow, { QuestionOptionRowErrors } from "./QuestionOptionRow";
import QuestionTypeSpecificFields from "./QuestionTypeSpecificFields";

interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Partial<AssignmentQuestion>) => Promise<void>;
  question?: AssignmentQuestion | null;
  isReadOnly: boolean;
}

export default function QuestionDrawer({
  isOpen,
  onClose,
  onSave,
  question,
  isReadOnly,
}: QuestionDrawerProps) {
  const t = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [errors, setErrors] = useState<{
    ar?: string;
    en?: string;
    points?: string;
    options?: Record<string, QuestionOptionRowErrors>;
    correctAnswer?: string;
    acceptedAnswers?: string;
    matchingPairs?: string;
    media?: string;
    general?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const {
    questionTextAr,
    questionTextEn,
    questionType,
    points,
    options,
    correctAnswer,
    sampleAnswerAr,
    sampleAnswerEn,
    acceptedAnswersAr,
    acceptedAnswersEn,
    matchingPairs,
    mediaMode,
    mediaTitle,
    mediaUrl,
    mediaFileName,
    mediaMimeType,
    mediaSize,
    setQuestionText,
    setPointsValue,
    handleTypeChange,
    addOption,
    removeOption,
    updateOptionText,
    updateOptionCorrect,
    moveOptionUp,
    moveOptionDown,
    reorderOptions,
    setTrueFalseAnswer,
    setSampleAnswerArValue,
    setSampleAnswerEnValue,
    setAcceptedAnswersArValue,
    setAcceptedAnswersEnValue,
    addMatchingPair,
    updateMatchingPair,
    removeMatchingPair,
    moveMatchingPairUp,
    moveMatchingPairDown,
    setMediaModeValue,
    setMediaTitleValue,
    setMediaUrlValue,
    setMediaFileValue,
    clearMedia,
    buildPayload,
  } = useQuestionFormState({
    question,
    isOpen,
    resetKey: question?.id ?? null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => setErrors({}));
    }
  }, [isOpen, question?.id]);

  const handleOptionTextChange = (id: string, ar: string, en: string) => {
    updateOptionText(id, ar, en);
    if (errors.options?.[id]) {
      const nextOptionErrors = { ...errors.options };
      delete nextOptionErrors[id];
      setErrors({ ...errors, options: nextOptionErrors });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderOptions(String(active.id), String(over.id));
    }
  };

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    const payload = buildPayload();
    const validation = validateQuestion(
      {
        id: question?.id || "draft-question",
        assignmentId: question?.assignmentId || "draft-assignment",
        createdAt: question?.createdAt || new Date().toISOString(),
        order: question?.order || 1,
        ...payload,
      } as AssignmentQuestion,
      tValidation
    );

    if (questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI") {
      if (options.length < 2) {
        nextErrors.general = tValidation("minTwoOptions");
      }

      const optionErrors: Record<string, QuestionOptionRowErrors> = {};
      const normalizedAr = new Set<string>();
      const normalizedEn = new Set<string>();

      options.forEach((option) => {
        const optionError: QuestionOptionRowErrors = {};

        if (!option.textAr.trim()) optionError.ar = tValidation("required_ar");
        if (!option.textEn.trim()) optionError.en = tValidation("required_en");

        if (option.textAr.trim()) {
          const normalized = normalizeQuestionText(option.textAr);
          if (normalizedAr.has(normalized)) {
            optionError.ar = tValidation("duplicateOptionAr");
          } else {
            normalizedAr.add(normalized);
          }
        }

        if (option.textEn.trim()) {
          const normalized = normalizeQuestionText(option.textEn);
          if (normalizedEn.has(normalized)) {
            optionError.en = tValidation("duplicateOptionEn");
          } else {
            normalizedEn.add(normalized);
          }
        }

        if (Object.keys(optionError).length > 0) {
          optionErrors[option.id] = optionError;
        }
      });

      if (Object.keys(optionErrors).length > 0) {
        nextErrors.options = optionErrors;
      }

    } else {
      nextErrors.correctAnswer = validation.correctAnswer;
      nextErrors.acceptedAnswers = validation.acceptedAnswers;
      nextErrors.matchingPairs = validation.matchingPairs;
      nextErrors.media = validation.media;
    }

    nextErrors.ar = validation.textAr;
    nextErrors.en = validation.textEn;
    nextErrors.points = validation.points;
    if (!nextErrors.general) {
      nextErrors.general = validation.options;
    }
    if (!nextErrors.correctAnswer) {
      nextErrors.correctAnswer = validation.correctAnswer;
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => {
      if (!value) {
        return true;
      }
      if (typeof value === "string") {
        return false;
      }
      return Object.keys(value).length === 0;
    });
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(buildPayload());
      onClose();
    } catch (error) {
      console.error("Failed to save question:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const questionTypeOptions = [
    { value: "MCQ_SINGLE", label: t("question_types.MCQ_SINGLE") },
    { value: "MCQ_MULTI", label: t("question_types.MCQ_MULTI") },
    { value: "TRUE_FALSE", label: t("question_types.TRUE_FALSE") },
    { value: "SHORT_ANSWER", label: t("question_types.SHORT_ANSWER") },
    { value: "ESSAY", label: t("question_types.ESSAY") },
    { value: "FILL_IN_BLANK", label: t("question_types.FILL_IN_BLANK") },
    { value: "MATCHING", label: t("question_types.MATCHING") },
    { value: "MEDIA", label: t("question_types.MEDIA") },
  ];

  const isMCQ = questionType === "MCQ_SINGLE" || questionType === "MCQ_MULTI";
  const canRemoveOption = options.length > 2;
  const radioGroupName = `drawer-correct-option-${question?.id ?? "new"}`;

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxWidth: { xs: "100%", sm: 600, md: 700 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {question ? t("edit_question") : t("add_question")}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <BilingualTextField
            label={t("question_text")}
            value={{ ar: questionTextAr, en: questionTextEn }}
            onChange={(value) => {
              setQuestionText(value);
              setErrors({ ...errors, ar: undefined, en: undefined });
            }}
            requiredAr={questionType !== "MEDIA"}
            requiredEn={questionType !== "MEDIA"}
            errors={errors}
            disabled={isReadOnly}
            placeholder={{
              ar: "\u0623\u062f\u062e\u0644 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
              en: "Enter question text in English",
            }}
          />

          <Select
            label={t("question_type")}
            value={questionType}
            onChange={(value) => handleTypeChange(value as AssignmentQuestion["questionType"])}
            options={questionTypeOptions}
            disabled={isReadOnly}
            required
          />

          <Input
            label={t("points")}
            type="number"
            value={points}
            onChange={(event) => {
              setPointsValue(Number(event.target.value));
              setErrors({ ...errors, points: undefined });
            }}
            error={errors.points}
            disabled={isReadOnly}
            min={0}
            placeholder="1"
            required
          />

          <div className="space-y-3">
            <div className="border-t pt-3">
              <label className="text-sm font-medium block mb-3">
                {questionType === "MEDIA" ? t("media") : t("answers")}
              </label>

              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">
                  {errors.general}
                </div>
              )}

              {isMCQ && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">{t("options")}</label>
                    {!isReadOnly && (
                      <Button onClick={addOption} variant="secondary" size="sm">
                        {t("add_option")}
                      </Button>
                    )}
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={options.map((option) => option.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {options.map((option, index) => (
                          <QuestionOptionRow
                            key={option.id}
                            option={option}
                            isMCQSingle={questionType === "MCQ_SINGLE"}
                            isReadOnly={isReadOnly}
                            radioGroupName={radioGroupName}
                            canMoveUp={index > 0}
                            canMoveDown={index < options.length - 1}
                            onTextChange={handleOptionTextChange}
                            onCorrectChange={updateOptionCorrect}
                            onRemove={canRemoveOption ? removeOption : () => {}}
                            onMoveUp={moveOptionUp}
                            onMoveDown={moveOptionDown}
                            errors={errors.options?.[option.id]}
                            t={t}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <p className="text-xs text-gray-500">
                    {questionType === "MCQ_SINGLE"
                      ? `${t("correct_answer")}: ${tValidation("selectCorrectSingle")}`
                      : `${t("correct_answer")}: ${tValidation("selectCorrectMulti")}`}
                  </p>
                </div>
              )}

              {!isMCQ && (
                <QuestionTypeSpecificFields
                  questionId={question?.id ?? "new"}
                  questionType={questionType}
                  isReadOnly={isReadOnly}
                  correctAnswer={correctAnswer}
                  sampleAnswerAr={sampleAnswerAr}
                  sampleAnswerEn={sampleAnswerEn}
                  acceptedAnswersAr={acceptedAnswersAr}
                  acceptedAnswersEn={acceptedAnswersEn}
                  matchingPairs={matchingPairs}
                  mediaMode={mediaMode}
                  mediaTitle={mediaTitle}
                  mediaUrl={mediaUrl}
                  mediaFileName={mediaFileName}
                  mediaMimeType={mediaMimeType}
                  mediaSize={mediaSize}
                  setTrueFalseAnswer={setTrueFalseAnswer}
                  setSampleAnswerArValue={setSampleAnswerArValue}
                  setSampleAnswerEnValue={setSampleAnswerEnValue}
                  setAcceptedAnswersArValue={setAcceptedAnswersArValue}
                  setAcceptedAnswersEnValue={setAcceptedAnswersEnValue}
                  addMatchingPair={addMatchingPair}
                  updateMatchingPair={updateMatchingPair}
                  removeMatchingPair={removeMatchingPair}
                  moveMatchingPairUp={moveMatchingPairUp}
                  moveMatchingPairDown={moveMatchingPairDown}
                  setMediaModeValue={setMediaModeValue}
                  setMediaTitleValue={setMediaTitleValue}
                  setMediaUrlValue={setMediaUrlValue}
                  setMediaFileValue={setMediaFileValue}
                  clearMedia={clearMedia}
                  validationErrors={errors}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0">
        <Button onClick={onClose} variant="secondary" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary" disabled={isReadOnly || isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Drawer>
  );
}
