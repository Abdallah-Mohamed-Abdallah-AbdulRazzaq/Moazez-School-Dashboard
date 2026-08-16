import { exportToCSVWithTitle, exportToExcelWithTitle } from "@/utils/exportUtils";
import type { ExcuseRequest } from "../types";

interface ExportMetadata {
  yearName: string;
  termName: string;
  scopeName: string;
  dateRange: string;
}

export function exportExcuses(
  records: ExcuseRequest[],
  locale: string,
  format: "csv" | "excel",
  metadata: ExportMetadata
) {
  const isArabic = locale === "ar";
  const title = isArabic ? "الأعذار" : "Excuses";
  const subtitle = `${metadata.yearName} - ${metadata.termName} | ${metadata.scopeName} | ${metadata.dateRange}`;

  const data = records.map((record) => {
    const typeLabel =
      record.type === "ABSENCE"
        ? isArabic
          ? "غياب"
          : "Absence"
        : record.type === "LATE"
          ? isArabic
            ? "تأخير"
            : "Late"
          : isArabic
            ? "مغادرة مبكرة"
            : "Early Leave";

    const statusLabel =
      record.status === "PENDING"
        ? isArabic
          ? "قيد الانتظار"
          : "Pending"
        : record.status === "APPROVED"
          ? isArabic
            ? "مقبول"
            : "Approved"
          : isArabic
            ? "مرفوض"
            : "Rejected";

    if (isArabic) {
      return {
        "تاريخ الطلب": record.createdAt.split("T")[0],
        "رقم الطالب": record.studentNumber || "-",
        "الطالب": record.studentNameAr,
        "النوع": typeLabel,
        "النطاق": `${record.dateFrom} → ${record.dateTo}`,
        "المرفقات": record.attachments.length,
        "الحالة": statusLabel,
      };
    }

    return {
      "Submitted At": record.createdAt.split("T")[0],
      "Student #": record.studentNumber || "-",
      Student: record.studentNameEn,
      Type: typeLabel,
      Range: `${record.dateFrom} -> ${record.dateTo}`,
      Attachments: record.attachments.length,
      Status: statusLabel,
    };
  });

  const filename = `attendance-excuses_${metadata.termName}_${new Date().toISOString().split("T")[0]}`;

  if (format === "csv") {
    exportToCSVWithTitle({ title, subtitle, data, filename });
    return;
  }

  exportToExcelWithTitle({ title, subtitle, data, filename });
}
