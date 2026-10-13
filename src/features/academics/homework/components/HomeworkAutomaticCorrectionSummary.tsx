"use client";

import { useTranslations } from "next-intl";
import type { HomeworkCorrectionResult } from "../services/homeworkAutomaticCorrectionExecution";

export default function HomeworkAutomaticCorrectionSummary({ outcomes }: { outcomes: readonly HomeworkCorrectionResult[] }) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  const unresolved = outcomes.flatMap(outcome => outcome.plan?.unresolved ?? []);
  const counts = {
    correctedAnswers: outcomes.reduce((total, outcome) => total + (outcome.outcome === "failed" && outcome.failedStage === "answers" ? 0 : outcome.plan?.correctedCount ?? 0), 0),
    completedReviews: outcomes.filter(outcome => outcome.reviewCompleted).length,
    syncedGrades: outcomes.filter(outcome => outcome.gradeSynced).length,
    manualPending: unresolved.filter(question => question.reason === "manual_question").length,
    missingAnswers: unresolved.filter(question => question.reason === "missing_answer_record").length,
    invalidDefinitions: unresolved.filter(question => question.reason === "invalid_definition").length,
    pendingStudents: outcomes.filter(outcome => outcome.outcome === "manual_pending").length,
    skippedStudents: outcomes.filter(outcome => outcome.outcome === "skipped").length,
    failures: outcomes.filter(outcome => outcome.outcome === "failed").length,
  };
  const reasons = [...new Set(outcomes.flatMap(outcome => outcome.syncUnavailableReason ? [outcome.syncUnavailableReason] : []))];
  return <div role="status" aria-live="polite" className="space-y-3 rounded-lg border border-border p-3 text-sm">
    <dl className="grid grid-cols-2 gap-2">{Object.entries(counts).map(([label, count]) => <div key={label}>
      <dt className="text-gray-600">{t(label)}</dt><dd className="font-semibold">{count}</dd>
    </div>)}</dl>
    {reasons.map(reason => <p key={reason} className="text-amber-800">{t(`syncReasons.${reason}`)}</p>)}
  </div>;
}
