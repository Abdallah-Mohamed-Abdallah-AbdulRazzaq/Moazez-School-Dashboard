import type {
  Assignment,
  AssignmentAttachment,
  AssignmentQuestion,
  QuestionOption,
} from "@/features/academics/curriculum/services/curriculumService";
import type {
  BackendHomeworkAssignmentDto,
  BackendHomeworkAttachmentDto,
  BackendHomeworkQuestionDto,
  BackendHomeworkQuestionOptionDto,
  BackendHomeworkTargetDto,
  CreateHomeworkAssignmentRequest,
  HomeworkAssignmentUiModel,
  HomeworkTargetUiModel,
  UpdateHomeworkAssignmentRequest,
} from "./homeworkApi.types";

const BACKEND_QUESTION_TYPE_TO_UI: Record<string, AssignmentQuestion["questionType"]> = {
  single_choice: "MCQ_SINGLE",
  multiple_choice: "MCQ_MULTI",
  true_false: "TRUE_FALSE",
  short_text: "SHORT_ANSWER",
  long_text: "ESSAY",
};

const UI_QUESTION_TYPE_TO_BACKEND: Record<AssignmentQuestion["questionType"], string> = {
  MCQ_SINGLE: "SINGLE_CHOICE",
  MCQ_MULTI: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  SHORT_ANSWER: "SHORT_TEXT",
  ESSAY: "LONG_TEXT",
  FILL_IN_BLANK: "SHORT_TEXT",
  MATCHING: "SHORT_TEXT",
  MEDIA: "SHORT_TEXT",
};

function normalizeStatus(
  status: BackendHomeworkAssignmentDto["status"],
): HomeworkAssignmentUiModel["status"] {
  const normalized = String(status || "draft").toLowerCase();
  if (
    normalized === "published" ||
    normalized === "closed" ||
    normalized === "cancelled" ||
    normalized === "archived"
  ) {
    return normalized;
  }
  return "draft";
}

function label(
  ref: {
    displayName?: string;
    fullName?: string;
    name?: string;
    nameEn?: string;
    nameAr?: string;
    title?: string;
    titleEn?: string;
    titleAr?: string;
  } | null | undefined,
): string | undefined {
  if (!ref) return undefined;
  return ref.displayName || ref.fullName || ref.name || ref.nameEn || ref.nameAr || ref.title || ref.titleEn || ref.titleAr;
}

function homeworkAssignmentId(dto: BackendHomeworkAssignmentDto) {
  return dto.id ?? dto.homeworkId ?? dto.assignmentId ?? "";
}

export function mapBackendHomeworkAssignmentToUi(
  dto: BackendHomeworkAssignmentDto,
): HomeworkAssignmentUiModel {
  return {
    id: homeworkAssignmentId(dto),
    academicYearId: dto.academicYearId ?? dto.academicYear?.id,
    termId: dto.termId ?? dto.term?.id,
    classroomId: dto.classroomId ?? dto.classroom?.id,
    classroomSectionId: dto.classroom?.section?.id,
    classroomGradeId: dto.classroom?.grade?.id,
    subjectId: dto.subjectId ?? dto.subject?.id,
    teacherSubjectAllocationId: dto.teacherSubjectAllocationId,
    teacherUserId: dto.teacherUserId ?? dto.teacher?.userId,
    timetableEntryId: dto.timetableEntryId,
    scheduleDate: dto.scheduleDate,
    title: dto.title ?? "",
    description: dto.description ?? "",
    mode: String(dto.mode || "homework").toLowerCase(),
    status: normalizeStatus(dto.status),
    targetMode: String(dto.targetMode || "classroom").toLowerCase(),
    dueAt: dto.dueAt ?? undefined,
    publishAt: dto.publishAt ?? undefined,
    publishedAt: dto.publishedAt,
    closedAt: dto.closedAt,
    estimatedMinutes: dto.estimatedMinutes ?? undefined,
    totalMarks: dto.totalMarks ?? null,
    isGraded: dto.isGraded ?? true,
    questionCount: dto.questionCount ?? dto.questions?.length ?? 0,
    attachmentCount:
      dto.attachmentsCount ?? dto.attachmentCount ?? dto.attachments?.length ?? 0,
    classroomName: label(dto.classroom),
    classroomSectionName: label(dto.classroom?.section),
    classroomGradeName: label(dto.classroom?.grade),
    academicYearName: label(dto.academicYear),
    termName: label(dto.term),
    termStartDate: dto.term?.startDate,
    termEndDate: dto.term?.endDate,
    subjectName: label(dto.subject),
    subjectCode: dto.subject?.code,
    subjectColor: dto.subject?.color,
    teacherName: label(dto.teacher),
    counters: dto.counters,
    questions: dto.questions?.map(mapBackendHomeworkQuestionToBuilder),
    attachments: dto.attachments?.map(mapBackendHomeworkAttachmentToBuilder),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapHomeworkUiToBuilderAssignment(
  assignment: HomeworkAssignmentUiModel,
): Assignment {
  return {
    id: assignment.id,
    lessonId: "homework",
    titleAr: assignment.title,
    titleEn: assignment.title,
    descriptionAr: assignment.description,
    descriptionEn: assignment.description,
    dueDate: assignment.dueAt,
    maxScore: assignment.totalMarks,
    expectedTimeMinutes: assignment.estimatedMinutes,
    isPublished: assignment.status === "published",
    createdAt: assignment.createdAt,
  };
}

export function mapBuilderAssignmentToHomeworkUpdate(
  assignment: Assignment,
): UpdateHomeworkAssignmentRequest {
  return {
    title: (assignment.titleEn || assignment.titleAr).trim(),
    description:
      (assignment.descriptionEn || assignment.descriptionAr)?.trim() || undefined,
    dueAt: assignment.dueDate,
    totalMarks: assignment.maxScore,
    estimatedMinutes: assignment.expectedTimeMinutes,
  };
}

export function mapHomeworkCreateFormToPayload(
  payload: CreateHomeworkAssignmentRequest,
): CreateHomeworkAssignmentRequest {
  return {
    ...payload,
    mode: payload.mode || "homework",
    isGraded: payload.isGraded ?? true,
  };
}

function toUiQuestionType(type: string | undefined): AssignmentQuestion["questionType"] {
  if (!type) return "SHORT_ANSWER";
  return BACKEND_QUESTION_TYPE_TO_UI[type] ?? BACKEND_QUESTION_TYPE_TO_UI[type.toLowerCase()] ?? (type.toUpperCase() as AssignmentQuestion["questionType"]);
}

export function mapBackendHomeworkQuestionToBuilder(
  dto: BackendHomeworkQuestionDto,
): AssignmentQuestion {
  return {
    id: dto.questionId,
    assignmentId: dto.homeworkId,
    questionTextAr: dto.prompt,
    questionTextEn: dto.prompt,
    questionType: toUiQuestionType(dto.type),
    points: dto.points,
    isRequired: dto.isRequired,
    order: dto.sortOrder,
    options: dto.options.map(mapBackendHomeworkOptionToBuilder),
    correctAnswer: dto.type.toLowerCase() === "true_false"
      ? dto.options.find(({ sortOrder }) => sortOrder === 0)?.isCorrect
      : undefined,
    instructions: dto.instructions ?? undefined,
    expectedAnswer: dto.expectedAnswer ?? undefined,
    createdAt: dto.createdAt,
  };
}

export function mapBackendHomeworkOptionToBuilder(
  dto: BackendHomeworkQuestionOptionDto,
): QuestionOption {
  return {
    id: dto.optionId,
    textAr: dto.text,
    textEn: dto.text,
    isCorrect: dto.isCorrect ?? false,
    order: dto.sortOrder,
  };
}

export function mapBuilderQuestionToHomeworkCreatePayload(
  question: AssignmentQuestion,
): Record<string, unknown> {
  return {
    type: UI_QUESTION_TYPE_TO_BACKEND[question.questionType],
    prompt: question.questionTextEn || question.questionTextAr,
    points: question.points,
    sortOrder: question.order,
    isRequired: question.isRequired ?? true,
    instructions: question.instructions?.trim() || undefined,
    expectedAnswer: question.questionType === "SHORT_ANSWER"
      ? question.expectedAnswer?.trim() || undefined
      : undefined,
    options: question.questionType === "TRUE_FALSE"
      ? trueFalseOptions(question.correctAnswer ?? true)
      : question.options?.map(mapBuilderOptionToHomeworkPayload),
  };
}

function trueFalseOptions(correctAnswer: boolean) {
  return [
    { text: "True", isCorrect: correctAnswer, sortOrder: 0 },
    { text: "False", isCorrect: !correctAnswer, sortOrder: 1 },
  ];
}

export function mapBuilderQuestionToHomeworkUpdatePayload(
  question: AssignmentQuestion,
): Record<string, unknown> {
  const { sortOrder, options, ...payload } = mapBuilderQuestionToHomeworkCreatePayload(question);
  void sortOrder;
  void options;
  return payload;
}

export function mapBuilderOptionToHomeworkPayload(
  option: QuestionOption,
): Record<string, unknown> {
  return {
    text: option.textEn || option.textAr,
    isCorrect: option.isCorrect,
    sortOrder: option.order,
  };
}

export function mapBackendHomeworkAttachmentToBuilder(
  dto: BackendHomeworkAttachmentDto,
): AssignmentAttachment {
  return {
    id: dto.attachmentId,
    assignmentId: dto.homeworkId,
    fileId: dto.fileId,
    type: "FILE",
    title: dto.title ?? dto.file.filename,
    url: `/api/files/${encodeURIComponent(dto.fileId)}/download`,
    fileName: dto.file.filename,
    mimeType: dto.file.mimeType,
    size: Number(dto.file.sizeBytes),
    createdAt: dto.createdAt,
  };
}

export function mapBackendHomeworkTargetToUi(
  dto: BackendHomeworkTargetDto,
): HomeworkTargetUiModel {
  return {
    targetId: dto.targetId,
    studentId: dto.studentId,
    enrollmentId: dto.enrollmentId,
    studentName:
      dto.student?.displayName ||
      dto.student?.name ||
      dto.student?.nameEn ||
      dto.student?.nameAr ||
      dto.studentId,
    status: dto.status ?? "assigned",
    assignedAt: dto.assignedAt,
    viewedAt: dto.viewedAt,
    submittedAt: dto.submittedAt,
    reviewedAt: dto.reviewedAt,
    excusedAt: dto.excusedAt,
  };
}
