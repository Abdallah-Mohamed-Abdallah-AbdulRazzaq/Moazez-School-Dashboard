import { exportToCSVWithTitle, exportToExcelWithTitle } from "@/utils/exportUtils";
import type { Incident } from "../types";

interface ExportMetadata {
  yearName: string;
  termName: string;
  scopeName: string;
  dateRange: string;
}

export function exportLateEarly(
  records: Incident[],
  locale: string,
  format: "csv" | "excel",
  metadata: ExportMetadata
) {
  const isArabic = locale === "ar";
  const title = isArabic ? "التأخير والمغادرة المبكرة" : "Late & Early Leave";
  const subtitle = `${metadata.yearName} - ${metadata.termName} | ${metadata.scopeName} | ${metadata.dateRange}`;

  const data = records.map((record) => {
    if (isArabic) {
      return {
        "التاريخ": record.date,
        "الحصة": record.periodNameAr || record.periodNameEn ||
          (record.periodIndex ? `P${record.periodIndex}` : record.periodKey || "-"),
        "رقم الطالب": record.studentNumber || "-",
        "الطالب": record.studentNameAr,
        "الصف": record.gradeNameAr || record.gradeNameEn || "-",
        "الشعبة": record.sectionNameAr || record.sectionNameEn || "-",
        "النوع": record.type === "LATE" ? "تأخير" : "مغادرة مبكرة",
        "الدقائق": record.minutes,
        "الحد": typeof record.threshold === "number" ? record.threshold : "-",
        "مخالفة": record.isViolation === null ? "غير معروف" : record.isViolation ? "نعم" : "لا",
      };
    }

    return {
      Date: record.date,
      Period: record.periodNameEn || record.periodNameAr ||
        (record.periodIndex ? `P${record.periodIndex}` : record.periodKey || "-"),
      "Student #": record.studentNumber || "-",
      Student: record.studentNameEn,
      Grade: record.gradeNameEn || record.gradeNameAr || "-",
      Section: record.sectionNameEn || record.sectionNameAr || "-",
      Type: record.type === "LATE" ? "Late" : "Early Leave",
      Minutes: record.minutes,
      Threshold: typeof record.threshold === "number" ? record.threshold : "-",
      Violation: record.isViolation === null ? "Unknown" : record.isViolation ? "Yes" : "No",
    };
  });

  const filename = `late-early_${metadata.termName}_${new Date().toISOString().split("T")[0]}`;

  if (format === "csv") {
    exportToCSVWithTitle({ title, subtitle, data, filename });
    return;
  }

  exportToExcelWithTitle({ title, subtitle, data, filename });
}
