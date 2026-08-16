"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type NedaaExportFormat = "csv" | "json" | "excel";
export type NedaaExportLocale = "en" | "ar";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  yearName?: string;
  termName?: string;
  viewName?: string;
  datasetName?: string;
  exportDate?: string;
}

export interface ExportSection {
  title?: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

export interface NedaaExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: NedaaExportFormat;
  columns?: ExportColumn[];
  rows?: Record<string, unknown>[];
  sections?: ExportSection[];
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

export function resolveNedaaExportLocale(locale?: string): NedaaExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getNedaaExportLocaleForFormat(
  format: NedaaExportFormat,
  locale?: string,
): NedaaExportLocale {
  return format === "json" ? "en" : resolveNedaaExportLocale(locale);
}

export function getNedaaExportExtension(
  format: NedaaExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getNedaaExportFilename(
  filenameBase: string,
  format: NedaaExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getNedaaExportExtension(format)}`;
}

function buildSubtitle(
  metadata: ExportMetadata | undefined,
  locale: NedaaExportLocale,
): string {
  if (!metadata) return "";

  const parts: string[] = [];
  const labels =
    locale === "ar"
      ? {
          year: "السنة",
          term: "الفصل",
          view: "العرض",
          dataset: "مجموعة البيانات",
          exported: "تاريخ التصدير",
        }
      : {
          year: "Year",
          term: "Term",
          view: "View",
          dataset: "Dataset",
          exported: "Exported",
        };

  if (metadata.yearName) parts.push(`${labels.year}: ${metadata.yearName}`);
  if (metadata.termName) parts.push(`${labels.term}: ${metadata.termName}`);
  if (metadata.viewName) parts.push(`${labels.view}: ${metadata.viewName}`);
  if (metadata.datasetName) parts.push(`${labels.dataset}: ${metadata.datasetName}`);
  if (metadata.exportDate) parts.push(`${labels.exported}: ${metadata.exportDate}`);

  return parts.join(" | ");
}

function appendTitleRows(rows: string[], title?: string, subtitle?: string) {
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

function buildSectionCsv(section: ExportSection): string[] {
  if (section.rows.length === 0 || section.columns.length === 0) {
    return [];
  }

  const transformedRows = transformRowsForExport(section.columns, section.rows);
  const headers = Object.keys(transformedRows[0] || {});
  const dataCsv = convertToCSV(transformedRows, headers).replace(/^\uFEFF/, "");
  const lines = dataCsv.split("\n");
  const contentRows: string[] = [];

  if (section.title) {
    contentRows.push(`"${section.title.replace(/"/g, '""')}"`);
  }
  contentRows.push(...lines);
  contentRows.push("");

  return contentRows;
}

export function exportNedaaData({
  title,
  metadata,
  filename,
  format,
  columns = [],
  rows = [],
  sections = [],
  jsonData,
  locale = "en",
  emptyMessage = "No data to export",
}: NedaaExportOptions): void {
  const exportLocale = getNedaaExportLocaleForFormat(format, locale);

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

  const hasSectionData = sections.some(
    (section) => section.rows.length > 0 && section.columns.length > 0,
  );
  const hasFlatData = rows.length > 0 && columns.length > 0;

  if (!hasSectionData && !hasFlatData) {
    alert(emptyMessage);
    return;
  }

  const subtitle = buildSubtitle(metadata, exportLocale);
  const contentRows: string[] = [];
  appendTitleRows(contentRows, title, subtitle);

  if (hasSectionData) {
    sections.forEach((section) => {
      contentRows.push(...buildSectionCsv(section));
    });
  } else {
    const transformedRows = transformRowsForExport(columns, rows);
    const headers = Object.keys(transformedRows[0] || {});
    const dataCsv = convertToCSV(transformedRows, headers).replace(/^\uFEFF/, "");
    contentRows.push(...dataCsv.split("\n"));
  }

  const finalContent = `\uFEFF${contentRows.join("\n")}`;
  downloadBlob(
    new Blob([finalContent], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`,
  );
}

export function generateNedaaExportFilename(
  prefix: string,
  termId?: string | null,
): string {
  const parts = [prefix];
  if (termId) parts.push(termId);
  return parts.join("-");
}

export function formatNedaaExportDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
}
