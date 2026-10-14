import { importIssue } from "@/features/academics/shared/excel-import/workbookReader";
import { existingQuestionIssues, importQuestions, marksWarnings, questionContractIssues, readImportFields, validImportDateTime, type ImportFieldRules } from "@/features/academics/shared/excel-import/workbookValidation";
import type { HomeworkImport, ImportContext, ImportIssue, ImportValidation, ImportWorkbookRows } from "@/features/academics/shared/excel-import/types";
import { validateHomeworkQuestionDraft } from "./homeworkQuestionDraftValidation";
import { HOMEWORK_DRAFT_LIMITS, HOMEWORK_MODES } from "./homeworkQuestionDraft.types";

const metadataRules: ImportFieldRules = {
  title: { kind: "text", required: true, max: 180 }, description: { kind: "text", max: 4000 },
  mode: { kind: "enum", options: HOMEWORK_MODES, default: "homework" },
  dueAt: { kind: "text", required: true }, isGraded: { kind: "boolean", default: true },
  totalMarks: { kind: "number", min: 0.01, max: HOMEWORK_DRAFT_LIMITS.points }, estimatedMinutes: { kind: "number", min: 1, max: HOMEWORK_DRAFT_LIMITS.minutes, integer: true },
};

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

function metadataIssues(draft: HomeworkImport): ImportIssue[] {
  const row = { rowNumber: draft.source.details.rowNumber, cells: { ...draft.metadata } };
  const bounds = readImportFields(row as ImportWorkbookRows["details"], "Details", metadataRules).issues;
  const issues: ImportIssue[] = [];
  if (!validImportDateTime(draft.metadata.dueAt)) issues.push(importIssue("Details", row.rowNumber, "dueAt", "dateTime"));
  return [...bounds, ...issues];
}

export function validateHomeworkImportDraft(draft: HomeworkImport, context: ImportContext): ImportValidation<HomeworkImport> {
  const issues = [...metadataIssues(draft), ...questionContractIssues(draft.questions, draft.source)];
  const checked = validateHomeworkQuestionDraft(draft, context);
  if (checked.kind === "invalid") for (const issue of checked.issues) {
    if (issue.scope === "metadata") issues.push({ sheet: "Details", row: draft.source.details.rowNumber, field: issue.field, messageKey: issue.messageKey, values: issue.values });
    else {
      const question = draft.questions.find(candidate => candidate.id === issue.questionId)!;
      const mapped = existingQuestionIssues({ question, source: draft.source, errors: { [issue.field]: issue.messageKey } });
      if (!issues.some(existing => existing.sheet === "Questions" && existing.row === mapped[0].row && existing.field === issue.field)) issues.push(...mapped);
    }
  }
  if (issues.length) return { kind: "invalid", issues };
  return { kind: "valid", draft, warnings: marksWarnings(draft.metadata.isGraded ? draft.metadata.totalMarks : undefined, draft.questions, draft.source.details) };
}
