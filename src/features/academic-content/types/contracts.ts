export const ACADEMIC_CONTENT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "EXPIRED",
  "ARCHIVED",
  "CANCELLED",
] as const;
export type AcademicContentStatus = (typeof ACADEMIC_CONTENT_STATUSES)[number];

export const ACADEMIC_CONTENT_APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "CHANGES_REQUESTED",
] as const;
export type AcademicContentApprovalStatus =
  (typeof ACADEMIC_CONTENT_APPROVAL_STATUSES)[number];

export const ACADEMIC_CONTENT_TYPES = [
  "TEACHER_PREPARATION",
  "WEEKLY_PLAN",
  "GUARDIAN_WEEKLY_NOTE",
  "SUBJECT_RESOURCE",
  "ONLINE_SESSION",
  "GENERAL_RESOURCE",
] as const;
export type AcademicContentType = (typeof ACADEMIC_CONTENT_TYPES)[number];

export const ACADEMIC_CONTENT_AUDIENCES = [
  "INTERNAL_STAFF",
  "STUDENTS",
  "GUARDIANS",
  "STUDENTS_AND_GUARDIANS",
] as const;
export type AcademicContentAudience = (typeof ACADEMIC_CONTENT_AUDIENCES)[number];

export type AcademicContentTargetScope =
  | "SCHOOL"
  | "STAGE"
  | "GRADE"
  | "SECTION"
  | "CLASSROOM";

export const ACADEMIC_GUARDIAN_NOTE_PRIORITIES = [
  "NORMAL",
  "IMPORTANT",
  "URGENT",
] as const;
export type AcademicGuardianNotePriority =
  (typeof ACADEMIC_GUARDIAN_NOTE_PRIORITIES)[number];

export const ACADEMIC_SUBJECT_RESOURCE_CATEGORIES = [
  "WORKSHEET",
  "PRESENTATION",
  "REFERENCE",
  "REVISION",
  "ACTIVITY",
  "EXAM_PREPARATION",
  "VIDEO",
  "DOCUMENT",
  "OTHER",
] as const;
export type AcademicSubjectResourceCategory =
  (typeof ACADEMIC_SUBJECT_RESOURCE_CATEGORIES)[number];

export const ACADEMIC_ONLINE_SESSION_PLATFORMS = [
  "GOOGLE_MEET",
  "ZOOM",
  "MICROSOFT_TEAMS",
  "WEBEX",
  "OTHER",
] as const;
export type AcademicOnlineSessionPlatform =
  (typeof ACADEMIC_ONLINE_SESSION_PLATFORMS)[number];

export type FileUploadSessionStatus =
  | "CREATED"
  | "UPLOADING"
  | "VERIFYING"
  | "READY"
  | "LEGACY"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "PURGED";

export interface CreateAcademicContentRequest {
  academicYearId: string;
  termId: string;
  type: AcademicContentType;
  audience: AcademicContentAudience;
  title: string;
  description?: string | null;
}

export interface UpdateAcademicContentRequest {
  title?: string;
  description?: string | null;
  audience?: AcademicContentAudience;
}

export interface ListAcademicContentQuery {
  page?: number;
  limit?: number;
  academicYearId?: string;
  termId?: string;
  type?: AcademicContentType;
  status?: AcademicContentStatus;
  audience?: AcademicContentAudience;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  teacherUserId?: string;
  resourceCategory?: AcademicSubjectResourceCategory;
  weeklyDateFrom?: string;
  weeklyDateTo?: string;
  sessionStartAtFrom?: string;
  sessionStartAtTo?: string;
  sessionPlatform?: AcademicOnlineSessionPlatform;
  guardianPriority?: AcademicGuardianNotePriority;
  tag?: string;
  search?: string;
}

export interface AcademicContentPaginationQuery {
  page?: number;
  limit?: number;
}

export interface AcademicContentTargetDraft {
  scopeType: AcademicContentTargetScope;
  stageId?: string | null;
  gradeId?: string | null;
  sectionId?: string | null;
  classroomId?: string | null;
  subjectId?: string | null;
  teacherSubjectAllocationId?: string | null;
}

export interface ReplaceAcademicContentTargetsRequest {
  targets: AcademicContentTargetDraft[];
}

export interface AcademicContentTarget {
  id: string;
  scopeType: AcademicContentTargetScope;
  stageId: string | null;
  gradeId: string | null;
  sectionId: string | null;
  classroomId: string | null;
  subjectId: string | null;
  teacherSubjectAllocationId: string | null;
}

export interface AcademicContentBase {
  id: string;
  academicYearId: string;
  termId: string;
  type: AcademicContentType;
  audience: AcademicContentAudience;
  title: string;
  description: string | null;
  status: AcademicContentStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicContentAsset {
  assetId: string;
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  sortOrder: number;
  createdAt: string;
}

export interface AcademicContentLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
}

export interface AcademicContentTag {
  id: string;
  value: string;
  sortOrder: number;
}

export interface AcademicContentLinkInput {
  label: string;
  url: string;
}

export interface AcademicContentTagInput {
  value: string;
}

export interface ReplaceAcademicContentLinksRequest {
  links: AcademicContentLinkInput[];
}

export interface ReplaceAcademicContentTagsRequest {
  tags: AcademicContentTagInput[];
}

export interface AcademicContentPreparationDetail {
  topic: string | null;
  objectives: string[];
  learningOutcomes: string[];
  teachingStrategies: string[];
  activities: string[];
  resourceNotes: string | null;
  assessmentNotes: string | null;
  teacherNotes: string | null;
  curriculumId: string | null;
  curriculumUnitId: string | null;
  curriculumLessonId: string | null;
  lessonPlanId: string | null;
  lessonPlanItemId: string | null;
  timetableEntryId: string | null;
}

export interface AcademicContentWeeklyPlanDetail {
  weekStartDate: string;
  weekEndDate: string;
  objectives: string[];
  topics: string[];
  expectedHomework: string | null;
  upcomingAssessments: string | null;
  notes: string | null;
  homeworkAssignmentIds: string[];
  gradeAssessmentIds: string[];
}

export interface AcademicContentGuardianNoteDetail {
  body: string;
  priority: AcademicGuardianNotePriority;
  requiresAcknowledgement: boolean;
}

export interface AcademicContentSubjectResourceDetail {
  resourceCategory: AcademicSubjectResourceCategory;
  curriculumId: string | null;
  curriculumUnitId: string | null;
  curriculumLessonId: string | null;
}

export interface AcademicContentOnlineSessionDetail {
  platform: AcademicOnlineSessionPlatform;
  providerName: string | null;
  joinUrl: string;
  accessCode: string | null;
  instructions: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  timetableEntryId: string | null;
}

export type ReplaceAcademicContentPreparationDetailRequest = Partial<
  Pick<
    AcademicContentPreparationDetail,
    | "topic"
    | "resourceNotes"
    | "assessmentNotes"
    | "teacherNotes"
    | "curriculumId"
    | "curriculumUnitId"
    | "curriculumLessonId"
    | "lessonPlanId"
    | "lessonPlanItemId"
    | "timetableEntryId"
  >
> &
  Pick<
    AcademicContentPreparationDetail,
    "objectives" | "learningOutcomes" | "teachingStrategies" | "activities"
  >;

export type ReplaceAcademicContentWeeklyPlanDetailRequest = Pick<
  AcademicContentWeeklyPlanDetail,
  | "weekStartDate"
  | "weekEndDate"
  | "objectives"
  | "topics"
  | "homeworkAssignmentIds"
  | "gradeAssessmentIds"
> &
  Partial<
    Pick<
      AcademicContentWeeklyPlanDetail,
      "expectedHomework" | "upcomingAssessments" | "notes"
    >
  >;

export type ReplaceAcademicContentGuardianNoteDetailRequest =
  AcademicContentGuardianNoteDetail;

export type ReplaceAcademicContentSubjectResourceDetailRequest = Pick<
  AcademicContentSubjectResourceDetail,
  "resourceCategory"
> &
  Partial<
    Pick<
      AcademicContentSubjectResourceDetail,
      "curriculumId" | "curriculumUnitId" | "curriculumLessonId"
    >
  >;

export type ReplaceAcademicContentOnlineSessionDetailRequest = Pick<
  AcademicContentOnlineSessionDetail,
  "platform" | "joinUrl" | "startAt" | "endAt" | "timezone"
> &
  Partial<
    Pick<
      AcademicContentOnlineSessionDetail,
      "providerName" | "accessCode" | "instructions" | "timetableEntryId"
    >
  >;

export interface AcademicContentDetailsByType {
  TEACHER_PREPARATION: AcademicContentPreparationDetail;
  WEEKLY_PLAN: AcademicContentWeeklyPlanDetail;
  GUARDIAN_WEEKLY_NOTE: AcademicContentGuardianNoteDetail;
  SUBJECT_RESOURCE: AcademicContentSubjectResourceDetail;
  ONLINE_SESSION: AcademicContentOnlineSessionDetail;
  GENERAL_RESOURCE: null;
}

type AcademicContentDetailVariant<TType extends AcademicContentType> = Omit<
  AcademicContentBase,
  "type"
> & {
  type: TType;
  latestPublicationId: string | null;
  publicationStatus: AcademicContentPublicationStatus | null;
  publishAt: string | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
  targets: AcademicContentTarget[];
  assets: AcademicContentAsset[];
  links: AcademicContentLink[];
  tags: AcademicContentTag[];
  details: AcademicContentDetailsByType[TType] | null;
};

export type AcademicContentDetail = {
  [TType in AcademicContentType]: AcademicContentDetailVariant<TType>;
}[AcademicContentType];

export interface AcademicContentPreparationSummary {
  type: "TEACHER_PREPARATION";
  topic: string | null;
}

export interface AcademicContentWeeklyPlanSummary {
  type: "WEEKLY_PLAN";
  weekStartDate: string;
  weekEndDate: string;
}

export interface AcademicContentGuardianNoteSummary {
  type: "GUARDIAN_WEEKLY_NOTE";
  priority: AcademicGuardianNotePriority;
  requiresAcknowledgement: boolean;
}

export interface AcademicContentSubjectResourceSummary {
  type: "SUBJECT_RESOURCE";
  resourceCategory: AcademicSubjectResourceCategory;
}

export interface AcademicContentOnlineSessionSummary {
  type: "ONLINE_SESSION";
  platform: AcademicOnlineSessionPlatform;
  startAt: string;
  endAt: string;
}

export type AcademicContentLibrarySummary =
  | AcademicContentPreparationSummary
  | AcademicContentWeeklyPlanSummary
  | AcademicContentGuardianNoteSummary
  | AcademicContentSubjectResourceSummary
  | AcademicContentOnlineSessionSummary;

export interface AcademicContentLibraryItem extends AcademicContentBase {
  summary: AcademicContentLibrarySummary | null;
}

export interface AcademicContentListResponse {
  items: AcademicContentLibraryItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AcademicContentTargetsResponse {
  targets: AcademicContentTarget[];
}

export interface AcademicContentLinksResponse {
  links: AcademicContentLink[];
}

export interface AcademicContentTagsResponse {
  tags: AcademicContentTag[];
}

export interface AcademicContentReadinessReason {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AcademicContentReadinessResponse {
  canAdvance: boolean;
  blockingReasons: AcademicContentReadinessReason[];
}

export const ACADEMIC_CONTENT_PUBLICATION_STATUSES = [
  "SCHEDULED",
  "PUBLISHED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type AcademicContentPublicationStatus =
  (typeof ACADEMIC_CONTENT_PUBLICATION_STATUSES)[number];

export type AcademicContentPublicationCancellationReason =
  | "UNSCHEDULED"
  | "WITHDRAWN"
  | "REVISION_STARTED";

export type AcademicContentChangeSignificance = "MINOR" | "SIGNIFICANT";

export interface AcademicContentPublicationReadinessResponse {
  canPublish: boolean;
  canSchedule: boolean;
  blockingReasons: string[];
}

export interface AcademicContentAudiencePreviewResponse {
  asOf: string;
  students: number;
  guardianContexts: number;
  guardianUsersWithAccounts: number;
  guardianNotificationOptOutContexts: number;
}

export interface CreateAcademicContentPublicationRequest {
  clientRequestId: string;
  publishAt?: string;
  visibleFrom?: string;
  visibleUntil?: string | null;
  notifyMinorUpdate?: boolean;
}

export interface AcademicContentPublication {
  publicationId: string;
  revisionId: string;
  status: AcademicContentPublicationStatus;
  sourceContentStatus: AcademicContentStatus;
  publishAt: string;
  visibleFrom: string;
  visibleUntil: string | null;
  publishedAt: string | null;
  expiredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: AcademicContentPublicationCancellationReason | null;
  supersedesPublicationId: string | null;
  changeSignificance: AcademicContentChangeSignificance | null;
  notifyMinorUpdate: boolean;
  studentRecipientCount: number;
  guardianRecipientContextCount: number;
  createdByUserId: string;
  createdAt: string;
}

export interface AcademicContentPublicationRevisionStartResponse {
  contentId: string;
  oldPublicationId: string;
  oldRevisionId: string;
  cancellationReason: AcademicContentPublicationCancellationReason;
  restoredContentStatus: AcademicContentStatus;
  cancelledAt: string;
}

export interface AcademicContentPublicationHistoryResponse {
  items: AcademicContentPublication[];
  page: number;
  limit: number;
  total: number;
}

export interface AcademicContentDeleteResponse {
  ok: boolean;
}

export interface CreateAcademicContentUploadRequest {
  clientRequestId: string;
  originalName: string;
  expectedMimeType: string;
  expectedSizeBytes: string;
}

export interface AcademicContentUploadIntentResponse {
  uploadId: string;
  status: FileUploadSessionStatus;
  sessionUrl: string;
  capabilityExpiresAt: string;
  expiresAt: string;
  expectedMimeType: string;
  expectedSizeBytes: string;
  uploadMode: "resumable";
}

export interface AcademicContentUploadCompleteResponse {
  asset: {
    id: string;
    academicContentId: string;
    fileId: string;
    createdAt: string;
  };
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: string;
  };
}

export interface AcademicContentUploadCancelResponse {
  uploadId: string;
  status: FileUploadSessionStatus;
  cancelledAt: string | null;
}

export interface AcademicContentAssetUnlinkResponse {
  ok: boolean;
  assetId: string;
}

export interface AcademicContentFilePolicy {
  attachmentsEnabled: boolean;
  maximumFileSizeBytes: string;
  documentsEnabled: boolean;
  imagesEnabled: boolean;
  videosEnabled: boolean;
  audioEnabled: boolean;
  archivesEnabled: boolean;
  otherFilesEnabled: boolean;
  allowStudentDownload: boolean;
  allowGuardianDownload: boolean;
  allowInlinePreview: boolean;
}

export type UpdateAcademicContentFilePolicyRequest = Partial<AcademicContentFilePolicy>;

export interface AcademicContentRevisionSummary {
  id: string;
  revisionNumber: number;
  snapshotContractVersion: number;
  sourceStatus: AcademicContentStatus;
  title: string;
  capturedAt: string;
}

export interface AcademicContentRevisionListResponse {
  items: AcademicContentRevisionSummary[];
  page: number;
  limit: number;
  total: number;
}

export interface AcademicContentRevisionAsset {
  fileId: string;
  sortOrder: number;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
}

export interface AcademicContentRevisionDetail extends AcademicContentRevisionSummary {
  academicContentId: string;
  academicYearId: string;
  termId: string;
  type: AcademicContentType;
  audience: AcademicContentAudience;
  description: string | null;
  targets: AcademicContentTarget[];
  assets: AcademicContentRevisionAsset[];
  links: AcademicContentLink[];
  tags: AcademicContentTag[];
  details: Exclude<AcademicContentDetailsByType[AcademicContentType], null> | null;
}

export interface AcademicContentWorkflowPolicy {
  preparationApprovalRequired: boolean;
}

export type UpdateAcademicContentWorkflowPolicyRequest =
  Partial<AcademicContentWorkflowPolicy>;

export interface AcademicContentNotificationPolicy {
  notificationsEnabled: boolean;
  studentNotificationsEnabled: boolean;
  guardianNotificationsEnabled: boolean;
  weeklyPlanNotificationsEnabled: boolean;
  guardianWeeklyNoteNotificationsEnabled: boolean;
  subjectResourceNotificationsEnabled: boolean;
  onlineSessionNotificationsEnabled: boolean;
  generalResourceNotificationsEnabled: boolean;
  significantUpdateNotificationsEnabled: boolean;
  cancellationNotificationsEnabled: boolean;
  onlineSessionRemindersEnabled: boolean;
  onlineSessionReminderOffsetsMinutes: number[];
}

export type UpdateAcademicContentNotificationPolicyRequest =
  Partial<AcademicContentNotificationPolicy>;

export interface AcademicContentTransitionResponse {
  contentId: string;
  contentStatus: AcademicContentStatus;
  approvalId: string;
  approvalStatus: AcademicContentApprovalStatus;
  revisionId: string;
  roundNumber: number;
  submittedAt: string;
  decidedAt: string | null;
}

export interface AcademicContentReviewQueueQuery
  extends AcademicContentPaginationQuery {
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  teacherUserId?: string;
  search?: string;
}

export type AcademicContentReviewQueueTarget = Omit<AcademicContentTarget, "id">;

export interface AcademicContentReviewQueueItem {
  contentId: string;
  title: string;
  academicYearId: string;
  termId: string;
  approvalId: string;
  submittedRevisionId: string;
  roundNumber: number;
  submittedAt: string;
  submittedByUserId: string;
  targets: AcademicContentReviewQueueTarget[];
}

export interface AcademicContentReviewQueueResponse {
  items: AcademicContentReviewQueueItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AcademicContentApprovalHistoryItem {
  approvalId: string;
  revisionId: string;
  roundNumber: number;
  status: AcademicContentApprovalStatus;
  submittedByUserId: string;
  submittedAt: string;
  decidedByUserId: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface AcademicContentApprovalHistoryResponse {
  items: AcademicContentApprovalHistoryItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ListAcademicContentPreparationTemplatesQuery
  extends AcademicContentPaginationQuery {
  stageId?: string;
  subjectId?: string;
  search?: string;
}

export interface CreateAcademicContentPreparationTemplateRequest {
  name: string;
  description?: string | null;
  stageId?: string | null;
  subjectId?: string | null;
  topic?: string | null;
  objectives?: string[];
  learningOutcomes?: string[];
  teachingStrategies?: string[];
  activities?: string[];
  resourceNotes?: string | null;
  assessmentNotes?: string | null;
  teacherNotes?: string | null;
}

export type UpdateAcademicContentPreparationTemplateRequest =
  Partial<CreateAcademicContentPreparationTemplateRequest>;

export interface AcademicContentPreparationTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  stageId: string | null;
  subjectId: string | null;
  objectivesCount: number;
  learningOutcomesCount: number;
  teachingStrategiesCount: number;
  activitiesCount: number;
  updatedAt: string;
}

export interface AcademicContentPreparationTemplateListResponse {
  items: AcademicContentPreparationTemplateListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AcademicContentPreparationTemplateDetail {
  id: string;
  name: string;
  description: string | null;
  stageId: string | null;
  subjectId: string | null;
  topic: string | null;
  objectives: string[];
  learningOutcomes: string[];
  teachingStrategies: string[];
  activities: string[];
  resourceNotes: string | null;
  assessmentNotes: string | null;
  teacherNotes: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicContentPreparationTemplateDeleteResponse {
  ok: boolean;
}
