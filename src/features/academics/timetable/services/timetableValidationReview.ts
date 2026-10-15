import type {
  PublicationResponse,
  TimetablePublishReason,
  TimetableValidationItem,
  TimetableValidationIssue,
} from "./timetableApiTypes";
import type { TimetableConflictDisplay } from "./timetableConflictNormalization";
import type { TimetableValidationSummary } from "./timetableValidationSummary";

export interface ValidationReviewReport {
  summary: TimetableValidationSummary;
  conflicts: TimetableConflictDisplay[];
  publication: PublicationResponse;
}

export interface ValidationConflictGroup {
  conflict: TimetableConflictDisplay;
  reports: number;
  messages: string[];
}

function conflictIntervalKey(conflict: TimetableConflictDisplay) {
  const day = conflict.dayOfWeek ?? conflict.dayKey;
  const interval =
    conflict.startTime && conflict.endTime
      ? [conflict.startTime, conflict.endTime]
      : (conflict.periodId ?? conflict.periodIndex);
  if (!conflict.resourceId || day == null || interval == null) return null;
  return JSON.stringify([
    conflict.type,
    conflict.resourceId,
    day,
    interval,
    conflict.severity,
  ]);
}

export function groupValidationConflicts(
  conflicts: TimetableConflictDisplay[],
): ValidationConflictGroup[] {
  const groups = new Map<string, ValidationConflictGroup>();
  conflicts.forEach((conflict, index) => {
    const key = conflictIntervalKey(conflict) ?? `unresolved:${index}`;
    const previous = groups.get(key);
    groups.set(
      key,
      previous
        ? mergeConflictGroup(previous, conflict)
        : { conflict, reports: 1, messages: [conflict.message] },
    );
  });
  return [...groups.values()];
}

function mergeConflictGroup(
  previous: ValidationConflictGroup,
  conflict: TimetableConflictDisplay,
): ValidationConflictGroup {
  return {
    conflict: {
      ...previous.conflict,
      entryIds: [
        ...new Set([...previous.conflict.entryIds, ...conflict.entryIds]),
      ],
      proposedIndexes: [
        ...new Set([
          ...previous.conflict.proposedIndexes,
          ...conflict.proposedIndexes,
        ]),
      ],
    },
    reports: previous.reports + 1,
    messages: [...new Set([...previous.messages, conflict.message])],
  };
}

function validationIssueKey(issue: TimetableValidationIssue) {
  return [
    issue.code ?? issue.message,
    issue.classroomId,
    issue.subjectId,
    issue.teacherId,
    issue.roomId,
    issue.dayOfWeek,
    issue.periodId,
  ];
}

export function validationReviewIssueKeys(
  report: ValidationReviewReport,
): string[] {
  const subjects = report.summary.items
    .filter((item) => item.status !== "complete" || item.issues.length > 0)
    .map(subjectReviewKey);
  const conflicts = groupValidationConflicts(report.conflicts).map(
    conflictReviewKey,
  );
  const publication =
    report.publication.blockingReasons.map(publicationReviewKey);
  const fallback = [
    report.summary.teacherConflicts,
    report.summary.classroomConflicts,
    report.summary.roomConflicts,
    report.summary.roomIntegrityIssues,
    report.summary.conflicts,
    report.summary.warnings,
  ]
    .flat()
    .map((issue) =>
      JSON.stringify([
        "other",
        ...validationIssueKey(
          typeof issue === "string" ? { message: issue } : issue,
        ),
      ]),
    );
  const blockers = report.summary.backendSummary
    ? []
    : report.summary.blockingReasons.map((reason) =>
        JSON.stringify(["blocker", reason]),
      );
  const keys = new Set([
    ...subjects,
    ...conflicts,
    ...publication,
    ...fallback,
    ...blockers,
    ...summaryOnlyIssueKeys(report),
  ]);
  if (
    keys.size === 0 &&
    (!report.summary.canPublish || !report.publication.canPublish)
  )
    keys.add("unresolved-readiness");
  return [...keys];
}

function subjectReviewKey(item: TimetableValidationItem) {
  return JSON.stringify([
    "subject",
    item.classroomId,
    item.subjectId,
    item.status,
    item.issues.map((issue) => issue.code).sort(),
  ]);
}

function conflictReviewKey({ conflict }: ValidationConflictGroup) {
  return JSON.stringify([
    "conflict",
    conflictIntervalKey(conflict) ?? [
      conflict.type,
      conflict.code,
      conflict.message,
      [...conflict.entryIds].sort(),
      [...conflict.proposedIndexes].sort(),
    ],
  ]);
}

function publicationReviewKey(reason: TimetablePublishReason) {
  const identity = Object.entries(reason.details ?? {}).filter(
    ([key]) =>
      /(Id|Ids)$/.test(key) ||
      ["dayOfWeek", "periodIndex", "scopeType", "scopeKey"].includes(key),
  );
  return JSON.stringify([
    "publication",
    reason.code,
    identity.sort(([first], [second]) => first.localeCompare(second)),
  ]);
}

function summaryOnlyIssueKeys({ summary, conflicts }: ValidationReviewReport) {
  if (!summary.backendSummary) return [];
  const detailedStatuses = new Set(summary.items.map((item) => item.status));
  const detailedConflictTypes = new Set(
    conflicts.map((conflict) => conflict.type),
  );
  const categories = [
    [
      "missingTeacherAllocations",
      detailedStatuses.has("missing_teacher_allocation"),
    ],
    [
      "missingSubjectAllocationRows",
      detailedStatuses.has("missing_subject_allocation"),
    ],
    ["underScheduledSubjects", detailedStatuses.has("under_scheduled")],
    ["overScheduledSubjects", detailedStatuses.has("over_scheduled")],
    ["teacherConflicts", detailedConflictTypes.has("TEACHER")],
    ["classroomConflicts", detailedConflictTypes.has("CLASSROOM")],
    ["roomConflicts", detailedConflictTypes.has("ROOM")],
  ] as const;
  return categories
    .filter(
      ([category, hasDetails]) =>
        !hasDetails && summary.backendSummary![category] > 0,
    )
    .map(([category]) => JSON.stringify(["summary", category]));
}

export function validationReviewProgress(
  previous: string[],
  current: string[],
) {
  const previousKeys = new Set(previous);
  const currentKeys = new Set(current);
  return {
    resolved: [...previousKeys].filter((key) => !currentKeys.has(key)).length,
    added: [...currentKeys].filter((key) => !previousKeys.has(key)).length,
    remaining: currentKeys.size,
  };
}
