// Attendance KPIs Calculation

import type { AttendanceEntry, AttendanceKPIs, RosterStudent } from "../types";

/**
 * Compute KPIs from roster and entries
 */
export function computeAttendanceKpis(
  roster: RosterStudent[],
  entries: AttendanceEntry[]
): AttendanceKPIs {
  const totalStudents = roster.length;
  const markedCount = entries.filter((e) => e.status).length;
  const unmarkedCount = totalStudents - markedCount;

  const presentCount = entries.filter((e) => e.status === "PRESENT").length;
  const absentCount = entries.filter((e) => e.status === "ABSENT").length;
  const lateCount = entries.filter((e) => e.status === "LATE").length;
  const excusedCount = entries.filter((e) => e.status === "EXCUSED").length;
  const earlyLeaveCount = entries.filter((e) => e.status === "EARLY_LEAVE").length;

  const completionPct = totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;

  return {
    totalStudents,
    markedCount,
    unmarkedCount,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    earlyLeaveCount,
    completionPct,
  };
}
