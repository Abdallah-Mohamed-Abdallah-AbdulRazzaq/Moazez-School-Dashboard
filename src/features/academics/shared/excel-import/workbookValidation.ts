import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import { HOMEWORK_DRAFT_LIMITS } from "@/features/academics/homework/utils/homeworkQuestionDraft.types";
import type { QuestionValidationError } from "@/features/academics/curriculum/types/types";
import { QUESTION_TYPES } from "./templateSchemas";
import { importIssue } from "./workbookReader";
import type { ImportCell, ImportIssue, ImportRow, ImportSheet, ImportWorkbookRows } from "./types";

type FieldRule =
  | { kind: "text"; required?: true; max?: number }
  | { kind: "number"; required?: true; min: number; max: number; integer?: true }
  | { kind: "boolean"; required?: true; default?: boolean }
  | { kind: "enum"; required?: true; options: readonly string[]; default?: string };
export type ImportFieldRules = Record<string, FieldRule>;
const identifierRule: FieldRule = { kind: "number", required: true, min: 1, max: 2147483647, integer: true };

function blankCell(cell: ImportCell | undefined): boolean { return cell == null || cell === "" || (typeof cell === "string" && !cell.trim()); }

function convertedCell(cell: ImportCell, rule: FieldRule): ImportCell {
  if (rule.kind === "text") return typeof cell === "string" ? cell.trim() : null;
  if (rule.kind === "boolean") {
    if (typeof cell === "boolean") return cell;
    if (typeof cell === "string" && /^(true|false)$/i.test(cell.trim())) return cell.trim().toLowerCase() === "true";
    return null;
  }
  if (rule.kind === "enum") return typeof cell === "string" ? rule.options.find((option) => option.toLowerCase() === cell.trim().toLowerCase()) ?? null : null;
  if (typeof cell !== "number" && !(typeof cell === "string" && /^-?\d+(\.\d+)?$/.test(cell.trim()))) return null;
  const number = Number(cell);
  const correctPrecision = rule.integer ? Number.isInteger(number) : /^\d+(\.\d{1,2})?$/.test(String(number));
  return Number.isFinite(number) && correctPrecision && number >= rule.min && number <= rule.max ? number : null;
}

function fieldRead(cell: ImportCell | undefined, rule: FieldRule) {
  if (blankCell(cell)) return { cell: "default" in rule ? rule.default ?? null : null, error: rule.required ? "required" : null };
  const converted = convertedCell(cell!, rule);
  if (converted == null) return { cell: null, error: "invalidValue" };
  if (rule.kind === "text" && rule.max && String(converted).length > rule.max) return { cell: converted, error: "textLength" };
  return { cell: converted, error: null };
}

export function readImportFields(row: ImportRow, sheet: ImportSheet, rules: ImportFieldRules) {
  const fields: Record<string, ImportCell> = Object.create(null);
  const issues: ImportIssue[] = [];
  for (const [field, rule] of Object.entries(rules)) {
    const parsed = fieldRead(row.cells[field], rule);
    fields[field] = parsed.cell;
    if (parsed.error) issues.push({ ...importIssue(sheet, row.rowNumber, field, parsed.error), values: rule.kind === "text" ? { maximum: rule.max ?? 0 } : undefined });
  }
  return { fields, issues };
}

export function validImportDate(dateText: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return false;
  const parsed = new Date(`${dateText}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateText;
}
export function validImportDateTime(dateText: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(dateText)
    && validImportDate(dateText.slice(0, 10)) && !Number.isNaN(new Date(dateText).getTime());
}

function questionRules(module: ImportWorkbookRows["module"]): ImportFieldRules {
  const texts: ImportFieldRules = module === "assignment"
    ? { questionText: { kind: "text", required: true, max: 8000 }, instructions: { kind: "text", max: 4000 }, expectedAnswer: { kind: "text", max: 8000 } }
    : { questionTextAr: { kind: "text", required: true, max: 5000 }, questionTextEn: { kind: "text", required: true, max: 5000 }, sampleAnswerAr: { kind: "text" }, sampleAnswerEn: { kind: "text" } };
  return { questionNumber: identifierRule, questionType: { kind: "enum", required: true, options: QUESTION_TYPES }, points: { kind: "number", required: true, min: module === "assignment" ? 0 : 0.01, max: module === "assignment" ? HOMEWORK_DRAFT_LIMITS.points : 999999.99 }, correctAnswer: { kind: "boolean" }, ...texts };
}

function choiceRules(module: ImportWorkbookRows["module"]): ImportFieldRules {
  const choiceText: ImportFieldRules = module === "assignment"
    ? { choiceText: { kind: "text", required: true, max: 1000 } }
    : { choiceTextAr: { kind: "text", required: true, max: 1000 }, choiceTextEn: { kind: "text", required: true, max: 1000 } };
  return { questionNumber: identifierRule, choiceNumber: identifierRule, isCorrect: { kind: "boolean", required: true }, ...choiceText };
}

function duplicateNumberIssues(rows: ImportRow[], sheet: ImportSheet, field: string): ImportIssue[] {
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    const number = String(row.cells[field]);
    const key = sheet === "Choices" ? `${row.cells.questionNumber}:${number}` : number;
    if (seen.has(key)) return [importIssue(sheet, row.rowNumber, field, "duplicateNumber")];
    seen.add(key);
    return [];
  });
}

function answerFieldIssues(row: ImportRow): ImportIssue[] {
  const type = row.cells.questionType;
  const allowed = { correctAnswer: type === "TRUE_FALSE", expectedAnswer: type === "SHORT_ANSWER", sampleAnswerAr: type === "SHORT_ANSWER" || type === "ESSAY", sampleAnswerEn: type === "SHORT_ANSWER" || type === "ESSAY" };
  const issues = Object.entries(allowed).filter(([field, accepted]) => !accepted && !blankCell(row.cells[field])).map(([field]) => importIssue("Questions", row.rowNumber, field, "forbiddenField"));
  if (type === "TRUE_FALSE" && blankCell(row.cells.correctAnswer)) issues.push(importIssue("Questions", row.rowNumber, "correctAnswer", "required"));
  return issues;
}

function questionFromRows(row: ImportRow, choices: ImportRow[], order: number): AssignmentQuestion {
  const fields = row.cells;
  const singleText = String(fields.questionText ?? "");
  return {
    id: `temp-question-${fields.questionNumber}`, assignmentId: "draft-import", createdAt: "", order, isRequired: true,
    questionTextAr: String(fields.questionTextAr ?? singleText), questionTextEn: String(fields.questionTextEn ?? singleText),
    questionType: fields.questionType as AssignmentQuestion["questionType"], points: Number(fields.points),
    correctAnswer: fields.correctAnswer == null ? undefined : fields.correctAnswer as boolean,
    instructions: fields.instructions == null ? undefined : String(fields.instructions),
    expectedAnswer: fields.expectedAnswer == null ? undefined : String(fields.expectedAnswer),
    sampleAnswerAr: fields.sampleAnswerAr == null ? undefined : String(fields.sampleAnswerAr), sampleAnswerEn: fields.sampleAnswerEn == null ? undefined : String(fields.sampleAnswerEn),
    options: choices.map((choice, index) => ({ id: `opt-${fields.questionNumber}-${choice.cells.choiceNumber}`, order: index + 1, isCorrect: choice.cells.isCorrect === true, textAr: String(choice.cells.choiceTextAr ?? choice.cells.choiceText ?? ""), textEn: String(choice.cells.choiceTextEn ?? choice.cells.choiceText ?? "") })),
  };
}

export function importQuestions(workbook: ImportWorkbookRows) {
  const questionReads = workbook.questions.map((row) => ({ rowNumber: row.rowNumber, ...readImportFields(row, "Questions", questionRules(workbook.module)) }));
  const choiceReads = workbook.choices.map((row) => ({ rowNumber: row.rowNumber, ...readImportFields(row, "Choices", choiceRules(workbook.module)) }));
  const questionRows = questionReads.map((parsed) => ({ rowNumber: parsed.rowNumber, cells: parsed.fields }));
  const choiceRows = choiceReads.map((parsed) => ({ rowNumber: parsed.rowNumber, cells: parsed.fields }));
  const issues = [...questionReads, ...choiceReads].flatMap((parsed) => parsed.issues);
  issues.push(...duplicateNumberIssues(questionRows, "Questions", "questionNumber"), ...duplicateNumberIssues(choiceRows, "Choices", "choiceNumber"));
  const choiceGroups = new Map<number, ImportRow[]>();
  for (const choice of choiceRows) {
    const number = Number(choice.cells.questionNumber);
    choiceGroups.set(number, [...(choiceGroups.get(number) ?? []), choice]);
    if (!questionRows.some((question) => question.cells.questionNumber === number)) issues.push(importIssue("Choices", choice.rowNumber, "questionNumber", "unknownQuestion"));
  }
  const orderedRows = [...questionRows].sort((left, right) => Number(left.cells.questionNumber) - Number(right.cells.questionNumber));
  const questions = orderedRows.map((row, index) => {
    const choices = (choiceGroups.get(Number(row.cells.questionNumber)) ?? []).sort((left, right) => Number(left.cells.choiceNumber) - Number(right.cells.choiceNumber));
    issues.push(...answerFieldIssues(row));
    if (choices.length > 50) issues.push(importIssue("Questions", row.rowNumber, "options", "choicesLimit"));
    if (choices.length && !["MCQ_SINGLE", "MCQ_MULTI"].includes(String(row.cells.questionType))) issues.push(importIssue("Choices", choices[0].rowNumber, "questionNumber", "forbiddenChoices"));
    return questionFromRows(row, choices, index + 1);
  });
  return { questions, issues };
}

export function existingQuestionIssues(request: { question: AssignmentQuestion; source: ImportWorkbookRows; errors: QuestionValidationError }): ImportIssue[] {
  const number = Number(request.question.id.replace("temp-question-", ""));
  const row = request.source.questions.find((question) => Number(question.cells.questionNumber) === number)?.rowNumber ?? 2;
  return Object.entries(request.errors).filter(([, message]) => message).map(([field, message]) => ({ sheet: "Questions", row, field, messageKey: message! }));
}

function modelQuestionRow(question: AssignmentQuestion, source: ImportWorkbookRows): ImportRow {
  const questionNumber = Number(question.id.replace("temp-question-", ""));
  const rowNumber = source.questions.find((row) => Number(row.cells.questionNumber) === questionNumber)?.rowNumber ?? 2;
  const texts: Record<string, ImportCell> = source.module === "assignment"
    ? { questionText: question.questionTextEn || question.questionTextAr, instructions: question.instructions ?? null, expectedAnswer: question.expectedAnswer ?? null }
    : { questionTextAr: question.questionTextAr, questionTextEn: question.questionTextEn, sampleAnswerAr: question.sampleAnswerAr ?? null, sampleAnswerEn: question.sampleAnswerEn ?? null };
  return { rowNumber, cells: { questionNumber, questionType: question.questionType, points: question.points, correctAnswer: question.correctAnswer ?? null, ...texts } };
}

function modelChoiceRows(question: AssignmentQuestion, source: ImportWorkbookRows): ImportRow[] {
  const questionNumber = Number(question.id.replace("temp-question-", ""));
  return (question.options ?? []).map((option) => {
    const choiceNumber = Number(option.id.split("-").at(-1));
    const rowNumber = source.choices.find((row) => Number(row.cells.questionNumber) === questionNumber && Number(row.cells.choiceNumber) === choiceNumber)?.rowNumber ?? 2;
    const texts: Record<string, ImportCell> = source.module === "assignment" ? { choiceText: option.textEn || option.textAr } : { choiceTextAr: option.textAr, choiceTextEn: option.textEn };
    return { rowNumber, cells: { questionNumber, choiceNumber, isCorrect: option.isCorrect, ...texts } };
  });
}

export function questionContractIssues(questions: AssignmentQuestion[], source: ImportWorkbookRows): ImportIssue[] {
  if (!questions.length) return [importIssue("Questions", 2, "", "questionsRequired")];
  return importQuestions({ ...source, questions: questions.map((question) => modelQuestionRow(question, source)), choices: questions.flatMap((question) => modelChoiceRows(question, source)) }).issues;
}

export function marksWarnings(totalMarks: number | null | undefined, questions: AssignmentQuestion[], details: ImportRow): ImportIssue[] {
  if (totalMarks == null) return [];
  const sumCents = questions.reduce((total, question) => total + Math.round(question.points * 100), 0);
  return sumCents === Math.round(totalMarks * 100) ? [] : [{ sheet: "Details", row: details.rowNumber, field: "points", messageKey: "academics.excelImport.warnings.marksMismatch", values: { total: sumCents / 100, maximum: totalMarks } }];
}
