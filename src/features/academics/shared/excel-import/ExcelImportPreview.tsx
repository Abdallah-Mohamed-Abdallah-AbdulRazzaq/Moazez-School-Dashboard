"use client";

import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ImportedDraft, ImportIssue } from "./types";
import { importSchemas } from "./templateSchemas";

interface PreviewQuestion extends Record<string, unknown> { id: string; number: number; question: AssignmentQuestion }
export function ImportIssues({ issues }: { issues: ImportIssue[] }) {
  const translate = useTranslations();
  const t = useTranslations("academics.excelImport");
  const distinct = [...new Map(issues.map((issue) => [`${issue.sheet}:${issue.row}:${issue.field}:${issue.messageKey}`, issue])).values()];
  return <ul role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {distinct.map((issue, index) => <li key={index}>
      <strong>{issue.sheet}{issue.row > 0 ? ` · ${t("labels.row", { row: issue.row })}` : ""}{issue.field ? ` · ${t.has(`fields.${issue.field}`) ? t(`fields.${issue.field}`) : issue.field}` : ""}: </strong>
      {translate(issue.messageKey, issue.values)}
    </li>)}
  </ul>;
}

function QuestionContents({ question, module }: { question: AssignmentQuestion; module: ImportedDraft["module"] }) {
  const t = useTranslations("academics.excelImport");
  return <div className="space-y-2 whitespace-pre-wrap break-words">
    {module === "assessment" && <p dir="auto">{question.questionTextAr}</p>}
    <p dir="auto">{question.questionTextEn}</p>
    {question.instructions && <p dir="auto" className="text-xs">{question.instructions}</p>}
    {(question.options ?? []).map((option) => <div key={option.id} className="rounded border p-2" dir="auto">
      {module === "assessment" && <div>{option.textAr}</div>}<div>{option.textEn}</div>
      {option.isCorrect && <span className="text-xs font-semibold text-primary">{t("labels.correct")}</span>}
    </div>)}
    {question.correctAnswer !== undefined && <p>{t("labels.answer")}: {t(question.correctAnswer ? "labels.true" : "labels.false")}</p>}
    {[question.expectedAnswer, question.sampleAnswerAr, question.sampleAnswerEn].filter(Boolean).map((answer, index) => <p key={index} dir="auto">{t("labels.answer")}: {answer}</p>)}
  </div>;
}

export default function ExcelImportPreview({ draft, warnings }: { draft: ImportedDraft; warnings: ImportIssue[] }) {
  const t = useTranslations("academics.excelImport");
  const translate = useTranslations();
  const tTypes = useTranslations("academics.curriculum.questions.question_types");
  const metadataFields = importSchemas(draft.module)[0].columns;
  const total = draft.questions.reduce((sum, question) => sum + Math.round(question.points * 100), 0) / 100;
  const rows: PreviewQuestion[] = draft.questions.map((question) => ({ id: question.id, number: Number(question.id.replace("temp-question-", "")), question }));
  const columns: Column<PreviewQuestion>[] = [
    { key: "number", label: t("fields.questionNumber") },
    { key: "type", label: t("fields.questionType"), render: (_, row) => tTypes(row.question.questionType) },
    { key: "content", label: t("labels.questions"), render: (_, row) => <QuestionContents question={row.question} module={draft.module} /> },
    { key: "points", label: t("fields.points"), render: (_, row) => row.question.points },
  ];
  return <div className="space-y-4">
    <dl className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
      {Object.entries(draft.metadata).filter(([field, value]) => value != null && metadataFields.includes(draft.module === "assessment" && field === "title" ? "titleEn" : field)).map(([field, value]) => <div key={field}>
        <dt className="text-xs text-gray-500">{t(`fields.${draft.module === "assessment" && field === "title" ? "titleEn" : field}`)}</dt>
        <dd dir="auto" className="whitespace-pre-wrap break-words text-sm">{typeof value === "boolean" ? t(value ? "labels.true" : "labels.false") : String(value)}</dd>
      </div>)}
    </dl>
    {draft.module === "assessment" && <p className="text-sm">{t("labels.questionBased")}</p>}
    <p className="text-sm font-semibold">{t("labels.totalPoints", { total })}</p>
    {warnings.map((warning, index) => <p key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{translate(warning.messageKey, warning.values)}</p>)}
    <div className="overflow-x-auto"><DataTable columns={columns} data={rows} getRowKey={(row) => row.id} itemsPerPage={10} /></div>
  </div>;
}
