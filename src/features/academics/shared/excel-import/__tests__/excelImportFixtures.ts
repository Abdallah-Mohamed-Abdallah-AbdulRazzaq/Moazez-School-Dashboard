import ExcelJS from "exceljs";
import { createImportTemplate } from "../templateDownload";
import { readImportBlob } from "../workbookReader";
import type { ImportCell, ImportModule } from "../types";

export const fixtureContext = { now: new Date("2099-01-01T00:00:00Z"), termStart: "2099-01-01", termEnd: "2099-12-31" };
export async function workbookFile(workbook: ExcelJS.Workbook): Promise<File> {
  const bytes = await workbook.xlsx.writeBuffer();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(new Uint8Array(bytes));
  return new File([copy.buffer], "import.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
export function setSheetRow(sheet: ExcelJS.Worksheet, row: number, fields: Record<string, ImportCell>) {
  const headers = sheet.getRow(1).values as string[];
  for (const [field, cellValue] of Object.entries(fields)) sheet.getCell(row, headers.indexOf(field)).value = cellValue;
}
export async function fixtureWorkbook(module: ImportModule = "assignment"): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const template = await createImportTemplate({ module, locale: "en", instructions: [] });
  await workbook.xlsx.load(await readImportBlob(template));
  const details: Record<string, ImportCell> = module === "assignment"
    ? { title: "Practice", dueAt: "2099-01-02T12:00:00Z", totalMarks: 2 }
    : { titleAr: "اختبار", titleEn: "Assessment", type: "QUIZ", date: "2099-01-02", weight: 0.5, maxScore: 2 };
  setSheetRow(workbook.getWorksheet("Details")!, 2, details);
  const prompt: Record<string, ImportCell> = module === "assignment" ? { questionText: "Is 2 even?" } : { questionTextAr: "هل ٢ زوجي؟", questionTextEn: "Is 2 even?" };
  setSheetRow(workbook.getWorksheet("Questions")!, 2, { questionNumber: 1, questionType: "TRUE_FALSE", points: 2, correctAnswer: false, ...prompt });
  return workbook;
}
export async function assignmentWorkbookFile() { return workbookFile(await fixtureWorkbook()); }
