import type {
  TimetableValidationIssue,
  TimetableValidationItem,
  TimetableValidationResponse,
} from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableConflict } from "@/features/academics/timetable/types/timetable";
import { dayIndexToKey } from "@/features/academics/timetable/services/timetableMappers";

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

export function conflictsFromResponse(response: unknown): TimetableConflict[] {
  return normalizeConflictResponse(response).conflicts;
}

export function normalizeConflictCheckResponse(response: unknown): {
  conflicts: TimetableConflict[];
} {
  return normalizeConflictResponse(response, "code");
}

export function normalizePersistedConflicts(response: unknown): {
  conflicts: TimetableConflict[];
} {
  return normalizeConflictResponse(response, "type");
}

function normalizeConflictResponse(
  response: unknown,
  source: "code" | "type" = "code",
): { conflicts: TimetableConflict[] } {
  if (Array.isArray(response)) {
    return { conflicts: response.map((conflict) => normalizeConflict(conflict, source)) };
  }
  if (response && typeof response === "object") {
    const conflictsResponse = response as {
      conflicts?: unknown[];
      items?: unknown[];
    };
    return {
      conflicts: (conflictsResponse.conflicts ?? conflictsResponse.items ?? []).map(
        (conflict) => normalizeConflict(conflict, source),
      ),
    };
  }
  return { conflicts: [] };
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

function normalizeConflict(
  conflict: unknown,
  source: "code" | "type",
): TimetableConflict {
  const current = conflict as Partial<TimetableConflict> & {
    code?: string;
    type?: string;
    dayOfWeek?: number | null;
    periodIndex?: number;
    periodId?: string | null;
    teacherUserId?: string | null;
    roomId?: string | null;
    message?: string;
    severity?: string;
    proposedIndexes?: number[];
    entryIds?: string[];
  };
  if (
    current.dayKey &&
    current.periodIndex &&
    current.type &&
    ["CLASSROOM", "TEACHER", "ROOM", "DUPLICATE", "UNKNOWN"].includes(
      current.type,
    )
  ) {
    return current as TimetableConflict;
  }
  const discriminator = source === "type" ? current.type : current.code;
  const type = conflictType(discriminator);
  const periodIndex = current.periodIndex ?? current.period ?? 0;
  const resourceId =
    type === "ROOM"
      ? (current.roomId ?? current.resourceId ?? "")
      : type === "TEACHER"
        ? (current.teacherUserId ?? current.resourceId ?? "")
        : current.resourceId ?? "";
  return {
    type,
    code: current.code ?? current.type,
    message: current.message,
    severity: current.severity,
    dayKey: dayIndexToKey(current.dayOfWeek ?? 0),
    periodIndex,
    periodId: current.periodId ?? undefined,
    resourceId,
    resourceName:
      current.resourceName ??
      resourceId ??
      current.message ??
      "Timetable conflict",
    proposedIndexes: current.proposedIndexes ?? [],
    entryIds: current.entryIds ?? [],
    sections: current.sections ?? [],
    day: current.dayOfWeek ?? current.day,
    period: periodIndex,
  };
}

function conflictType(discriminator: string | undefined): TimetableConflict["type"] {
  switch (discriminator) {
    case "CLASSROOM_SLOT":
    case "CLASSROOM":
    case "classroom_conflict":
      return "CLASSROOM";
    case "TEACHER":
    case "teacher_conflict":
      return "TEACHER";
    case "ROOM":
    case "room_conflict":
      return "ROOM";
    case "duplicate_slot":
      return "DUPLICATE";
    default:
      return "UNKNOWN";
  }
}
