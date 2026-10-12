import { describe, expect, it } from "vitest";
import { fixtureWorkbook, workbookFile } from "./excelImportFixtures";
import { readImportWorkbook } from "../workbookReader";

describe("Excel workbook input", () => {
  it("preserves false, Arabic text, source rows and reordered headers", async () => {
    const workbook = await fixtureWorkbook("assessment");
    const sheet = workbook.getWorksheet("Questions")!;
    const headers = sheet.getRow(1).values as string[];
    const values = headers.slice(1).map((_, index) => sheet.getCell(2, index + 1).value);
    sheet.getRow(1).values = headers.slice(1).reverse();
    sheet.getRow(2).values = values.reverse();
    const parsed = await readImportWorkbook(await workbookFile(workbook), "assessment");
    expect(parsed.kind).toBe("valid");
    if (parsed.kind !== "valid") throw new Error("Valid fixture rejected");
    expect(parsed.draft.questions[0]).toMatchObject({ rowNumber: 2, cells: { correctAnswer: false, questionTextAr: "هل ٢ زوجي؟" } });
  });

  it.each(["wrongModule", "missingSheet", "duplicateHeader", "formula", "extraDetails", "unknownColumn"])("rejects %s with a located issue", async (scenario) => {
    const workbook = await fixtureWorkbook();
    const details = workbook.getWorksheet("Details")!;
    if (scenario === "wrongModule") details.getCell("B2").value = "assessment";
    if (scenario === "missingSheet") workbook.removeWorksheet("Choices");
    if (scenario === "duplicateHeader") details.getCell("D1").value = "title";
    if (scenario === "formula") details.getCell("C2").value = { formula: "1+1", result: 2 };
    if (scenario === "extraDetails") details.getCell("C3").value = "Another item";
    if (scenario === "unknownColumn") { details.getCell("J1").value = "studentId"; details.getCell("J2").value = "unexpected"; }
    const parsed = await readImportWorkbook(await workbookFile(workbook), "assignment");
    expect(parsed.kind).toBe("invalid");
    if (parsed.kind === "invalid") expect(parsed.issues[0]).toMatchObject({ sheet: expect.any(String), row: expect.any(Number), messageKey: expect.any(String) });
  });

  it.each([new File(["invalid"], "fake.xlsx"), new File(["invalid"], "fake.csv"), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.xlsx")])("rejects unreadable or unsupported files", async (file) => {
    expect((await readImportWorkbook(file, "assignment")).kind).toBe("invalid");
  });

  it("ignores blank rows while enforcing the populated question limit", async () => {
    const workbook = await fixtureWorkbook();
    const sheet = workbook.getWorksheet("Questions")!;
    sheet.getCell("A4").value = 2;
    const parsed = await readImportWorkbook(await workbookFile(workbook), "assignment");
    if (parsed.kind !== "valid") throw new Error("Blank row rejected");
    expect(parsed.draft.questions.map((question) => question.rowNumber)).toEqual([2, 4]);
    for (let row = 5; row <= 503; row++) sheet.getCell(row, 1).value = row;
    expect((await readImportWorkbook(await workbookFile(workbook), "assignment")).kind).toBe("invalid");
  });
});
