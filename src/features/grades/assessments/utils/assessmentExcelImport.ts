import { validateQuestion } from "@/features/academics/curriculum/utils/validation";
import { importIssue } from "@/features/academics/shared/excel-import/workbookReader";
import { existingQuestionIssues, importQuestions, marksWarnings, questionContractIssues, readImportFields, validImportDate, type ImportFieldRules } from "@/features/academics/shared/excel-import/workbookValidation";
import type { AssessmentImport, ImportContext, ImportIssue, ImportValidation, ImportWorkbookRows } from "@/features/academics/shared/excel-import/types";
import type { AssessmentType } from "../../shared/types";

const metadataRules: ImportFieldRules = {
  titleAr: { kind: "text", required: true, max: 255 }, titleEn: { kind: "text", required: true, max: 255 },
  type: { kind: "enum", required: true, options: ["QUIZ", "MONTH_EXAM", "MIDTERM", "TERM_EXAM", "ASSIGNMENT", "FINAL", "PRACTICAL"] },
  date: { kind: "text", required: true }, weight: { kind: "number", required: true, min: 0.01, max: 100 }, maxScore: { kind: "number", required: true, min: 0.01, max: 99999.99 },
  expectedTimeMinutes: { kind: "number", min: 1, max: 2147483647, integer: true },
};

export function assessmentImportFromWorkbook(workbook: ImportWorkbookRows, context: ImportContext): ImportValidation<AssessmentImport> {
  const metadata = readImportFields(workbook.details, "Details", metadataRules);
  const imported = importQuestions(workbook);
  const fields = metadata.fields;
  const draft: AssessmentImport = { module: "assessment", source: workbook,
    questions: imported.questions.map((question) => ({ ...question, assessmentId: "draft-import", required: true })),
    metadata: { title: String(fields.titleEn ?? ""), titleAr: String(fields.titleAr ?? ""), type: fields.type as AssessmentType,
      date: String(fields.date ?? ""), weight: Number(fields.weight), maxScore: Number(fields.maxScore), expectedTimeMinutes: fields.expectedTimeMinutes as number | null, deliveryMode: "QUESTION_BASED" } };
  const validated = validateAssessmentImportDraft(draft, context);
  const issues = [...metadata.issues, ...imported.issues, ...(validated.kind === "invalid" ? validated.issues : [])];
  return issues.length ? { kind: "invalid", issues } : validated;
}

export function validateAssessmentImportDraft(draft: AssessmentImport, context: ImportContext): ImportValidation<AssessmentImport> {
  const metadata = draft.metadata;
  const row = { rowNumber: draft.source.details.rowNumber, cells: { ...metadata, titleEn: metadata.title } };
  const issues: ImportIssue[] = [...readImportFields(row as ImportWorkbookRows["details"], "Details", metadataRules).issues, ...questionContractIssues(draft.questions, draft.source)];
  if (!validImportDate(metadata.date) || metadata.date < context.termStart || metadata.date > context.termEnd) issues.push(importIssue("Details", row.rowNumber, "date", "date"));
  if (metadata.deliveryMode !== "QUESTION_BASED") issues.push(importIssue("Details", row.rowNumber, "deliveryMode", "invalidValue"));
  for (const question of draft.questions) issues.push(...existingQuestionIssues({ question, source: draft.source, errors: validateQuestion(question, (key) => `validation.${key}`) }));
  return issues.length ? { kind: "invalid", issues } : { kind: "valid", draft, warnings: marksWarnings(metadata.maxScore, draft.questions, draft.source.details) };
}
