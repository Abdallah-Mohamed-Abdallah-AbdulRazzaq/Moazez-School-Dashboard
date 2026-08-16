"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type ReinforcementExportFormat = "csv" | "json" | "excel";
export type ReinforcementExportLocale = "en" | "ar";

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

export interface ReinforcementExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: ReinforcementExportFormat;
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

export function resolveReinforcementExportLocale(
  locale?: string,
): ReinforcementExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getReinforcementExportLocaleForFormat(
  format: ReinforcementExportFormat,
  locale?: string,
): ReinforcementExportLocale {
  return format === "json" ? "en" : resolveReinforcementExportLocale(locale);
}

export function getReinforcementExportExtension(
  format: ReinforcementExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getReinforcementExportFilename(
  filenameBase: string,
  format: ReinforcementExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getReinforcementExportExtension(format)}`;
}

function buildSubtitle(
  metadata: ExportMetadata | undefined,
  locale: ReinforcementExportLocale,
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

function escapeCsvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function appendTitleRows(rows: string[], title: string, subtitle: string) {
  if (title) rows.push(escapeCsvCell(title));
  if (subtitle) rows.push(escapeCsvCell(subtitle));
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

  const lines: string[] = [];
  if (section.title) {
    lines.push(escapeCsvCell(section.title));
  }

  const transformedRows = transformRowsForExport(section.columns, section.rows);
  const headers = Object.keys(transformedRows[0] || {});
  const csv = convertToCSV(transformedRows, headers).replace(/^\uFEFF/, "");
  lines.push(...csv.split("\n"));
  return lines;
}

export function exportReinforcementData({
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
}: ReinforcementExportOptions): void {
  const exportLocale = getReinforcementExportLocaleForFormat(format, locale);

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

  const hasFlatRows = rows.length > 0 && columns.length > 0;
  const hasSections = sections.some(
    (section) => section.rows.length > 0 && section.columns.length > 0,
  );

  if (!hasFlatRows && !hasSections) {
    alert(emptyMessage);
    return;
  }

  const subtitle = buildSubtitle(metadata, exportLocale);
  const contentRows: string[] = [];
  appendTitleRows(contentRows, title, subtitle);

  if (hasSections) {
    sections.forEach((section, index) => {
      const sectionRows = buildSectionCsv(section);
      if (sectionRows.length === 0) return;
      contentRows.push(...sectionRows);
      if (index < sections.length - 1) {
        contentRows.push("");
      }
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

export function generateReinforcementExportFilename(
  prefix: string,
  suffix?: string,
): string {
  const parts = [prefix];
  if (suffix) parts.push(suffix);
  return parts.join("-");
}

export function formatReinforcementExportDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
}
