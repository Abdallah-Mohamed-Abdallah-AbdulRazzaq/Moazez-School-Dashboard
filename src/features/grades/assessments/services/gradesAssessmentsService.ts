import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "@/lib/api";
import type {
  BackendAssessmentItemsListResponse,
  BackendAssessmentResponse,
  BackendAssessmentQuestionsListResponse,
  BackendAssessmentQuestionResponse,
} from "../../gradebook/types/api.types";
import type {
  AssessmentRosterItem,
  GradeItemStatus,
  CreateAssessmentPayload,
  Assessment,
  AssessmentQuestion,
} from "../../shared/types";
import {
  mapBackendRosterItemToUi,
  toBackendGradeItemStatus,
  mapBackendAssessmentToAssessment,
} from "../../gradebook/utils/gradebookMappers";

const BACKEND_QUESTION_TYPE_TO_UI: Record<string, AssessmentQuestion["questionType"]> = {
  mcq_single: "MCQ_SINGLE",
  mcq_multi: "MCQ_MULTI",
  true_false: "TRUE_FALSE",
  short_answer: "SHORT_ANSWER",
  essay: "ESSAY",
  fill_in_blank: "FILL_IN_BLANK",
  matching: "MATCHING",
  media: "MEDIA",
};

function toUiQuestionType(type: string | undefined): AssessmentQuestion["questionType"] {
  if (!type) return "SHORT_ANSWER";
  return BACKEND_QUESTION_TYPE_TO_UI[type] ?? (type.toUpperCase() as AssessmentQuestion["questionType"]);
}

function toBackendAssessmentPayload(
  academicYearId: string,
  payload: CreateAssessmentPayload,
  deliveryMode?: "SCORE_ONLY",
): Record<string, unknown> {
  return {
    academicYearId,
    termId: payload.termId,
    subjectId: payload.subjectId,
    scopeType: payload.scopeType,
    scopeId: payload.scopeId || undefined,
    stageId: payload.stageId,
    gradeId: payload.gradeId,
    sectionId: payload.sectionId,
    classroomId: payload.classroomId,
    titleEn: payload.title,
    titleAr: payload.titleAr,
    type: payload.type,
    ...(deliveryMode ? { deliveryMode } : {}),
    date: payload.date,
    weight: payload.weight,
    maxScore: payload.maxScore,
    expectedTimeMinutes: payload.expectedTimeMinutes,
  };
}

function toBackendAssessmentUpdatePayload(payload: CreateAssessmentPayload): Record<string, unknown> {
  return {
    subjectId: payload.subjectId,
    scopeType: payload.scopeType,
    scopeId: payload.scopeId || undefined,
    stageId: payload.stageId,
    gradeId: payload.gradeId,
    sectionId: payload.sectionId,
    classroomId: payload.classroomId,
    titleEn: payload.title,
    titleAr: payload.titleAr,
    type: payload.type,
    date: payload.date,
    weight: payload.weight,
    maxScore: payload.maxScore,
    expectedTimeMinutes: payload.expectedTimeMinutes,
  };
}

function toBackendQuestionOptions(options: AssessmentQuestion["options"]): Array<Record<string, unknown>> | undefined {
  return options?.map((option) => ({
    id: option.id.startsWith("opt-") ? undefined : option.id,
    labelAr: option.textAr,
    label: option.textEn,
    value: option.value,
    isCorrect: option.isCorrect,
    sortOrder: option.order,
  }));
}

// ── Local helper: Backend question → frontend AssessmentQuestion ─────

function mapBackendQuestionToUi(
  q: BackendAssessmentQuestionResponse,
): AssessmentQuestion {
  const metadata = q.metadata ?? {};
  return {
    id: q.id,
    assessmentId: q.assessmentId,
    assignmentId: "",
    questionTextAr: q.promptAr ?? "",
    questionTextEn: q.prompt ?? "",
    questionType: toUiQuestionType(q.type),
    points: q.points ?? 0,
    order: q.sortOrder ?? 0,
    options: q.options?.map((o) => ({
      id: o.id,
      textAr: o.labelAr ?? "",
      textEn: o.label ?? "",
      value: o.value ?? undefined,
      isCorrect: o.isCorrect ?? false,
      order: o.sortOrder ?? 0,
    })),
    explanation: q.explanation ?? undefined,
    explanationAr: q.explanationAr ?? undefined,
    required: q.required,
    correctAnswer:
      typeof q.answerKey === "boolean"
        ? q.answerKey
        : typeof metadata.correctAnswer === "boolean"
          ? metadata.correctAnswer
          : undefined,
    sampleAnswerAr: typeof metadata.sampleAnswerAr === "string" ? metadata.sampleAnswerAr : undefined,
    sampleAnswerEn: typeof metadata.sampleAnswerEn === "string" ? metadata.sampleAnswerEn : undefined,
    acceptedAnswersAr: Array.isArray(metadata.acceptedAnswersAr)
      ? metadata.acceptedAnswersAr.filter((answer): answer is string => typeof answer === "string")
      : undefined,
    acceptedAnswersEn: Array.isArray(metadata.acceptedAnswersEn)
      ? metadata.acceptedAnswersEn.filter((answer): answer is string => typeof answer === "string")
      : undefined,
    matchingPairs: Array.isArray(metadata.matchingPairs) ? metadata.matchingPairs as AssessmentQuestion["matchingPairs"] : undefined,
    mediaMode: metadata.mediaMode === "FILE" || metadata.mediaMode === "LINK" ? metadata.mediaMode : undefined,
    mediaTitle: typeof metadata.mediaTitle === "string" ? metadata.mediaTitle : undefined,
    mediaUrl: typeof metadata.mediaUrl === "string" ? metadata.mediaUrl : undefined,
    mediaFileName: typeof metadata.mediaFileName === "string" ? metadata.mediaFileName : undefined,
    mediaMimeType: typeof metadata.mediaMimeType === "string" ? metadata.mediaMimeType : undefined,
    mediaSize: typeof metadata.mediaSize === "number" ? metadata.mediaSize : undefined,
    createdAt: q.createdAt ?? "",
    updatedAt: q.updatedAt,
  };
}

function toBackendQuestionPayload(question: AssessmentQuestion): Record<string, unknown> {
  return {
    promptAr: question.questionTextAr,
    prompt: question.questionTextEn,
    explanationAr: question.explanationAr,
    explanation: question.explanation,
    type: question.questionType,
    points: question.points,
    sortOrder: question.order,
    required: question.required,
    options: toBackendQuestionOptions(question.options),
    correctAnswer: question.correctAnswer,
    sampleAnswerAr: question.sampleAnswerAr,
    sampleAnswerEn: question.sampleAnswerEn,
    acceptedAnswersAr: question.acceptedAnswersAr,
    acceptedAnswersEn: question.acceptedAnswersEn,
    matchingPairs: question.matchingPairs,
    mediaMode: question.mediaMode,
    mediaTitle: question.mediaTitle,
    mediaUrl: question.mediaUrl,
    mediaFileName: question.mediaFileName,
    mediaMimeType: question.mediaMimeType,
    mediaSize: question.mediaSize,
  };
}

// ── 1. Fetch assessment roster ───────────────────────────────────────

export async function fetchAssessmentRoster(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentRosterItem[]> {
  void academicYearId;
  void termId;
  const response = await apiGet<BackendAssessmentItemsListResponse>(
    `/grades/assessments/${assessmentId}/items`,
    { params: { includeMissingStudents: true } },
  );
  return response.items.map(mapBackendRosterItemToUi);
}

// ── 2. Bulk update assessment grades ─────────────────────────────────

export async function bulkUpdateAssessmentGrades(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  items: Array<{
    studentId: string;
    score: number | null;
    status: GradeItemStatus;
    comment?: string;
  }>,
): Promise<void> {
  const backendItems = items.map((item) => ({
    studentId: item.studentId,
    score: item.score,
    status: toBackendGradeItemStatus(item.status),
    comment: item.comment,
  }));

  void academicYearId;
  void termId;
  await apiPut(`/grades/assessments/${assessmentId}/items`, { items: backendItems });
}

// ── 3. Publish assessment ────────────────────────────────────────────

export async function publishAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiPost(`/grades/assessments/${assessmentId}/publish`);
}

// ── 4. Approve assessment ────────────────────────────────────────────

export async function approveAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiPost(`/grades/assessments/${assessmentId}/approve`);
}

// ── 5. Lock assessment ───────────────────────────────────────────────

export async function lockAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiPost(`/grades/assessments/${assessmentId}/lock`);
}

// ── 6. Update assessment ─────────────────────────────────────────────

export async function updateAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  payload: CreateAssessmentPayload,
): Promise<Assessment> {
  void academicYearId;
  void termId;
  const response = await apiPatch<BackendAssessmentResponse>(
    `/grades/assessments/${assessmentId}`,
    toBackendAssessmentUpdatePayload(payload),
  );
  return mapBackendAssessmentToAssessment(response);
}

// ── 7. Delete assessment ─────────────────────────────────────────────

export async function deleteAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiDelete(`/grades/assessments/${assessmentId}`);
}

// ── 8. Create assessment ─────────────────────────────────────────────

export async function createAssessment(
  academicYearId: string,
  payload: CreateAssessmentPayload,
): Promise<{ id: string }> {
  const result = await apiPost<BackendAssessmentResponse>(
    "/grades/assessments",
    toBackendAssessmentPayload(academicYearId, payload, "SCORE_ONLY"),
  );
  return { id: result.id };
}

// ── 9. Create assessment with questions ──────────────────────────────

export async function createAssessmentWithQuestions(
  academicYearId: string,
  payload: { assessment: CreateAssessmentPayload; questions: AssessmentQuestion[] },
): Promise<{ id: string }> {
  const result = await apiPost<BackendAssessmentResponse>(
    "/grades/assessments/question-based",
    toBackendAssessmentPayload(academicYearId, payload.assessment),
  );

  for (const [questionIndex, question] of payload.questions.entries()) {
    try {
      await apiPost<BackendAssessmentQuestionResponse>(
        `/grades/assessments/${result.id}/questions`,
        toBackendQuestionPayload(question),
      );
    } catch (cause) {
      throw new AssessmentQuestionsCreationError(result.id, questionIndex, cause);
    }
  }

  return { id: result.id };
}

export class AssessmentQuestionsCreationError extends Error {
  constructor(
    public readonly assessmentId: string,
    public readonly failedQuestionIndex: number,
    cause: unknown,
  ) {
    super("Assessment was created, but one or more questions could not be saved", { cause });
    this.name = "AssessmentQuestionsCreationError";
  }
}

// ── 10. Get assessment type label key (pure) ─────────────────────────

const ASSESSMENT_TYPE_LABEL_KEYS: Record<string, string> = {
  QUIZ: "quiz",
  MONTH_EXAM: "monthExam",
  MIDTERM: "midterm",
  TERM_EXAM: "termExam",
  ASSIGNMENT: "assignment",
  FINAL: "final",
  PRACTICAL: "practical",
};

export function getAssessmentTypeLabelKey(type: string): string {
  return ASSESSMENT_TYPE_LABEL_KEYS[type] ?? "quiz";
}

// ── 11. Fetch assessment by ID ───────────────────────────────────────

export async function fetchAssessmentById(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment> {
  const response = await apiGet<BackendAssessmentResponse>(
    `/grades/assessments/${assessmentId}`,
  );
  void academicYearId;
  void termId;
  return mapBackendAssessmentToAssessment(response);
}

// ── 12. Fetch assessment questions ───────────────────────────────────

export async function fetchAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentQuestion[]> {
  void academicYearId;
  void termId;
  const response = await apiGet<BackendAssessmentQuestionsListResponse>(
    `/grades/assessments/${assessmentId}/questions`,
  );
  return response.questions.map(mapBackendQuestionToUi);
}

// ── 13. Create assessment question ───────────────────────────────────

export async function createAssessmentQuestion(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  questionPayload: AssessmentQuestion,
): Promise<AssessmentQuestion> {
  const response = await apiPost<BackendAssessmentQuestionResponse>(
    `/grades/assessments/${assessmentId}/questions`,
    toBackendQuestionPayload(questionPayload),
  );
  void academicYearId;
  void termId;
  return mapBackendQuestionToUi(response);
}

// ── 14. Update assessment question ───────────────────────────────────

export async function updateAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
  questionPayload: AssessmentQuestion,
): Promise<AssessmentQuestion> {
  const response = await apiPatch<BackendAssessmentQuestionResponse>(
    `/grades/questions/${questionId}`,
    toBackendQuestionPayload(questionPayload),
  );
  void academicYearId;
  void termId;
  return mapBackendQuestionToUi(response);
}

// ── 15. Delete assessment question ───────────────────────────────────

export async function deleteAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiDelete(`/grades/questions/${questionId}`);
}

// ── 16. Reorder assessment questions ─────────────────────────────────

export async function reorderAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  orderedIds: string[],
): Promise<void> {
  void academicYearId;
  void termId;
  await apiPost(
    `/grades/assessments/${assessmentId}/questions/reorder`,
    { questionIds: orderedIds },
  );
}

// ── 17. Bulk update assessment question points ───────────────────────

export async function bulkUpdateAssessmentQuestionPoints(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  updates: Array<{ questionId: string; points: number }>,
): Promise<void> {
  void academicYearId;
  void termId;
  await apiPost(
    `/grades/assessments/${assessmentId}/questions/points/bulk`,
    { updates },
  );
}
