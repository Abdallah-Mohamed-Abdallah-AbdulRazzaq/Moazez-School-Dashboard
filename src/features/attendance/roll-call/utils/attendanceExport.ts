// Attendance Export Utilities

import { exportToExcelWithTitle } from "@/utils/exportUtils";
import type { AttendanceSession, AttendanceEntry, RosterStudent, AttendanceStatus } from "../types";

export interface ExportAttendanceOptions {
  session: AttendanceSession;
  entries: AttendanceEntry[];
  roster: RosterStudent[];
  locale: string;
  scopeName: string;
}

/**
 * Export attendance session to Excel
 */
export function exportAttendanceSession(options: ExportAttendanceOptions) {
  const { session, entries, roster, locale, scopeName } = options;

  const isArabic = locale === "ar";

  // Build title
  const modeLabel = session.mode === "DAILY" 
    ? (isArabic ? "حضور يومي" : "Daily Attendance")
    : (isArabic ? `حضور الحصة ${session.periodIndex}` : `Period ${session.periodIndex} Attendance`);

  const title = isArabic
    ? `${modeLabel} - ${scopeName}`
    : `${modeLabel} - ${scopeName}`;

  const subtitle = isArabic
    ? `التاريخ: ${session.date} | الحالة: ${session.status === "DRAFT" ? "مسودة" : "مقدم"}`
    : `Date: ${session.date} | Status: ${session.status === "DRAFT" ? "Draft" : "Submitted"}`;

  // Build data rows
  const data = roster.map((student) => {
    const entry = entries.find((e) => e.studentId === student.id);

    const statusLabel = entry?.status
      ? getStatusLabel(entry.status, isArabic)
      : (isArabic ? "غير محدد" : "Unmarked");

    const row: Record<string, unknown> = isArabic
      ? {
          "رقم الطالب": student.studentNumber,
          "الاسم": student.nameAr,
          "الحالة": statusLabel,
          "دقائق التأخير": entry?.minutesLate || "",
          "دقائق المغادرة المبكرة": entry?.minutesEarlyLeave || "",
          "ملاحظات": entry?.note || "",
        }
      : {
          "Student Number": student.studentNumber,
          "Name": student.nameEn,
          "Status": statusLabel,
          "Minutes Late": entry?.minutesLate || "",
          "Minutes Early Leave": entry?.minutesEarlyLeave || "",
          "Notes": entry?.note || "",
        };

    return row;
  });

  // Generate filename
  const dateStr = session.date.replace(/-/g, "");
  const modeStr = session.mode === "DAILY" ? "daily" : `period${session.periodIndex}`;
  const filename = `attendance_${modeStr}_${dateStr}_${Date.now()}`;

  // Export
  exportToExcelWithTitle({
    title,
    subtitle,
    data,
    filename,
  });
}

/**
 * Get status label in locale
 */
function getStatusLabel(status: AttendanceStatus, isArabic: boolean): string {
  const labels: Record<AttendanceStatus, { ar: string; en: string }> = {
    PRESENT: { ar: "حاضر", en: "Present" },
    ABSENT: { ar: "غائب", en: "Absent" },
    LATE: { ar: "متأخر", en: "Late" },
    EXCUSED: { ar: "غياب بعذر", en: "Excused" },
    EARLY_LEAVE: { ar: "مغادرة مبكرة", en: "Early Leave" },
    UNMARKED: { ar: "غير محدد", en: "Unmarked" },
  };

  return isArabic ? labels[status].ar : labels[status].en;
}
