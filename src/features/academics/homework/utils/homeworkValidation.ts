import type {
  Assignment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";
import type {
  QuestionValidationError,
  ValidationErrors,
} from "@/features/academics/curriculum/types/types";

const SUPPORTED_TYPES = new Set([
  "MCQ_SINGLE",
  "MCQ_MULTI",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
]);
const CHOICE_TYPES = new Set(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"]);

export interface HomeworkAssignmentContractInput {
  title: string;
  description?: string | null;
  dueAt: string;
  publishAt?: string | null;
  isGraded: boolean;
  totalMarks?: number | null;
  estimatedMinutes?: number | null;
}

function hasAtMostTwoDecimals(number: number): boolean {
  const scaled = number * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-8;
}

function validateAssignmentText(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const title = input.title.trim();
  if (!title) errors.titleEn = t("assignmentTitleRequired");
  else if (title.length > 180) errors.titleEn = t("assignmentTitleTooLong");
  if ((input.description?.trim().length ?? 0) > 4000) {
    errors.descriptionEn = t("assignmentDescriptionTooLong");
  }
  return errors;
}

function validateAssignmentDates(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
  now: Date,
): ValidationErrors {
  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) return { dueDate: t("assignmentDueAtInvalid") };
  if (dueAt.getTime() <= now.getTime()) return { dueDate: t("assignmentDueAtFuture") };
  if (!input.publishAt) return {};
  const publishAt = new Date(input.publishAt);
  if (Number.isNaN(publishAt.getTime())) return { dueDate: t("assignmentPublishAtInvalid") };
  return dueAt.getTime() <= publishAt.getTime()
    ? { dueDate: t("assignmentDueAtAfterPublish") }
    : {};
}

function validateAssignmentMarks(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
): ValidationErrors {
  const marks = input.totalMarks;
  if (input.isGraded && marks == null) return { maxScore: t("assignmentMarksRequired") };
  if (marks == null) return {};
  if (!Number.isFinite(marks) || marks < 0.01) return { maxScore: t("assignmentMarksMin") };
  return hasAtMostTwoDecimals(marks)
    ? {}
    : { maxScore: t("assignmentMarksDecimals") };
}

function validateAssignmentMinutes(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
): ValidationErrors {
  const minutes = input.estimatedMinutes;
  if (minutes == null) return {};
  if (!Number.isInteger(minutes)) return { expectedTimeMinutes: t("assignmentMinutesInteger") };
  return minutes < 1
    ? { expectedTimeMinutes: t("assignmentMinutesMin") }
    : {};
}

export function validateHomeworkAssignmentContract(
  input: HomeworkAssignmentContractInput,
  t: (key: string) => string,
  now: Date = new Date(),
): ValidationErrors {
  return {
    ...validateAssignmentText(input, t),
    ...validateAssignmentDates(input, t, now),
    ...validateAssignmentMarks(input, t),
    ...validateAssignmentMinutes(input, t),
  };
}

function validatePromptAndPoints(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const errors: QuestionValidationError = {};
  const prompt = question.questionTextEn?.trim() || question.questionTextAr?.trim() || "";
  if (!prompt) errors.textEn = t("question_text_required");
  else if (prompt.length > 8000) errors.textEn = t("questionTextTooLong");
  if (!Number.isFinite(question.points) || question.points < 0) {
    errors.points = t("invalid_points");
  }
  if ((question.instructions?.trim().length ?? 0) > 4000) {
    errors.instructions = t("instructionsTooLong");
  }
  if ((question.expectedAnswer?.trim().length ?? 0) > 8000) {
    errors.expectedAnswer = t("expectedAnswerTooLong");
  }
  return errors;
}

function validateOptionStructure(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const options = question.options ?? [];
  if (!CHOICE_TYPES.has(question.questionType) && options.length > 0) return { options: t("textQuestionOptionsForbidden") };
  if (options.length > 50) return { options: t("tooManyOptions") };
  if (options.some((option) => (option.textEn?.trim() || option.textAr?.trim() || "").length > 1000)) return { options: t("optionTextTooLong") };
  if (options.some((option) => !option.textAr?.trim() && !option.textEn?.trim())) return { options: t("all_options_required") };
  if (question.questionType === "TRUE_FALSE") return {};
  if ((question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") && options.length < 2) return { options: t("minTwoOptions") };
  return {};
}

function validateCorrectOptions(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  const correctCount = (question.options ?? []).filter(({ isCorrect }) => isCorrect).length;
  if (question.questionType === "MCQ_SINGLE" && correctCount !== 1) return { correctAnswer: t("selectCorrectSingle") };
  if (question.questionType === "MCQ_MULTI" && correctCount < 1) return { correctAnswer: t("selectCorrectMulti") };
  return {};
}

export function validateHomeworkQuestion(
  question: AssignmentQuestion,
  t: (key: string) => string,
): QuestionValidationError {
  return {
    ...(!SUPPORTED_TYPES.has(question.questionType) && { general: t("unsupportedQuestionType") }),
    ...validatePromptAndPoints(question, t),
    ...validateOptionStructure(question, t),
    ...validateCorrectOptions(question, t),
  };
}

export function validateHomeworkAssignment(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string,
  context: { isGraded: boolean; publishAt?: string | null },
): ValidationErrors {
  const errors = validateHomeworkAssignmentContract({
    title: assignment.titleEn || assignment.titleAr,
    description: assignment.descriptionEn || assignment.descriptionAr,
    dueAt: assignment.dueDate ?? "",
    publishAt: context.publishAt,
    isGraded: context.isGraded,
    totalMarks: assignment.maxScore,
    estimatedMinutes: assignment.expectedTimeMinutes,
  }, t);
  const questionErrors = Object.fromEntries(
    questions
      .map((question) => [question.id, validateHomeworkQuestion(question, t)])
      .filter(([, questionError]) => Object.keys(questionError).length > 0),
  );
  if (Object.keys(questionErrors).length) errors.questions = questionErrors;
  return errors;
}
