import type {
  TimetableValidationIssue,
  TimetableValidationItem,
  TimetableValidationResponse,
} from "@/features/academics/timetable/services/timetableApiTypes";
import {
  normalizeTimetableConflicts,
  type TimetableConflictDisplay,
  type TimetableConflictNormalizationContext,
  type TimetableConflictPeriod,
} from "@/features/academics/timetable/services/timetableConflictNormalization";

export interface TimetableValidationSummary {
  canPublish: boolean;
  backendSummary: TimetableValidationResponse["summary"] | null;
  items: TimetableValidationItem[];
  blockingReasons: string[];
  warnings: string[];
  missingTeacherAllocations: TimetableValidationIssue[];
  underScheduledSubjects: TimetableValidationIssue[];
  overScheduledSubjects: TimetableValidationIssue[];
  teacherConflicts: TimetableValidationIssue[];
  classroomConflicts: TimetableValidationIssue[];
  roomConflicts: TimetableValidationIssue[];
  roomIntegrityIssues: TimetableValidationIssue[];
  missingSubjectAllocationRows: TimetableValidationIssue[];
  conflicts: TimetableValidationIssue[];
}

export const emptyValidationSummary = (): TimetableValidationSummary => ({
  canPublish: false,
  backendSummary: null,
  items: [],
  blockingReasons: [],
  warnings: [],
  missingTeacherAllocations: [],
  underScheduledSubjects: [],
  overScheduledSubjects: [],
  teacherConflicts: [],
  classroomConflicts: [],
  roomConflicts: [],
  roomIntegrityIssues: [],
  missingSubjectAllocationRows: [],
  conflicts: [],
});

export function validationSummaryFromResponse(
  response: TimetableValidationResponse,
): TimetableValidationSummary {
  const backendItems = response.items;
  const itemBuckets = bucketIssuesFromValidationItems(backendItems);
  return {
    canPublish: !hasSummaryBlockingCounts(response),
    backendSummary: response.summary,
    items: backendItems,
    blockingReasons: blockingReasonsFromSummary(response),
    warnings: [],
    missingTeacherAllocations: itemBuckets.missingTeacherAllocations,
    underScheduledSubjects: itemBuckets.underScheduledSubjects,
    overScheduledSubjects: itemBuckets.overScheduledSubjects,
    teacherConflicts: [],
    classroomConflicts: [],
    roomConflicts: [],
    roomIntegrityIssues: itemBuckets.roomIntegrityIssues,
    missingSubjectAllocationRows: itemBuckets.missingSubjectAllocationRows,
    conflicts: [],
  };
}

export function validationIssueText(issue: TimetableValidationIssue): string {
  if (issue.message) {
    return issue.message;
  }
  const name =
    issue.subjectName ??
    issue.subjectId ??
    issue.teacherName ??
    issue.classroomName ??
    issue.roomName ??
    issue.teacherId ??
    issue.classroomId ??
    issue.roomId;
  const hours =
    typeof issue.actual === "number" && typeof issue.expected === "number"
      ? ` (${issue.actual}/${issue.expected})`
      : typeof issue.scheduledWeeklyHours === "number" &&
          typeof issue.expectedWeeklyHours === "number"
        ? ` (${issue.scheduledWeeklyHours}/${issue.expectedWeeklyHours})`
        : "";
  return `${name ?? "Timetable issue"}${hours}`;
}

export function conflictsFromResponse(
  response: unknown,
  periods: TimetableConflictPeriod[] = [],
  context: TimetableConflictNormalizationContext = {},
): TimetableConflictDisplay[] {
  return normalizeTimetableConflicts(response, "proposed", periods, context);
}

export function normalizeConflictCheckResponse(
  response: unknown,
  periods: TimetableConflictPeriod[] = [],
  context: TimetableConflictNormalizationContext = {},
): {
  conflicts: TimetableConflictDisplay[];
} {
  return {
    conflicts: normalizeTimetableConflicts(response, "proposed", periods, context),
  };
}

export function normalizePersistedConflicts(
  response: unknown,
  periods: TimetableConflictPeriod[] = [],
  context: TimetableConflictNormalizationContext = {},
): {
  conflicts: TimetableConflictDisplay[];
} {
  return {
    conflicts: normalizeTimetableConflicts(response, "persisted", periods, context),
  };
}

export function hasBlockingValidation(summary: TimetableValidationSummary) {
  return (
    summary.blockingReasons.length > 0 ||
    summary.missingTeacherAllocations.length > 0 ||
    summary.underScheduledSubjects.length > 0 ||
    summary.overScheduledSubjects.length > 0 ||
    summary.teacherConflicts.length > 0 ||
    summary.classroomConflicts.length > 0 ||
    summary.roomConflicts.length > 0 ||
    summary.roomIntegrityIssues.length > 0 ||
    summary.missingSubjectAllocationRows.length > 0 ||
    summary.conflicts.length > 0
  );
}

function bucketIssuesFromValidationItems(items: TimetableValidationItem[]) {
  const buckets = {
    missingTeacherAllocations: [] as TimetableValidationIssue[],
    underScheduledSubjects: [] as TimetableValidationIssue[],
    overScheduledSubjects: [] as TimetableValidationIssue[],
    missingSubjectAllocationRows: [] as TimetableValidationIssue[],
    roomIntegrityIssues: [] as TimetableValidationIssue[],
  };

  for (const item of items) {
    const normalizedIssues = item.issues.map((issue) =>
      enrichValidationIssue(issue, item),
    );
    if (item.status === "missing_subject_allocation") {
      buckets.missingSubjectAllocationRows.push(...normalizedIssues);
      continue;
    }
    for (const issue of normalizedIssues) {
      if (issue.code === "missing_teacher_allocation") {
        buckets.missingTeacherAllocations.push(issue);
      } else if (issue.code === "under_scheduled_subject") {
        buckets.underScheduledSubjects.push(issue);
      } else if (issue.code === "over_scheduled_subject") {
        buckets.overScheduledSubjects.push(issue);
      } else if (issue.code === "missing_subject_allocation_row") {
        buckets.missingSubjectAllocationRows.push(issue);
      } else if (issue.code === "room_not_found" || issue.code === "room_inactive" || issue.code === "room_capacity_insufficient") {
        buckets.roomIntegrityIssues.push(issue);
      }
    }
  }

  return buckets;
}

function enrichValidationIssue(
  issue: TimetableValidationItem["issues"][number],
  item: TimetableValidationItem,
): TimetableValidationIssue {
  return {
    ...issue,
    subjectId: item.subjectId ?? undefined,
    subjectName: item.subject?.nameEn ?? item.subject?.nameAr,
    classroomId: item.classroomId,
    classroomName: item.classroom.nameEn ?? item.classroom.nameAr,
    expectedWeeklyHours: item.expectedWeeklyHours,
    scheduledWeeklyHours: item.scheduledWeeklyHours,
    expected:
      typeof item.expectedWeeklyHours === "number"
        ? item.expectedWeeklyHours
        : undefined,
    actual: item.scheduledWeeklyHours,
  };
}

function hasSummaryBlockingCounts(
  response: TimetableValidationResponse,
): boolean {
  const summary = response.summary;
  if (!summary) {
    return false;
  }
  return (
    summary.missingTeacherAllocations > 0 ||
    summary.underScheduledSubjects > 0 ||
    summary.overScheduledSubjects > 0 ||
    summary.teacherConflicts > 0 ||
    summary.classroomConflicts > 0 ||
    summary.roomConflicts > 0 ||
    summary.missingSubjectAllocationRows > 0
  );
}

function blockingReasonsFromSummary(
  response: TimetableValidationResponse,
): string[] {
  return hasSummaryBlockingCounts(response)
    ? ["Resolve timetable validation issues before publishing."]
    : [];
}
