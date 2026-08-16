import { PrintDocument } from "@/components/print";

interface AttendanceReportPrintDocumentProps {
  title: string;
  subtitle: string;
  locale: string;
  academicYear: string;
  term: string;
  scope: string;
  dateRange: string;
  rows: Record<string, unknown>[];
}

export default function AttendanceReportPrintDocument({
  title,
  subtitle,
  locale,
  academicYear,
  term,
  scope,
  dateRange,
  rows,
}: AttendanceReportPrintDocumentProps) {
  const columns = Object.keys(rows[0] || {});
  const isArabic = locale === "ar";

  return (
    <PrintDocument
      title={title}
      locale={locale}
      subtitle={subtitle}
      metadata={[
        { label: isArabic ? "السنة الدراسية" : "Academic year", value: academicYear },
        { label: isArabic ? "الفصل الدراسي" : "Term", value: term },
        { label: isArabic ? "النطاق" : "Scope", value: scope },
        {
          label: isArabic ? "الفترة" : "Date range",
          value: <bdi className="print-document__date-range" dir="ltr">{dateRange}</bdi>,
        },
      ]}
    >
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </PrintDocument>
  );
}
