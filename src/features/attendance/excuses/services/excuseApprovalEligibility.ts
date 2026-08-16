import {
  fetchEntriesForSessions,
  fetchSessions,
} from "@/features/attendance/roll-call/services/attendanceRollCallService";
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus,
} from "@/features/attendance/roll-call/types";
import type { ExcuseRequest } from "../types";

export type ExcuseApprovalEligibilityState =
  | "READY_TO_APPROVE"
  | "ALREADY_EXCUSED"
  | "NO_SUBMITTED_ATTENDANCE"
  | "STATUS_DOES_NOT_MATCH";

export interface ExcuseApprovalEligibility {
  state: ExcuseApprovalEligibilityState;
  eligibleEntryCount: number;
  matchingEntryCount: number;
  alreadyExcusedEntryCount: number;
}

function expectedAttendanceStatus(type: ExcuseRequest["type"]): AttendanceStatus {
  if (type === "ABSENCE") return "ABSENT";
  if (type === "LATE") return "LATE";
  return "EARLY_LEAVE";
}

export function deriveExcuseApprovalEligibility(
  request: ExcuseRequest,
  sessions: AttendanceSession[],
  entries: AttendanceEntry[],
): ExcuseApprovalEligibility {
  const matchingSessions = findMatchingSubmittedSessions(request, sessions);
  const matchingEntries = findStudentEntries(
    request.studentId,
    matchingSessions,
    entries,
  );
  return summarizeEligibility(request, matchingEntries);
}

function findMatchingSubmittedSessions(
  request: ExcuseRequest,
  sessions: AttendanceSession[],
): AttendanceSession[] {
  const selectedPeriodKeys = new Set(request.selectedPeriodIds || []);
  return sessions.filter(
    (session) =>
      session.status === "SUBMITTED" &&
      (selectedPeriodKeys.size === 0 || selectedPeriodKeys.has(session.periodKey || "")),
  );
}

function findStudentEntries(
  studentId: string,
  sessions: AttendanceSession[],
  entries: AttendanceEntry[],
): AttendanceEntry[] {
  const matchingSessionIds = new Set(sessions.map((session) => session.id));
  return entries.filter(
    (entry) => entry.studentId === studentId && matchingSessionIds.has(entry.sessionId),
  );
}

function summarizeEligibility(
  request: ExcuseRequest,
  matchingEntries: AttendanceEntry[],
): ExcuseApprovalEligibility {
  const eligibleEntryCount = matchingEntries.filter(
    (entry) => entry.status === expectedAttendanceStatus(request.type),
  ).length;
  const alreadyExcusedEntryCount = matchingEntries.filter(
    (entry) => entry.status === "EXCUSED",
  ).length;

  if (eligibleEntryCount > 0) {
    return {
      state: "READY_TO_APPROVE",
      eligibleEntryCount,
      matchingEntryCount: matchingEntries.length,
      alreadyExcusedEntryCount,
    };
  }

  return {
    state:
      alreadyExcusedEntryCount > 0
        ? "ALREADY_EXCUSED"
        : matchingEntries.length === 0
          ? "NO_SUBMITTED_ATTENDANCE"
          : "STATUS_DOES_NOT_MATCH",
    eligibleEntryCount,
    matchingEntryCount: matchingEntries.length,
    alreadyExcusedEntryCount,
  };
}

export async function getExcuseApprovalEligibility(
  request: ExcuseRequest,
): Promise<ExcuseApprovalEligibility> {
  const sessions = await fetchSessions(
    request.yearId,
    request.termId,
    request.dateFrom,
    request.dateTo,
  );
  const submittedSessionIds = sessions
    .filter((session) => session.status === "SUBMITTED")
    .map((session) => session.id);
  const entries = await fetchEntriesForSessions(
    request.yearId,
    request.termId,
    submittedSessionIds,
  );

  return deriveExcuseApprovalEligibility(request, sessions, entries);
}
