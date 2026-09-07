import type { QuestionValidationError } from "@/features/academics/curriculum/types/types";
import { describeGradesApiError } from "../../gradebook/utils/gradesApiErrors";

const BACKEND_FIELD_TO_QUESTION_FIELD: Record<string, keyof QuestionValidationError> = {
  prompt: "textEn",
  questionTextEn: "textEn",
  promptAr: "textAr",
  questionTextAr: "textAr",
  points: "points",
  options: "options",
  correctAnswer: "correctAnswer",
  answerKey: "correctAnswer",
  acceptedAnswersAr: "acceptedAnswers",
  acceptedAnswersEn: "acceptedAnswers",
  matchingPairs: "matchingPairs",
  mediaMode: "media",
  mediaTitle: "media",
  mediaUrl: "media",
  mediaFileName: "media",
  mediaMimeType: "media",
  mediaSize: "media",
};

const ERROR_KEY_TO_QUESTION_FIELD: Record<string, keyof QuestionValidationError> = {
  question_points_required: "points",
  question_points_positive: "points",
  question_prompt_required: "textEn",
  multiple_choice_selection_required: "correctAnswer",
  single_choice_selection_required: "correctAnswer",
  minimum_question_options_required: "options",
  question_options_not_allowed: "options",
  matching_metadata_required: "matchingPairs",
  matching_structure_required: "matchingPairs",
};

function questionErrorField(field?: string): keyof QuestionValidationError | undefined {
  return field
    ? BACKEND_FIELD_TO_QUESTION_FIELD[field.split(/[.[\]]/, 1)[0]]
    : undefined;
}

export function mapAssessmentQuestionApiError(
  error: unknown,
  message: string,
): QuestionValidationError {
  const descriptor = describeGradesApiError(error);
  const field = questionErrorField(descriptor.field)
    ?? ERROR_KEY_TO_QUESTION_FIELD[descriptor.key]
    ?? "general";

  return { [field]: message };
}
