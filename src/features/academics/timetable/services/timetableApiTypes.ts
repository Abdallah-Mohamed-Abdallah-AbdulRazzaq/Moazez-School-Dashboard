export type TimetableScopeType = "TERM" | "GRADE" | "SECTION" | "CLASSROOM";

export type BackendTimetableStatus = "draft" | "active" | "cancelled";
export type BackendTimetableConfigStatus = "draft" | "active" | "archived";
export type BackendTimetablePublicationStatus =
  | "draft"
  | "published"
  | "superseded"
  | "archived";

export interface TimetableConfigEnvelopeDto {
  data: BackendTimetableConfigDto;
}

export interface BackendTimetableConfigDto {
  id: string;
  timetableConfigId?: string;
  academicYearId: string;
  termId: string;
  name: string;
  weekStartDay: number;
  activeDays: number[];
  scopeType: "term" | "grade" | "section" | "classroom";
  scopeKey: string;
  gradeId: string | null;
  sectionId: string | null;
  classroomId: string | null;
  status: BackendTimetableConfigStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTimetablePeriodDto {
  id: string;
  timetableConfigId: string;
  index: number;
  label: string;
  startTime: string;
  endTime: string;
  timeRange?: string;
  type: "class" | "break" | string;
  isInstructional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTimetableEntryDto {
  id: string;
  timetableConfigId: string;
  periodId: string;
  dayOfWeek: number;
  period: {
    id: string;
    index: number;
    label: string;
    startTime: string;
    endTime: string;
  };
  classroom: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  subject: {
    id: string;
    nameAr: string;
    nameEn: string;
    code?: string | null;
  } | null;
  teacher: {
    userId: string;
    fullName: string;
  } | null;
  room: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
  teacherSubjectAllocationId: string;
  notes: string | null;
  status: BackendTimetableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableDashboardConfigSummaryDto {
  id: string;
  name: string;
  scopeType: string;
  scopeKey: string;
  status: string;
  activeDays: number[];
}

export interface TimetableDashboardItemDto {
  classroomId: string;
  classroom: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  gradeId: string;
  grade: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  configs: TimetableDashboardConfigSummaryDto[];
  periods: BackendTimetablePeriodDto[];
  entries: BackendTimetableEntryDto[];
}

export interface TimetableDashboardAllResponseDto {
  termId: string;
  academicYearId: string;
  publishedAt: string | null;
  isPublished: boolean;
  items: TimetableDashboardItemDto[];
}

export interface ListResponse<T> {
  items: T[];
}

export interface PublicationResponse {
  timetableConfigId: string;
  status: BackendTimetablePublicationStatus | string;
  revision?: number;
  isPublished?: boolean;
  canPublish: boolean;
  blockingReasons: TimetablePublishReason[];
  warnings?: TimetablePublishReason[];
  publishedAt: string | null;
  publishedByUserId?: string | null;
  summary?: {
    periodsCount: number;
    instructionalPeriodsCount: number;
    entriesCount: number;
    conflictsCount: number;
    activeDays: number[];
    scopeType: string;
    academicYearId: string;
    termId: string;
  };
}

export interface TimetablePublishReason {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TimetableValidationIssue {
  code?: string;
  message?: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  classroomId?: string;
  classroomName?: string;
  roomId?: string;
  roomName?: string;
  dayOfWeek?: number;
  periodId?: string;
  periodIndex?: number;
  expected?: number;
  actual?: number;
  expectedWeeklyHours?: number | null;
  scheduledWeeklyHours?: number;
  details?: Record<string, unknown>;
}

export interface TimetableUnpublishResponse {
  termId: string;
  academicYearId: string;
  summary: {
    configsChecked: number;
    unpublishedCount: number;
    entriesReturnedToDraft: number;
  };
}

export interface TimetablePersistedConflictDto {
  id: string;
  type: "CLASSROOM_SLOT" | "TEACHER" | "ROOM" | string;
  severity: string;
  status: string;
  dayOfWeek: number | null;
  periodId: string | null;
  entryId: string | null;
  relatedEntryId: string | null;
  entryIds: string[];
  teacherUserId: string | null;
  roomId: string | null;
  message: string;
}

export interface TimetableConflictCheckResponse {
  termId: string;
  academicYearId: string;
  hasConflicts: boolean;
  conflicts: Array<{
    code: string;
    message: string;
    severity: string;
    dayOfWeek: number | null;
    periodId: string | null;
    classroomId: string | null;
    teacherUserId: string | null;
    roomId: string | null;
    entryIds: string[];
    proposedIndexes: number[];
  }>;
}

export interface BackendTimetableValidationIssue {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TimetableValidationItem {
  classroomId: string;
  classroom: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  gradeId: string;
  grade: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  subjectId: string | null;
  subject: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string | null;
    color: string | null;
  } | null;
  expectedWeeklyHours: number | null;
  scheduledWeeklyHours: number;
  status:
    | "complete"
    | "under_scheduled"
    | "over_scheduled"
    | "missing_teacher_allocation"
    | "missing_subject_allocation";
  issues: BackendTimetableValidationIssue[];
}

export interface TimetableValidationResponse {
  termId: string;
  academicYearId: string;
  summary: {
    classroomsChecked: number;
    expectedWeeklySlots: number;
    actualScheduledSlots: number;
    missingTeacherAllocations: number;
    underScheduledSubjects: number;
    overScheduledSubjects: number;
    teacherConflicts: number;
    classroomConflicts: number;
    roomConflicts: number;
    missingSubjectAllocationRows: number;
  };
  items: TimetableValidationItem[];
}

export type UpsertConfigRequest = {
  academicYearId: string;
  termId: string;
  scopeType?: TimetableScopeType;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  name: string;
  weekStartDay: number;
  activeDays: number[];
  status?: "DRAFT";
};

export interface CreatePeriodRequest {
  timetableConfigId: string;
  index: number;
  label: string;
  startTime: string;
  endTime: string;
  type?: "CLASS" | "BREAK" | "ASSEMBLY" | "ACTIVITY";
  isInstructional?: boolean;
}

export type UpdatePeriodRequest = Partial<
  Omit<CreatePeriodRequest, "timetableConfigId">
>;

export interface CreateEntryRequest {
  timetableConfigId: string;
  periodId: string;
  dayOfWeek: number;
  classroomId: string;
  subjectId?: string;
  teacherSubjectAllocationId: string;
  roomId?: string | null;
  notes?: string | null;
}

export type UpdateEntryRequest = Partial<
  Omit<CreateEntryRequest, "timetableConfigId">
>;

export interface BulkSaveTimetableRequest {
  termId: string;
  items: Array<{
    classroomId: string;
    dayOfWeek: number;
    periodId: string;
    teacherSubjectAllocationId: string;
    roomId?: string | null;
  }>;
}
