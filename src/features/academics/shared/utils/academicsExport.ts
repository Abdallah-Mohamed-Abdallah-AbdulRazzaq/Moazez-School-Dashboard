"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type AcademicsExportFormat = "csv" | "json" | "excel";
export type AcademicsExportLocale = "en" | "ar";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  stageName?: string;
  yearName?: string;
  termName?: string;
  gradeName?: string;
  sectionName?: string;
  classroomName?: string;
  configSource?: string;
  exportDate?: string;
}

export interface AcademicsExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: AcademicsExportFormat;
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

export function resolveAcademicsExportLocale(
  locale?: string,
): AcademicsExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getAcademicsExportLocaleForFormat(
  format: AcademicsExportFormat,
  locale?: string,
): AcademicsExportLocale {
  return format === "json" ? "en" : resolveAcademicsExportLocale(locale);
}

export function getAcademicsExportExtension(
  format: AcademicsExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getAcademicsExportFilename(
  filenameBase: string,
  format: AcademicsExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getAcademicsExportExtension(format)}`;
}

function buildSubtitle(
  metadata: ExportMetadata | undefined,
  locale: AcademicsExportLocale,
): string {
  if (!metadata) return "";

  const parts: string[] = [];
  const labels =
    locale === "ar"
      ? {
          year: "السنة",
          stage: "المرحلة",
          term: "الفصل",
          grade: "الصف",
          section: "الشعبة",
          classroom: "الفصل",
          configSource: "مصدر الإعدادات",
          exported: "تاريخ التصدير",
        }
      : {
          year: "Year",
          stage: "Stage",
          term: "Term",
          grade: "Grade",
          section: "Section",
          classroom: "Classroom",
          configSource: "Config source",
          exported: "Exported",
        };

  if (metadata.yearName) parts.push(`${labels.year}: ${metadata.yearName}`);
  if (metadata.stageName) parts.push(`${labels.stage}: ${metadata.stageName}`);
  if (metadata.termName) parts.push(`${labels.term}: ${metadata.termName}`);
  if (metadata.gradeName) parts.push(`${labels.grade}: ${metadata.gradeName}`);
  if (metadata.sectionName) {
    parts.push(`${labels.section}: ${metadata.sectionName}`);
  }
  if (metadata.classroomName) {
    parts.push(`${labels.classroom}: ${metadata.classroomName}`);
  }
  if (metadata.configSource) {
    parts.push(`${labels.configSource}: ${metadata.configSource}`);
  }
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

export function downloadAcademicsExport({
  data,
  format,
  filenameBase,
  emptyMessage = "No data to export",
}: {
  data: Record<string, unknown>[] | Record<string, unknown>;
  format: AcademicsExportFormat;
  filenameBase: string;
  emptyMessage?: string;
}) {
  const filename = getAcademicsExportFilename(filenameBase, format);
  const records = Array.isArray(data) ? data : [data];

  if (records.length === 0) {
    throw new Error(emptyMessage);
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

export function exportAcademicsData({
  title,
  metadata,
  filename,
  format,
  columns = [],
  rows = [],
  jsonData,
  locale = "en",
  emptyMessage = "No data to export",
}: AcademicsExportOptions): void {
  const exportLocale = getAcademicsExportLocaleForFormat(format, locale);

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
      throw new Error(emptyMessage);
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
    throw new Error(emptyMessage);
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

export function generateExportFilename(
  prefix: string,
  termId?: string,
  gradeId?: string,
): string {
  const parts = [prefix];

  if (termId) parts.push(termId);
  if (gradeId) parts.push(gradeId);

  return parts.join("-");
}

export function formatExportDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
}
