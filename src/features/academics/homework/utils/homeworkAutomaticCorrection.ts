import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { HomeworkSubmissionAnswerUiModel } from "../services/homeworkApi.types";
import { multipleChoiceScore, type MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";
import { trueFalseOptionValue } from "@/lib/grading/trueFalseOptionValue";

export type HomeworkCorrectionReason = "manual_question" | "missing_answer_record" | "invalid_definition";
export interface HomeworkCorrectionPlan {
  reviews: Array<{ answerId: string; questionId: string; score: number }>;
  unresolved: Array<{ questionId: string; reason: HomeworkCorrectionReason }>;
  correctedCount: number;
}
const OBJECTIVE_TYPES = new Set(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"]);

function validScore(score: number | null | undefined, points: number): score is number {
  return score != null && Number.isFinite(score) && score >= 0 && score <= points
    && Math.abs(score * 100 - Math.round(score * 100)) < 1e-8;
}

function validAssociations(questions: readonly AssignmentQuestion[], answers: readonly HomeworkSubmissionAnswerUiModel[]) {
  const questionIds = new Set(questions.map(question => question.id));
  return questionIds.size === questions.length && !questionIds.has("")
    && new Set(answers.map(answer => answer.id)).size === answers.length
    && new Set(answers.map(answer => answer.questionId)).size === answers.length
    && answers.every(answer => answer.id && answer.questionId && questionIds.has(answer.questionId));
}

function booleanOption(option: NonNullable<AssignmentQuestion["options"]>[number]) {
  return trueFalseOptionValue(option.textEn || option.textAr);
}

function validObjectiveKey(question: AssignmentQuestion) {
  const options = question.options ?? [];
  const correct = options.filter(option => option.isCorrect);
  if (!options.length || options.some(option => !option.id)
    || new Set(options.map(option => option.id)).size !== options.length) return false;
  if (correct.length !== 1) return false;
  if (question.questionType !== "TRUE_FALSE") return true;
  const labels = options.map(booleanOption);
  return options.length === 2 && labels.includes(true) && labels.includes(false)
    && typeof question.correctAnswer === "boolean"
    && booleanOption(correct[0]) === question.correctAnswer;
}

function objectiveScore(question: AssignmentQuestion, answer: HomeworkSubmissionAnswerUiModel, policy: MultipleSelectionScoringPolicy): number | null {
  if (question.questionType === "MCQ_MULTI") {
    return multipleChoiceScore({ points: question.points, options: question.options ?? [], selectedOptionIds: answer.selectedOptionIds ?? [], policy });
  }
  if (!validObjectiveKey(question)) return null;
  const selectedIds = answer.selectedOptionIds ?? [];
  const options = question.options!;
  if (new Set(selectedIds).size !== selectedIds.length
    || selectedIds.some(id => !options.some(option => option.id === id))) return null;
  const correctIds = options.filter(option => option.isCorrect).map(option => option.id);
  return selectedIds.length === correctIds.length && selectedIds.every(id => correctIds.includes(id))
    ? question.points : 0;
}

function correctionDecision(question: AssignmentQuestion, answer: HomeworkSubmissionAnswerUiModel | undefined, policy: MultipleSelectionScoringPolicy) {
  if (!validScore(question.points, question.points)) return "invalid_definition" as const;
  if (!answer) return "missing_answer_record" as const;
  if (OBJECTIVE_TYPES.has(question.questionType)) {
    return objectiveScore(question, answer, policy) ?? "invalid_definition";
  }
  return answer.reviewedAt && validScore(answer.score, question.points) ? null : "manual_question" as const;
}

export function buildHomeworkAutomaticCorrectionPlan(
  questions: readonly AssignmentQuestion[], answers: readonly HomeworkSubmissionAnswerUiModel[],
  policy: MultipleSelectionScoringPolicy = "partial_with_penalty",
): HomeworkCorrectionPlan {
  const plan: HomeworkCorrectionPlan = { reviews: [], unresolved: [], correctedCount: 0 };
  const associationsValid = validAssociations(questions, answers);
  const answersByQuestion = new Map(answers.map(answer => [answer.questionId, answer]));
  for (const question of questions) {
    const decision = associationsValid ? correctionDecision(question, answersByQuestion.get(question.id), policy) : "invalid_definition";
    if (typeof decision === "number") {
      plan.reviews.push({ answerId: answersByQuestion.get(question.id)!.id, questionId: question.id, score: decision });
    } else if (decision) plan.unresolved.push({ questionId: question.id, reason: decision });
  }
  plan.correctedCount = plan.reviews.length;
  return plan;
}

export function isHomeworkCorrectionComplete(
  questions: readonly AssignmentQuestion[], answers: readonly HomeworkSubmissionAnswerUiModel[],
  policy: MultipleSelectionScoringPolicy = "partial_with_penalty",
): boolean {
  if (!questions.length) return false;
  const plan = buildHomeworkAutomaticCorrectionPlan(questions, answers, policy);
  if (plan.unresolved.length) return false;
  return questions.every(question => {
    const answer = answers.find(answer => answer.questionId === question.id);
    const expected = plan.reviews.find(review => review.questionId === question.id);
    return Boolean(answer?.reviewedAt) && validScore(answer?.score, question.points)
      && (!expected || answer?.score === expected.score);
  });
}
