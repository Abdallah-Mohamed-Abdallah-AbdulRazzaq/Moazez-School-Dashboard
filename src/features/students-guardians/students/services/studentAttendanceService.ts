"use client";

import { fetchEntriesForSessions, fetchSessions } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import type { AttendanceEntry, AttendanceStatus } from "@/features/attendance/roll-call/types";

export interface StudentAttendanceRecordRow {
  id: string;
  date: string;
  status: AttendanceStatus;
  minutes: number;
  reason: string;
}

export interface StudentAttendanceTrendPoint {
  label: string;
  value: number;
}

export interface StudentAttendanceViewModel {
  attendanceRate: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  recentRecords: StudentAttendanceRecordRow[];
  trend: StudentAttendanceTrendPoint[];
}

function buildDailyStatus(entries: AttendanceEntry[]): AttendanceStatus {
  if (entries.some((entry) => entry.status === "ABSENT")) return "ABSENT";
  if (entries.some((entry) => entry.status === "EXCUSED")) return "EXCUSED";
  if (entries.some((entry) => entry.status === "LATE")) return "LATE";
  if (entries.some((entry) => entry.status === "EARLY_LEAVE")) return "EARLY_LEAVE";
  return "PRESENT";
}

function formatTrendLabel(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function fetchStudentAttendanceViewModel(
  studentId: string,
  yearId: string,
  termId: string,
): Promise<StudentAttendanceViewModel> {
  const sessions = (await fetchSessions(yearId, termId)).filter(
    (session) => session.status === "SUBMITTED",
  );

  if (sessions.length === 0) {
    return {
      attendanceRate: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      recentRecords: [],
      trend: [],
    };
  }

  const entries = await fetchEntriesForSessions(
    yearId,
    termId,
    sessions.map((session) => session.id),
  );

  const studentEntries = entries.filter((entry) => entry.studentId === studentId);
  const entriesByDate = new Map<string, AttendanceEntry[]>();

  studentEntries.forEach((entry) => {
    const session = sessions.find((item) => item.id === entry.sessionId);
    if (!session) return;

    if (!entriesByDate.has(session.date)) {
      entriesByDate.set(session.date, []);
    }
    entriesByDate.get(session.date)!.push(entry);
  });

  const dailyStatuses = Array.from(entriesByDate.entries())
    .map(([date, dateEntries]) => ({
      date,
      status: buildDailyStatus(dateEntries),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  const presentDays = dailyStatuses.filter((item) => item.status === "PRESENT").length;
  const absentDays = dailyStatuses.filter(
    (item) => item.status === "ABSENT" || item.status === "EXCUSED",
  ).length;
  const lateDays = dailyStatuses.filter((item) => item.status === "LATE").length;

  const attendanceRate =
    dailyStatuses.length > 0
      ? Math.round(((presentDays + lateDays) / dailyStatuses.length) * 100)
      : 0;

  const recentRecords = studentEntries
    .map((entry) => {
      const session = sessions.find((item) => item.id === entry.sessionId);
      return {
        id: entry.id,
        date: session?.date || "",
        status: entry.status,
        minutes: entry.minutesLate || entry.minutesEarlyLeave || 0,
        reason: entry.excuseReason || entry.note || "",
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 10);

  const trend = dailyStatuses.map((item) => ({
    label: formatTrendLabel(item.date),
    value: item.status === "ABSENT" || item.status === "EXCUSED" ? 0 : 100,
  }));

  return {
    attendanceRate,
    presentDays,
    absentDays,
    lateDays,
    recentRecords,
    trend,
  };
}

