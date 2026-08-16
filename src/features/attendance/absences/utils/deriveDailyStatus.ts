// Derive daily attendance status from period attendance

import type { AttendancePolicy } from "@/features/attendance/policies/types";
import type { AttendanceEntry, AttendanceSession } from "@/features/attendance/roll-call/types";
import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import type { DailyStatus } from "../types";
import { normalizeSelectedPeriodIds } from "../../utils/periodIdNormalization";

/**
 * Derive daily status for a student on a specific date
 * based on period attendance and policy rules
 * 
 * IMPORTANT: Only call this for SUBMITTED sessions. DRAFT sessions should not be counted.
 */
export function deriveDailyStatus(
  studentId: string,
  date: string,
  sessionsForDate: AttendanceSession[],
  entriesForDate: AttendanceEntry[],
  policy: AttendancePolicy | null,
  timetablePeriods: TimetablePeriod[]
): DailyStatus {
  if (!policy || !policy.selectedPeriodIds || policy.selectedPeriodIds.length === 0) {
    // No policy or no selected periods - default to PRESENT
    return {
      date,
      studentId,
      status: "PRESENT",
      missedPeriodsCount: 0,
      totalSelectedPeriods: 0,
      threshold: 0,
    };
  }

  // Normalize policy's selected period IDs against timetable
  const selectedPeriodIds = normalizeSelectedPeriodIds(
    policy.selectedPeriodIds,
    timetablePeriods
  );

  if (selectedPeriodIds.length === 0) {
    // No valid periods after normalization
    return {
      date,
      studentId,
      status: "PRESENT",
      missedPeriodsCount: 0,
      totalSelectedPeriods: 0,
      threshold: 0,
    };
  }

  const threshold = policy.absentIfMissedPeriodsCount || selectedPeriodIds.length;

  // Build map of periodId -> sessionId for SUBMITTED sessions only
  const periodToSessionMap = new Map<string, string>();
  sessionsForDate
    .filter((s) => s.status === "SUBMITTED" && s.mode === "PERIOD" && s.periodId)
    .forEach((s) => {
      periodToSessionMap.set(s.periodId!, s.id);
    });

  // Count missed periods among selected periods
  let missedCount = 0;
  let allMissedAreExcused = true;
  for (const periodId of selectedPeriodIds) {
    const sessionId = periodToSessionMap.get(periodId);

    if (!sessionId) {
      // No submitted session found for this period - this is UNMARKED
      continue;
    }

    // Find entry for this student in this session
    const entry = entriesForDate.find(
      (e) => e.sessionId === sessionId && e.studentId === studentId
    );

    if (!entry) {
      // No entry found - this is UNMARKED
      continue;
    }

    if (entry.status === "ABSENT") {
      missedCount++;
      allMissedAreExcused = false;
    } else if (entry.status === "EXCUSED") {
      missedCount++;
      // Keep allMissedAreExcused true
    }
  }

  // Determine daily status
  let status: "PRESENT" | "ABSENT" | "EXCUSED" = "PRESENT";

  // Only mark as absent if we have enough marked absences
  // Don't count UNMARKED entries as absent
  if (missedCount >= threshold) {
    status = allMissedAreExcused ? "EXCUSED" : "ABSENT";
  }

  return {
    date,
    studentId,
    status,
    missedPeriodsCount: missedCount,
    totalSelectedPeriods: selectedPeriodIds.length,
    threshold,
  };
}

/**
 * Compute daily statuses for all students on a date
 */
export function computeDailyStatuses(
  date: string,
  studentIds: string[],
  sessionsForDate: AttendanceSession[],
  entriesForDate: AttendanceEntry[],
  policy: AttendancePolicy | null,
  timetablePeriods: TimetablePeriod[]
): Map<string, DailyStatus> {
  const dailyStatuses = new Map<string, DailyStatus>();

  for (const studentId of studentIds) {
    const dailyStatus = deriveDailyStatus(
      studentId,
      date,
      sessionsForDate,
      entriesForDate,
      policy,
      timetablePeriods
    );
    dailyStatuses.set(studentId, dailyStatus);
  }

  return dailyStatuses;
}
