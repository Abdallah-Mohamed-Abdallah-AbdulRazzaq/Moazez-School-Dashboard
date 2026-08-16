export type LessonPlanStatusDto = "draft" | "active" | "archived";
export type LessonPlanItemStatusDto =
  | "planned"
  | "in_progress"
  | "done"
  | "skipped"
  | "cancelled"
  | "rescheduled";
export type LessonPlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "UNKNOWN";
export type LessonPlanItemStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SKIPPED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "UNKNOWN";
export type LessonPlanStatusFilter = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface NamedSummaryDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
}
export interface LessonPlanItemResponseDto {
  id: string;
  itemId: string;
  lessonPlanId: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  unitTitle: string;
  lessonTitle: string;
  timetableEntryId: string | null;
  plannedDate: string | null;
  dayOfWeek: number | null;
  periodId: string | null;
  periodLabel: string | null;
  title: string;
  notes: string | null;
  status: LessonPlanItemStatusDto | string;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface LessonPlanResponseDto {
  id: string;
  lessonPlanId: string;
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherUserId: string;
  classroomId: string;
  subjectId: string;
  curriculumId: string;
  title: string;
  description: string | null;
  status: LessonPlanStatusDto | string;
  weekStartDate: string;
  weekEndDate: string;
  activatedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: NamedSummaryDto;
  term: NamedSummaryDto;
  teacher: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  classroom: NamedSummaryDto;
  subject: NamedSummaryDto & { code: string | null; color: string | null };
  curriculum: { curriculumId: string; title: string; status: string };
  itemCount: number;
  items?: LessonPlanItemResponseDto[];
}
export interface LessonPlanDetailResponseDto extends LessonPlanResponseDto {
  items: LessonPlanItemResponseDto[];
}
export interface LessonPlansListResponseDto {
  items: LessonPlanResponseDto[];
}
export interface LessonPlanWeekBucketDto {
  weekIndex: number;
  startsAt: string;
  endsAt: string;
  instructionalDays: string[];
  holidayDays: Array<{ date: string; eventId: string; title: string }>;
  plannedItemsCount: number;
}
export interface LessonPlanWeeksResponseDto {
  termId: string;
  academicYearId: string;
  weeks: LessonPlanWeekBucketDto[];
}
export interface LessonPlanSummaryTotals {
  lessonPlansCount: number;
  itemsCount: number;
  plannedItemsCount: number;
  completedItemsCount: number;
  unplannedLessonsCount: number;
  coveragePercent: number;
}
export interface LessonPlanSafeTeacherSummaryDto {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}
export interface LessonPlanSubjectSummaryDto extends NamedSummaryDto {
  code: string | null;
  color: string | null;
}
export interface LessonPlanAllocationSummaryDto {
  teacherSubjectAllocationId: string;
  teacher: LessonPlanSafeTeacherSummaryDto;
  subject: LessonPlanSubjectSummaryDto;
  classroom: NamedSummaryDto;
  plannedItemsCount: number;
  completedItemsCount: number;
  unplannedLessonsCount: number;
  coveragePercent: number;
}
export interface LessonPlanSummaryResponseDto {
  termId: string;
  academicYearId: string;
  summary: LessonPlanSummaryTotals;
  byTeacherAllocation: LessonPlanAllocationSummaryDto[];
}
export interface LessonPlanValidationResponseDto {
  termId: string;
  academicYearId: string;
  summary: LessonPlanValidationSummary;
  issues: LessonPlanValidationIssue[];
}
export interface LessonPlanValidationSummary {
  lessonPlansChecked: number;
  itemsChecked: number;
  missingPlannedLessons: number;
  holidayItems: number;
  outsideTermItems: number;
  duplicateLessons: number;
}
export interface LessonPlanValidationIssue {
  code: string;
  severity: string;
  message: string;
  lessonId?: string;
  itemId?: string;
  teacherSubjectAllocationId?: string;
}
export interface AutoPlanLessonPlanResponseDto {
  termId: string;
  academicYearId: string;
  teacherSubjectAllocationId: string;
  dryRun: boolean;
  summary: AutoPlanLessonPlanSummary;
  items: AutoPlanLessonPlanItem[];
}
export interface AutoPlanLessonPlanSummary {
  candidateLessons: number;
  availableSlots: number;
  proposedItems: number;
  createdItems: number;
  skippedExistingItems: number;
  skippedHolidaySlots: number;
}
export interface AutoPlanLessonPlanItem {
  lessonId: string;
  title: string;
  plannedDate: string;
  timetableEntryId: string | null;
  weekIndex: number;
  status: string;
}

export interface LessonPlanListFilters {
  academicYearId?: string;
  termId?: string;
  teacherSubjectAllocationId?: string;
  teacherUserId?: string;
  classroomId?: string;
  subjectId?: string;
  curriculumId?: string;
  status?: LessonPlanStatusFilter;
  weekStartDate?: string;
  search?: string;
}
export interface CreateLessonPlanRequest {
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherUserId?: string;
  classroomId?: string;
  subjectId?: string;
  curriculumId: string;
  title: string;
  description?: string | null;
  weekStartDate: string;
  weekEndDate: string;
}
export interface UpdateLessonPlanRequest {
  title?: string;
  description?: string | null;
  weekStartDate?: string;
  weekEndDate?: string;
}
export interface CreateLessonPlanItemRequest {
  unitId: string;
  lessonId: string;
  timetableEntryId?: string | null;
  plannedDate?: string | null;
  dayOfWeek?: number | null;
  periodId?: string | null;
  periodLabel?: string | null;
  title?: string | null;
  notes?: string | null;
  sortOrder?: number;
}
export type UpdateLessonPlanItemRequest = Omit<
  Partial<CreateLessonPlanItemRequest>,
  "sortOrder"
>;
export interface ReorderLessonPlanItemRequest {
  sortOrder: number;
}
export interface MoveLessonPlanItemRequestDto {
  weekIndex?: number;
  plannedDate?: string;
  timetableEntryId?: string | null;
  sortOrder?: number;
}
export interface LessonPlanStatusNoteRequest {
  note?: string | null;
}
export interface LessonPlanWeeksQuery {
  termId: string;
  teacherSubjectAllocationId?: string;
  from?: string;
  to?: string;
}
export interface LessonPlanSummaryQuery {
  termId: string;
  teacherSubjectAllocationId?: string;
  gradeId?: string;
  subjectId?: string;
  classroomId?: string;
}
export type LessonPlanValidationQuery = LessonPlanSummaryQuery;
export interface AutoPlanLessonPlanRequest {
  termId: string;
  teacherSubjectAllocationId: string;
  from?: string;
  to?: string;
  overwrite?: boolean;
  dryRun?: boolean;
}
export interface DeleteResponse {
  ok: true;
}

export interface LessonPlanItem {
  id: string;
  planId: string;
  lessonId: string;
  unitId: string;
  unitTitle: string;
  lessonTitle: string;
  status: LessonPlanItemStatus;
  rawStatus: string;
  order: number;
  notes?: string;
  notesAr?: string;
  notesEn?: string;
  plannedDate?: string;
  timetableEntryId?: string;
  dayOfWeek?: number;
  periodId?: string;
  periodLabel?: string;
  title?: string;
  startedAt?: string;
  completedAt?: string;
  skippedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface LessonPlan {
  id: string;
  academicYearId: string;
  termId: string;
  teacherSubjectAllocationId: string;
  teacherId: string;
  classroomId: string;
  subjectId: string;
  curriculumId: string;
  title: string;
  description: string | null;
  status: LessonPlanStatus;
  rawStatus: string;
  weekIndex: number;
  weekStartDate: string;
  weekEndDate: string;
  items: LessonPlanItem[];
  updatedAt: string;
}
export interface WeekInfo {
  weekIndex: number;
  startDate: string;
  endDate: string;
  instructionalDays: string[];
  holidayDays: Array<{
    date: string;
    eventId: string;
    title: string;
  }>;
  lostTeachingDays: number;
  hasHolidays: boolean;
  plannedItemsCount: number;
}
export interface LessonPlanSummary extends LessonPlanSummaryTotals {
  byTeacherAllocation: LessonPlanAllocationSummaryDto[];
}

export interface CreateLessonPlanItemCommand {
  lessonPlanId: string;
  payload: CreateLessonPlanItemRequest;
}
export interface UpdateLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
  payload: UpdateLessonPlanItemRequest;
}
export interface ReorderLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
  payload: ReorderLessonPlanItemRequest;
}
export interface LessonPlanItemActionCommand {
  lessonPlanId: string;
  itemId: string;
  payload?: LessonPlanStatusNoteRequest;
}
export interface DeleteLessonPlanItemCommand {
  lessonPlanId: string;
  itemId: string;
}
