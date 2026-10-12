"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { ImportedDraft } from "./types";

const QUESTIONS_PER_PAGE = 10;

function QuestionChoices({ question, module }: { question: AssignmentQuestion; module: ImportedDraft["module"] }) {
  const t = useTranslations("academics.excelImport");
  if (!question.options?.length) return null;
  return <ul aria-label={t("labels.choices")} className="space-y-2">
    {question.options.map(option => <li key={option.id} className={`min-w-0 rounded-xl border p-3 ${option.isCorrect ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-gray-50"}`}>
      {module === "assessment" && <p dir="auto">{option.textAr}</p>}
      <p dir="auto">{option.textEn}</p>
      {option.isCorrect && <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{t("labels.correct")}</span>}
    </li>)}
  </ul>;
}

function QuestionContents({ question, module }: { question: AssignmentQuestion; module: ImportedDraft["module"] }) {
  const t = useTranslations("academics.excelImport");
  const answers = [question.expectedAnswer, question.sampleAnswerAr, question.sampleAnswerEn].filter(Boolean);
  return <div className="space-y-4 whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]">
    <div className="space-y-2 font-medium text-gray-900">
      {module === "assessment" && <p dir="auto">{question.questionTextAr}</p>}
      <p dir="auto">{question.questionTextEn}</p>
    </div>
    {question.instructions && <p dir="auto" className="rounded-lg bg-gray-50 p-3 text-gray-600">{question.instructions}</p>}
    <QuestionChoices question={question} module={module} />
    {(question.correctAnswer !== undefined || answers.length > 0) && <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <p className="text-xs font-semibold text-primary">{t("labels.answer")}</p>
      {question.correctAnswer !== undefined && <p>{t(question.correctAnswer ? "labels.true" : "labels.false")}</p>}
      {answers.map((answer, index) => <p key={index} dir="auto">{answer}</p>)}
    </div>}
  </div>;
}

function QuestionCard({ question, module }: { question: AssignmentQuestion; module: ImportedDraft["module"] }) {
  const t = useTranslations("academics.excelImport");
  const tTypes = useTranslations("academics.curriculum.questions.question_types");
  const number = Number(question.id.replace("temp-question-", ""));
  const headingId = `import-preview-${module}-${question.id}`;
  return <article aria-labelledby={headingId} className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h3 id={headingId} className="font-semibold text-gray-900">{t("labels.questionHeading", { number })}</h3>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">{tTypes(question.questionType)}</span>
      </div>
      <p className="text-sm font-semibold text-primary">{t("fields.points")}: {question.points}</p>
    </div>
    <div className="p-4 sm:p-5"><QuestionContents question={question} module={module} /></div>
  </article>;
}

export default function ExcelImportQuestionCards({ draft }: { draft: ImportedDraft }) {
  const t = useTranslations("academics.excelImport");
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(draft.questions.length / QUESTIONS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
  return <section aria-label={t("labels.questions")} className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-gray-900">{t("labels.questions")}</h2>
      <p aria-live="polite" className="text-sm text-gray-500">{t("labels.questionRange", { start: start + 1, end: Math.min(start + QUESTIONS_PER_PAGE, draft.questions.length), total: draft.questions.length })}</p>
    </div>
    <div className="space-y-4">{draft.questions.slice(start, start + QUESTIONS_PER_PAGE).map(question => <QuestionCard key={question.id} question={question} module={draft.module} />)}</div>
    {pageCount > 1 && <nav aria-label={t("labels.questions")} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <Button variant="secondary" className="min-h-11" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>{t("actions.previousQuestions")}</Button>
      <span className="text-sm text-gray-600">{t("labels.questionPage", { page: currentPage, total: pageCount })}</span>
      <Button variant="secondary" className="min-h-11" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>{t("actions.nextQuestions")}</Button>
    </nav>}
  </section>;
}
