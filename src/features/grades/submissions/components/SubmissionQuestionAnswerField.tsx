"use client";

import { useLocale, useTranslations } from "next-intl";
import { Input, Select, TextArea } from "@/components/ui/input";
import type { BackendSubmissionQuestionResponse } from "../../gradebook/types/api.types";
import type { AssessmentQuestion, MatchingPair } from "../../shared/types";
import type { SubmissionAnswerDraft } from "../types";
import {
  isChoiceQuestion,
  isFillInBlankQuestion,
  isMatchingQuestion,
  isMediaQuestion,
} from "../utils/submissionAnswerPayload";

interface SubmissionQuestionAnswerFieldProps {
  question: BackendSubmissionQuestionResponse;
  definition?: AssessmentQuestion;
  draft: SubmissionAnswerDraft;
  canEnter: boolean;
  onAnswerTextChange: (answerText: string) => void;
  onSelectedOptionIdsChange: (selectedOptionIds: string[]) => void;
  onMatchingAnswerChange: (promptId: string, selectedPairId: string) => void;
}

export default function SubmissionQuestionAnswerField({
  question,
  definition,
  draft,
  canEnter,
  onAnswerTextChange,
  onSelectedOptionIdsChange,
  onMatchingAnswerChange,
}: SubmissionQuestionAnswerFieldProps) {
  const t = useTranslations("academics.grades.submissions");
  const locale = useLocale();
  const isChoice = isChoiceQuestion(question.type, definition);
  const isFillInBlank = isFillInBlankQuestion(question.type, definition);
  const isMatching = isMatchingQuestion(question.type, definition);
  const isMedia = isMediaQuestion(question.type, definition);

  if (isChoice) {
    return (
      <ChoiceAnswerField
        question={question}
        definition={definition}
        draft={draft}
        canEnter={canEnter}
        onSelectedOptionIdsChange={onSelectedOptionIdsChange}
      />
    );
  }

  if (isMatching && definition?.matchingPairs?.length) {
    return (
      <MatchingAnswerField
        matchingPairs={definition.matchingPairs}
        draft={draft}
        canEnter={canEnter}
        locale={locale}
        onMatchingAnswerChange={onMatchingAnswerChange}
      />
    );
  }

  if (isMatching) {
    return <p className="text-sm text-[var(--text-secondary)]">{t("questionDetailsUnavailable")}</p>;
  }

  if (isFillInBlank) {
    return (
      <FillInBlankAnswerField
        draft={draft}
        canEnter={canEnter}
        onAnswerTextChange={onAnswerTextChange}
      />
    );
  }

  return (
    <div className="space-y-3">
      {isMedia ? <MediaAttachment definition={definition} /> : null}
      <TextArea
        maxLength={10_000}
        rows={4}
        value={draft.answerText}
        disabled={!canEnter}
        onChange={(event) => onAnswerTextChange(event.target.value)}
        placeholder={t("answerPlaceholder")}
        aria-label={t("answerPlaceholder")}
      />
    </div>
  );
}

function FillInBlankAnswerField({
  draft,
  canEnter,
  onAnswerTextChange,
}: Pick<SubmissionQuestionAnswerFieldProps, "draft" | "canEnter" | "onAnswerTextChange">) {
  const t = useTranslations("academics.grades.submissions");

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4">
      <Input
        label={t("fillInBlankAnswer")}
        maxLength={10_000}
        value={draft.answerText}
        disabled={!canEnter}
        autoComplete="off"
        onChange={(event) => onAnswerTextChange(event.target.value)}
        placeholder={t("fillInBlankPlaceholder")}
      />
    </div>
  );
}

function ChoiceAnswerField({
  question,
  definition,
  draft,
  canEnter,
  onSelectedOptionIdsChange,
}: Pick<SubmissionQuestionAnswerFieldProps, "question" | "definition" | "draft" | "canEnter" | "onSelectedOptionIdsChange">) {
  const t = useTranslations("academics.grades.submissions");
  const locale = useLocale();
  const options = definition?.options ?? [];

  if (!canEnter) {
    return (
      <div className="space-y-2">
        {question.answer?.selectedOptions.map((option) => (
          <div key={option.optionId} className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
            {locale === "ar" ? option.labelAr || option.label : option.label}
          </div>
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{t("questionDetailsUnavailable")}</p>;
  }

  const allowsMultipleSelections = definition?.questionType === "MCQ_MULTI";
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = draft.selectedOptionIds.includes(option.id);
        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors duration-200 ${
              checked
                ? "border-[var(--primary-color)] bg-[var(--color-primary-50)] text-[var(--text-primary)]"
                : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <input
              type={allowsMultipleSelections ? "checkbox" : "radio"}
              name={`question-${question.id}`}
              checked={checked}
              className="h-4 w-4 shrink-0 accent-[var(--primary-color)]"
              onChange={() => onSelectedOptionIdsChange(
                allowsMultipleSelections
                  ? checked
                    ? draft.selectedOptionIds.filter((id) => id !== option.id)
                    : [...draft.selectedOptionIds, option.id]
                  : [option.id],
              )}
            />
            <span>{locale === "ar" ? option.textAr || option.textEn : option.textEn || option.textAr}</span>
          </label>
        );
      })}
    </div>
  );
}

function MatchingAnswerField({
  matchingPairs,
  draft,
  canEnter,
  locale,
  onMatchingAnswerChange,
}: {
  matchingPairs: MatchingPair[];
  draft: SubmissionAnswerDraft;
  canEnter: boolean;
  locale: string;
  onMatchingAnswerChange: (promptId: string, selectedPairId: string) => void;
}) {
  const t = useTranslations("academics.grades.submissions");
  const sortedPairs = [...matchingPairs].sort((first, second) => first.order - second.order);
  const answerOptions = sortedPairs.map((match, index) => ({
    value: match.id,
    label: matchingLabel(match, locale),
    leadingContent: (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-secondary)]"
      >
        {matchingAnswerMarker(index)}
      </span>
    ),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-secondary)]">{t("matchingHelp")}</p>
      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]">
        <div className="hidden grid-cols-2 border-b border-[var(--border-color)] bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-secondary)] md:grid">
          <div className="px-4 py-3">{t("matchingPrompt")}</div>
          <div className="border-s border-[var(--border-color)] px-4 py-3">{t("matchingAnswer")}</div>
        </div>

        {sortedPairs.map((pair, index) => {
          const selectedPairId = draft.matchingAnswers[pair.id] ?? "";
          const selectedPair = sortedPairs.find((match) => match.id === selectedPairId);
          const prompt = locale === "ar" ? pair.promptAr || pair.promptEn : pair.promptEn || pair.promptAr;
          const selectedMatch = selectedPair ? matchingLabel(selectedPair, locale) : "—";
          const selectedOptionIndex = selectedPair
            ? sortedPairs.findIndex((match) => match.id === selectedPair.id)
            : -1;

          return (
            <div
              key={pair.id}
              className="grid gap-3 border-t border-[var(--border-color)] p-4 first:border-t-0 md:grid-cols-2 md:gap-0 md:p-0"
            >
              <div className="flex min-w-0 items-start gap-3 md:p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-xs font-semibold text-[var(--primary-color)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-1">
                  <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)] md:hidden">{t("matchingPrompt")}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{prompt}</p>
                </div>
              </div>

              <div className="border-[var(--border-color)] md:border-s md:p-4">
                <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)] md:hidden">{t("matchingAnswer")}</span>
                {canEnter ? (
                  <Select
                    placeholder={t("selectMatch")}
                    options={answerOptions}
                    value={selectedPairId}
                    triggerAriaLabel={`${t("matchingAnswer")}: ${prompt}`}
                    onChange={(value) => onMatchingAnswerChange(pair.id, value)}
                  />
                ) : (
                  <div className="flex min-h-10 items-center gap-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
                    {selectedOptionIndex >= 0 ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-xs font-semibold text-[var(--primary-color)]">
                        {matchingAnswerMarker(selectedOptionIndex)}
                      </span>
                    ) : null}
                    <span>{selectedMatch}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MediaAttachment({ definition }: { definition?: AssessmentQuestion }) {
  const t = useTranslations("academics.grades.submissions");
  const label = definition?.mediaTitle || definition?.mediaFileName || t("mediaAttachment");

  if (!definition?.mediaUrl) return null;

  return (
    <a
      className="inline-flex text-sm text-primary underline"
      href={definition.mediaUrl}
      rel="noreferrer"
      target="_blank"
    >
      {t("openMedia", { label })}
    </a>
  );
}

function matchingLabel(pair: MatchingPair, locale: string): string {
  return locale === "ar" ? pair.matchAr || pair.matchEn : pair.matchEn || pair.matchAr;
}

function matchingAnswerMarker(index: number): string {
  let marker = "";
  let characterIndex = index;

  do {
    marker = String.fromCharCode(65 + (characterIndex % 26)) + marker;
    characterIndex = Math.floor(characterIndex / 26) - 1;
  } while (characterIndex >= 0);

  return marker;
}
