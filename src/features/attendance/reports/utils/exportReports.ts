import { exportToCSVWithTitle, exportToExcelWithTitle } from "@/utils/exportUtils";
import type {
  AttendanceReportsData,
  AttendanceReportsExportPayload,
  ReportsExportDataset,
} from "../types";

interface ExportParams {
  dataset: ReportsExportDataset;
  report: AttendanceReportsData;
  locale: string;
  yearName: string;
  termName: string;
  scopeName: string;
  dateRange: string;
}

function getCommonMetadata(params: ExportParams) {
  const title = params.locale === "ar" ? "تقارير الحضور" : "Attendance Reports";
  const subtitle = `${params.yearName} - ${params.termName} | ${params.scopeName} | ${params.dateRange}`;
  return { title, subtitle };
}

function buildSummaryRows(report: AttendanceReportsData, locale: string): Record<string, string | number>[] {
  const cardsByKey = new Map(report.overview.cards.map((card) => [card.key, card]));

  if (locale === "ar") {
    return [
      {
        "نسبة الحضور": cardsByKey.get("attendanceRate")?.displayValue || "0%",
        "الحاضرون": cardsByKey.get("presentCount")?.value || 0,
        "الغياب": cardsByKey.get("absentCount")?.value || 0,
        "المعذورون": cardsByKey.get("excusedCount")?.value || 0,
        "التأخير": cardsByKey.get("lateCount")?.value || 0,
        "المغادرة المبكرة": cardsByKey.get("earlyLeaveCount")?.value || 0,
        "الطلاب المعرضون للخطر": cardsByKey.get("riskStudents")?.value || 0,
        "المجموعات تحت الحد": cardsByKey.get("groupsBelowThreshold")?.value || 0,
      },
    ];
  }

  return [
    {
      "Attendance Rate": cardsByKey.get("attendanceRate")?.displayValue || "0%",
      Present: cardsByKey.get("presentCount")?.value || 0,
      Absent: cardsByKey.get("absentCount")?.value || 0,
      Excused: cardsByKey.get("excusedCount")?.value || 0,
      Late: cardsByKey.get("lateCount")?.value || 0,
      "Early Leave": cardsByKey.get("earlyLeaveCount")?.value || 0,
      "Risk Students": cardsByKey.get("riskStudents")?.value || 0,
      "Groups Below Threshold": cardsByKey.get("groupsBelowThreshold")?.value || 0,
    },
  ];
}

function buildDetailedRows(report: AttendanceReportsData, locale: string): Record<string, string | number>[] {
  return report.attendanceRows.map((row) => {
    if (locale === "ar") {
      const exportRow: Record<string, string | number> = {
        "التاريخ": row.date,
        "رقم الطالب": row.studentNumber,
        "الطالب": row.studentNameAr,
        "المرحلة": row.stageNameAr || "-",
        "الصف": row.gradeNameAr || "-",
        "الشعبة": row.sectionNameAr || "-",
        "الفصل": row.classroomNameAr || "-",
        "الحالة": row.status,
        "الحصة": row.periodNameAr || row.periodIndex || "-",
      };
      return exportRow;
    }

    const exportRow: Record<string, string | number> = {
      Date: row.date,
      "Student #": row.studentNumber,
      Student: row.studentNameEn,
      Stage: row.stageNameEn || "-",
      Grade: row.gradeNameEn || "-",
      Section: row.sectionNameEn || "-",
      Classroom: row.classroomNameEn || "-",
      Status: row.status,
      Period: row.periodNameEn || row.periodIndex || "-",
    };
    return exportRow;
  });
}

function buildRiskRows(report: AttendanceReportsData, locale: string): Record<string, string | number>[] {
  return report.riskStudents.map((row) => {
    const flags = row.flags.map((flag) => `${flag.code}:${flag.count}`).join(" | ");

    if (locale === "ar") {
      const exportRow: Record<string, string | number> = {
        "رقم الطالب": row.studentNumber || "-",
        "الطالب": row.studentNameAr,
        "النطاق": row.scopeLabelAr,
        "نسبة الحضور": `${row.attendanceRate.toFixed(1)}%`,
        "مرات الغياب": row.absenceCount,
        "مرات التأخير": row.lateCount,
        "الأعذار المرفوضة": row.rejectedExcuses,
        "نواقص التسجيل": row.missingMarks,
        "المخاطر": flags,
      };
      return exportRow;
    }

    const exportRow: Record<string, string | number> = {
      "Student #": row.studentNumber || "-",
      Student: row.studentNameEn,
      Scope: row.scopeLabelEn,
      "Attendance Rate": `${row.attendanceRate.toFixed(1)}%`,
      Absences: row.absenceCount,
      Late: row.lateCount,
      "Rejected Excuses": row.rejectedExcuses,
      "Missing Marks": row.missingMarks,
      Flags: flags,
    };
    return exportRow;
  });
}

function buildPerformanceRows(report: AttendanceReportsData, locale: string): Record<string, string | number>[] {
  return Object.entries(report.performance).flatMap(([level, rows]) =>
    rows.map((row) => {
      if (locale === "ar") {
        const exportRow: Record<string, string | number> = {
          "المستوى": level,
          "الاسم": row.labelAr,
          "نسبة الحضور": `${row.attendanceRate.toFixed(1)}%`,
          "إجمالي التسجيلات": row.markedCount,
          "الغياب": row.absentCount,
          "التأخير": row.lateCount,
          "المعذور": row.excusedCount,
          "التغير": typeof row.delta === "number" ? row.delta.toFixed(1) : "-",
        };
        return exportRow;
      }

      const exportRow: Record<string, string | number> = {
        Level: level,
        Name: row.labelEn,
        "Attendance Rate": `${row.attendanceRate.toFixed(1)}%`,
        "Marked Count": row.markedCount,
        Absent: row.absentCount,
        Late: row.lateCount,
        Excused: row.excusedCount,
        Delta: typeof row.delta === "number" ? row.delta.toFixed(1) : "-",
      };
      return exportRow;
    })
  );
}

export function buildAttendanceReportsExportPayload(params: ExportParams): AttendanceReportsExportPayload {
  const metadata = getCommonMetadata(params);
  const filename = `attendance-reports_${params.dataset}_${new Date().toISOString().slice(0, 10)}`;

  if (params.dataset === "summary") {
    return { ...metadata, filename, data: buildSummaryRows(params.report, params.locale) };
  }

  if (params.dataset === "risk") {
    return { ...metadata, filename, data: buildRiskRows(params.report, params.locale) };
  }

  if (params.dataset === "performance") {
    return { ...metadata, filename, data: buildPerformanceRows(params.report, params.locale) };
  }

  return { ...metadata, filename, data: buildDetailedRows(params.report, params.locale) };
}

export function exportAttendanceReports(params: ExportParams & { format: "csv" | "excel" }) {
  const payload = buildAttendanceReportsExportPayload(params);
  const normalizedPayload = {
    ...payload,
    data: Array.isArray(payload.data) ? payload.data : [],
  };

  if (params.format === "csv") {
    exportToCSVWithTitle(normalizedPayload);
    return;
  }

  exportToExcelWithTitle(normalizedPayload);
}
