// Export absences to Excel

import type { AbsenceRecord } from "../types";
import { exportToExcelWithTitle } from "@/utils/exportUtils";

export function exportAbsencesToExcel(
  records: AbsenceRecord[],
  locale: string,
  metadata: {
    yearName: string;
    termName: string;
    scopeName: string;
    dateRange: string;
  }
) {
  const isArabic = locale === "ar";

  const title = isArabic ? "الغياب والإجازات" : "Absences & Leaves";
  const subtitle = isArabic
    ? `${metadata.yearName} - ${metadata.termName} | ${metadata.scopeName} | ${metadata.dateRange}`
    : `${metadata.yearName} - ${metadata.termName} | ${metadata.scopeName} | ${metadata.dateRange}`;

  const data = records.map((r) => {
    const row: Record<string, unknown> = isArabic
      ? {
          "التاريخ": r.date,
          "رقم الطالب": r.studentNumber,
          "اسم الطالب": r.studentNameAr,
          "الصف": r.gradeNameAr || r.gradeNameEn || "-",
          "الشعبة": r.sectionNameAr || r.sectionNameEn || "-",
          "النوع": r.granularity === "DAILY_DERIVED" ? "يومي مشتق" : r.granularity === "DAILY" ? "يومي" : "حصة",
          "الحصة": r.periodNameAr || r.periodNameEn ||
            (r.periodIndex ? `P${r.periodIndex}` : r.periodKey || "-"),
          "الدقائق": r.minutesLate || r.minutesEarlyLeave || "-",
          "العذر": r.excuse ? "نعم" : "لا",
        }
      : {
          "Date": r.date,
          "Student #": r.studentNumber,
          "Student Name": r.studentNameEn,
          "Grade": r.gradeNameAr || r.gradeNameEn || "-",
          "Section": r.sectionNameAr || r.sectionNameEn || "-",
          "Type": r.granularity === "DAILY_DERIVED" ? "Daily Derived" : r.granularity === "DAILY" ? "Daily" : "Period",
          "Period": r.periodNameEn || r.periodNameAr ||
            (r.periodIndex ? `P${r.periodIndex}` : r.periodKey || "-"),
          "Minutes": r.minutesLate || r.minutesEarlyLeave || "-",
          "Excuse": r.excuse ? "Yes" : "No",
        };

    return row;
  });

  const fileName = `attendance-absences_${metadata.termName}_${new Date().toISOString().split("T")[0]}`;

  exportToExcelWithTitle({
    title,
    subtitle,
    data,
    filename: fileName,
  });
}
