"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import QuestionEditor from "@/features/academics/curriculum/components/QuestionEditor";
import QuestionOutlineItem from "@/features/academics/curriculum/components/QuestionOutlineItem";
import type { QuestionValidationError } from "@/features/academics/curriculum/types/types";
import type { HomeworkCreateQuestions } from "../hooks/useHomeworkCreateQuestions";
import { HOMEWORK_DRAFT_LIMITS, type HomeworkDraftIssue } from "../utils/homeworkQuestionDraft.types";
import { validateHomeworkDraftQuestion } from "../utils/homeworkQuestionDraftValidation";

export default function HomeworkQuestionAuthoringPanel({ authoring, locked, issues }: { authoring: HomeworkCreateQuestions; locked: boolean; issues: HomeworkDraftIssue[] }) {
  const t = useTranslations("academics.homework.manual");
  const translate = useTranslations();
  if (authoring.content.kind !== "manual") return null;
  const { questions, selectedQuestionId } = authoring.content;
  const selected = questions.find(question => question.id === selectedQuestionId);
  const errors: QuestionValidationError = Object.fromEntries(issues.filter(issue => issue.scope === "question" && issue.questionId === selectedQuestionId).map(issue => [issue.field, translate(issue.messageKey, issue.values)]));
  return <section aria-label={t("title")} className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
      <div><h2 className="text-lg font-semibold">{t("title")}</h2><p className="mt-1 text-sm text-gray-600">{t("localHelp")}</p><p className="mt-1 text-sm text-gray-600">{t("content", { count: questions.length })}</p></div>
      <Button variant="secondary" leftIcon={<ChevronDown size={16} />} disabled={locked} onClick={() => authoring.setEditorOpen(!authoring.editorOpen)}>{t(authoring.editorOpen ? "hide" : "show")}</Button>
    </div>
    {authoring.editorOpen && <div className="border-t border-gray-100 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">{t("optionalHelp")}</p>
        <Button variant="secondary" leftIcon={<Plus size={18} />} onClick={authoring.addQuestion} disabled={locked || questions.length >= HOMEWORK_DRAFT_LIMITS.questions}>{t("add")}</Button>
      </div>
      {!selected ? <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">{t("empty")}</p> : <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="max-h-96 min-w-0 overflow-y-auto lg:max-h-[720px]">
          {questions.map((question, index) => <QuestionOutlineItem key={question.id} question={question} index={index} isSelected={question.id === selectedQuestionId} onSelect={() => authoring.selectQuestion(question.id)} onMoveUp={() => authoring.moveQuestion(question.id, "up")} onMoveDown={() => authoring.moveQuestion(question.id, "down")} onDelete={() => authoring.deleteQuestion(question.id)} canMoveUp={index > 0} canMoveDown={index < questions.length - 1} isReadOnly={locked} validationErrors={validateHomeworkDraftQuestion(question)} />)}
        </div>
        <div className="min-w-0 overflow-hidden [&_input]:box-border! [&_input]:min-w-0! [&_input]:max-w-full! [&_[aria-haspopup=listbox]]:box-border! [&_[aria-haspopup=listbox]]:max-w-full!">
          <QuestionEditor key={selected.id} question={selected} isReadOnly={locked} onChange={updates => authoring.updateQuestion(selected.id, updates)} allowedQuestionTypes={["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]} requireBothLocalizedTexts={false} showHomeworkFields detailsInputMode="single" validationErrors={errors} />
        </div>
      </div>}
    </div>}
  </section>;
}
