import type {
  AssessmentDeliveryMode,
  AssessmentType,
  ExamScopeType,
  LegacyAssessmentType,
} from "../../shared/types";

export type BackendGradeItemStatus = "entered" | "missing" | "absent";
export type BackendGradeItemStatusPayload = "ENTERED" | "MISSING" | "ABSENT";

export type BackendApprovalStatus = "draft" | "published" | "approved";
export type BackendApprovalStatusPayload = "DRAFT" | "PUBLISHED" | "APPROVED";

export type BackendAssessmentType = AssessmentType | LegacyAssessmentType;

export interface BackendNamedEntity {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  parentId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
}

export interface BackendGradesBootstrapResponse {
  academicYears?: BackendNamedEntity[];
  terms?: BackendNamedEntity[];
  stages?: BackendNamedEntity[];
  grades?: BackendNamedEntity[];
  sections?: BackendNamedEntity[];
  classrooms?: BackendNamedEntity[];
  subjects?: BackendNamedEntity[];
  defaults?: {
    academicYearId?: string | null;
    termId?: string | null;
  };
  supportedScopes?: ExamScopeType[];
  assessmentTypes?: BackendAssessmentType[];
  deliveryModes?: Array<AssessmentDeliveryMode | "question_based">;
  approvalStatuses?: BackendApprovalStatus[];
}

//Gradebook query types
export interface BackendGradebookQuery {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  subjectId?: string;
  scopeType?: ExamScopeType;
  scopeId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  search?: string;
  assessmentStatus?: BackendApprovalStatusPayload;
  includeVirtualMissing?: boolean;
}

//Backend Gradebook response types
export interface BackendGradebookColumn {
  id: string;
  assessmentId: string;
  subjectId?: string;
  subject?: BackendNamedEntity | null;

  scopeType?: ExamScopeType;
  scopeId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;

  title?: string;
  titleAr?: string;
  titleEn?: string;

  type?: BackendAssessmentType;
  deliveryMode?: AssessmentDeliveryMode | "question_based";

  date?: string;
  weight?: number;
  maxScore?: number;
  expectedTimeMinutes?: number | null;

  approvalStatus?: BackendApprovalStatus;
  isLocked?: boolean;
}

export interface BackendGradebookCell {
  assessmentId: string;
  itemId?: string | null;
  score?: number | null;
  status?: BackendGradeItemStatus | null;
  percent?: number | null;
  weightedContribution?: number | null;
  comment?: string | null;
  isVirtualMissing?: boolean;
}

export interface BackendGradebookStudent {
  id: string;
  firstName?: string;
  lastName?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string | null;
  admissionNo?: string | null;
}

export interface BackendGradebookRow {
  studentId: string;
  enrollmentId?: string;
  student?: BackendGradebookStudent | null;

  finalPercent?: number | null;

  completedWeight?: number | null;
  totalEnteredCount?: number;
  missingCount?: number;
  absentCount?: number;
  status?: string;

  cells?: BackendGradebookCell[];
}

export interface BackendGradebookSummary {
  studentCount?: number;
  assessmentCount?: number;
  averagePercent?: number | null;
  passingCount?: number;
  failingCount?: number;
  incompleteCount?: number;
}

export interface BackendGradebookResponse {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  subjectId?: string;
  scope?: unknown;
  rule?: {
    ruleId?: string | null;
    source?: string;
    passMark?: number;
    gradingScale?: string;
    rounding?: string;
  } | null;
  columns?: BackendGradebookColumn[];
  rows?: BackendGradebookRow[];
  summary?: BackendGradebookSummary;
}

//Grade item update types
export interface BackendUpdateGradeItemPayload {
  status: BackendGradeItemStatusPayload;
  score?: number | null;
  comment?: string | null;
}

export interface BackendBulkGradeItemPayload {
  items: Array<{
    studentId: string;
    status: BackendGradeItemStatusPayload;
    score?: number | null;
    comment?: string | null;
  }>;
}

//Assessment roster types
export interface BackendAssessmentRosterItem {
  id?: string | null;
  assessmentId: string;
  studentId: string;
  student?: {
    id: string;
    fullName?: string;
    nameEn?: string;
    nameAr?: string | null;
    code?: string | null;
    admissionNo?: string | null;
  } | null;
  enrollmentId?: string | null;
  score?: number | null;
  status?: BackendGradeItemStatus | null;
  comment?: string | null;
  isVirtualMissing?: boolean;
}

// Assessment list response (GET /grades/assessments)
export interface BackendAssessmentResponse {
  id: string;
  academicYearId?: string;
  termId?: string;
  subjectId?: string;
  subject?: BackendNamedEntity | null;

  scopeType?: ExamScopeType;
  scopeKey?: string;
  scopeId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;

  title?: string;
  titleAr?: string;
  titleEn?: string;

  type?: BackendAssessmentType;
  deliveryMode?: AssessmentDeliveryMode | "question_based";

  date?: string;
  weight?: number;
  maxScore?: number;
  expectedTimeMinutes?: number | null;

  approvalStatus?: BackendApprovalStatus;
  isLocked?: boolean;
}

export interface BackendAssessmentsListResponse {
  items: BackendAssessmentResponse[];
}

export interface BackendAssessmentItemsListResponse {
  items: BackendAssessmentRosterItem[];
}

// Grade rule response (GET /grades/rules/effective)
export interface BackendGradeRuleResponse {
  id?: string | null;
  ruleId?: string | null;
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  scopeType?: string;
  scopeKey?: string;
  scopeId?: string;
  gradeId?: string | null;
  gradingScale?: string;
  passMark?: number;
  rounding?: string;
  source?: "DEFAULT" | "SCHOOL" | "GRADE" | "STAGE";
  createdAt?: string;
  updatedAt?: string;
  resolvedFrom?: {
    requestedScopeType: string;
    requestedScopeKey: string;
    stageId: string | null;
    gradeId: string | null;
    sectionId: string | null;
    classroomId: string | null;
  };
}

export interface BackendGradeRulesListResponse {
  items: BackendGradeRuleResponse[];
}

export interface BackendGradesOverviewResponse {
  academicYearId: string;
  yearId: string;
  termId: string;
  subjectId: string | null;
  scope: { scopeType: string; scopeId: string; label: string };
  totals: {
    studentCount: number;
    assessmentCount: number;
    completedAssessmentCount?: number;
    publishedAssessmentCount?: number;
    approvedAssessmentCount?: number;
    lockedAssessmentCount?: number;
  };
  performance: {
    averagePercent: number | null;
    highestPercent: number | null;
    lowestPercent: number | null;
    passingCount?: number;
    failingCount?: number;
    incompleteCount?: number;
  };
  completion: {
    enteredCount: number;
    missingCount: number;
    absentCount: number;
    completedWeightAverage: number | null;
  };
  assessments: Array<{
    assessmentId: string;
    title: string | null;
    averagePercent: number | null;
    date: string;
  }>;
  rule: { source: string; passMark: number; rounding: string } | null;
  emptyState: { reason: string; message: string } | null;
}

// Submission flow types
export type BackendSubmissionStatus = "in_progress" | "submitted" | "corrected";

export interface BackendSubmissionResolveResponse {
  id: string;
  assessmentId: string;
  studentId: string;
  status?: string;
  submittedAt?: string;
  totalScore?: number | null;
  maxScore?: number;
}

export interface BackendSubmissionAnswerResponse {
  id: string;
  questionId: string;
  type: string;
  answerText: string | null;
  answerJson: unknown;
  awardedPoints: number | null;
  maxPoints: number | null;
  correctionStatus: string;
  reviewerComment: string | null;
  selectedOptions: Array<{
    optionId: string;
    label: string;
    labelAr: string | null;
    value: string | null;
  }>;
  reviewerCommentAr: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSubmissionProgressResponse {
  totalQuestions: number;
  answeredCount: number;
  requiredAnsweredCount: number;
  requiredQuestionCount: number;
  pendingCorrectionCount: number;
}

export interface BackendSubmissionStudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  nameAr: string | null;
  nameEn: string;
  code: string | null;
  admissionNo: string | null;
}

export interface BackendSubmissionEnrollmentResponse {
  id: string;
  classroomId: string;
  sectionId: string | null;
  gradeId: string | null;
  classroomName: string | null;
  sectionName: string | null;
  gradeName: string | null;
}

export interface BackendSubmissionListRowResponse {
  id: string;
  assessmentId: string;
  studentId: string;
  enrollmentId: string;
  status: BackendSubmissionStatus;
  startedAt: string;
  submittedAt: string | null;
  student: BackendSubmissionStudentResponse | null;
  enrollment: BackendSubmissionEnrollmentResponse | null;
  progress: BackendSubmissionProgressResponse;
}

export interface BackendSubmissionsListResponse {
  items: BackendSubmissionListRowResponse[];
}

export interface BackendSubmissionAssessmentResponse {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  deliveryMode: AssessmentDeliveryMode | "question_based";
  approvalStatus: BackendApprovalStatus;
  maxScore: number | null;
}

export interface BackendSubmissionQuestionResponse {
  id: string;
  type: string;
  prompt: string;
  promptAr: string | null;
  points: number;
  sortOrder: number;
  required: boolean;
  answer: BackendSubmissionAnswerResponse | null;
}

export interface BackendSubmissionDetailResponse {
  id: string;
  termId: string;
  assessmentId: string;
  studentId: string;
  enrollmentId: string;
  status: BackendSubmissionStatus;
  startedAt: string;
  submittedAt: string | null;
  correctedAt: string | null;
  reviewedById: string | null;
  totalScore: number | null;
  maxScore: number | null;
  assessment: BackendSubmissionAssessmentResponse | null;
  student: BackendSubmissionStudentResponse | null;
  enrollment: BackendSubmissionEnrollmentResponse | null;
  progress: BackendSubmissionProgressResponse;
  answers: BackendSubmissionAnswerResponse[];
  questions: BackendSubmissionQuestionResponse[];
}

export interface BackendSubmissionGradeItemSyncResponse {
  submission: { id: string; status: string; totalScore: number | null; maxScore: number | null };
  gradeItem: { id: string; status: string; score: number | null };
  synced: boolean;
  idempotent: boolean;
}

export interface BackendSubmissionReviewPayload {
  reviews: Array<{
    answerId: string;
    awardedPoints: number;
    reviewerComment?: string | null;
  }>;
}

// Assessment questions types (GET /grades/assessments/:id/questions)
export interface BackendAssessmentQuestionResponse {
  id: string;
  assessmentId: string;
  assignmentId?: string;
  promptAr?: string | null;
  prompt?: string;
  explanation?: string | null;
  explanationAr?: string | null;
  type?: string;
  points?: number;
  sortOrder?: number;
  required?: boolean;
  answerKey?: unknown;
  metadata?: Record<string, unknown> | null;
  options?: Array<{
    id: string;
    labelAr?: string | null;
    label?: string;
    value?: string | null;
    isCorrect?: boolean;
    sortOrder?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendAssessmentQuestionsListResponse {
  assessmentId: string;
  totalQuestions: number;
  totalPoints: number;
  pointsMatchMaxScore: boolean;
  questions: BackendAssessmentQuestionResponse[];
}
