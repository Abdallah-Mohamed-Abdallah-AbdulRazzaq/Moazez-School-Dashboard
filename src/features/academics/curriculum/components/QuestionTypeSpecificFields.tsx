"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Link2, Paperclip, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  AssignmentQuestion,
  MatchingPair,
} from "@/features/academics/curriculum/services/curriculumService";

interface QuestionTypeSpecificFieldsProps {
  questionId: string;
  questionType: AssignmentQuestion["questionType"];
  isReadOnly: boolean;
  correctAnswer: boolean;
  sampleAnswerAr: string;
  sampleAnswerEn: string;
  acceptedAnswersAr: string[];
  acceptedAnswersEn: string[];
  matchingPairs: MatchingPair[];
  mediaMode: "FILE" | "LINK";
  mediaTitle: string;
  mediaUrl: string;
  mediaFileName: string;
  mediaMimeType: string;
  mediaSize?: number;
  setTrueFalseAnswer: (value: boolean) => void;
  setSampleAnswerArValue: (value: string) => void;
  setSampleAnswerEnValue: (value: string) => void;
  setAcceptedAnswersArValue: (value: string[]) => void;
  setAcceptedAnswersEnValue: (value: string[]) => void;
  addMatchingPair: () => void;
  updateMatchingPair: (id: string, updates: Partial<MatchingPair>) => void;
  removeMatchingPair: (id: string) => void;
  moveMatchingPairUp: (id: string) => void;
  moveMatchingPairDown: (id: string) => void;
  setMediaModeValue: (value: "FILE" | "LINK") => void;
  setMediaTitleValue: (value: string) => void;
  setMediaUrlValue: (value: string) => void;
  setMediaFileValue: (file: File | null) => void;
  clearMedia: () => void;
  validationErrors?: {
    correctAnswer?: string;
    acceptedAnswers?: string;
    matchingPairs?: string;
    media?: string;
  };
}

function answersToTextareaValue(values: string[]) {
  return values.join("\n");
}

function parseTextareaAnswers(value: string) {
  return value.split("\n");
}

function formatFileSize(size?: number) {
  if (typeof size !== "number" || Number.isNaN(size)) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuestionTypeSpecificFields({
  questionId,
  questionType,
  isReadOnly,
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
  validationErrors,
}: QuestionTypeSpecificFieldsProps) {
  const t = useTranslations("academics.curriculum.questions");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trueFalseGroupName = `question-true-false-${questionId}`;
  const canRemoveMatchingPair = matchingPairs.length > 2;

  if (questionType === "TRUE_FALSE") {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">{t("correct_answer")}</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={trueFalseGroupName}
              checked={correctAnswer === true}
              onChange={() => setTrueFalseAnswer(true)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
            <span>{t("true")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={trueFalseGroupName}
              checked={correctAnswer === false}
              onChange={() => setTrueFalseAnswer(false)}
              disabled={isReadOnly}
              className="w-4 h-4"
            />
            <span>{t("false")}</span>
          </label>
        </div>
        {validationErrors?.correctAnswer ? (
          <p className="text-xs text-red-600">{validationErrors.correctAnswer}</p>
        ) : null}
      </div>
    );
  }

  if (questionType === "SHORT_ANSWER") {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          {t("manual_grading_hint")}
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-600">{t("sample_answer")}</label>
          <textarea
            value={sampleAnswerAr}
            onChange={(event) => setSampleAnswerArValue(event.target.value)}
            placeholder={t("sample_answer_ar_placeholder")}
            disabled={isReadOnly}
            rows={3}
            dir="rtl"
            className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
          />
          <textarea
            value={sampleAnswerEn}
            onChange={(event) => setSampleAnswerEnValue(event.target.value)}
            placeholder={t("sample_answer_en_placeholder")}
            disabled={isReadOnly}
            rows={3}
            dir="ltr"
            className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
          />
        </div>
      </div>
    );
  }

  if (questionType === "ESSAY") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        {t("manual_grading_hint")}
      </div>
    );
  }

  if (questionType === "FILL_IN_BLANK") {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          {t("fill_in_blank_hint")}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("accepted_answers_ar")}
            </label>
            <textarea
              value={answersToTextareaValue(acceptedAnswersAr)}
              onChange={(event) => setAcceptedAnswersArValue(parseTextareaAnswers(event.target.value))}
              placeholder={t("accepted_answers_ar_placeholder")}
              disabled={isReadOnly}
              rows={5}
              dir="rtl"
              className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("accepted_answers_en")}
            </label>
            <textarea
              value={answersToTextareaValue(acceptedAnswersEn)}
              onChange={(event) => setAcceptedAnswersEnValue(parseTextareaAnswers(event.target.value))}
              placeholder={t("accepted_answers_en_placeholder")}
              disabled={isReadOnly}
              rows={5}
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none border-gray-200"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">{t("accepted_answers_help")}</p>
        {validationErrors?.acceptedAnswers ? (
          <p className="text-xs text-red-600">{validationErrors.acceptedAnswers}</p>
        ) : null}
      </div>
    );
  }

  if (questionType === "MATCHING") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">{t("matching_pairs")}</label>
            <p className="text-xs text-gray-500">{t("matching_pairs_help")}</p>
          </div>
          {!isReadOnly ? (
            <Button onClick={addMatchingPair} variant="secondary" size="sm">
              <Plus className="w-4 h-4" />
              {t("add_pair")}
            </Button>
          ) : null}
        </div>

        <div className="space-y-3">
          {matchingPairs.map((pair, index) => (
            <div key={pair.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  {t("pair_label", { number: index + 1 })}
                </div>
                {!isReadOnly ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveMatchingPairUp(pair.id)}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
                      aria-label={t("move_up")}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMatchingPairDown(pair.id)}
                      disabled={index === matchingPairs.length - 1}
                      className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300"
                      aria-label={t("move_down")}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMatchingPair(pair.id)}
                      disabled={!canRemoveMatchingPair}
                      className="rounded p-1 text-red-600 hover:bg-red-50 disabled:text-gray-300"
                      aria-label={t("remove_pair")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label={t("matching_prompt_ar")}
                  value={pair.promptAr}
                  onChange={(event) => updateMatchingPair(pair.id, { promptAr: event.target.value })}
                  disabled={isReadOnly}
                />
                <Input
                  label={t("matching_prompt_en")}
                  value={pair.promptEn}
                  onChange={(event) => updateMatchingPair(pair.id, { promptEn: event.target.value })}
                  disabled={isReadOnly}
                />
                <Input
                  label={t("matching_answer_ar")}
                  value={pair.matchAr}
                  onChange={(event) => updateMatchingPair(pair.id, { matchAr: event.target.value })}
                  disabled={isReadOnly}
                />
                <Input
                  label={t("matching_answer_en")}
                  value={pair.matchEn}
                  onChange={(event) => updateMatchingPair(pair.id, { matchEn: event.target.value })}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          {t("manual_grading_hint")}
        </div>
        {validationErrors?.matchingPairs ? (
          <p className="text-xs text-red-600">{validationErrors.matchingPairs}</p>
        ) : null}
      </div>
    );
  }

  if (questionType === "MEDIA") {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          {t("media_hint")}
        </div>

        <Select
          label={t("media_mode")}
          value={mediaMode}
          onChange={(value) => setMediaModeValue(value as "FILE" | "LINK")}
          options={[
            { value: "LINK", label: t("media_mode_link") },
            { value: "FILE", label: t("media_mode_file") },
          ]}
          disabled={isReadOnly}
        />

        <Input
          label={t("media_title")}
          value={mediaTitle}
          onChange={(event) => setMediaTitleValue(event.target.value)}
          disabled={isReadOnly}
          placeholder={t("media_title_placeholder")}
        />

        {mediaMode === "LINK" ? (
          <div className="space-y-2">
            <Input
              label={t("media_url")}
              value={mediaUrl}
              onChange={(event) => setMediaUrlValue(event.target.value)}
              disabled={isReadOnly}
              placeholder="https://"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Link2 className="w-3.5 h-3.5" />
              <span>{t("media_link_help")}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => setMediaFileValue(event.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                size="sm"
                disabled={isReadOnly}
              >
                <Paperclip className="w-4 h-4" />
                {t("attach_file")}
              </Button>
              {(mediaFileName || mediaUrl) && !isReadOnly ? (
                <Button onClick={clearMedia} variant="ghost" size="sm">
                  {t("remove_media")}
                </Button>
              ) : null}
            </div>
            {(mediaFileName || mediaUrl) ? (
              <div className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="font-medium text-gray-800">{mediaFileName || mediaTitle || t("media_attached")}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {[mediaMimeType, formatFileSize(mediaSize)].filter(Boolean).join(" • ") || t("media_attached")}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {validationErrors?.media ? <p className="text-xs text-red-600">{validationErrors.media}</p> : null}
      </div>
    );
  }

  return null;
}
