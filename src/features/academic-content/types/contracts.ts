export type AcademicContentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "EXPIRED"
  | "ARCHIVED"
  | "CANCELLED";

export type AcademicContentType =
  | "TEACHER_PREPARATION"
  | "WEEKLY_PLAN"
  | "GUARDIAN_WEEKLY_NOTE"
  | "SUBJECT_RESOURCE"
  | "ONLINE_SESSION"
  | "GENERAL_RESOURCE";

export type AcademicContentAudience =
  | "INTERNAL_STAFF"
  | "STUDENTS"
  | "GUARDIANS"
  | "STUDENTS_AND_GUARDIANS";

export type AcademicContentTargetScope =
  | "SCHOOL"
  | "STAGE"
  | "GRADE"
  | "SECTION"
  | "CLASSROOM";

export type AcademicGuardianNotePriority = "NORMAL" | "IMPORTANT" | "URGENT";

export type AcademicSubjectResourceCategory =
  | "WORKSHEET"
  | "PRESENTATION"
  | "REFERENCE"
  | "REVISION"
  | "ACTIVITY"
  | "EXAM_PREPARATION"
  | "VIDEO"
  | "DOCUMENT"
  | "OTHER";

export type AcademicOnlineSessionPlatform =
  | "GOOGLE_MEET"
  | "ZOOM"
  | "MICROSOFT_TEAMS"
  | "WEBEX"
  | "OTHER";

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
