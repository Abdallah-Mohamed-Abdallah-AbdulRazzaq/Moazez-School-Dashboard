import { Assignment, AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { ValidationErrors, QuestionValidationError } from "../types/types";
import { MIN_OPTIONS_COUNT } from "@/features/academics/curriculum/libs/constants";

export function normalizeQuestionText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function sanitizeAnswerList(values?: string[]): string[] {
  return (values || []).map((value) => value.trim()).filter(Boolean);
}

export function sanitizeMatchingPairs(question: Pick<AssignmentQuestion, "matchingPairs">) {
  return (question.matchingPairs || []).map((pair, index) => ({
    ...pair,
    promptAr: pair.promptAr.trim(),
    promptEn: pair.promptEn.trim(),
    matchAr: pair.matchAr.trim(),
    matchEn: pair.matchEn.trim(),
    order: index + 1,
  }));
}

export function hasQuestionMedia(question: Pick<
  AssignmentQuestion,
  "mediaUrl" | "mediaFileName" | "mediaMimeType" | "mediaSize"
>): boolean {
  return Boolean(
    question.mediaUrl?.trim() ||
      question.mediaFileName?.trim() ||
      question.mediaMimeType?.trim() ||
      typeof question.mediaSize === "number",
  );
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateAssignment(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};
  const generalErrors: string[] = [];

  // Validate title
  if (!assignment.titleAr?.trim()) {
    errors.titleAr = t("required_ar");
  }
  if (!assignment.titleEn?.trim()) {
    errors.titleEn = t("required_en");
  }

  // Validate max score
  if (!assignment.maxScore || assignment.maxScore <= 0) {
    errors.maxScore = t("invalid_max_score");
  }

  if (
    assignment.expectedTimeMinutes != null &&
    (!Number.isInteger(assignment.expectedTimeMinutes) || assignment.expectedTimeMinutes < 1)
  ) {
    errors.expectedTimeMinutes = t("invalid_expected_time");
  }

  // Validate questions exist
  if (questions.length === 0) {
    generalErrors.push(t("at_least_one_question"));
  }

  // Validate each question
  const questionErrors: Record<string, QuestionValidationError> = {};
  questions.forEach((q) => {
    const qErrors = validateQuestion(q, t);
    if (Object.keys(qErrors).length > 0) {
      questionErrors[q.id] = qErrors;
    }
  });

  if (Object.keys(questionErrors).length > 0) {
    errors.questions = questionErrors;
  }

  if (generalErrors.length > 0) {
    errors.general = generalErrors;
  }

  return errors;
}

export function validateQuestion(
  question: AssignmentQuestion,
  t: (key: string) => string
): QuestionValidationError {
  const errors: QuestionValidationError = {};
  const normalizedTextAr = question.questionTextAr?.trim() || "";
  const normalizedTextEn = question.questionTextEn?.trim() || "";

  if (!normalizedTextAr) {
    errors.textAr = t("required_ar");
  }
  if (!normalizedTextEn) {
    errors.textEn = t("required_en");
  }

  if (!Number.isFinite(question.points) || question.points < 0.01) {
    errors.points = t("invalid_points");
  }

  if (question.questionType === "MCQ_SINGLE" || question.questionType === "MCQ_MULTI") {
    if (!question.options || question.options.length < MIN_OPTIONS_COUNT) {
      errors.options = t("minTwoOptions");
    } else {
      // Validate each option has text
      const emptyOptions = question.options.filter(
        (o) => !o.textAr?.trim() || !o.textEn?.trim()
      );
      if (emptyOptions.length > 0) {
        errors.options = t("all_options_required");
      }

      // Validate correct answer selection
      const correctCount = question.options.filter((o) => o.isCorrect).length;
      if (question.questionType === "MCQ_SINGLE" && correctCount !== 1) {
        errors.correctAnswer = t("selectCorrectSingle");
      } else if (question.questionType === "MCQ_MULTI" && correctCount < 1) {
        errors.correctAnswer = t("selectCorrectMulti");
      }
    }
  }

  if (question.questionType === "FILL_IN_BLANK") {
    const acceptedAnswersAr = sanitizeAnswerList(question.acceptedAnswersAr);
    const acceptedAnswersEn = sanitizeAnswerList(question.acceptedAnswersEn);
    const uniqueAr = new Set(acceptedAnswersAr.map(normalizeQuestionText));
    const uniqueEn = new Set(acceptedAnswersEn.map(normalizeQuestionText));

    if (uniqueAr.size !== acceptedAnswersAr.length) {
      errors.acceptedAnswers = t("duplicateAcceptedAnswersAr");
    } else if (uniqueEn.size !== acceptedAnswersEn.length) {
      errors.acceptedAnswers = t("duplicateAcceptedAnswersEn");
    }
  }

  if (question.questionType === "MATCHING") {
    const matchingPairs = sanitizeMatchingPairs(question);
    if (matchingPairs.length < 2) {
      errors.matchingPairs = t("minMatchingPairs");
    } else {
      const promptArSet = new Set<string>();
      const promptEnSet = new Set<string>();
      const matchArSet = new Set<string>();
      const matchEnSet = new Set<string>();

      for (const pair of matchingPairs) {
        if (!pair.promptAr || !pair.promptEn || !pair.matchAr || !pair.matchEn) {
          errors.matchingPairs = t("matchingPairFieldsRequired");
          break;
        }

        if (normalizeQuestionText(pair.promptAr) === normalizeQuestionText(pair.promptEn)) {
          errors.matchingPairs = t("matchingPromptArEnMustDiffer");
          break;
        }

        if (normalizeQuestionText(pair.matchAr) === normalizeQuestionText(pair.matchEn)) {
          errors.matchingPairs = t("matchingAnswerArEnMustDiffer");
          break;
        }

        const promptArKey = normalizeQuestionText(pair.promptAr);
        const promptEnKey = normalizeQuestionText(pair.promptEn);
        const matchArKey = normalizeQuestionText(pair.matchAr);
        const matchEnKey = normalizeQuestionText(pair.matchEn);

        if (promptArSet.has(promptArKey)) {
          errors.matchingPairs = t("duplicateMatchingPromptAr");
          break;
        }
        if (promptEnSet.has(promptEnKey)) {
          errors.matchingPairs = t("duplicateMatchingPromptEn");
          break;
        }
        if (matchArSet.has(matchArKey)) {
          errors.matchingPairs = t("duplicateMatchingAnswerAr");
          break;
        }
        if (matchEnSet.has(matchEnKey)) {
          errors.matchingPairs = t("duplicateMatchingAnswerEn");
          break;
        }

        promptArSet.add(promptArKey);
        promptEnSet.add(promptEnKey);
        matchArSet.add(matchArKey);
        matchEnSet.add(matchEnKey);
      }
    }
  }

  if (question.questionType === "MEDIA") {
    const mediaMode = question.mediaMode || "LINK";
    const hasMedia = hasQuestionMedia(question);
    if (!hasMedia) {
      errors.media = t("media_required");
    } else if (mediaMode === "LINK" && question.mediaUrl?.trim() && !isValidHttpUrl(question.mediaUrl.trim())) {
      errors.media = t("invalid_media_url");
    }
  }

  return errors;
}

export function validateForPublish(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  t: (key: string) => string
): string[] {
  const errors: string[] = [];

  // Validate title
  if (!assignment.titleAr?.trim()) {
    errors.push(t("required_ar"));
  }
  if (!assignment.titleEn?.trim()) {
    errors.push(t("required_en"));
  }

  // Validate questions exist
  if (questions.length === 0) {
    errors.push(t("at_least_one_question"));
  }

  // Validate each question
  questions.forEach((q, index) => {
    const qNum = `Q${index + 1}`;
    const qErrors = validateQuestion(q, t);
    Object.values(qErrors)
      .filter((value): value is string => Boolean(value))
      .forEach((value) => {
        errors.push(`${qNum}: ${value}`);
      });
    if (Object.keys(qErrors).length > 0 && q.questionType !== "MEDIA" && (!q.questionTextAr?.trim() || !q.questionTextEn?.trim())) {
      errors.push(`${qNum}: ${t("question_text_required")}`);
    }
  });

  // Validate points match
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  if ((assignment.maxScore || 0) !== totalPoints) {
    errors.push(t("points_sum_mismatch"));
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return (
    !!errors.titleAr ||
    !!errors.titleEn ||
    !!errors.descriptionAr ||
    !!errors.descriptionEn ||
    !!errors.maxScore ||
    !!errors.dueDate ||
    !!(errors.questions && Object.keys(errors.questions).length > 0) ||
    !!(errors.general && errors.general.length > 0)
  );
}
