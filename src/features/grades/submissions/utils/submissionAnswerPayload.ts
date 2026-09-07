import type { BackendSubmissionAnswerResponse } from "../../gradebook/types/api.types";
import type { AssessmentQuestion, MatchingPair } from "../../shared/types";
import type { SaveSubmissionAnswerPayload, SubmissionAnswerDraft } from "../types";

export function createSubmissionAnswerDraft(
  answer: BackendSubmissionAnswerResponse | null,
  definition?: AssessmentQuestion,
): SubmissionAnswerDraft {
  return {
    answerText: answer?.answerText ?? "",
    selectedOptionIds: answer?.selectedOptions.map((option) => option.optionId) ?? [],
    matchingAnswers: toMatchingDraftAnswers(answer?.answerJson, definition?.matchingPairs),
  };
}

export function createSubmissionAnswerPayload(
  questionType: string,
  definition: AssessmentQuestion | undefined,
  draft: SubmissionAnswerDraft,
): SaveSubmissionAnswerPayload {
  if (isChoiceQuestion(questionType, definition)) {
    return { answerText: null, answerJson: null, selectedOptionIds: draft.selectedOptionIds };
  }

  if (isMatchingQuestion(questionType, definition)) {
    return {
      answerText: null,
      answerJson: toMatchingAnswerJson(draft.matchingAnswers, definition?.matchingPairs),
      selectedOptionIds: null,
    };
  }

  return { answerText: draft.answerText.trim() || null, answerJson: null, selectedOptionIds: null };
}

export function hasSubmissionAnswer(payload: SaveSubmissionAnswerPayload): boolean {
  return Boolean(
    payload.answerText?.trim()
    || payload.selectedOptionIds?.length
    || (payload.answerJson && Object.keys(payload.answerJson).length),
  );
}

export function isMatchingQuestion(questionType: string, definition?: AssessmentQuestion): boolean {
  return definition?.questionType === "MATCHING" || questionType === "matching";
}

export function isMediaQuestion(questionType: string, definition?: AssessmentQuestion): boolean {
  return definition?.questionType === "MEDIA" || questionType === "media";
}

export function isFillInBlankQuestion(questionType: string, definition?: AssessmentQuestion): boolean {
  return definition?.questionType === "FILL_IN_BLANK" || questionType === "fill_in_blank";
}

export function isChoiceQuestion(questionType: string, definition?: AssessmentQuestion): boolean {
  if (definition) {
    return ["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"].includes(definition.questionType);
  }
  return ["mcq_single", "mcq_multi", "true_false"].includes(questionType);
}

export function changeMatchingAnswer(
  matchingAnswers: Record<string, string>,
  promptId: string,
  selectedPairId: string,
): Record<string, string> {
  const previousPairId = matchingAnswers[promptId];
  const conflictingPromptId = Object.entries(matchingAnswers).find(
    ([otherPromptId, pairId]) => otherPromptId !== promptId && pairId === selectedPairId,
  )?.[0];
  const nextAnswers = { ...matchingAnswers, [promptId]: selectedPairId };

  if (!conflictingPromptId) return nextAnswers;
  if (previousPairId) nextAnswers[conflictingPromptId] = previousPairId;
  else delete nextAnswers[conflictingPromptId];

  return nextAnswers;
}

function toMatchingDraftAnswers(
  answerJson: unknown,
  matchingPairs: MatchingPair[] | undefined,
): Record<string, string> {
  if (!isRecord(answerJson)) return {};

  return Object.fromEntries(
    Object.entries(answerJson).flatMap(([promptId, answerValue]) => {
      if (typeof answerValue !== "string") return [];
      const matchedPair = matchingPairs?.find((pair) =>
        [pair.id, pair.matchEn, pair.matchAr].includes(answerValue));
      return [[promptId, matchedPair?.id ?? answerValue]];
    }),
  );
}

function toMatchingAnswerJson(
  matchingAnswers: Record<string, string>,
  matchingPairs: MatchingPair[] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(matchingAnswers)
      .filter(([, selectedPairId]) => Boolean(selectedPairId))
      .map(([promptId, selectedPairId]) => {
        const selectedPair = matchingPairs?.find((pair) => pair.id === selectedPairId);
        return [promptId, selectedPair?.matchEn || selectedPairId];
      }),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
