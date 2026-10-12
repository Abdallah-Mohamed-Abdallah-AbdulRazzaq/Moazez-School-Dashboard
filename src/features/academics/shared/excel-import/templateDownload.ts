import { importSchemas, templateDefaults } from "./templateSchemas";
import type { ImportLocale, ImportModule } from "./types";

export async function createImportTemplate(request: { module: ImportModule; locale: ImportLocale; instructions: string[][] }): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const guide = workbook.addWorksheet("Instructions");
  guide.addRows(request.instructions);
  guide.columns = [{ width: 32 }, { width: 100 }];
  for (const schema of importSchemas(request.module)) {
    const sheet = workbook.addWorksheet(schema.name);
    sheet.columns = schema.columns.map((field) => ({ header: field, key: field, width: field.includes("Text") || field.includes("Answer") ? 40 : 24 }));
    sheet.views = [{ state: "frozen", ySplit: 1, rightToLeft: request.locale === "ar" }];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    if (schema.name === "Details") sheet.addRow(templateDefaults(request.module));
    for (const field of ["dueAt", "date"]) if (schema.columns.includes(field)) sheet.getColumn(field).numFmt = "@";
  }
  const bytes = await workbook.xlsx.writeBuffer();
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(new Uint8Array(bytes));
  return new Blob([copied.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadImportTemplate(request: { blob: Blob; filename: string }): void {
  const url = URL.createObjectURL(request.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = request.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
