export type AssessmentType =
  | "QUIZ"
  | "MONTH_EXAM"
  | "MIDTERM"
  | "TERM_EXAM"
  | "ASSIGNMENT"
  | "FINAL"
  | "PRACTICAL";

export type LegacyAssessmentType = never;

export type ExamScopeType =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom";

export type AssessmentDeliveryMode = "SCORE_ONLY" | "QUESTION_BASED";

export type GradeItemStatus = "entered" | "missing" | "absent";
export type AssessmentSubmissionStatus =
  | "not_started"
  | "submitted"
  | "in_progress"
  | "corrected";
export type AssessmentCorrectionStatus = "pending" | "corrected";

export interface Assessment {
  id: string;
  academicYearId?: string;
  termId: string;
  subjectId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  scopeKey?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  title: string;
  titleAr: string;
  type: AssessmentType | LegacyAssessmentType;
  deliveryMode: AssessmentDeliveryMode;
  date: string;
  weight: number;
  maxScore: number;
  expectedTimeMinutes?: number;
  isLocked: boolean;
  approvalStatus: "draft" | "published" | "approved";
}

export interface GradeItem {
  id: string;
  termId: string;
  assessmentId: string;
  studentId: string;
  score: number | null;
  comment?: string;
  status: GradeItemStatus;
}

export interface GradeRule {
  id: string;
  scopeType: ExamScopeType;
  scopeId: string;
  gradingScale: "percentage";
  passMark: number;
  rounding: "none" | "decimal_0" | "decimal_1" | "decimal_2";
}

export interface Rubric {
  id: string;
  assessmentId: string;
  criteria: Array<{
    id: string;
    label: string;
    points: number;
  }>;
}

export interface ReportCardSummary {
  studentId: string;
  average: number;
  status: "pass" | "fail";
  totalAssessments: number;
}

export interface GradebookStudentRow {
  studentId: string;
  enrollmentId?: string;
  studentNameEn: string;
  studentNameAr: string;
  studentCode?: string | null;
  admissionNo?: string | null;
  classroomName?: string;
  status?: string;
  scoresByAssessmentId: Record<string, number | null>;
  statusByAssessmentId: Record<string, GradeItemStatus>;
  average: number;
  completedItems: number;
  totalItems: number;
}

export interface AssessmentTrendPoint {
  assessmentId: string;
  label: string;
  date: string;
  average: number;
  weight: number;
  enteredCount: number;
  maxScore: number;
}

export interface GradesPageSummary {
  totalStudents: number;
  totalAssessments: number;
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  completionRate: number;
}

export interface GradebookResponse {
  assessments: Assessment[];
  rows: GradebookStudentRow[];
  summary: GradesPageSummary;
  trend: AssessmentTrendPoint[];
}

export interface CreateAssessmentPayload {
  termId: string;
  subjectId: string;
  scopeType: ExamScopeType;
  scopeId: string;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;
  title: string;
  titleAr: string;
  type: AssessmentType;
  deliveryMode: AssessmentDeliveryMode;
  date: string;
  weight: number;
  maxScore: number;
  expectedTimeMinutes?: number;
}

export interface GradesScopeFilters {
  scopeType?: ExamScopeType;
  scopeId?: string;
  subjectId?: string;
  includeDrafts?: boolean;
  deliveryMode?: AssessmentDeliveryMode;
}

export interface ScopeOption {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
}

export interface ScopeEntityOption extends ScopeOption {
  scopeType: ExamScopeType;
  parentId?: string;
}

export interface GradesFiltersData {
  scopeTypes: ExamScopeType[];
  scopeEntities: Record<ExamScopeType, ScopeEntityOption[]>;
  stages: ScopeEntityOption[];
  grades: ScopeEntityOption[];
  sections: ScopeEntityOption[];
  classrooms: ScopeEntityOption[];
  subjects: ScopeOption[];
}

export interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  value?: string;
  isCorrect: boolean;
  order: number;
}

export interface MatchingPair {
  id: string;
  promptAr: string;
  promptEn: string;
  matchAr: string;
  matchEn: string;
  order: number;
}

export interface AssessmentQuestion extends Record<string, unknown> {
  id: string;
  assessmentId: string;
  assignmentId: string;
  questionTextAr: string;
  questionTextEn: string;
  questionType:
    | "MCQ_SINGLE"
    | "MCQ_MULTI"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_IN_BLANK"
    | "MATCHING"
    | "MEDIA";
  points: number;
  order: number;
  options?: QuestionOption[];
  correctAnswer?: boolean;
  sampleAnswerAr?: string;
  sampleAnswerEn?: string;
  acceptedAnswersAr?: string[];
  acceptedAnswersEn?: string[];
  matchingPairs?: MatchingPair[];
  mediaMode?: "FILE" | "LINK";
  mediaTitle?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  explanation?: string;
  explanationAr?: string;
  required?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentSubmission {
  id: string;
  termId: string;
  assessmentId: string;
  studentId: string;
  status: AssessmentSubmissionStatus;
  submittedAt?: string;
  totalScore: number | null;
  maxScore: number;
}

export interface AssessmentQuestionAnswer {
  id: string;
  submissionId: string;
  assessmentId: string;
  questionId: string;
  studentId: string;
  selectedOptionIds?: string[];
  booleanAnswer?: boolean;
  answerText?: string;
  awardedPoints: number | null;
  correctionStatus: AssessmentCorrectionStatus;
  teacherComment?: string;
}

export interface AssessmentSubmissionQuestionReview {
  question: AssessmentQuestion;
  answer: AssessmentQuestionAnswer | null;
}

export interface AssessmentSubmissionReview {
  submission: AssessmentSubmission;
  assessment: Assessment;
  studentNameEn: string;
  studentNameAr: string;
  questions: AssessmentSubmissionQuestionReview[];
}

export interface UpdateGradeItemPayload {
  assessmentId: string;
  studentId: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface BulkGradeItemPayload {
  studentId: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface AssessmentRosterItem {
  studentId: string;
  studentNameEn: string;
  studentNameAr: string;
  classroomName?: string;
  score: number | null;
  status: GradeItemStatus;
  comment?: string;
}

export interface StudentSubjectGradeSummary {
  subjectId: string;
  subjectName: string;
  subjectNameAr?: string | null;
  subjectNameEn?: string | null;
  average: number | null;
  lastAssessmentScore: number | null;
  assessmentsCount: number;
  assessmentCount?: number;
  enteredCount?: number;
  missingCount?: number;
  absentCount?: number;
  completedWeight?: number;
  status?: string;
  trend: "up" | "down" | "stable";
}

export interface StudentGradesSnapshot {
  studentId: string;
  academicYearId?: string;
  termId?: string;
  rule?: BackendStudentGradeSnapshot["rule"];
  status?: string;
  completedWeight?: number;
  subjectRows: StudentSubjectGradeSummary[];
  assessments?: BackendStudentGradeSnapshotAssessment[];
  currentAverage: number | null;
  highestAverage: number;
  lowestAverage: number;
  totalAssessments: number;
  performanceTrend: Array<{
    label: string;
    average: number;
  }>;
}

export interface BackendStudentGradeSnapshotSubject {
  subjectId: string;
  subjectName: string;
  subjectNameAr: string | null;
  subjectNameEn: string | null;
  finalPercent: number | null;
  completedWeight: number;
  assessmentCount: number;
  enteredCount: number;
  missingCount: number;
  absentCount: number;
  status: string;
}

export interface BackendStudentGradeSnapshotAssessment {
  assessmentId: string;
  subjectId: string;
  title: string | null;
  titleEn: string | null;
  titleAr: string | null;
  type: string;
  date: string;
  weight: number;
  maxScore: number;
  itemId: string | null;
  score: number | null;
  percent: number | null;
  weightedContribution: number | null;
  status: string;
  comment: string | null;
  isVirtualMissing: boolean;
}

export interface BackendStudentGradeSnapshot {
  studentId: string;
  enrollmentId: string;
  academicYearId: string;
  yearId: string;
  termId: string;
  subjectId: string | null;
  rule: {
    source: string;
    ruleId: string | null;
    passMark: number;
    rounding: string;
    gradingScale: string;
  };
  finalPercent: number | null;
  completedWeight: number;
  status: string;
  subjects: BackendStudentGradeSnapshotSubject[];
  assessments: BackendStudentGradeSnapshotAssessment[];
}

