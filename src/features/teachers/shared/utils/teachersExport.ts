"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type TeachersExportFormat = "csv" | "json" | "excel";
export type TeachersExportLocale = "en" | "ar";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  yearName?: string;
  termName?: string;
  exportDate?: string;
}

export interface TeachersExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: TeachersExportFormat;
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

export function resolveTeachersExportLocale(
  locale?: string,
): TeachersExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getTeachersExportLocaleForFormat(
  format: TeachersExportFormat,
  locale?: string,
): TeachersExportLocale {
  return format === "json" ? "en" : resolveTeachersExportLocale(locale);
}

export function getTeachersExportExtension(
  format: TeachersExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getTeachersExportFilename(
  filenameBase: string,
  format: TeachersExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getTeachersExportExtension(format)}`;
}

function buildSubtitle(
  metadata: ExportMetadata | undefined,
  locale: TeachersExportLocale,
): string {
  if (!metadata) return "";

  const parts: string[] = [];
  const labels =
    locale === "ar"
      ? {
          year: "السنة",
          term: "الفصل",
          exported: "تاريخ التصدير",
        }
      : {
          year: "Year",
          term: "Term",
          exported: "Exported",
        };

  if (metadata.yearName) parts.push(`${labels.year}: ${metadata.yearName}`);
  if (metadata.termName) parts.push(`${labels.term}: ${metadata.termName}`);
  if (metadata.exportDate) {
    parts.push(`${labels.exported}: ${metadata.exportDate}`);
  }

  return parts.join(" | ");
}

function appendTitleRows(rows: string[], title: string, subtitle: string) {
  if (title) {
    rows.push(`"${title.replace(/"/g, '""')}"`);
  }
  if (subtitle) {
    rows.push(`"${subtitle.replace(/"/g, '""')}"`);
  }
  if (title || subtitle) {
    rows.push("");
  }
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

export function downloadTeachersExport({
  data,
  format,
  filenameBase,
  emptyMessage = "No data to export",
}: {
  data: Record<string, unknown>[] | Record<string, unknown>;
  format: TeachersExportFormat;
  filenameBase: string;
  emptyMessage?: string;
}) {
  const filename = getTeachersExportFilename(filenameBase, format);
  const records = Array.isArray(data) ? data : [data];

  if (records.length === 0) {
    alert(emptyMessage);
    return;
  }

  if (format === "json") {
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8;",
      }),
      filename,
    );
    return;
  }

  const csv = convertToCSV(records);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function exportTeachersData({
  title,
  metadata,
  filename,
  format,
  columns = [],
  rows = [],
  jsonData,
  locale = "en",
  emptyMessage = "No data to export",
}: TeachersExportOptions): void {
  const exportLocale = getTeachersExportLocaleForFormat(format, locale);

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

export function generateTeachersExportFilename(
  prefix: string,
  termId?: string,
): string {
  const parts = [prefix];
  if (termId) parts.push(termId);
  return parts.join("-");
}

export function formatTeachersExportDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
}
