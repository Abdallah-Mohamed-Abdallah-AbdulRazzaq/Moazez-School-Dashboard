import { expect, it } from "vitest";
import { fixtureContext, fixtureWorkbook, setSheetRow, workbookFile } from "./excelImportFixtures";
import { readImportWorkbook } from "../workbookReader";
import { homeworkImportFromWorkbook } from "@/features/academics/homework/utils/homeworkExcelImport";
import { assessmentImportFromWorkbook } from "@/features/grades/assessments/utils/assessmentExcelImport";
import { mapBuilderQuestionToHomeworkCreatePayload } from "@/features/academics/homework/services/homeworkMappers";
import type { ImportModule } from "../types";
import { QUESTION_TYPES } from "../templateSchemas";

const cases = (["assignment", "assessment"] as const).flatMap((module) => QUESTION_TYPES.map((type) => ({ module, type })));
it.each(cases)("accepts $module $type with its supported answer fields", async ({ module, type }) => {
  const workbook = await fixtureWorkbook(module);
  const question = workbook.getWorksheet("Questions")!;
  setSheetRow(question, 2, { questionType: type, correctAnswer: type === "TRUE_FALSE" ? false : null });
  if (type === "SHORT_ANSWER") setSheetRow(question, 2, module === "assignment" ? { expectedAnswer: "4" } : { sampleAnswerAr: "٤", sampleAnswerEn: "4" });
  if (type.startsWith("MCQ")) {
    const choiceText = module === "assignment" ? { choiceText: "Choice" } : { choiceTextAr: "خيار", choiceTextEn: "Choice" };
    for (let choice = 1; choice <= 2; choice++) setSheetRow(workbook.getWorksheet("Choices")!, choice + 1, { questionNumber: 1, choiceNumber: choice, isCorrect: choice === 1, ...choiceText });
  }
  const parsed = await readImportWorkbook(await workbookFile(workbook), module);
  if (parsed.kind !== "valid") throw new Error("Unreadable fixture");
  const imported = module === "assignment" ? homeworkImportFromWorkbook(parsed.draft, fixtureContext) : assessmentImportFromWorkbook(parsed.draft, fixtureContext);
  if (imported.kind !== "valid") throw new Error(JSON.stringify(imported.issues));
  expect(imported.draft.questions[0].questionType).toBe(type);
  if (module === "assignment") expect(mapBuilderQuestionToHomeworkCreatePayload(imported.draft.questions[0]).type).toBe({ MCQ_SINGLE: "SINGLE_CHOICE", MCQ_MULTI: "MULTIPLE_CHOICE", TRUE_FALSE: "TRUE_FALSE", SHORT_ANSWER: "SHORT_TEXT", ESSAY: "LONG_TEXT" }[type]);
  if (type === "SHORT_ANSWER") expect(imported.draft.questions[0]).toMatchObject(module === "assignment" ? { expectedAnswer: "4" } : { sampleAnswerAr: "٤", sampleAnswerEn: "4" });
});

it.each([{ module: "assignment", count: 50 }, { module: "assignment", count: 51 }, { module: "assessment", count: 50 }, { module: "assessment", count: 51 }] as const)("enforces the $module choice limit at $count", async ({ module, count }) => {
  const workbook = await fixtureWorkbook(module);
  setSheetRow(workbook.getWorksheet("Questions")!, 2, { questionType: "MCQ_SINGLE", correctAnswer: null });
  for (let choice = 1; choice <= count; choice++) {
    const texts = module === "assignment" ? { choiceText: `Choice ${choice}` } : { choiceTextAr: `خيار ${choice}`, choiceTextEn: `Choice ${choice}` };
    setSheetRow(workbook.getWorksheet("Choices")!, choice + 1, { questionNumber: 1, choiceNumber: choice, isCorrect: choice === 1, ...texts });
  }
  const parsed = await readImportWorkbook(await workbookFile(workbook), module);
  if (parsed.kind !== "valid") throw new Error("Unreadable fixture");
  const imported = module === "assignment" ? homeworkImportFromWorkbook(parsed.draft, fixtureContext) : assessmentImportFromWorkbook(parsed.draft, fixtureContext);
  expect(imported.kind).toBe(count === 50 ? "valid" : "invalid");
});

it.each(["assignment", "assessment"] as ImportModule[])("rejects repeated numbering before creating a %s draft", async (module) => {
  const workbook = await fixtureWorkbook(module);
  workbook.getWorksheet("Questions")!.getRow(3).values = workbook.getWorksheet("Questions")!.getRow(2).values;
  const parsed = await readImportWorkbook(await workbookFile(workbook), module);
  if (parsed.kind !== "valid") throw new Error("Unreadable fixture");
  const imported = module === "assignment" ? homeworkImportFromWorkbook(parsed.draft, fixtureContext) : assessmentImportFromWorkbook(parsed.draft, fixtureContext);
  if (imported.kind !== "invalid") throw new Error("Duplicate accepted");
  expect(imported.issues).toEqual(expect.arrayContaining([expect.objectContaining({ sheet: "Questions", row: 3, field: "questionNumber" })]));
});
