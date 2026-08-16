"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { ConfirmDialog, EmptyState, Input, TextArea } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { usePermissions } from "@/hooks/usePermissions";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { fetchAssessmentQuestions } from "../../assessments/services/gradesAssessmentsService";
import type { AssessmentQuestion } from "../../shared/types";
import {
  fetchGradeSubmission,
  finalizeSubmissionReview,
  reviewSubmissionAnswer,
  saveSubmissionAnswer,
  saveSubmissionAnswers,
  submitGradeSubmission,
  syncSubmissionGradeItem,
} from "../services/gradesSubmissionsService";
import type { GradeSubmissionDetail } from "../types";
import {
  MAX_ANSWER_TEXT_LENGTH,
  MAX_REVIEWER_COMMENT_LENGTH,
} from "../utils/submissionContract";
import {
  isChoiceSubmissionQuestion,
  shouldFetchSubmissionQuestionDefinitions,
  submissionStatusMessageKey,
} from "../utils/submissionStatus";

interface DraftAnswer {
  answerText: string;
  selectedOptionIds: string[];
  awardedPoints: string;
  reviewerComment: string;
}

export default function GradeSubmissionPage({ submissionId }: { submissionId: string }) {
  const t = useTranslations("academics.grades.submissions");
  const commonT = useTranslations("common");
  const errorT = useTranslations("academics.grades.errors");
  const locale = useLocale();
  const { hasPermission } = usePermissions();
  const canViewQuestions = hasPermission("grades.questions.view");
  const [submission, setSubmission] = useState<GradeSubmissionDetail | null>(null);
  const [questionDefinitions, setQuestionDefinitions] = useState<Record<string, AssessmentQuestion>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const loadSubmission = useCallback(async () => {
    setIsLoading(true);
    try {
      const detail = await fetchGradeSubmission(submissionId);
      const definitions = canViewQuestions && shouldFetchSubmissionQuestionDefinitions(detail.status)
        ? await fetchAssessmentQuestions("", detail.termId, detail.assessmentId)
        : [];
      setSubmission(detail);
      setQuestionDefinitions(Object.fromEntries(definitions.map((question) => [question.id, question])));
      setDrafts(Object.fromEntries(detail.questions.map((question) => [question.id, {
        answerText: question.answer?.answerText ?? "",
        selectedOptionIds: question.answer?.selectedOptions?.map((option) => option.optionId) ?? [],
        awardedPoints: question.answer?.awardedPoints?.toString() ?? "",
        reviewerComment: question.answer?.reviewerComment ?? "",
      }])));
      setError(null);
    } catch (requestError) {
      setError(errorT(mapGradesApiError(requestError)));
    } finally {
      setIsLoading(false);
    }
  }, [canViewQuestions, errorT, submissionId]);

  useEffect(() => { void Promise.resolve().then(loadSubmission); }, [loadSubmission]);

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setActiveAction(key);
    setError(null);
    try { await action(); await loadSubmission(); }
    catch (requestError) { setError(errorT(mapGradesApiError(requestError))); }
    finally { setActiveAction(null); }
  };

  const canEnter = hasPermission("grades.submissions.submit") && submission?.status === "in_progress";
  const canReview = hasPermission("grades.submissions.review") && submission?.status === "submitted";
  const canFinalize = canReview && submission.progress.pendingCorrectionCount === 0;
  const canSubmit = canEnter && submission.progress.requiredAnsweredCount === submission.progress.requiredQuestionCount;
  const sortedQuestions = useMemo(() => [...(submission?.questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [submission]);

  if (isLoading && !submission) return <div className="p-8"><PartialLoader /></div>;
  if (!submission) return <EmptyState message={error || t("empty")} />;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-color)] pb-4 md:flex-row md:items-end">
        <div><h1 className="text-xl font-semibold text-[var(--text-primary)]">{submission.assessment?.titleEn || t("detailTitle")}</h1><p className="text-sm text-[var(--text-secondary)]">{submission.student?.nameEn} · {t(`statuses.${submissionStatusMessageKey(submission.status)}`)} · {submission.progress.answeredCount}/{submission.progress.totalQuestions}</p></div>
        <div className="flex flex-wrap gap-2">
          {canEnter ? <Button variant="secondary" loading={activeAction === "save-all"} onClick={() => void runAction("save-all", () => saveSubmissionAnswers(submission.id, sortedQuestions.map((question) => ({ questionId: question.id, answerText: drafts[question.id]?.answerText || null, selectedOptionIds: drafts[question.id]?.selectedOptionIds ?? [] }))))}>{t("saveAll")}</Button> : null}
          {canSubmit ? <Button loading={activeAction === "submit"} onClick={() => setIsSubmitDialogOpen(true)}>{t("submit")}</Button> : null}
          {canFinalize ? <Button loading={activeAction === "finalize"} onClick={() => void runAction("finalize", () => finalizeSubmissionReview(submission.id))}>{t("finalize")}</Button> : null}
          {hasPermission("grades.submissions.review") && submission.status === "corrected" ? <Button loading={activeAction === "sync"} onClick={() => void runAction("sync", () => syncSubmissionGradeItem(submission.id))}>{t("sync")}</Button> : null}
        </div>
      </div>
      {error ? <div className="border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error-text)]">{error}</div> : null}
      <div className="space-y-4">{sortedQuestions.map((question, index) => {
        const draft = drafts[question.id] ?? { answerText: "", selectedOptionIds: [], awardedPoints: "", reviewerComment: "" };
        const definition = questionDefinitions[question.id];
        const isChoiceQuestion = definition
          ? definition.questionType === "MCQ_SINGLE" || definition.questionType === "MCQ_MULTI" || definition.questionType === "TRUE_FALSE"
          : isChoiceSubmissionQuestion(question.type);
        return <section key={question.id} className="border border-[var(--border-color)] bg-[var(--surface-color)] p-4">
          <div className="mb-3 flex justify-between gap-3"><h2 className="font-medium text-[var(--text-primary)]">{index + 1}. {question.prompt}</h2><span className="text-sm text-[var(--text-secondary)]">{question.points} {t("points")}</span></div>
          {isChoiceQuestion && canEnter ? <div className="space-y-2">{definition?.options?.map((option) => {
            const checked = draft.selectedOptionIds.includes(option.id);
            return <label key={option.id} className="flex items-center gap-3 border border-[var(--border-color)] p-3 text-sm"><input type={definition.questionType === "MCQ_MULTI" ? "checkbox" : "radio"} name={`question-${question.id}`} checked={checked} disabled={!canEnter} onChange={() => setDrafts((current) => ({ ...current, [question.id]: { ...draft, selectedOptionIds: definition.questionType === "MCQ_MULTI" ? (checked ? draft.selectedOptionIds.filter((id) => id !== option.id) : [...draft.selectedOptionIds, option.id]) : [option.id] } }))} /><span>{option.textEn || option.textAr}</span></label>;
          })}</div> : isChoiceQuestion ? <div className="space-y-2">{question.answer?.selectedOptions.map((option) => <div key={option.optionId} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{locale === "ar" ? option.labelAr || option.label : option.label}</div>)}</div> : <TextArea maxLength={MAX_ANSWER_TEXT_LENGTH} rows={4} value={draft.answerText} disabled={!canEnter} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: { ...draft, answerText: event.target.value } }))} placeholder={t("answerPlaceholder")} aria-label={t("answerPlaceholder")} />}
          {canEnter ? <div className="mt-2 text-end"><Button size="sm" variant="secondary" loading={activeAction === `answer-${question.id}`} onClick={() => void runAction(`answer-${question.id}`, () => saveSubmissionAnswer(submission.id, question.id, { answerText: isChoiceQuestion ? null : draft.answerText || null, selectedOptionIds: isChoiceQuestion ? draft.selectedOptionIds : null }))}>{t("saveAnswer")}</Button></div> : null}
          {hasPermission("grades.submissions.review") && question.answer ? <div className="mt-4 grid gap-3 border-t border-[var(--border-color)] pt-4 md:grid-cols-[140px_1fr_auto]"><Input label={t("awardedPoints")} type="number" min={0} max={question.points} value={draft.awardedPoints} disabled={!canReview} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: { ...draft, awardedPoints: event.target.value } }))} /><Input label={t("reviewComment")} maxLength={MAX_REVIEWER_COMMENT_LENGTH} value={draft.reviewerComment} disabled={!canReview} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: { ...draft, reviewerComment: event.target.value } }))} />{canReview ? <Button size="sm" variant="secondary" className="self-end" loading={activeAction === `review-${question.id}`} disabled={draft.awardedPoints === "" || !Number.isFinite(Number(draft.awardedPoints)) || Number(draft.awardedPoints) < 0 || Number(draft.awardedPoints) > question.points} onClick={() => void runAction(`review-${question.id}`, () => reviewSubmissionAnswer(submission.id, question.answer!.id, { awardedPoints: Number(draft.awardedPoints), reviewerComment: draft.reviewerComment || null }))}>{t("saveReview")}</Button> : null}</div> : null}
        </section>;
      })}</div>
      <ConfirmDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={() => {
          void runAction("submit", () => submitGradeSubmission(submission.id)).then(() => {
            setIsSubmitDialogOpen(false);
          });
        }}
        title={t("submit")}
        description={t("submitConfirm")}
        confirmLabel={t("submit")}
        cancelLabel={commonT("cancel")}
        loading={activeAction === "submit"}
        severity="warning"
      />
    </div>
  );
}
