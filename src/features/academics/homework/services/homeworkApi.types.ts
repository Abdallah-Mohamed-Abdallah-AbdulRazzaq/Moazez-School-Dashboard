import type {
  AssignmentAttachment,
  AssignmentQuestion,
} from "@/features/academics/curriculum/services/curriculumService";

export type HomeworkAssignmentStatus =
  | "draft"
  | "published"
  | "closed"
  | "cancelled"
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "CANCELLED"
  | "archived"
  | "ARCHIVED";

export type HomeworkMode =
  | "homework"
  | "worksheet"
  | "writing_task"
  | "quiz"
  | "reading"
  | "project"
  | "HOMEWORK"
  | "WORKSHEET"
  | "WRITING_TASK"
  | "QUIZ"
  | "READING"
  | "PROJECT";

export type HomeworkTargetMode =
  | "classroom"
  | "selected_students"
  | "CLASSROOM"
  | "SELECTED_STUDENTS";

export interface BackendHomeworkListResponse {
  items: BackendHomeworkAssignmentDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BackendHomeworkAssignmentDto {
  id?: string;
  homeworkId?: string;
  assignmentId?: string;
  title?: string;
  description?: string | null;
  mode?: HomeworkMode;
  status?: HomeworkAssignmentStatus;
  targetMode?: HomeworkTargetMode;
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  subjectId?: string;
  teacherSubjectAllocationId?: string;
  teacherUserId?: string;
  timetableEntryId?: string | null;
  scheduleDate?: string | null;
  publishAt?: string | null;
  publishedAt?: string | null;
  dueAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  estimatedMinutes?: number | null;
  totalMarks?: number | null;
  isGraded?: boolean;
  questionCount?: number;
  attachmentCount?: number;
  attachmentsCount?: number;
  academicYear?: BackendNamedRef;
  term?: BackendHomeworkTermRef;
  classroom?: BackendHomeworkClassroomRef;
  subject?: BackendHomeworkSubjectRef;
  teacher?: BackendHomeworkTeacherRef;
  questions?: BackendHomeworkQuestionDto[];
  attachments?: BackendHomeworkAttachmentDto[];
  counters?: BackendHomeworkCounters;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendNamedRef {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  displayName?: string;
  fullName?: string;
}

export interface BackendHomeworkTermRef extends BackendNamedRef {
  startDate?: string;
  endDate?: string;
}

export interface BackendHomeworkClassroomRef extends BackendNamedRef {
  section?: BackendNamedRef | null;
  grade?: BackendNamedRef | null;
}

export interface BackendHomeworkSubjectRef extends BackendNamedRef {
  code?: string | null;
  color?: string | null;
}

export interface BackendHomeworkTeacherRef {
  userId?: string;
  fullName?: string;
}

export interface BackendHomeworkCounters {
  totalTargets?: number;
  assigned?: number;
  viewed?: number;
  submitted?: number;
  late?: number;
  missing?: number;
  reviewed?: number;
  excused?: number;
}

export interface HomeworkAssignmentListFilters {
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  teacherUserId?: string;
  teacherSubjectAllocationId?: string;
  status?: string;
  mode?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateHomeworkAssignmentRequest {
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  title: string;
  targetMode: string;
  dueAt: string;
  timetableEntryId?: string;
  scheduleDate?: string;
  description?: string | null;
  mode?: string;
  studentIds?: string[];
  publishAt?: string | null;
  estimatedMinutes?: number | null;
  totalMarks?: number | null;
  isGraded?: boolean;
}

export type UpdateHomeworkAssignmentRequest =
  Partial<CreateHomeworkAssignmentRequest>;

export interface BackendHomeworkQuestionDto {
  questionId: string;
  homeworkId: string;
  type: string;
  prompt: string;
  instructions?: string | null;
  points: number;
  sortOrder: number;
  isRequired: boolean;
  expectedAnswer?: string | null;
  options: BackendHomeworkQuestionOptionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendHomeworkQuestionOptionDto {
  optionId: string;
  questionId: string;
  text: string;
  isCorrect?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendHomeworkQuestionsResponse {
  items: BackendHomeworkQuestionDto[];
}

export interface BackendHomeworkQuestionDetailResponse {
  question: BackendHomeworkQuestionDto;
}

export interface BackendHomeworkAttachmentDto {
  attachmentId: string;
  homeworkId: string;
  fileId: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  file: {
    filename: string;
    mimeType: string;
    sizeBytes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BackendHomeworkAttachmentsResponse {
  items: BackendHomeworkAttachmentDto[];
}

export interface BackendHomeworkAttachmentDetailResponse {
  attachment: BackendHomeworkAttachmentDto;
}

export interface BackendHomeworkTargetDto {
  targetId: string;
  studentId: string;
  enrollmentId?: string;
  student?: {
    id?: string;
    displayName?: string;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  status?: string;
  assignedAt?: string | null;
  viewedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  excusedAt?: string | null;
}

export interface BackendHomeworkTargetsResponse {
  items?: BackendHomeworkTargetDto[];
  targets?: BackendHomeworkTargetDto[];
}

export interface HomeworkAssignmentUiModel {
  id: string;
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  classroomSectionId?: string;
  classroomGradeId?: string;
  subjectId?: string;
  teacherSubjectAllocationId?: string;
  teacherUserId?: string;
  timetableEntryId?: string | null;
  scheduleDate?: string | null;
  title: string;
  description?: string;
  mode: string;
  status: "draft" | "published" | "closed" | "cancelled" | "archived";
  targetMode: string;
  dueAt?: string;
  publishAt?: string;
  publishedAt?: string | null;
  closedAt?: string | null;
  estimatedMinutes?: number;
  totalMarks: number | null;
  isGraded: boolean;
  questionCount: number;
  attachmentCount: number;
  classroomName?: string;
  classroomSectionName?: string;
  classroomGradeName?: string;
  academicYearName?: string;
  termName?: string;
  termStartDate?: string;
  termEndDate?: string;
  subjectName?: string;
  subjectCode?: string | null;
  subjectColor?: string | null;
  teacherName?: string;
  counters?: BackendHomeworkCounters;
  questions?: AssignmentQuestion[];
  attachments?: AssignmentAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeworkListResult {
  items: HomeworkAssignmentUiModel[];
  meta: BackendHomeworkListResponse["meta"];
}

export interface HomeworkTargetUiModel {
  targetId: string;
  studentId: string;
  enrollmentId?: string;
  studentName: string;
  status: string;
  assignedAt?: string | null;
  viewedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  excusedAt?: string | null;
}

export interface BackendHomeworkSubmissionDto {
  submissionId?: string;
  id?: string;
  homeworkId?: string;
  targetId?: string;
  studentId?: string;
  enrollmentId?: string;
  student?: BackendNamedRef & {
    id?: string;
    displayName?: string;
    studentNumber?: string | null;
  };
  status?: string;
  bodyText?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  awardedMarks?: number | string | null;
  totalMarks?: number | string | null;
  score?: number | string | null;
  reviewNote?: string | null;
  isLate?: boolean;
  gradeItemId?: string | null;
  syncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendHomeworkSubmissionsResponse {
  items?: BackendHomeworkSubmissionDto[];
  submissions?: BackendHomeworkSubmissionDto[];
  meta?: BackendHomeworkListResponse["meta"];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface BackendHomeworkSubmissionResponse {
  submission: BackendHomeworkSubmissionDto;
}

export interface HomeworkSubmissionListFilters {
  status?: "submitted" | "late" | "reviewed" | "pending_review";
  search?: string;
  page?: number;
  limit?: number;
}

export interface HomeworkSubmissionsPaginationUiModel {
  page: number;
  limit: number;
  total: number;
}

export interface HomeworkSubmissionsListResult {
  items: HomeworkSubmissionUiModel[];
  pagination: HomeworkSubmissionsPaginationUiModel;
}

export interface BackendHomeworkSubmissionAnswerDto {
  answerId?: string;
  id?: string;
  questionId?: string;
  question?: {
    id?: string;
    prompt?: string;
    text?: string;
    type?: string;
    points?: number | string | null;
  };
  prompt?: {
    questionId?: string;
    type?: string;
    prompt?: string;
    points?: number | string | null;
    isRequired?: boolean;
  } | string;
  questionPrompt?: string;
  questionType?: string;
  answerText?: string | null;
  textAnswer?: string | null;
  text?: string | null;
  value?: string | number | boolean | string[] | null;
  selectedOptionIds?: string[];
  score?: number | string | null;
  awardedMarks?: number | string | null;
  awardedPoints?: number | string | null;
  maxScore?: number | string | null;
  points?: number | string | null;
  feedback?: string | null;
  reviewNote?: string | null;
  teacherComment?: string | null;
  isCorrect?: boolean | null;
  reviewedAt?: string | null;
}

export interface BackendHomeworkSubmissionAnswersResponse {
  items?: BackendHomeworkSubmissionAnswerDto[];
  answers?: BackendHomeworkSubmissionAnswerDto[];
}

export interface BackendHomeworkSubmissionAnswerResponse {
  answer: BackendHomeworkSubmissionAnswerDto;
}

export interface BackendHomeworkSubmissionAttachmentDto {
  attachmentId?: string;
  id?: string;
  fileId?: string;
  title?: string | null;
  description?: string | null;
  file?: {
    filename?: string;
    mimeType?: string;
    sizeBytes?: string | number;
    url?: string;
  };
  createdAt?: string;
}

export interface BackendHomeworkSubmissionAttachmentsResponse {
  items?: BackendHomeworkSubmissionAttachmentDto[];
  attachments?: BackendHomeworkSubmissionAttachmentDto[];
}

export interface HomeworkSubmissionUiModel {
  id: string;
  homeworkId?: string;
  targetId?: string;
  studentId?: string;
  studentNumber?: string | null;
  enrollmentId?: string;
  studentName: string;
  status: string;
  bodyText?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  awardedMarks?: number;
  totalMarks?: number;
  reviewNote?: string | null;
  isLate?: boolean;
  gradeItemId?: string | null;
  syncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeworkSubmissionAnswerUiModel {
  id: string;
  questionId?: string;
  prompt: string;
  questionType?: string;
  answerText: string;
  score?: number | null;
  maxScore?: number;
  feedback?: string | null;
  isCorrect?: boolean | null;
  reviewedAt?: string | null;
  selectedOptionIds?: string[];
}

export interface HomeworkSubmissionAttachmentUiModel {
  id: string;
  fileId?: string;
  title: string;
  description?: string | null;
  filename?: string;
  mimeType?: string;
  sizeBytes?: string | number;
  url?: string;
  createdAt?: string;
}

export interface HomeworkAnswerReviewRequest {
  score?: number | null;
  feedback?: string | null;
  isCorrect?: boolean;
}

export interface HomeworkBulkAnswerReviewRequest {
  answers: Array<HomeworkAnswerReviewRequest & { answerId: string }>;
}

export interface HomeworkSubmissionReviewRequest {
  reviewNote?: string;
  awardedMarks?: number;
}

export interface HomeworkGradeSyncStatusUiModel {
  homeworkId: string;
  linked: boolean;
  gradeAssessment?: {
    id?: string;
    title?: string;
    type?: string;
    deliveryMode?: string;
    status?: string;
    maxMarks?: number;
    isLocked?: boolean;
  };
  syncSummary?: {
    total?: number;
    synced?: number;
    pending?: number;
    failed?: number;
    lastSyncedAt?: string | null;
  };
  warnings: string[];
  submissionSync?: {
    submissionId?: string;
    studentId?: string;
    enrollmentId?: string;
    score?: number;
    gradeItemId?: string;
    synced?: boolean;
    idempotent?: boolean;
  };
}

export interface BackendHomeworkGradeSyncStatusDto {
  homeworkId?: string;
  linked?: boolean;
  gradeAssessment?: {
    id?: string;
    gradeAssessmentId?: string;
    title?: string | null;
    type?: string;
    deliveryMode?: string;
    status?: string;
    maxMarks?: number;
    maxScore?: number;
    isLocked?: boolean;
  } | null;
  syncSummary?: {
    total?: number;
    synced?: number;
    failed?: number;
    totalReviewedSubmissions?: number;
    syncedSubmissions?: number;
    pendingSyncSubmissions?: number;
    failedSyncSubmissions?: number;
    lastSyncedAt?: string | null;
  };
  warnings?: string[];
  submissionSync?: HomeworkGradeSyncStatusUiModel["submissionSync"];
}

export interface HomeworkAdapter {
  listAssignments(
    filters: HomeworkAssignmentListFilters,
  ): Promise<HomeworkListResult>;
  createAssignment(
    payload: CreateHomeworkAssignmentRequest,
  ): Promise<HomeworkAssignmentUiModel>;
  getAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  updateAssignment(
    homeworkId: string,
    payload: UpdateHomeworkAssignmentRequest,
  ): Promise<HomeworkAssignmentUiModel>;
  publishAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  closeAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  cancelAssignment(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  listTargets(homeworkId: string): Promise<HomeworkTargetUiModel[]>;
  resolveTargets(homeworkId: string): Promise<HomeworkAssignmentUiModel>;
  listQuestions(homeworkId: string): Promise<AssignmentQuestion[]>;
  createQuestion(
    homeworkId: string,
    question: AssignmentQuestion,
  ): Promise<AssignmentQuestion>;
  updateQuestion(
    homeworkId: string,
    questionId: string,
    question: AssignmentQuestion,
  ): Promise<AssignmentQuestion>;
  deleteQuestion(homeworkId: string, questionId: string): Promise<void>;
  reorderQuestion(
    homeworkId: string,
    questionId: string,
    order: number,
  ): Promise<AssignmentQuestion>;
  createOption(
    homeworkId: string,
    questionId: string,
    option: NonNullable<AssignmentQuestion["options"]>[number],
  ): Promise<AssignmentQuestion>;
  updateOption(
    homeworkId: string,
    questionId: string,
    option: NonNullable<AssignmentQuestion["options"]>[number],
  ): Promise<AssignmentQuestion>;
  deleteOption(
    homeworkId: string,
    questionId: string,
    optionId: string,
  ): Promise<void>;
  listAttachments(homeworkId: string): Promise<AssignmentAttachment[]>;
  createAttachment(
    homeworkId: string,
    payload: {
      fileId: string;
      title?: string;
      description?: string;
      sortOrder?: number;
    },
  ): Promise<AssignmentAttachment>;
  updateAttachment(
    homeworkId: string,
    attachmentId: string,
    payload: {
      title?: string;
      description?: string;
    },
  ): Promise<AssignmentAttachment>;
  reorderAttachment(
    homeworkId: string,
    attachmentId: string,
    order: number,
  ): Promise<AssignmentAttachment>;
  deleteAttachment(homeworkId: string, attachmentId: string): Promise<void>;
  listSubmissions(
    homeworkId: string,
    filters?: HomeworkSubmissionListFilters,
  ): Promise<HomeworkSubmissionsListResult>;
  getSubmission(
    homeworkId: string,
    submissionId: string,
  ): Promise<HomeworkSubmissionUiModel>;
  reviewSubmission(
    homeworkId: string,
    submissionId: string,
    payload: HomeworkSubmissionReviewRequest,
  ): Promise<HomeworkSubmissionUiModel>;
  listSubmissionAnswers(
    homeworkId: string,
    submissionId: string,
  ): Promise<HomeworkSubmissionAnswerUiModel[]>;
  getSubmissionAnswer(
    homeworkId: string,
    submissionId: string,
    answerId: string,
  ): Promise<HomeworkSubmissionAnswerUiModel>;
  reviewSubmissionAnswer(
    homeworkId: string,
    submissionId: string,
    answerId: string,
    payload: HomeworkAnswerReviewRequest,
  ): Promise<HomeworkSubmissionAnswerUiModel>;
  bulkReviewSubmissionAnswers(
    homeworkId: string,
    submissionId: string,
    payload: HomeworkBulkAnswerReviewRequest,
  ): Promise<HomeworkSubmissionAnswerUiModel[]>;
  listSubmissionAttachments(
    homeworkId: string,
    submissionId: string,
  ): Promise<HomeworkSubmissionAttachmentUiModel[]>;
  getGradeSyncStatus(
    homeworkId: string,
  ): Promise<HomeworkGradeSyncStatusUiModel>;
  linkGradeSync(
    homeworkId: string,
    gradeAssessmentId: string,
  ): Promise<HomeworkGradeSyncStatusUiModel>;
  syncHomeworkGrades(homeworkId: string): Promise<HomeworkGradeSyncStatusUiModel>;
  syncSubmissionGrade(
    homeworkId: string,
    submissionId: string,
  ): Promise<HomeworkGradeSyncStatusUiModel>;
}
