import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { QuestionValidationError } from "@/features/academics/curriculum/types/types";
import { HOMEWORK_DRAFT_LIMITS, HOMEWORK_MODES, type HomeworkDraftIssue, type HomeworkDraftValidation, type HomeworkDraftValidationContext, type HomeworkQuestionDraft } from "./homeworkQuestionDraft.types";
import { validateHomeworkAssignmentContract, validateHomeworkQuestion } from "./homeworkValidation";

const validationKey = (key: string) => `validation.${key}`;
const manualKey = (key: string) => `academics.homework.manual.errors.${key}`;

function metadataIssues(draft: HomeworkQuestionDraft, context: HomeworkDraftValidationContext): HomeworkDraftIssue[] {
  const metadata = draft.metadata;
  const errors = validateHomeworkAssignmentContract({ ...metadata, isGraded: metadata.isGraded ?? true, publishAt: context.publishAt }, validationKey, context.now);
  if ((metadata.totalMarks ?? 0) > HOMEWORK_DRAFT_LIMITS.points) errors.maxScore = manualKey("marksRange");
  if ((metadata.estimatedMinutes ?? 0) > HOMEWORK_DRAFT_LIMITS.minutes) errors.expectedTimeMinutes = manualKey("minutesRange");
  const issues: HomeworkDraftIssue[] = Object.entries(errors).map(([field, messageKey]) => ({ scope: "metadata", field, messageKey: messageKey as string }));
  if (!HOMEWORK_MODES.includes(metadata.mode as typeof HOMEWORK_MODES[number])) issues.push({ scope: "metadata", field: "mode", messageKey: manualKey("mode") });
  if (!draft.questions.length || draft.questions.length > HOMEWORK_DRAFT_LIMITS.questions) issues.push({ scope: "metadata", field: "questions", messageKey: manualKey("questionCount") });
  return issues;
}

export function validateHomeworkDraftQuestion(question: AssignmentQuestion): QuestionValidationError {
  const errors = validateHomeworkQuestion(question, validationKey);
  if (question.points > HOMEWORK_DRAFT_LIMITS.points || Math.abs(question.points * 100 - Math.round(question.points * 100)) > 1e-8) errors.points = manualKey("pointsRange");
  if (question.questionType === "TRUE_FALSE" && question.correctAnswer === undefined) errors.correctAnswer = manualKey("trueFalseAnswer");
  if (question.questionType !== "TRUE_FALSE" && question.correctAnswer !== undefined) errors.correctAnswer = manualKey("answerType");
  if (question.questionType !== "SHORT_ANSWER" && question.expectedAnswer?.trim()) errors.expectedAnswer = manualKey("answerType");
  if (question.questionType === "TRUE_FALSE" && question.options?.length) errors.options = manualKey("trueFalseOptions");
  return errors;
}

export function validateHomeworkQuestionDraft(draft: HomeworkQuestionDraft, context: HomeworkDraftValidationContext): HomeworkDraftValidation {
  const issues = metadataIssues(draft, context);
  for (const question of draft.questions) {
    for (const [field, messageKey] of Object.entries(validateHomeworkDraftQuestion(question))) {
      issues.push({ scope: "question", questionId: question.id, field, messageKey });
    }
  }
  if (issues.length) return { kind: "invalid", issues };
  const sum = draft.questions.reduce((total, question) => total + Math.round(question.points * 100), 0) / 100;
  const maximum = draft.metadata.totalMarks;
  const warnings: HomeworkDraftIssue[] = draft.metadata.isGraded && maximum != null && Math.round(sum * 100) !== Math.round(maximum * 100)
    ? [{ scope: "metadata", field: "points", messageKey: "academics.homework.manual.marksMismatch", values: { total: sum, maximum } }] : [];
  return { kind: "valid", warnings };
}

export function prepareHomeworkDraftQuestions(questions: AssignmentQuestion[]): AssignmentQuestion[] {
  return questions.map((question, index) => ({
    ...question, order: index + 1,
    options: question.options?.map((option, optionIndex) => ({ ...option, order: optionIndex + 1 })),
  }));
}
