export type ReinforcementSource = "teacher" | "parent" | "system";

export type ReinforcementRewardType = "xp" | "badge" | "moral" | "financial";

export type ReinforcementProofType = "none" | "image" | "video" | "document";

export type ReinforcementTargetScope =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "student";

export type ReinforcementTaskStatus =
  | "not_completed"
  | "in_progress"
  | "under_review"
  | "completed"
  | "cancelled";

export interface ReinforcementListResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ReinforcementLocalizedFields {
  titleEn?: string;
  titleAr?: string;
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface ReinforcementReward {
  type: ReinforcementRewardType | null;
  value?: number | string | null;
  labelEn?: string | null;
  labelAr?: string | null;
}

export interface CreateReinforcementReward {
  type: ReinforcementRewardType;
  value?: number | string;
  labelEn?: string;
  labelAr?: string;
}

export interface ReinforcementStagePayload {
  sortOrder: number;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  proofType: ReinforcementProofType;
  requiresApproval?: boolean;
}

export interface ReinforcementStage extends ReinforcementStagePayload {
  id?: string;
  isCompleted?: boolean;
  isApproved?: boolean;
  submittedAt?: string;
  proofUrl?: string;
  [key: string]: unknown;
}

export interface ReinforcementTemplate {
  id: string;
  nameEn: string | null;
  nameAr: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  source: ReinforcementSource;
  reward: ReinforcementReward;
  stages: ReinforcementTemplateStage[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ReinforcementTemplateStage {
  id?: string;
  sortOrder: number;
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  proofType: ReinforcementProofType | string;
  requiresApproval: boolean;
  [key: string]: unknown;
}

export interface ListReinforcementTemplatesParams {
  search?: string;
  source?: ReinforcementSource;
  includeDeleted?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateReinforcementTemplatePayload {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  reward: CreateReinforcementReward;
  stages: ReinforcementStagePayload[];
}

export interface CreateReinforcementTemplateRequest {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType?: ReinforcementRewardType;
  rewardValue?: number;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  stages: ReinforcementStagePayload[];
}

export type ListReinforcementTemplatesResponse =
  ReinforcementListResponse<ReinforcementTemplate>;

export interface ReinforcementTargetPayload {
  scopeType: ReinforcementTargetScope;
  scopeId: string;
}

export interface ReinforcementTaskTarget {
  id: string;
  scopeType: ReinforcementTargetScope;
  scopeKey: string;
  stageId: string | null;
  gradeId: string | null;
  sectionId: string | null;
  classroomId: string | null;
  studentId: string | null;
  [key: string]: unknown;
}

export interface ReinforcementTaskReward {
  type: ReinforcementRewardType | null;
  value: number | null;
  labelEn: string | null;
  labelAr: string | null;
}

export interface ReinforcementAssignmentSummary {
  total?: number;
  completed?: number;
  inProgress?: number;
  underReview?: number;
  notCompleted?: number;
  cancelled?: number;
  [key: string]: unknown;
}

export interface ReinforcementTask {
  id: string;
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  reward: ReinforcementTaskReward;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
  status: ReinforcementTaskStatus;
  targets?: ReinforcementTaskTarget[];
  stages?: ReinforcementStage[];
  assignmentSummary?: ReinforcementAssignmentSummary;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ListReinforcementTasksParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  subjectId?: string;
  studentId?: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  stageId?: string;
  status?: ReinforcementTaskStatus;
  source?: string;
  targetScope?: ReinforcementTargetScope | string;
  scope?: ReinforcementTargetScope | string;
  targetId?: string;
  dueFrom?: string;
  dueTo?: string;
  dueDate?: string;
  includeCancelled?: boolean;
  search?: string;
  page?: number;
  offset?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateReinforcementTaskPayload {
  academicYearId?: string;
  termId: string;
  subjectId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue?: number | null;
  rewardLabelEn?: string;
  rewardLabelAr?: string;
  dueDate: string;
  targets: ReinforcementTargetPayload[];
  stages: ReinforcementStagePayload[];
}

export interface DuplicateReinforcementTaskPayload {
  titleEn?: string;
  titleAr?: string;
  dueDate?: string;
}

export interface CancelReinforcementTaskPayload {
  reason?: string;
}

export type ListReinforcementTasksResponse =
  ReinforcementListResponse<ReinforcementTask>;

export interface ReinforcementFilterOptionsParams {
  academicYearId?: string;
  termId?: string;
  subjectId?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ReinforcementScopeOption {
  value: string;
  scopeType: ReinforcementTargetScope;
  nameEn?: string;
  nameAr?: string;
  audienceCount?: number;
  [key: string]: unknown;
}

export interface ReinforcementFilterOptions {
  academicYears?: unknown[];
  terms?: unknown[];
  subjects?: unknown[];
  students?: unknown[];
  classrooms?: unknown[];
  stages?: unknown[];
  grades?: unknown[];
  sections?: unknown[];
  sources?: unknown[];
  statuses?: unknown[];
  tasks?: unknown[];
  scopeTargets?: Partial<
    Record<ReinforcementTargetScope, ReinforcementScopeOption[]>
  >;
  [key: string]: unknown;
}

export interface ReinforcementNamedOption {
  id: string;
  value?: string;
  studentId?: string;
  name?: string;
  nameEn?: string;
  nameAr?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export type XpPolicyScopeType = ReinforcementTargetScope;

export interface XpPolicy {
  id: string | null;
  academicYearId: string;
  termId: string;
  scopeType: XpPolicyScopeType;
  scopeKey: string;
  dailyCap: number | null;
  weeklyCap: number | null;
  cooldownMinutes: number | null;
  allowedReasons: string[];
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListXpPoliciesParams {
  academicYearId?: string;
  termId?: string;
  scopeType?: XpPolicyScopeType;
  scopeKey?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  page?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface GetEffectiveXpPolicyParams {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  studentId?: string;
  scopeType?: XpPolicyScopeType;
  scopeId?: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  stageId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateXpPolicyPayload {
  academicYearId?: string;
  termId: string;
  scopeType: XpPolicyScopeType;
  scopeId?: string;
  dailyCap?: number | null;
  weeklyCap?: number | null;
  cooldownMinutes?: number | null;
  allowedReasons?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

export type PatchXpPolicyPayload = Partial<CreateXpPolicyPayload>;

export type ListXpPoliciesResponse = ReinforcementListResponse<XpPolicy>;

export interface ManualXpGrantPayload {
  academicYearId?: string;
  termId: string;
  studentId: string;
  enrollmentId?: string | null;
  amount: number;
  reason: string;
  reasonAr?: string;
  sourceId?: string;
  dedupeKey?: string;
}

export interface XpLedgerEntry {
  id: string;
  academicYearId: string;
  termId: string;
  studentId: string;
  enrollmentId: string | null;
  assignmentId: string | null;
  policyId: string | null;
  sourceType: XpSourceType;
  sourceId: string;
  amount: number;
  reason: string | null;
  reasonAr: string | null;
  actorUserId: string | null;
  occurredAt: string;
  student: XpLedgerStudent | null;
  createdAt: string;
}

export type XpSourceType =
  | "reinforcement_task"
  | "hero_mission"
  | "manual_bonus"
  | "behavior"
  | "grade"
  | "attendance"
  | "system";

export interface XpLedgerStudent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  enrollmentId: string | null;
  classroomId: string | null;
  classroomName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  stageId: string | null;
  stageName: string | null;
}

export interface ListXpLedgerParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  studentId?: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  stageId?: string;
  sourceType?: XpSourceType;
  sourceId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export type ListXpLedgerResponse = ReinforcementListResponse<XpLedgerEntry>;

export interface GetXpSummaryParams {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  studentId?: string;
  scopeType?: XpPolicyScopeType;
  scopeId?: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  stageId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface XpSummary {
  academicYearId: string;
  termId: string;
  scope: {
    scopeType: XpPolicyScopeType;
    scopeKey: string;
    stageId: string | null;
    gradeId: string | null;
    sectionId: string | null;
    classroomId: string | null;
    studentId: string | null;
  };
  totalXp: number;
  studentsCount: number;
  averageXp: number;
  bySourceType: Array<{
    sourceType: XpSourceType;
    amount: number;
  }>;
  topStudents: Array<{
    studentId: string;
    studentName: string | null;
    totalXp: number;
  }>;
}

export type ManualXpGrantResponse = XpLedgerEntry;

export interface ReinforcementOverviewParams {
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OverviewScope {
  academicYearId?: string | null;
  yearId?: string | null;
  termId?: string | null;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;
  studentId?: string | null;
  source?: string | null;
}

export interface OverviewTasksBySource {
  source: string;
  count: number;
}

export interface OverviewTasksByStatus {
  status: string;
  count: number;
}

export interface OverviewTasks {
  total: number;
  active: number;
  cancelled: number;
  bySource: OverviewTasksBySource[];
  byStatus: OverviewTasksByStatus[];
}

export interface OverviewAssignments {
  total: number;
  notCompleted: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface OverviewReviewQueue {
  submitted: number;
  approved: number;
  rejected: number;
  pendingReview: number;
}

export interface OverviewXpBySourceType {
  sourceType?: string;
  count: number;
  totalXp: number;
}

export interface OverviewXp {
  totalXp: number;
  studentsWithXp: number;
  averageXp: number;
  bySourceType: OverviewXpBySourceType[];
}

export interface OverviewStudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  admissionNo?: string | null;
}

export interface OverviewTopStudent {
  studentId: string;
  student: OverviewStudentInfo;
  totalXp: number;
  completedAssignments: number;
  completionRate: number;
}

export interface OverviewRecentActivity {
  id: string;
  type: "submission" | "review" | "xp_ledger";
  timestamp: string;
  student: OverviewStudentInfo;
  sourceType?: string;
  sourceId?: string;
  amount?: number;
  reason?: string | null;
}

export interface ReinforcementOverviewResponse {
  scope: OverviewScope;
  tasks: OverviewTasks;
  assignments: OverviewAssignments;
  reviewQueue: OverviewReviewQueue;
  xp: OverviewXp;
  topStudents: OverviewTopStudent[];
  recentActivity: OverviewRecentActivity[];
}

export interface StudentReinforcementProgressParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ReinforcementAssignmentStatusSummary {
  total: number;
  notCompleted: number;
  inProgress: number;
  underReview: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface ReinforcementReviewStatusSummary {
  submitted: number;
  approved: number;
  rejected: number;
  pendingReview: number;
}

export interface ReinforcementCompactTask {
  id: string;
  academicYearId: string;
  termId: string;
  subjectId: string | null;
  titleEn: string;
  titleAr: string;
  source: ReinforcementSource;
  status: ReinforcementTaskStatus;
  dueDate: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReinforcementTaskRow {
  taskId: string;
  assignmentId: string;
  status: ReinforcementTaskStatus;
  progress: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  task: ReinforcementCompactTask;
}

export interface ReinforcementProgressStudent {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  nameAr: string | null;
  code: string | null;
  admissionNo: string | null;
}

export interface ReinforcementProgressEnrollment {
  enrollmentId: string;
  classroomId: string;
  sectionId: string;
  gradeId: string;
  stageId: string;
}

export interface ReinforcementXpSourceSummary {
  sourceType: string;
  count: number;
  totalXp: number;
}

export interface ReinforcementProgressXp {
  totalXp: number;
  bySourceType: ReinforcementXpSourceSummary[];
  recentLedgerEntries: ReinforcementRecentXpLedgerEntry[];
}

export interface ReinforcementRecentXpLedgerEntry {
  id: string;
  academicYearId: string;
  termId: string;
  studentId: string;
  enrollmentId: string;
  assignmentId: string | null;
  policyId: string | null;
  sourceType: string;
  sourceId: string | null;
  amount: number;
  reason: string | null;
  reasonAr: string | null;
  actorUserId: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface ReinforcementRecentReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  taskId: string;
  stageId: string;
  outcome: string;
  note: string | null;
  noteAr: string | null;
  reviewedById: string;
  reviewedAt: string;
}

export interface StudentReinforcementProgress {
  student: ReinforcementProgressStudent;
  enrollment: ReinforcementProgressEnrollment | null;
  assignments: ReinforcementAssignmentStatusSummary;
  tasks: StudentReinforcementTaskRow[];
  submissions: ReinforcementReviewStatusSummary;
  xp: ReinforcementProgressXp;
  recentReviews: ReinforcementRecentReview[];
}

export interface ClassroomReinforcementSummaryParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ReinforcementClassroomInfo {
  classroomId: string;
  classroomName: string;
  sectionId: string;
  sectionName: string;
  gradeId: string;
  gradeName: string;
  stageId: string;
  stageName: string;
}

export interface ReinforcementClassroomStudent {
  studentId: string;
  name: string;
  totalXp: number;
  assignmentsTotal: number;
  assignmentsCompleted: number;
  completionRate: number;
  pendingReviews: number;
}

export interface ClassroomReinforcementSummary {
  classroom: ReinforcementClassroomInfo;
  studentsCount: number;
  assignments: ReinforcementAssignmentStatusSummary;
  reviewQueue: ReinforcementReviewStatusSummary;
  xp: OverviewXp;
  topStudents: OverviewTopStudent[];
  students: ReinforcementClassroomStudent[];
}

// ─── Review Types ────────────────────────────────────────────────────────────

export type ReinforcementReviewStatus = "submitted" | "approved" | "rejected";

export interface SubmitReinforcementStagePayload {
  proofText?: string;
  proofFileId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListReinforcementReviewQueueParams {
  academicYearId?: string;
  termId?: string;
  status?: string;
  source?: string;
  taskId?: string;
  studentId?: string;
  classroomId?: string;
  sectionId?: string;
  gradeId?: string;
  stageId?: string;
  search?: string;
  submittedFrom?: string;
  submittedTo?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface ReviewReinforcementSubmissionPayload {
  note?: string;
  noteAr?: string;
}

export interface ReinforcementReviewTask {
  id?: string;
  titleEn?: string | null;
  titleAr?: string | null;
  source?: string | null;
  status?: string | null;
  dueDate?: string | null;
  [key: string]: unknown;
}

export interface ReinforcementReviewStage {
  id?: string;
  titleEn?: string | null;
  titleAr?: string | null;
  proofType?: string | null;
  requiresApproval?: boolean;
  [key: string]: unknown;
}

export interface ReinforcementReviewStudent {
  id?: string;
  name?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  code?: string | null;
  admissionNo?: string | null;
  [key: string]: unknown;
}

export interface ReinforcementReviewProof {
  proofText?: string | null;
  proofFileId?: string | null;
  [key: string]: unknown;
}

export interface ReinforcementReviewHistoryEntry {
  id?: string;
  status?: ReinforcementReviewStatus;
  outcome?: ReinforcementReviewStatus;
  note?: string | null;
  noteAr?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  [key: string]: unknown;
}

export interface ReinforcementReviewItem {
  id: string;
  assignmentId: string;
  taskId: string;
  stageId: string;
  studentId: string;
  enrollmentId: string;
  status: ReinforcementReviewStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  task: ReinforcementReviewTask;
  stage: ReinforcementReviewStage;
  student: ReinforcementReviewStudent;
  assignment: Record<string, unknown>;
  proof: ReinforcementReviewProof;
  currentReview?: Record<string, unknown> | null;
  reviewHistory?: ReinforcementReviewHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type ReinforcementReviewQueueResponse =
  ReinforcementListResponse<ReinforcementReviewItem>;

export interface GrantXpForReviewPayload {
  amount?: number;
  reason?: string;
  reasonAr?: string;
}

// ─── Reward Types ────────────────────────────────────────────────────────────

export type RewardCatalogStatus = "draft" | "published" | "archived";

export type RewardItemType =
  | "physical"
  | "digital"
  | "privilege"
  | "certificate"
  | "other";

export type RedemptionStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "fulfilled"
  | "cancelled";

export type RedemptionRequestSource =
  | "dashboard"
  | "teacher"
  | "student_app"
  | "parent_app"
  | "system";

export interface RewardCatalogAcademicYearSummary {
  id: string;
  nameEn?: string | null;
  nameAr?: string | null;
  isActive?: boolean;
}

export interface RewardCatalogTermSummary {
  id: string;
  academicYearId: string;
  nameEn?: string | null;
  nameAr?: string | null;
  isActive?: boolean;
}

export interface RewardCatalogImageFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export interface RewardCatalogItem {
  id: string;
  academicYearId?: string | null;
  termId?: string | null;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: RewardItemType;
  status?: RewardCatalogStatus;
  minTotalXp?: number;
  stockQuantity?: number;
  stockRemaining?: number;
  isUnlimited?: boolean;
  isAvailable?: boolean;
  isLowStock?: boolean;
  redemptions?: Partial<Record<RedemptionStatus | "open" | "terminal" | "total", number>>;
  imageFileId?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  publishedById?: string | null;
  archivedById?: string | null;
  createdById?: string | null;
  academicYear?: RewardCatalogAcademicYearSummary | null;
  term?: RewardCatalogTermSummary | null;
  imageFile?: RewardCatalogImageFile | null;
  [key: string]: unknown;
}

export interface CreateRewardCatalogItemPayload {
  academicYearId?: string | null;
  termId?: string | null;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: RewardItemType;
  minTotalXp?: number;
  stockQuantity?: number;
  stockRemaining?: number;
  isUnlimited?: boolean;
  imageFileId?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRewardCatalogItemPayload {
  academicYearId?: string | null;
  termId?: string | null;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: RewardItemType;
  minTotalXp?: number;
  stockQuantity?: number;
  stockRemaining?: number;
  isUnlimited?: boolean;
  imageFileId?: string | null;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface ArchiveRewardCatalogItemPayload {
  reason?: string;
}

export interface ListRewardCatalogParams {
  academicYearId?: string;
  termId?: string;
  status?: RewardCatalogStatus;
  type?: RewardItemType;
  search?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  onlyAvailable?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface RewardRedemption {
  [key: string]: unknown;
  id: string;
  catalogItemId: string;
  studentId: string;
  enrollmentId: string;
  academicYearId: string;
  termId: string;
  status: RedemptionStatus;
  requestSource: RedemptionRequestSource;
  requestedById: string;
  reviewedById: string | null;
  fulfilledById: string | null;
  cancelledById: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  requestNoteEn: string | null;
  requestNoteAr: string | null;
  reviewNoteEn: string | null;
  reviewNoteAr: string | null;
  fulfillmentNoteEn: string | null;
  fulfillmentNoteAr: string | null;
  cancellationReasonEn: string | null;
  cancellationReasonAr: string | null;
  eligibilitySnapshot: RewardRedemptionEligibilitySnapshot;
  catalogItem: RewardRedemptionCatalogItem;
  student: RewardRedemptionStudent;
  enrollment: RewardRedemptionEnrollment;
  academicYear: RewardCatalogAcademicYearSummary;
  term: RewardCatalogTermSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemptionEligibilitySnapshot {
  eligible: boolean;
  minTotalXp: number;
  isUnlimited: boolean;
  totalEarnedXp: number;
  stockAvailable: boolean;
  stockRemaining: number | null;
  catalogItemStatus: RewardCatalogStatus;
}

export interface RewardRedemptionCatalogItem {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  type: RewardItemType;
  status: RewardCatalogStatus;
  minTotalXp: number;
  isUnlimited: boolean;
  stockRemaining: number | null;
  imageFileId: string | null;
}

export interface RewardRedemptionStudent {
  id: string;
  firstName: string;
  lastName: string;
  nameAr: string | null;
  code: string | null;
  admissionNo: string | null;
}

export interface RewardRedemptionEnrollment {
  id: string;
  academicYearId: string;
  termId: string;
  classroomId: string | null;
  sectionId: string | null;
  gradeId: string | null;
  stageId: string | null;
}

export interface CreateRewardRedemptionPayload {
  catalogItemId: string;
  studentId: string;
  enrollmentId?: string;
  academicYearId?: string;
  termId?: string;
  requestSource?: RedemptionRequestSource;
  requestNoteEn?: string;
  requestNoteAr?: string;
}

export interface CancelRewardRedemptionPayload {
  cancellationReasonEn?: string;
  cancellationReasonAr?: string;
}

export interface ApproveRewardRedemptionPayload {
  reviewNoteEn?: string;
  reviewNoteAr?: string;
}

export interface RejectRewardRedemptionPayload {
  reviewNoteEn?: string;
  reviewNoteAr?: string;
}

export interface FulfillRewardRedemptionPayload {
  fulfillmentNoteEn?: string;
  fulfillmentNoteAr?: string;
}

export interface ListRewardRedemptionsParams {
  academicYearId?: string;
  termId?: string;
  status?: RedemptionStatus;
  studentId?: string;
  catalogItemId?: string;
  requestSource?: RedemptionRequestSource;
  includeTerminal?: boolean;
  search?: string;
  requestedFrom?: string;
  requestedTo?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface RewardsOverviewParams {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  status?: RedemptionStatus;
  type?: RewardItemType;
  dateFrom?: string;
  dateTo?: string;
  includeArchived?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface StudentRewardsSummaryParams {
  academicYearId?: string;
  termId?: string;
  includeCatalogEligibility?: boolean;
  includeHistory?: boolean;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface RewardCatalogSummaryParams {
  academicYearId?: string;
  termId?: string;
  status?: RewardCatalogStatus;
  type?: RewardItemType;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  onlyAvailable?: boolean;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}
