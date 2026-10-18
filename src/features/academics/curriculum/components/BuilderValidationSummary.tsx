"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { AssignmentQuestion } from "../services/curriculumService";
import type { ValidationErrors } from "../types/types";

interface BuilderValidationSummaryProps {
  questions: AssignmentQuestion[];
  validationErrors: ValidationErrors;
  onSelectQuestion: (questionId: string) => void;
}

export default function BuilderValidationSummary({ questions, validationErrors, onSelectQuestion }: BuilderValidationSummaryProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const issues = questions.flatMap((question, index) => {
    const messages = Object.values(validationErrors.questions?.[question.id] ?? {}).filter(Boolean);
    return messages.length ? [{ id: question.id, number: index + 1, messages }] : [];
  });

  const settingsErrors = (["titleAr", "titleEn", "descriptionAr", "descriptionEn", "dueDate", "maxScore", "expectedTimeMinutes"] as const)
    .flatMap(field => validationErrors[field] ? [{ field, message: validationErrors[field] }] : []);
  const generalErrors = validationErrors.general ?? [];

  if (!issues.length && !settingsErrors.length && !generalErrors.length) return null;

  return (
    <div role="region" aria-label={t("validationSummary")} className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      {settingsErrors.length > 0 && <div className="mb-3">
        <p role="status" className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{t("settingsValidationHeading")}</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {settingsErrors.map(({ field, message }) => <li key={field}><span className="font-medium">{t(`validationFields.${field}`)}:</span> {message}</li>)}
        </ul>
        <p className="mt-2 text-xs">{t("settingsValidationHint")}</p>
      </div>}
      {generalErrors.length > 0 && <ul className="mb-3 list-inside list-disc space-y-1" role="alert">{generalErrors.map(message => <li key={message}>{message}</li>)}</ul>}
      {issues.length > 0 && <><p role="status" className="flex items-center gap-2 font-medium">
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
      </ul></>}
    </div>
  );
}
