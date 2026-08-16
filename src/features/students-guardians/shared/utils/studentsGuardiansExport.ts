"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type StudentsGuardiansExportFormat = "csv" | "json" | "excel";
export type StudentsGuardiansExportLocale = "en" | "ar";

interface DownloadStudentsGuardiansExportOptions {
  data: Record<string, unknown>[] | Record<string, unknown>;
  format: StudentsGuardiansExportFormat;
  filenameBase: string;
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

export function resolveStudentsGuardiansExportLocale(
  locale?: string,
): StudentsGuardiansExportLocale {
  return locale === "ar" ? "ar" : "en";
}

export function getStudentsGuardiansExportLocaleForFormat(
  format: StudentsGuardiansExportFormat,
  locale?: string,
): StudentsGuardiansExportLocale {
  return format === "json"
    ? "en"
    : resolveStudentsGuardiansExportLocale(locale);
}

export function getStudentsGuardiansExportExtension(
  format: StudentsGuardiansExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getStudentsGuardiansExportFilename(
  filenameBase: string,
  format: StudentsGuardiansExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getStudentsGuardiansExportExtension(format)}`;
}

export function downloadStudentsGuardiansExport({
  data,
  format,
  filenameBase,
  emptyMessage = "No data to export",
}: DownloadStudentsGuardiansExportOptions) {
  const records = Array.isArray(data) ? data : [data];

  if (records.length === 0) {
    alert(emptyMessage);
    return;
  }

  const filename = getStudentsGuardiansExportFilename(filenameBase, format);

  if (format === "json") {
    const json = JSON.stringify(data, null, 2);
    downloadBlob(
      new Blob([json], { type: "application/json;charset=utf-8;" }),
      filename,
    );
    return;
  }

  const csv = convertToCSV(records);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}
