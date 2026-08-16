"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type AttendanceExportFormat = "csv" | "json" | "excel";
export type AttendanceExportLocale = "en" | "ar";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  yearName?: string;
  termName?: string;
  scopeTypeName?: string;
  scopeName?: string;
  dateLabel?: string;
  viewName?: string;
  datasetName?: string;
  exportDate?: string;
}

export interface AttendanceExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: AttendanceExportFormat;
  columns?: ExportColumn[];
  rows?: Record<string, unknown>[];
  jsonData?: Record<string, unknown> | Record<string, unknown>[];
  locale?: string;
  emptyMessage?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function resolveAttendanceExportLocale(
  locale?: string,
): AttendanceExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getAttendanceExportLocaleForFormat(
  format: AttendanceExportFormat,
  locale?: string,
): AttendanceExportLocale {
  return format === "json" ? "en" : resolveAttendanceExportLocale(locale);
}

export function getAttendanceExportExtension(
  format: AttendanceExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getAttendanceExportFilename(
  filenameBase: string,
  format: AttendanceExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getAttendanceExportExtension(format)}`;
}

function buildSubtitle(
  metadata: ExportMetadata | undefined,
  locale: AttendanceExportLocale,
): string {
  if (!metadata) return "";

  const parts: string[] = [];
  const labels =
    locale === "ar"
      ? {
          year: "السنة",
          term: "الفصل",
          scopeType: "نوع النطاق",
          scope: "النطاق",
          date: "الفترة",
          view: "العرض",
          dataset: "مجموعة البيانات",
          exported: "تاريخ التصدير",
        }
      : {
          year: "Year",
          term: "Term",
          scopeType: "Scope type",
          scope: "Scope",
          date: "Date range",
          view: "View",
          dataset: "Dataset",
          exported: "Exported",
        };

  if (metadata.yearName) parts.push(`${labels.year}: ${metadata.yearName}`);
  if (metadata.termName) parts.push(`${labels.term}: ${metadata.termName}`);
  if (metadata.scopeTypeName) {
    parts.push(`${labels.scopeType}: ${metadata.scopeTypeName}`);
  }
  if (metadata.scopeName) parts.push(`${labels.scope}: ${metadata.scopeName}`);
  if (metadata.dateLabel) parts.push(`${labels.date}: ${metadata.dateLabel}`);
  if (metadata.viewName) parts.push(`${labels.view}: ${metadata.viewName}`);
  if (metadata.datasetName) {
    parts.push(`${labels.dataset}: ${metadata.datasetName}`);
  }
  if (metadata.exportDate) {
    parts.push(`${labels.exported}: ${metadata.exportDate}`);
  }

  return parts.join(" | ");
}

function appendTitleRows(rows: string[], title: string, subtitle: string) {
  if (title) rows.push(`"${title.replace(/"/g, '""')}"`);
  if (subtitle) rows.push(`"${subtitle.replace(/"/g, '""')}"`);
  if (title || subtitle) rows.push("");
}

function transformRowsForExport(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const transformedRow: Record<string, unknown> = {};
    columns.forEach((column) => {
      transformedRow[column.label] = row[column.key] ?? "";
    });
    return transformedRow;
  });
}

export function exportAttendanceData({
  title,
  metadata,
  filename,
  format,
  columns = [],
  rows = [],
  jsonData,
  locale = "en",
  emptyMessage = "No data to export",
}: AttendanceExportOptions): void {
  const exportLocale = getAttendanceExportLocaleForFormat(format, locale);

  if (format === "json") {
    const data =
      jsonData ??
      ({
        title,
        metadata: metadata || {},
        rows,
      } as Record<string, unknown>);

    const records = Array.isArray(data) ? data : [data];
    if (records.length === 0) {
      alert(emptyMessage);
      return;
    }

    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8;",
      }),
      `${filename}.json`,
    );
    return;
  }

  if (rows.length === 0 || columns.length === 0) {
    alert(emptyMessage);
    return;
  }

  const transformedRows = transformRowsForExport(columns, rows);
  const subtitle = buildSubtitle(metadata, exportLocale);
  const headers = Object.keys(transformedRows[0] || {});
  const dataCsv = convertToCSV(transformedRows, headers);
  const dataWithoutBom = dataCsv.replace(/^\uFEFF/, "");
  const csvRows = dataWithoutBom.split("\n");
  const contentRows: string[] = [];

  appendTitleRows(contentRows, title, subtitle);
  contentRows.push(...csvRows);

  const finalContent = `\uFEFF${contentRows.join("\n")}`;

  downloadBlob(
    new Blob([finalContent], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`,
  );
}

export function generateAttendanceExportFilename(
  prefix: string,
  termId?: string,
  scopeSuffix?: string,
): string {
  const parts = [prefix];
  if (termId) parts.push(termId);
  if (scopeSuffix) parts.push(scopeSuffix);
  return parts.join("-");
}

export function formatAttendanceExportDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
}
