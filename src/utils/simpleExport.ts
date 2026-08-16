// FILE: src/utils/simpleExport.ts

/**
 * Simple client-side export utility for sub-tab pages
 * Exports filtered data directly without API calls
 */

/**
 * Convert data to CSV with UTF-8 BOM for Excel Arabic support
 */
function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = keys.join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(","),
  );

  // Add UTF-8 BOM for proper Excel Arabic support
  const BOM = "\uFEFF";
  return BOM + [headerRow, ...dataRows].join("\n");
}

/**
 * Download data as CSV file
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  prefix: string,
  extension: "csv" | "json",
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}-${timestamp}.${extension}`;
}
