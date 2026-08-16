"use client";

import { convertToCSV } from "@/features/admissions/applications/utils/admissionsExportUtils";

export type AdmissionsExportFormat = "csv" | "json" | "excel";

interface DownloadAdmissionsExportOptions {
  data: Record<string, unknown>[] | Record<string, unknown>;
  format: AdmissionsExportFormat;
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

export function getAdmissionsExportExtension(
  format: AdmissionsExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function getAdmissionsExportFilename(
  filenameBase: string,
  format: AdmissionsExportFormat,
): string {
  const exportDate = new Date().toISOString().split("T")[0];
  return `${filenameBase}-${exportDate}.${getAdmissionsExportExtension(format)}`;
}

export function getServerExportFormat(
  format: AdmissionsExportFormat,
): "csv" | "json" {
  return format === "json" ? "json" : "csv";
}

export function downloadAdmissionsExport({
  data,
  format,
  filenameBase,
  emptyMessage = "No data to export",
}: DownloadAdmissionsExportOptions) {
  const records = Array.isArray(data) ? data : [data];

  if (records.length === 0) {
    alert(emptyMessage);
    return;
  }

  const filename = getAdmissionsExportFilename(filenameBase, format);

  if (format === "json") {
    const json = JSON.stringify(Array.isArray(data) ? data : data, null, 2);
    downloadBlob(
      new Blob([json], { type: "application/json;charset=utf-8;" }),
      filename,
    );
    return;
  }

  const csv = convertToCSV(records);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function downloadAdmissionsExportResponse(
  response: Response,
  fallbackFilenameBase: string,
  format: AdmissionsExportFormat,
) {
  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const fallbackFilename = getAdmissionsExportFilename(
    fallbackFilenameBase,
    format,
  );

  downloadBlob(blob, filenameMatch?.[1] || fallbackFilename);
}
