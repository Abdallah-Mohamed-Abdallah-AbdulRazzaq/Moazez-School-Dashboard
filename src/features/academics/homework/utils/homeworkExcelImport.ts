import { importIssue } from "@/features/academics/shared/excel-import/workbookReader";
import { existingQuestionIssues, importQuestions, marksWarnings, questionContractIssues, readImportFields, validImportDateTime, type ImportFieldRules } from "@/features/academics/shared/excel-import/workbookValidation";
import type { HomeworkImport, ImportContext, ImportIssue, ImportValidation, ImportWorkbookRows } from "@/features/academics/shared/excel-import/types";
import { validateHomeworkAssignmentContract, validateHomeworkQuestion } from "./homeworkValidation";

const metadataRules: ImportFieldRules = {
  title: { kind: "text", required: true, max: 180 }, description: { kind: "text", max: 4000 },
  mode: { kind: "enum", options: ["homework", "worksheet", "writing_task", "quiz", "reading", "project"], default: "homework" },
  dueAt: { kind: "text", required: true }, isGraded: { kind: "boolean", default: true },
  totalMarks: { kind: "number", min: 0.01, max: 99999.99 }, estimatedMinutes: { kind: "number", min: 1, max: 2147483647, integer: true },
};
const validationKey = (key: string) => `validation.${key}`;

export function homeworkImportFromWorkbook(workbook: ImportWorkbookRows, context: ImportContext): ImportValidation<HomeworkImport> {
  const metadata = readImportFields(workbook.details, "Details", metadataRules);
  const imported = importQuestions(workbook);
  const fields = metadata.fields;
  const draft: HomeworkImport = { module: "assignment", source: workbook, questions: imported.questions, metadata: {
    title: String(fields.title ?? ""), description: fields.description as string | null, mode: String(fields.mode ?? "homework"),
    dueAt: String(fields.dueAt ?? ""), isGraded: fields.isGraded === true, totalMarks: fields.totalMarks as number | null, estimatedMinutes: fields.estimatedMinutes as number | null,
  } };
  const validated = validateHomeworkImportDraft(draft, context);
  const issues = [...metadata.issues, ...imported.issues, ...(validated.kind === "invalid" ? validated.issues : [])];
  return issues.length ? { kind: "invalid", issues } : validated;
}

function metadataIssues(draft: HomeworkImport, context: ImportContext): ImportIssue[] {
  const row = { rowNumber: draft.source.details.rowNumber, cells: { ...draft.metadata } };
  const bounds = readImportFields(row as ImportWorkbookRows["details"], "Details", metadataRules).issues;
  const errors = validateHomeworkAssignmentContract({ ...draft.metadata, isGraded: draft.metadata.isGraded ?? true, publishAt: context.publishAt }, validationKey, context.now);
  const issues: ImportIssue[] = Object.entries(errors).map(([field, message]) => ({ sheet: "Details", row: row.rowNumber, field, messageKey: message as string }));
  if (!validImportDateTime(draft.metadata.dueAt)) issues.push(importIssue("Details", row.rowNumber, "dueAt", "dateTime"));
  return [...bounds, ...issues];
}

export function validateHomeworkImportDraft(draft: HomeworkImport, context: ImportContext): ImportValidation<HomeworkImport> {
  const issues = [...metadataIssues(draft, context), ...questionContractIssues(draft.questions, draft.source)];
  for (const question of draft.questions) issues.push(...existingQuestionIssues({ question, source: draft.source, errors: validateHomeworkQuestion(question, validationKey) }));
  if (issues.length) return { kind: "invalid", issues };
  return { kind: "valid", draft, warnings: marksWarnings(draft.metadata.isGraded ? draft.metadata.totalMarks : undefined, draft.questions, draft.source.details) };
}
