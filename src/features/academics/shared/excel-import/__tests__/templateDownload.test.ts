import ExcelJS from "exceljs";
import { expect, it } from "vitest";
import { createImportTemplate } from "../templateDownload";
import { readImportBlob } from "../workbookReader";

it.each(["assignment", "assessment"] as const)("generates an empty %s data template with guidance separated", async (module) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readImportBlob(await createImportTemplate({ module, locale: "ar", instructions: [["تعليمات", "مثال"]] })));
  expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["Instructions", "Details", "Questions", "Choices"]);
  expect(workbook.getWorksheet("Questions")!.rowCount).toBe(1);
  expect(workbook.getWorksheet("Choices")!.rowCount).toBe(1);
  expect(workbook.getWorksheet("Details")!.getCell("B2").value).toBe(module);
  expect(workbook.getWorksheet("Instructions")!.getCell("A1").value).toBe("تعليمات");
});
