"use client";

import { useTranslations } from "next-intl";
import type { ImportedDraft, ImportIssue } from "./types";
import { importSchemas } from "./templateSchemas";
import ExcelImportQuestionCards from "./ExcelImportQuestionCards";

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

export default function ExcelImportPreview({ draft, warnings }: { draft: ImportedDraft; warnings: ImportIssue[] }) {
  const t = useTranslations("academics.excelImport");
  const translate = useTranslations();
  const metadataFields = importSchemas(draft.module)[0].columns;
  const total = draft.questions.reduce((sum, question) => sum + Math.round(question.points * 100), 0) / 100;
  return <div className="space-y-4">
    <h2 className="text-base font-semibold text-gray-900">{t("labels.details")}</h2>
    <dl className="grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-2 sm:p-5 [&>div]:min-w-0">
      {Object.entries(draft.metadata).filter(([field, value]) => value != null && metadataFields.includes(draft.module === "assessment" && field === "title" ? "titleEn" : field)).map(([field, value]) => <div key={field}>
        <dt className="text-xs text-gray-500">{t(`fields.${draft.module === "assessment" && field === "title" ? "titleEn" : field}`)}</dt>
        <dd dir="auto" className="whitespace-pre-wrap break-words text-sm">{typeof value === "boolean" ? t(value ? "labels.true" : "labels.false") : String(value)}</dd>
      </div>)}
    </dl>
    {draft.module === "assessment" && <p className="text-sm">{t("labels.questionBased")}</p>}
    <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm font-semibold text-primary">{t("labels.totalPoints", { total })}</p>
    {warnings.map((warning, index) => <p key={index} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{translate(warning.messageKey, warning.values)}</p>)}
    <ExcelImportQuestionCards draft={draft} />
  </div>;
}
