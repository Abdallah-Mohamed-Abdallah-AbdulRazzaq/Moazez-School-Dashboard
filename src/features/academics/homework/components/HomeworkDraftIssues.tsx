"use client";

import { useTranslations } from "next-intl";
import type { AssignmentQuestion } from "@/features/academics/curriculum/services/curriculumService";
import type { HomeworkDraftIssue } from "../utils/homeworkQuestionDraft.types";

export default function HomeworkDraftIssues({ issues, questions }: { issues: HomeworkDraftIssue[]; questions: AssignmentQuestion[] }) {
  const translate = useTranslations();
  const t = useTranslations("academics.homework.manual");
  return <ul role="alert" className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {issues.map((issue, index) => <li key={`${issue.scope}:${issue.field}:${index}`}>
      <strong>{issue.scope === "question" ? t("questionNumber", { number: questions.findIndex(question => question.id === issue.questionId) + 1 }) : t("details")}: </strong>
      {translate(issue.messageKey, issue.values)}
    </li>)}
  </ul>;
}
