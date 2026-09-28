import type { AssessmentQuestion } from "../../shared/types";

export const ASSESSMENT_AUTHORING_QUESTION_TYPES: AssessmentQuestion["questionType"][] = [
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
];

const RETIRED_ASSESSMENT_QUESTION_TYPES = new Set<AssessmentQuestion["questionType"]>([
  "FILL_IN_BLANK",
  "MATCHING",
  "MEDIA",
]);

export function isRetiredAssessmentQuestionType(
  questionType: AssessmentQuestion["questionType"],
): boolean {
  return RETIRED_ASSESSMENT_QUESTION_TYPES.has(questionType);
}
