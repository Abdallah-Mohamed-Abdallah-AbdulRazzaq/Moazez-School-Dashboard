"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { AssignmentQuestion } from "../services/curriculumService";
import type { ValidationErrors } from "../types/types";

interface QuestionValidationSummaryProps {
  questions: AssignmentQuestion[];
  validationErrors: ValidationErrors;
  onSelectQuestion: (questionId: string) => void;
}

export default function QuestionValidationSummary({ questions, validationErrors, onSelectQuestion }: QuestionValidationSummaryProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const issues = questions.flatMap((question, index) => {
    const messages = Object.values(validationErrors.questions?.[question.id] ?? {}).filter(Boolean);
    return messages.length ? [{ id: question.id, number: index + 1, messages }] : [];
  });

  if (!issues.length) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <p role="status" className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("questionsNeedAttention", { count: issues.length })}
      </p>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {issues.map(issue => (
          <li key={issue.id}>
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelectQuestion(issue.id)} className="min-h-10 max-w-full !justify-start !text-start !text-amber-950 underline decoration-amber-400 underline-offset-4 focus-visible:ring-2 focus-visible:ring-primary">
              {t("questionIssue", { number: issue.number, message: issue.messages.join(" · ") })}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
