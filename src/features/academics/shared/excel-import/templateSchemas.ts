import type { ImportCell, ImportModule, ImportSheet } from "./types";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const QUESTION_TYPES = ["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"] as const;
export interface ImportSheetSchema {
  name: ImportSheet;
  columns: readonly string[];
  required: readonly string[];
  maxRows: number;
}
const schemas: Record<ImportModule, ImportSheetSchema[]> = {
  assignment: [
    { name: "Details", columns: ["templateVersion", "module", "title", "description", "mode", "dueAt", "isGraded", "totalMarks", "estimatedMinutes"], required: ["templateVersion", "module", "title", "dueAt"], maxRows: 1 },
    { name: "Questions", columns: ["questionNumber", "questionType", "questionText", "points", "instructions", "correctAnswer", "expectedAnswer"], required: ["questionNumber", "questionType", "questionText", "points"], maxRows: 500 },
    { name: "Choices", columns: ["questionNumber", "choiceNumber", "choiceText", "isCorrect"], required: ["questionNumber", "choiceNumber", "choiceText", "isCorrect"], maxRows: 25000 },
  ],
  assessment: [
    { name: "Details", columns: ["templateVersion", "module", "titleAr", "titleEn", "type", "date", "weight", "maxScore", "expectedTimeMinutes"], required: ["templateVersion", "module", "titleAr", "titleEn", "type", "date", "weight", "maxScore"], maxRows: 1 },
    { name: "Questions", columns: ["questionNumber", "questionType", "questionTextAr", "questionTextEn", "points", "correctAnswer", "sampleAnswerAr", "sampleAnswerEn"], required: ["questionNumber", "questionType", "questionTextAr", "questionTextEn", "points"], maxRows: 500 },
    { name: "Choices", columns: ["questionNumber", "choiceNumber", "choiceTextAr", "choiceTextEn", "isCorrect"], required: ["questionNumber", "choiceNumber", "choiceTextAr", "choiceTextEn", "isCorrect"], maxRows: 25000 },
  ],
};
export function importSchemas(module: ImportModule): ImportSheetSchema[] { return schemas[module]; }
export function templateDefaults(module: ImportModule): Record<string, ImportCell> {
  return module === "assignment"
    ? { templateVersion: 1, module, mode: "homework", isGraded: true }
    : { templateVersion: 1, module };
}
