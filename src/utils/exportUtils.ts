// FILE: src/utils/exportUtils.ts

/**
 * Export dashboard data to CSV format
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export dashboard data to JSON format
 */
export function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export dashboard to Excel-compatible format (CSV with UTF-8 BOM)
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content with UTF-8 BOM for Excel
  const BOM = "\uFEFF";
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob with BOM for Excel
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Enhanced export options with title and metadata support
 */
export interface EnhancedExportOptions {
  title?: string;
  subtitle?: string;
  data: Record<string, unknown>[];
  filename: string;
}

/**
 * Export to Excel with title section and metadata
 */
export function exportToExcelWithTitle(options: EnhancedExportOptions) {
  const { title, subtitle, filename } = options;
  const data = Array.isArray(options.data) ? options.data : [];

  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const BOM = "\uFEFF";
  
  const rows: string[] = [];

  // Add title row if provided
  if (title) {
    rows.push(`"${title.replace(/"/g, '""')}"`);
  }

  // Add subtitle/metadata row if provided
  if (subtitle) {
    rows.push(`"${subtitle.replace(/"/g, '""')}"`);
  }

  // Add blank spacer row if title or subtitle exists
  if (title || subtitle) {
    rows.push("");
  }

  // Add header row
  rows.push(headers.join(","));

  // Add data rows
  data.forEach((row) => {
    const rowValues = headers.map((header) => {
      const value = row[header];
      // Handle values with commas or quotes
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(rowValues.join(","));
  });

  const csvContent = rows.join("\n");

  // Create blob with BOM for Excel
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export to CSV with title section and metadata
 */
export function exportToCSVWithTitle(options: EnhancedExportOptions) {
  const { title, subtitle, filename } = options;
  const data = Array.isArray(options.data) ? options.data : [];

  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  const rows: string[] = [];

  // Add title row if provided
  if (title) {
    rows.push(`"${title.replace(/"/g, '""')}"`);
  }

  // Add subtitle/metadata row if provided
  if (subtitle) {
    rows.push(`"${subtitle.replace(/"/g, '""')}"`);
  }

  // Add blank spacer row if title or subtitle exists
  if (title || subtitle) {
    rows.push("");
  }

  // Add header row
  rows.push(headers.join(","));

  // Add data rows
  data.forEach((row) => {
    const rowValues = headers.map((header) => {
      const value = row[header];
      // Handle values with commas or quotes
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(rowValues.join(","));
  });

  const csvContent = rows.join("\n");

  // Create blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export dashboard summary as PDF (using browser print)
 */
export function exportToPDF() {
  // Hide elements that shouldn't be in PDF
  const elementsToHide = document.querySelectorAll(
    ".no-print, button, .hover\\:bg-gray-50",
  );
  elementsToHide.forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // Trigger print dialog
  window.print();

  // Restore hidden elements
  setTimeout(() => {
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }, 100);
}

/**
 * Helper function to download blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
