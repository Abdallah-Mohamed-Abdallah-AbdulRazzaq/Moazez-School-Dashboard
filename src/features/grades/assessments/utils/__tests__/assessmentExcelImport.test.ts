import { expect, it } from "vitest";
import { fixtureContext, fixtureWorkbook, setSheetRow, workbookFile } from "@/features/academics/shared/excel-import/__tests__/excelImportFixtures";
import { readImportWorkbook } from "@/features/academics/shared/excel-import/workbookReader";
import { assessmentImportFromWorkbook, validateAssessmentImportDraft } from "../assessmentExcelImport";

it("preserves bilingual texts, fractional weight and question-based delivery", async () => {
  const rows = await readImportWorkbook(await workbookFile(await fixtureWorkbook("assessment")), "assessment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  const imported = assessmentImportFromWorkbook(rows.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error(JSON.stringify(imported.issues));
  expect(imported.draft.metadata).toMatchObject({ title: "Assessment", titleAr: "اختبار", weight: 0.5, deliveryMode: "QUESTION_BASED" });
  expect(imported.draft.questions[0]).toMatchObject({ questionTextAr: "هل ٢ زوجي؟", questionTextEn: "Is 2 even?", correctAnswer: false, order: 1 });
});
it.each([
  ["points", 0], ["points", 0.001], ["points", 1000000],
  ["questionTextAr", ""], ["questionTextEn", "a".repeat(5001)], ["questionType", "MATCHING"],
] as const)("blocks assessment contract violation %s", async (field, value) => {
  const workbook = await fixtureWorkbook("assessment");
  setSheetRow(workbook.getWorksheet("Questions")!, 2, { [field]: value });
  const rows = await readImportWorkbook(await workbookFile(workbook), "assessment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  expect(assessmentImportFromWorkbook(rows.draft, fixtureContext).kind).toBe("invalid");
});
it("keeps a marks mismatch as a warning and rejects a date outside the selected term", async () => {
  const rows = await readImportWorkbook(await workbookFile(await fixtureWorkbook("assessment")), "assessment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  rows.draft.details.cells.maxScore = 3;
  const imported = assessmentImportFromWorkbook(rows.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error("Mismatch blocked draft");
  expect(imported.warnings).toHaveLength(1);
  expect(assessmentImportFromWorkbook(rows.draft, { ...fixtureContext, termEnd: "2099-01-01" }).kind).toBe("invalid");
});
it("rechecks question precision on the current draft before saving", async () => {
  const rows = await readImportWorkbook(await workbookFile(await fixtureWorkbook("assessment")), "assessment");
  if (rows.kind !== "valid") throw new Error("Invalid fixture");
  const imported = assessmentImportFromWorkbook(rows.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error("Invalid fixture");
  imported.draft.questions[0].points = 1.001;
  expect(validateAssessmentImportDraft(imported.draft, fixtureContext).kind).toBe("invalid");
});
