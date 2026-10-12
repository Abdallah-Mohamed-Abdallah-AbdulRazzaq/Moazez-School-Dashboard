import { expect, it } from "vitest";
import { fixtureContext, fixtureWorkbook, setSheetRow, workbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { readImportWorkbook } from "@/features/academics/shared/excel-import/workbookReader";
import { homeworkImportFromWorkbook } from "../homeworkExcelImport";
import { mapBuilderQuestionToHomeworkCreatePayload } from "../../services/homeworkMappers";

it("maps an explicit false answer to the existing homework wire contract", async () => {
  const rows = await readImportWorkbook(await workbookFile(await fixtureWorkbook()), "assignment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  const imported = homeworkImportFromWorkbook(rows.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error(JSON.stringify(imported.issues));
  expect(mapBuilderQuestionToHomeworkCreatePayload(imported.draft.questions[0])).toMatchObject({ type: "TRUE_FALSE", options: [{ text: "True", isCorrect: false, sortOrder: 0 }, { text: "False", isCorrect: true, sortOrder: 1 }] });
});

it.each([
  ["points", 0, "valid"], ["points", 1.001, "invalid"], ["points", 100000, "invalid"],
  ["points", "2abc", "invalid"], ["questionText", "", "invalid"],
  ["questionText", "a".repeat(8001), "invalid"], ["correctAnswer", "yes", "invalid"],
] as const)("validates homework %s=%s", async (field, value, kind) => {
  const workbook = await fixtureWorkbook();
  setSheetRow(workbook.getWorksheet("Questions")!, 2, { [field]: value });
  const rows = await readImportWorkbook(await workbookFile(workbook), "assignment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  expect(homeworkImportFromWorkbook(rows.draft, fixtureContext).kind).toBe(kind);
});

it("rejects an impossible future date and a choice referencing an absent question", async () => {
  const workbook = await fixtureWorkbook();
  setSheetRow(workbook.getWorksheet("Details")!, 2, { dueAt: "2099-02-30T12:00:00Z" });
  setSheetRow(workbook.getWorksheet("Choices")!, 4, { questionNumber: 8, choiceNumber: 1, choiceText: "Absent", isCorrect: true });
  const rows = await readImportWorkbook(await workbookFile(workbook), "assignment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  const imported = homeworkImportFromWorkbook(rows.draft, fixtureContext);
  if (imported.kind !== "invalid") throw new Error("Invalid workbook accepted");
  expect(imported.issues).toEqual(expect.arrayContaining([expect.objectContaining({ sheet: "Details", field: "dueAt" }), expect.objectContaining({ sheet: "Choices", row: 4, field: "questionNumber" })]));
});
