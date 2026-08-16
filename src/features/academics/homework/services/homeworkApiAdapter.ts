import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type {
  BackendHomeworkAssignmentDto,
  BackendHomeworkAttachmentDetailResponse,
  BackendHomeworkAttachmentsResponse,
  BackendHomeworkListResponse,
  BackendHomeworkQuestionDto,
  BackendHomeworkQuestionDetailResponse,
  BackendHomeworkQuestionsResponse,
  BackendHomeworkSubmissionAnswerDto,
  BackendHomeworkSubmissionAnswerResponse,
  BackendHomeworkSubmissionAnswersResponse,
  BackendHomeworkSubmissionAttachmentDto,
  BackendHomeworkSubmissionAttachmentsResponse,
  BackendHomeworkSubmissionDto,
  BackendHomeworkSubmissionResponse,
  BackendHomeworkSubmissionsResponse,
  BackendHomeworkGradeSyncStatusDto,
  BackendHomeworkTargetsResponse,
  CreateHomeworkAssignmentRequest,
  HomeworkGradeSyncStatusUiModel,
  HomeworkAdapter,
  HomeworkAssignmentListFilters,
  HomeworkSubmissionListFilters,
  HomeworkSubmissionReviewRequest,
  HomeworkSubmissionAnswerUiModel,
  HomeworkSubmissionAttachmentUiModel,
  HomeworkSubmissionUiModel,
  UpdateHomeworkAssignmentRequest,
} from "./homeworkApi.types";
import {
  mapBackendHomeworkAssignmentToUi,
  mapBackendHomeworkAttachmentToBuilder,
  mapBackendHomeworkQuestionToBuilder,
  mapBackendHomeworkTargetToUi,
  mapBuilderOptionToHomeworkPayload,
  mapBuilderQuestionToHomeworkCreatePayload,
  mapBuilderQuestionToHomeworkUpdatePayload,
  mapHomeworkCreateFormToPayload,
} from "./homeworkMappers";

const BASE_PATH = "/homework/assignments";

function extractQuestionList(
  response: BackendHomeworkQuestionsResponse | BackendHomeworkQuestionDto[],
): BackendHomeworkQuestionDto[] {
  if (Array.isArray(response)) return response;
  return response.items;
}

function extractAttachmentList(response: BackendHomeworkAttachmentsResponse) {
  return response.items;
}

function extractTargetList(response: BackendHomeworkTargetsResponse) {
  return response.items ?? response.targets ?? [];
}

function extractAnswerList(
  response:
    | BackendHomeworkSubmissionAnswersResponse
    | BackendHomeworkSubmissionAnswerDto[],
) {
  if (Array.isArray(response)) return response;
  return response.items ?? response.answers ?? [];
}

function extractSubmissionList(response: BackendHomeworkSubmissionsResponse) {
  return response.items ?? response.submissions ?? [];
}

function extractSubmissionPagination(
  response: BackendHomeworkSubmissionsResponse,
  filters?: HomeworkSubmissionListFilters,
) {
  return {
    page: response.pagination?.page ?? response.meta?.page ?? filters?.page ?? 1,
    limit: response.pagination?.limit ?? response.meta?.limit ?? filters?.limit ?? 25,
    total:
      response.pagination?.total ??
      response.meta?.total ??
      extractSubmissionList(response).length,
  };
}

function extractSubmissionAttachmentList(
  response:
    | BackendHomeworkSubmissionAttachmentsResponse
    | BackendHomeworkSubmissionAttachmentDto[],
) {
  if (Array.isArray(response)) return response;
  return response.items ?? response.attachments ?? [];
}

function questionPath(homeworkId: string, questionId: string) {
  return `${BASE_PATH}/${homeworkId}/questions/${questionId}`;
}

function submissionPath(homeworkId: string, submissionId: string) {
  return `${BASE_PATH}/${homeworkId}/submissions/${submissionId}`;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableNumber(
  ...values: Array<number | string | null | undefined>
): number | null | undefined {
  for (const value of values) {
    if (value === undefined || value === "") continue;
    if (value === null) return null;
    const parsed = toNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => !!value?.trim())?.trim();
}

function stringifyAnswerValue(
  value: BackendHomeworkSubmissionAnswerDto["value"],
) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "True" : "False";
  if (value === null || value === undefined) return "";
  return String(value);
}

function answerPromptText(answer: BackendHomeworkSubmissionAnswerDto) {
  return typeof answer.prompt === "string"
    ? answer.prompt
    : answer.prompt?.prompt;
}

function answerPromptQuestionId(answer: BackendHomeworkSubmissionAnswerDto) {
  return typeof answer.prompt === "object" ? answer.prompt?.questionId : undefined;
}

function answerPromptType(answer: BackendHomeworkSubmissionAnswerDto) {
  return typeof answer.prompt === "object" ? answer.prompt?.type : undefined;
}

function answerPromptPoints(answer: BackendHomeworkSubmissionAnswerDto) {
  return typeof answer.prompt === "object" ? answer.prompt?.points : undefined;
}

function mapSubmissionAnswerToUi(
  answer: BackendHomeworkSubmissionAnswerDto,
): HomeworkSubmissionAnswerUiModel {
  const id = answer.answerId ?? answer.id ?? "";
  const question = answer.question;
  return {
    id,
    questionId: answer.questionId ?? answerPromptQuestionId(answer) ?? question?.id,
    prompt:
      firstText(answerPromptText(answer), answer.questionPrompt, question?.prompt, question?.text) ??
      "Question",
    questionType: answer.questionType ?? answerPromptType(answer) ?? question?.type,
    answerText:
      firstText(answer.answerText, answer.textAnswer, answer.text, stringifyAnswerValue(answer.value)) ??
      "",
    score: toNullableNumber(
      answer.score,
      answer.awardedMarks,
      answer.awardedPoints,
    ),
    maxScore: toNumber(
      answer.maxScore ?? answer.points ?? answerPromptPoints(answer) ?? question?.points,
    ),
    feedback: answer.feedback ?? answer.reviewNote ?? answer.teacherComment,
    isCorrect: answer.isCorrect,
    reviewedAt: answer.reviewedAt,
    selectedOptionIds: answer.selectedOptionIds,
  };
}

function mapSubmissionAttachmentToUi(
  attachment: BackendHomeworkSubmissionAttachmentDto,
): HomeworkSubmissionAttachmentUiModel {
  const id = attachment.attachmentId ?? attachment.id ?? "";
  const filename = attachment.file?.filename;
  return {
    id,
    fileId: attachment.fileId,
    title: firstText(attachment.title, filename) ?? "Attachment",
    description: attachment.description,
    filename,
    mimeType: attachment.file?.mimeType,
    sizeBytes: attachment.file?.sizeBytes,
    // Submission attachment responses expose the backing file id, not a URL.
    // Use the same authenticated download proxy as the rest of the app.
    url:
      attachment.file?.url ??
      (attachment.fileId
        ? `/api/files/${encodeURIComponent(attachment.fileId)}/download`
        : undefined),
    createdAt: attachment.createdAt,
  };
}

function mapSubmissionToUi(
  submission: BackendHomeworkSubmissionDto,
): HomeworkSubmissionUiModel {
  const id = submission.submissionId ?? submission.id ?? "";
  const student = submission.student;
  return {
    id,
    homeworkId: submission.homeworkId,
    targetId: submission.targetId,
    studentId: submission.studentId ?? student?.id,
    studentNumber: student?.studentNumber,
    enrollmentId: submission.enrollmentId,
    studentName:
      firstText(
        student?.displayName,
        student?.name,
        student?.nameEn,
        student?.nameAr,
        submission.studentId,
      ) ?? "Student",
    status: submission.status ?? "submitted",
    bodyText: submission.bodyText,
    submittedAt: submission.submittedAt,
    reviewedAt: submission.reviewedAt,
    awardedMarks: toNumber(submission.awardedMarks ?? submission.score),
    totalMarks: toNumber(submission.totalMarks),
    reviewNote: submission.reviewNote,
    isLate: submission.isLate,
    gradeItemId: submission.gradeItemId,
    syncedAt: submission.syncedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function submissionReviewPayload(payload: HomeworkSubmissionReviewRequest) {
  const reviewNote = payload.reviewNote?.trim();
  return {
    ...(reviewNote ? { reviewNote } : {}),
    ...(payload.awardedMarks === undefined
      ? {}
      : { awardedMarks: payload.awardedMarks }),
  };
}

function submissionListParams(filters?: HomeworkSubmissionListFilters) {
  if (!filters) return undefined;
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search?.trim() ? { search: filters.search.trim().slice(0, 200) } : {}),
    ...(filters.page ? { page: Math.max(1, Math.trunc(filters.page)) } : {}),
    ...(filters.limit
      ? { limit: Math.min(100, Math.max(1, Math.trunc(filters.limit))) }
      : {}),
  };
}

function mapGradeSyncStatus(
  response: BackendHomeworkGradeSyncStatusDto,
): HomeworkGradeSyncStatusUiModel {
  const gradeAssessment = response.gradeAssessment
    ? {
        id:
          response.gradeAssessment.gradeAssessmentId ??
          response.gradeAssessment.id,
        title: response.gradeAssessment.title ?? undefined,
        type: response.gradeAssessment.type,
        deliveryMode: response.gradeAssessment.deliveryMode,
        status: response.gradeAssessment.status,
        maxMarks:
          response.gradeAssessment.maxMarks ??
          response.gradeAssessment.maxScore,
        isLocked: response.gradeAssessment.isLocked,
      }
    : undefined;
  const summary = response.syncSummary;
  return {
    homeworkId: response.homeworkId ?? "",
    linked: Boolean(response.linked),
    gradeAssessment,
    syncSummary: summary
      ? {
          total: summary.total ?? summary.totalReviewedSubmissions,
          synced: summary.synced ?? summary.syncedSubmissions,
          pending: summary.pendingSyncSubmissions,
          failed: summary.failed ?? summary.failedSyncSubmissions,
          lastSyncedAt: summary.lastSyncedAt,
        }
      : undefined,
    warnings: Array.isArray(response.warnings) ? response.warnings : [],
    submissionSync: response.submissionSync,
  };
}

async function reconcileQuestionOptions(
  homeworkId: string,
  questionId: string,
  question: AssignmentQuestion,
  currentQuestion: BackendHomeworkQuestionDto,
) {
  const path = questionPath(homeworkId, questionId);
  const requestedOptions = question.options ?? [];
  const requestedIds = new Set(requestedOptions.map(({ id }) => id));
  const currentIds = new Set(currentQuestion.options.map(({ optionId }) => optionId));

  for (const option of currentQuestion.options) {
    if (!requestedIds.has(option.optionId)) {
      await apiDelete(`${path}/options/${option.optionId}`);
    }
  }

  for (const option of requestedOptions) {
    const payload = mapBuilderOptionToHomeworkPayload(option);
    if (!currentIds.has(option.id)) {
      await apiPost(`${path}/options`, payload);
      continue;
    }
    await apiPatch(`${path}/options/${option.id}`, {
      text: payload.text,
      isCorrect: payload.isCorrect,
    });
    await apiPatch(`${path}/options/${option.id}/reorder`, {
      sortOrder: option.order,
    });
  }
}

function isChoiceQuestion(question: AssignmentQuestion) {
  return question.questionType === "MCQ_SINGLE" ||
    question.questionType === "MCQ_MULTI" ||
    question.questionType === "TRUE_FALSE";
}

async function updateTrueFalseOptions(
  path: string,
  currentQuestion: BackendHomeworkQuestionDto,
  correctAnswer: boolean,
) {
  const desired = [
    { text: "True", isCorrect: correctAnswer, sortOrder: 0 },
    { text: "False", isCorrect: !correctAnswer, sortOrder: 1 },
  ];
  const retainedOptionIds = new Set<string>();

  for (const option of desired) {
    const currentOption = currentQuestion.options.find(({ sortOrder }) => sortOrder === option.sortOrder);
    if (currentOption) {
      retainedOptionIds.add(currentOption.optionId);
      await apiPatch(`${path}/options/${currentOption.optionId}`, {
        text: option.text,
        isCorrect: option.isCorrect,
      });
    } else {
      await apiPost(`${path}/options`, option);
    }
  }

  for (const option of currentQuestion.options) {
    if (!retainedOptionIds.has(option.optionId)) {
      await apiDelete(`${path}/options/${option.optionId}`);
    }
  }
}

export const homeworkApiAdapter: HomeworkAdapter = {
  async listAssignments(filters: HomeworkAssignmentListFilters) {
    const response = await apiGet<BackendHomeworkListResponse>(BASE_PATH, {
      params: filters,
    });
    return {
      items: response.items.map(mapBackendHomeworkAssignmentToUi),
      meta: response.meta,
    };
  },

  async createAssignment(payload: CreateHomeworkAssignmentRequest) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      BASE_PATH,
      mapHomeworkCreateFormToPayload(payload),
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async getAssignment(homeworkId: string) {
    const response = await apiGet<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async updateAssignment(
    homeworkId: string,
    payload: UpdateHomeworkAssignmentRequest,
  ) {
    const response = await apiPatch<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}`,
      payload,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async publishAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/publish`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async closeAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/close`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async cancelAssignment(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/cancel`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async listTargets(homeworkId: string) {
    const response = await apiGet<BackendHomeworkTargetsResponse>(
      `${BASE_PATH}/${homeworkId}/targets`,
    );
    return extractTargetList(response).map(mapBackendHomeworkTargetToUi);
  },

  async resolveTargets(homeworkId: string) {
    const response = await apiPost<BackendHomeworkAssignmentDto>(
      `${BASE_PATH}/${homeworkId}/targets/resolve`,
    );
    return mapBackendHomeworkAssignmentToUi(response);
  },

  async listQuestions(homeworkId: string) {
    const response = await apiGet<BackendHomeworkQuestionsResponse | BackendHomeworkQuestionDto[]>(
      `${BASE_PATH}/${homeworkId}/questions`,
    );
    return extractQuestionList(response).map(mapBackendHomeworkQuestionToBuilder);
  },

  async createQuestion(homeworkId: string, question: AssignmentQuestion) {
    const response = await apiPost<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions`,
      mapBuilderQuestionToHomeworkCreatePayload(question),
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async updateQuestion(
    homeworkId: string,
    questionId: string,
    question: AssignmentQuestion,
  ) {
    const path = questionPath(homeworkId, questionId);
    const current = await apiGet<BackendHomeworkQuestionDetailResponse>(path);
    if (!isChoiceQuestion(question)) {
      for (const option of current.question.options) {
        await apiDelete(`${path}/options/${option.optionId}`);
      }
    }
    await apiPatch<BackendHomeworkQuestionDetailResponse>(
      path,
      mapBuilderQuestionToHomeworkUpdatePayload(question),
    );
    if (question.questionType === "TRUE_FALSE") {
      await updateTrueFalseOptions(path, current.question, question.correctAnswer ?? true);
    } else if (isChoiceQuestion(question)) {
      await reconcileQuestionOptions(homeworkId, questionId, question, current.question);
    }
    const response = await apiGet<BackendHomeworkQuestionDetailResponse>(path);
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async deleteQuestion(homeworkId: string, questionId: string) {
    await apiDelete(`${BASE_PATH}/${homeworkId}/questions/${questionId}`);
  },

  async reorderQuestion(homeworkId: string, questionId: string, order: number) {
    const response = await apiPatch<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/reorder`,
      { sortOrder: order },
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async createOption(homeworkId, questionId, option) {
    const response = await apiPost<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options`,
      mapBuilderOptionToHomeworkPayload(option),
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async updateOption(homeworkId, questionId, option) {
    const response = await apiPatch<BackendHomeworkQuestionDetailResponse>(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options/${option.id}`,
      {
        text: option.textEn || option.textAr,
        isCorrect: option.isCorrect,
      },
    );
    return mapBackendHomeworkQuestionToBuilder(response.question);
  },

  async deleteOption(homeworkId, questionId, optionId) {
    await apiDelete(
      `${BASE_PATH}/${homeworkId}/questions/${questionId}/options/${optionId}`,
    );
  },

  async listAttachments(homeworkId: string) {
    const response = await apiGet<BackendHomeworkAttachmentsResponse>(
      `${BASE_PATH}/${homeworkId}/attachments`,
    );
    return extractAttachmentList(response).map(mapBackendHomeworkAttachmentToBuilder);
  },

  async createAttachment(homeworkId: string, payload) {
    const response = await apiPost<BackendHomeworkAttachmentDetailResponse>(
      `${BASE_PATH}/${homeworkId}/attachments`,
      payload,
    );
    return mapBackendHomeworkAttachmentToBuilder(response.attachment);
  },

  async updateAttachment(homeworkId: string, attachmentId: string, payload) {
    const response = await apiPatch<BackendHomeworkAttachmentDetailResponse>(
      `${BASE_PATH}/${homeworkId}/attachments/${attachmentId}`,
      payload,
    );
    return mapBackendHomeworkAttachmentToBuilder(response.attachment);
  },

  async reorderAttachment(homeworkId: string, attachmentId: string, order: number) {
    const response = await apiPatch<BackendHomeworkAttachmentDetailResponse>(
      `${BASE_PATH}/${homeworkId}/attachments/${attachmentId}/reorder`,
      { sortOrder: order },
    );
    return mapBackendHomeworkAttachmentToBuilder(response.attachment);
  },

  async deleteAttachment(homeworkId: string, attachmentId: string) {
    await apiDelete(`${BASE_PATH}/${homeworkId}/attachments/${attachmentId}`);
  },

  async listSubmissions(homeworkId: string, filters) {
    const path = `${BASE_PATH}/${homeworkId}/submissions`;
    const params = submissionListParams(filters);
    const response = params
      ? await apiGet<BackendHomeworkSubmissionsResponse>(path, {
          params,
        })
      : await apiGet<BackendHomeworkSubmissionsResponse>(path);
    return {
      items: extractSubmissionList(response)
        .map(mapSubmissionToUi)
        .filter((submission) => submission.id),
      pagination: extractSubmissionPagination(response, filters),
    };
  },

  async getSubmission(homeworkId: string, submissionId: string) {
    const response = await apiGet<BackendHomeworkSubmissionResponse>(
      submissionPath(homeworkId, submissionId),
    );
    return mapSubmissionToUi(response.submission);
  },

  async reviewSubmission(homeworkId, submissionId, payload) {
    const response = await apiPatch<BackendHomeworkSubmissionResponse>(
      `${submissionPath(homeworkId, submissionId)}/review`,
      submissionReviewPayload(payload),
    );
    return mapSubmissionToUi(response.submission);
  },

  async listSubmissionAnswers(homeworkId: string, submissionId: string) {
    const response = await apiGet<
      BackendHomeworkSubmissionAnswersResponse | BackendHomeworkSubmissionAnswerDto[]
    >(`${submissionPath(homeworkId, submissionId)}/answers`);
    return extractAnswerList(response)
      .map(mapSubmissionAnswerToUi)
      .filter((answer) => answer.id);
  },

  async getSubmissionAnswer(homeworkId, submissionId, answerId) {
    const response = await apiGet<BackendHomeworkSubmissionAnswerResponse>(
      `${submissionPath(homeworkId, submissionId)}/answers/${answerId}`,
    );
    return mapSubmissionAnswerToUi(response.answer);
  },

  async reviewSubmissionAnswer(homeworkId, submissionId, answerId, payload) {
    const backendPayload = {
      awardedPoints: payload.score,
      teacherComment: payload.feedback,
    };
    const response = await apiPatch<BackendHomeworkSubmissionAnswerResponse>(
      `${submissionPath(homeworkId, submissionId)}/answers/${answerId}/review`,
      backendPayload,
    );
    return mapSubmissionAnswerToUi(response.answer);
  },

  async bulkReviewSubmissionAnswers(homeworkId, submissionId, payload) {
    const backendPayload = {
      answers: payload.answers.map((item) => ({
        answerId: item.answerId,
        awardedPoints: item.score,
        teacherComment: item.feedback,
      })),
    };
    const response = await apiPut<
      BackendHomeworkSubmissionAnswersResponse | BackendHomeworkSubmissionAnswerDto[]
    >(
      `${submissionPath(homeworkId, submissionId)}/answers/review`,
      backendPayload,
    );
    return extractAnswerList(response)
      .map(mapSubmissionAnswerToUi)
      .filter((answer) => answer.id);
  },

  async listSubmissionAttachments(homeworkId, submissionId) {
    const response = await apiGet<
      | BackendHomeworkSubmissionAttachmentsResponse
      | BackendHomeworkSubmissionAttachmentDto[]
    >(`${submissionPath(homeworkId, submissionId)}/attachments`);
    return extractSubmissionAttachmentList(response)
      .map(mapSubmissionAttachmentToUi)
      .filter((attachment) => attachment.id);
  },

  async getGradeSyncStatus(homeworkId: string) {
    const response = await apiGet<BackendHomeworkGradeSyncStatusDto>(
      `${BASE_PATH}/${homeworkId}/grade-sync`,
    );
    return mapGradeSyncStatus(response);
  },

  async linkGradeSync(homeworkId: string, gradeAssessmentId: string) {
    const response = await apiPost<BackendHomeworkGradeSyncStatusDto>(
      `${BASE_PATH}/${homeworkId}/grade-sync/link`,
      { gradeAssessmentId },
    );
    return mapGradeSyncStatus(response);
  },

  async syncHomeworkGrades(homeworkId: string) {
    const response = await apiPost<BackendHomeworkGradeSyncStatusDto>(
      `${BASE_PATH}/${homeworkId}/grade-sync`,
    );
    return mapGradeSyncStatus(response);
  },

  async syncSubmissionGrade(homeworkId: string, submissionId: string) {
    const response = await apiPost<BackendHomeworkGradeSyncStatusDto>(
      `${submissionPath(homeworkId, submissionId)}/grade-sync`,
    );
    return mapGradeSyncStatus(response);
  },
};
