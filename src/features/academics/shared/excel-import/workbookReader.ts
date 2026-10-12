import type { CellValue, Row, Worksheet, Workbook } from "exceljs";
import { importSchemas, MAX_IMPORT_BYTES, type ImportSheetSchema } from "./templateSchemas";
import type { ImportCell, ImportIssue, ImportModule, ImportRow, ImportValidation, ImportWorkbookRows } from "./types";

export function readImportBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new DOMException("Read aborted", "AbortError"));
    reader.readAsArrayBuffer(blob);
  });
}

export function importIssue(sheet: ImportIssue["sheet"], row: number, field: string, error: string): ImportIssue {
  return { sheet, row, field, messageKey: `academics.excelImport.errors.${error}` };
}

function primitiveCell(cell: CellValue): cell is ImportCell {
  return cell == null || ["string", "number", "boolean"].includes(typeof cell);
}

function sheetHeaders(sheet: Worksheet, schema: ImportSheetSchema) {
  const headers: string[] = [];
  const issues: ImportIssue[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
    const header = typeof cell.value === "string" ? cell.value.trim() : "";
    if (header && headers.includes(header)) issues.push(importIssue(schema.name, 1, header, "duplicateHeader"));
    headers[column] = header;
  });
  for (const field of schema.required) {
    if (!headers.includes(field)) issues.push(importIssue(schema.name, 1, field, "missingColumn"));
  }
  return { headers, issues };
}

function readSheetRow(request: { row: Row; schema: ImportSheetSchema; headers: string[] }) {
  const cells: Record<string, ImportCell> = Object.create(null);
  const issues: ImportIssue[] = [];
  request.row.eachCell({ includeEmpty: true }, (cell, column) => {
    const field = request.headers[column] || `Column ${column}`;
    if (!primitiveCell(cell.value)) {
      issues.push(importIssue(request.schema.name, request.row.number, field, "primitiveCell"));
    } else if (!request.schema.columns.includes(field)) {
      if (cell.value != null && cell.value !== "") issues.push(importIssue(request.schema.name, request.row.number, field, "unknownColumn"));
    } else cells[field] = cell.value ?? null;
  });
  return { row: { rowNumber: request.row.number, cells }, issues };
}

function readSheet(sheet: Worksheet | undefined, schema: ImportSheetSchema) {
  if (!sheet) return { rows: [], issues: [importIssue(schema.name, 1, "", "missingSheet")] };
  const headerRead = sheetHeaders(sheet, schema);
  const rows: ImportRow[] = [];
  const issues = [...headerRead.issues];
  sheet.eachRow((row) => {
    if (row.number === 1 || !rowHasContent(row)) return;
    if (rows.length >= schema.maxRows) {
      if (!issues.some((issue) => issue.messageKey.endsWith(".rowLimit"))) issues.push(importIssue(schema.name, row.number, "", "rowLimit"));
      return;
    }
    const rowRead = readSheetRow({ row, schema, headers: headerRead.headers });
    rows.push(rowRead.row);
    issues.push(...rowRead.issues);
  });
  return { rows, issues };
}

function rowHasContent(row: Row): boolean {
  return (row.values as CellValue[]).some((cell) => cell != null && (typeof cell !== "string" || Boolean(cell.trim())));
}

function workbookRows(workbook: Workbook, module: ImportModule): ImportValidation<ImportWorkbookRows> {
  const [details, questions, choices] = importSchemas(module).map((schema) => readSheet(workbook.getWorksheet(schema.name), schema));
  const issues = [...details.issues, ...questions.issues, ...choices.issues];
  if (!details.rows[0]) issues.push(importIssue("Details", 2, "", "required"));
  if (!questions.rows.length) issues.push(importIssue("Questions", 2, "", "questionsRequired"));
  if (issues.length) return { kind: "invalid", issues };
  const metadata = details.rows[0];
  if (String(metadata.cells.templateVersion).trim() !== "1") issues.push(importIssue("Details", metadata.rowNumber, "templateVersion", "version"));
  if (String(metadata.cells.module).trim() !== module) issues.push(importIssue("Details", metadata.rowNumber, "module", "module"));
  return issues.length ? { kind: "invalid", issues } : { kind: "valid", draft: { module, details: metadata, questions: questions.rows, choices: choices.rows }, warnings: [] };
}

export async function readImportWorkbook(file: File, module: ImportModule): Promise<ImportValidation<ImportWorkbookRows>> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { kind: "invalid", issues: [importIssue("File", 0, "", "fileType")] };
  if (file.size > MAX_IMPORT_BYTES) return { kind: "invalid", issues: [importIssue("File", 0, "", "fileSize")] };
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  try {
    const bytes = await readImportBlob(file);
    // ExcelJS accepts ArrayBuffer in browsers; its declaration still names Node's Buffer.
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return { kind: "invalid", issues: [importIssue("File", 0, "", "unreadableWorkbook")] };
  }
  return workbookRows(workbook, module);
}
