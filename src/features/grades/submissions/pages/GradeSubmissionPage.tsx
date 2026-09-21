"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CircleGauge,
  ClipboardCheck,
  type LucideIcon,
  School,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { ConfirmDialog, EmptyState } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { fetchAssessmentQuestions } from "../../assessments/services/gradesAssessmentsService";
import { describeGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import type { AssessmentQuestion } from "../../shared/types";
import SubmissionQuestionAnswerField from "../components/SubmissionQuestionAnswerField";
import SubmissionAnswerReviewFields from "../components/SubmissionAnswerReviewFields";
import {
  fetchGradeSubmission,
  finalizeSubmissionReview,
  reviewSubmissionAnswer,
  reviewSubmissionAnswers,
  saveSubmissionAnswer,
  saveSubmissionAnswers,
  submitGradeSubmission,
  syncSubmissionGradeItem,
} from "../services/gradesSubmissionsService";
import type { GradeSubmissionDetail, SubmissionAnswerDraft } from "../types";
import {
  changeMatchingAnswer,
  createSubmissionAnswerDraft,
  createSubmissionAnswerPayload,
  hasSubmissionAnswer,
  isMatchingQuestion,
} from "../utils/submissionAnswerPayload";
import {
  buildDirtyReviewPayloads,
  createSubmissionReviewDraft,
  getDirtyReviewAnswerIds,
  hasSubmissionReviewErrors,
  toSubmissionReviewPayload,
  validateSubmissionReviewDraft,
  type SubmissionReviewDraft,
} from "../utils/submissionReviewDrafts";
import { buildSubmissionReturnHref } from "../utils/submissionNavigation";
import {
  submissionStatusMessageKey,
} from "../utils/submissionStatus";

const EMPTY_DRAFT: SubmissionAnswerDraft = {
  answerText: "",
  selectedOptionIds: [],
  matchingAnswers: {},
};

const QUESTION_TYPE_MESSAGE_KEYS = {
  MCQ_SINGLE: "singleChoice",
  MCQ_MULTI: "multipleChoice",
  TRUE_FALSE: "trueFalse",
  SHORT_ANSWER: "shortAnswer",
  ESSAY: "essay",
  FILL_IN_BLANK: "fillInBlank",
  MATCHING: "matching",
  MEDIA: "media",
} as const;

export default function GradeSubmissionPage({ submissionId }: { submissionId: string }) {
  const t = useTranslations("academics.grades.submissions");
  const commonT = useTranslations("common");
  const errorT = useTranslations("academics.grades.errors");
  const { showError, showSuccess } = useToast();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const canViewQuestions = hasPermission("grades.questions.view");
  const canReviewPermission = hasPermission("grades.submissions.review");
  const [submission, setSubmission] = useState<GradeSubmissionDetail | null>(null);
  const [questionDefinitions, setQuestionDefinitions] = useState<Record<string, AssessmentQuestion>>({});
  const [drafts, setDrafts] = useState<Record<string, SubmissionAnswerDraft>>({});
  const [initialReviewDrafts, setInitialReviewDrafts] = useState<Record<string, SubmissionReviewDraft>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, SubmissionReviewDraft>>({});
  const reviewDraftsRef = useRef(reviewDrafts);
  useEffect(() => { reviewDraftsRef.current = reviewDrafts; }, [reviewDrafts]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const actionLockRef = useRef(false);
  const [error, setError] = useState<{ message: string; traceId?: string } | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const loadSubmission = useCallback(async (options: { preserveReviews?: boolean; error?: { message: string; traceId?: string } } = {}) => {
    const previousDrafts = reviewDraftsRef.current;
    setIsLoading(true);
    try {
      const detail = await fetchGradeSubmission(submissionId);
      const definitions = canViewQuestions
        ? await fetchAssessmentQuestions("", detail.termId, detail.assessmentId)
        : [];
      const definitionsByQuestionId = Object.fromEntries(
        definitions.map((question) => [question.id, question]),
      );

      setSubmission(detail);
      setQuestionDefinitions(definitionsByQuestionId);
      setDrafts(Object.fromEntries(detail.questions.map((question) => [
        question.id,
        createSubmissionAnswerDraft(question.answer, definitionsByQuestionId[question.id]),
      ])));
      const reviews = Object.fromEntries(detail.questions.flatMap((question) => question.answer ? [[question.answer.id, createSubmissionReviewDraft(question.answer)]] : []));
      const merged = options.preserveReviews && detail.status === "submitted" && canReviewPermission
        ? Object.fromEntries(Object.keys(reviews).map((id) => [id, previousDrafts[id] ?? reviews[id]]))
        : reviews;
      setInitialReviewDrafts(reviews);
      setReviewDrafts(merged);
      setError(options.error ?? null);
      return { ok: true as const };
    } catch (requestError) {
      const descriptor = describeGradesApiError(requestError);
      setError({ message: errorT(descriptor.key), traceId: descriptor.traceId });
      return { ok: false as const, error: { message: errorT(descriptor.key), traceId: descriptor.traceId } };
    } finally {
      setIsLoading(false);
    }
  }, [canReviewPermission, canViewQuestions, errorT, submissionId]);

  useEffect(() => {
    void loadSubmission();
  }, [loadSubmission]);

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setActiveAction(key);
    setError(null);
    try {
      await action();
      await loadSubmission();
      if (key === "sync") showSuccess(t("messages.synced"));
    } catch (requestError) {
      const descriptor = describeGradesApiError(requestError);
      const mappedError = { message: errorT(descriptor.key), traceId: descriptor.traceId };
      if (key === "sync") showError(mappedError.message);
      const stale = ["submission_already_submitted", "submission_locked", "submission_not_submitted", "review_already_finalized", "review_pending_answers"].includes(descriptor.key);
      if (stale) await loadSubmission({ preserveReviews: true, error: mappedError });
      else setError(mappedError);
    } finally {
      setActiveAction(null);
      actionLockRef.current = false;
    }
  };

  const runBulkReview = async () => {
    if (!submission || !bulkReviewPayloads || actionLockRef.current) return;
    actionLockRef.current = true;
    setActiveAction("review-all");
    setError(null);
    try {
      await reviewSubmissionAnswers(submission.id, bulkReviewPayloads);
      await loadSubmission();
    } catch (saveError) {
      const saveDescriptor = describeGradesApiError(saveError);
      const saveMapped = { message: errorT(saveDescriptor.key), traceId: saveDescriptor.traceId };
      const reloadResult = await loadSubmission({ preserveReviews: true });
      if (reloadResult.ok) {
        setError({ message: t("bulkReviewPartialRecovery"), traceId: saveDescriptor.traceId });
      } else {
        setError({ message: t("bulkReviewRecoveryFailed", { saveError: saveMapped.message, reloadError: reloadResult.error.message }), traceId: reloadResult.error.traceId ?? saveDescriptor.traceId });
      }
    } finally {
      setActiveAction(null);
      actionLockRef.current = false;
    }
  };

  const canEnter = hasPermission("grades.submissions.submit") && submission?.status === "in_progress";
  const canReview = hasPermission("grades.submissions.review") && submission?.status === "submitted";
  const canViewReview = hasPermission("grades.submissions.review") && (submission?.status === "submitted" || submission?.status === "corrected");
  const canSubmit = canEnter && submission.progress.requiredAnsweredCount === submission.progress.requiredQuestionCount;
  const sortedQuestions = useMemo(
    () => [...(submission?.questions ?? [])].sort((first, second) => first.sortOrder - second.sortOrder),
    [submission],
  );
  const reviewAnswers = useMemo(() => sortedQuestions.flatMap((question) => question.answer ? [{ id: question.answer.id, maxPoints: question.answer.maxPoints ?? question.points }] : []), [sortedQuestions]);
  const dirtyAnswerIds = useMemo(() => getDirtyReviewAnswerIds(reviewDrafts, initialReviewDrafts), [initialReviewDrafts, reviewDrafts]);
  const hasDirtyReviews = dirtyAnswerIds.length > 0;
  const hasInvalidDirtyReviews = dirtyAnswerIds.some((id) => hasSubmissionReviewErrors(validateSubmissionReviewDraft(reviewDrafts[id], reviewAnswers.find((answer) => answer.id === id)?.maxPoints ?? 0)));
  const bulkReviewPayloads = useMemo(() => buildDirtyReviewPayloads(reviewDrafts, initialReviewDrafts, reviewAnswers), [initialReviewDrafts, reviewAnswers, reviewDrafts]);
  const canFinalize = Boolean(canReview && !hasDirtyReviews && !hasInvalidDirtyReviews && submission?.progress.pendingCorrectionCount === 0);

  useEffect(() => {
    if (!hasDirtyReviews) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasDirtyReviews]);
  const answerPayloads = useMemo(
    () => sortedQuestions.flatMap((question) => {
      const definition = questionDefinitions[question.id];
      const draft = drafts[question.id] ?? EMPTY_DRAFT;
      const payload = createSubmissionAnswerPayload(question.type, definition, draft);
      const isCompleteMatchingAnswer = !isMatchingQuestion(question.type, definition)
        || hasCompleteMatchingAnswer(definition, draft);

      return hasSubmissionAnswer(payload) && isCompleteMatchingAnswer
        ? [{ questionId: question.id, ...payload }]
        : [];
    }),
    [drafts, questionDefinitions, sortedQuestions],
  );

  if (isLoading && !submission) return <div className="p-8"><PartialLoader /></div>;
  if (!submission) return <EmptyState message={error?.message || t("empty")} />;

  const returnHref = buildSubmissionReturnHref({
    locale,
    source: searchParams.get("source"),
    assessmentId: searchParams.get("assessmentId") ?? submission.assessmentId,
    context: searchParams,
  });
  const studentName = locale === "ar"
    ? submission.student?.nameAr || submission.student?.nameEn
    : submission.student?.nameEn;
  const finalizeBlocker = !canFinalize
    ? submission.status !== "submitted"
      ? t("finalizeBlockedStatus")
      : hasDirtyReviews || hasInvalidDirtyReviews
        ? t("finalizeBlockedUnsaved")
        : t("finalizeBlockedPending")
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <header className="sticky top-16 z-20 overflow-hidden rounded-2xl border border-primary bg-[var(--surface-color)] shadow-sm sm:top-[-24px]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between md:p-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-[var(--text-primary)]">
              {locale === "ar"
                ? submission.assessment?.titleAr || submission.assessment?.titleEn || t("detailTitle")
                : submission.assessment?.titleEn || submission.assessment?.titleAr || t("detailTitle")}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {studentName ? (
                <>
                  <span className="text-[var(--text-secondary)]">{studentName}</span>
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[var(--text-secondary)]"
                  />
                </>
              ) : null}
              <span className="rounded-full bg-[var(--color-primary-50)] px-3 py-1 text-xs font-semibold text-[var(--primary-color)]">
                {t(`statuses.${submissionStatusMessageKey(submission.status)}`)} · {submission.progress.answeredCount}/{submission.progress.totalQuestions}
              </span>
            </div>
          </div>
          <Button
            className="shrink-0 self-start"
            variant="secondary"
            leftIcon={locale === "ar"
              ? <ArrowRight className="h-4 w-4" aria-hidden="true" />
              : <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => hasDirtyReviews
              ? setIsDiscardDialogOpen(true)
              : router.push(returnHref)}
          >
            {t("back")}
          </Button>
        </div>
        {canEnter || canReviewPermission ? (
          <div className="border-t border-[var(--border-color)] bg-[var(--surface-secondary)] px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {canReviewPermission && finalizeBlocker ? (
                <p className="text-xs leading-5 text-[var(--text-secondary)]">
                  {finalizeBlocker}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
                {canEnter ? (
                  <Button
                    variant="secondary"
                    disabled={activeAction !== null || answerPayloads.length === 0}
                    loading={activeAction === "save-all"}
                    onClick={() => void runAction(
                      "save-all",
                      () => saveSubmissionAnswers(submission.id, answerPayloads),
                    )}
                  >
                    {t("saveAll")}
                  </Button>
                ) : null}
                {canReview ? (
                  <Button
                    variant="secondary"
                    loading={activeAction === "review-all"}
                    disabled={!hasDirtyReviews || hasInvalidDirtyReviews || !bulkReviewPayloads || activeAction !== null}
                    onClick={() => void runBulkReview()}
                  >
                    {t("saveAllReviews")}
                  </Button>
                ) : null}
                {canSubmit ? (
                  <Button
                    loading={activeAction === "submit"}
                    disabled={activeAction !== null}
                    onClick={() => setIsSubmitDialogOpen(true)}
                  >
                    {t("submit")}
                  </Button>
                ) : null}
                {canReviewPermission ? (
                  <Button
                    loading={activeAction === "finalize"}
                    disabled={!canFinalize || activeAction !== null}
                    onClick={() => void runAction(
                      "finalize",
                      () => finalizeSubmissionReview(submission.id),
                    )}
                  >
                    {t("finalize")}
                  </Button>
                ) : null}
                {canReviewPermission && submission.status === "corrected" ? (
                  <Button
                    variant="secondary"
                    loading={activeAction === "sync"}
                    disabled={activeAction !== null}
                    onClick={() => void runAction(
                      "sync",
                      () => syncSubmissionGradeItem(submission.id),
                    )}
                  >
                    {t("sync")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {error ? <div role="alert" className="border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm text-[var(--error-text)]"><div>{error.message}</div>{error.traceId ? <div className="mt-1" aria-label={`Trace ID ${error.traceId}`}>{t("traceId", { traceId: error.traceId })}</div> : null}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SubmissionSummaryItem
          icon={UserRound}
          label={t("student")}
          value={locale === "ar" ? submission.student?.nameAr || submission.student?.nameEn : submission.student?.nameEn}
        />
        <SubmissionSummaryItem icon={School} label={t("class")} value={formatEnrollmentScope(submission.enrollment)} />
        <SubmissionSummaryItem icon={BookOpenCheck} label={t("assessmentStatus")} value={t(`assessmentStatuses.${submission.assessment?.approvalStatus ?? "published"}`)} />
        <SubmissionSummaryItem icon={ClipboardCheck} label={t("requiredProgress")} value={`${submission.progress.requiredAnsweredCount}/${submission.progress.requiredQuestionCount}`} />
        <SubmissionSummaryItem icon={CircleGauge} label={t("score")} value={formatScore(submission.totalScore, submission.maxScore)} />
        <SubmissionSummaryItem icon={BookOpenCheck} label={t("deliveryMode")} value={t(`deliveryModes.${deliveryModeMessageKey(submission.assessment?.deliveryMode)}`)} />
        <SubmissionSummaryItem icon={CalendarClock} label={t("startedAt")} value={formatSubmissionDate(submission.startedAt, locale)} />
        {submission.submittedAt ? <SubmissionSummaryItem icon={CalendarClock} label={t("submittedAt")} value={formatSubmissionDate(submission.submittedAt, locale)} /> : null}
        {submission.correctedAt ? <SubmissionSummaryItem icon={CalendarClock} label={t("correctedAt")} value={formatSubmissionDate(submission.correctedAt, locale)} /> : null}
      </section>

      <div className="space-y-4">
        {sortedQuestions.map((question, index) => {
          const draft = drafts[question.id] ?? EMPTY_DRAFT;
          const definition = questionDefinitions[question.id];
          const answerPayload = createSubmissionAnswerPayload(question.type, definition, draft);
          const canSaveMatchingAnswer = !isMatchingQuestion(question.type, definition)
            || hasCompleteMatchingAnswer(definition, draft);
          const showCorrectionDetails = submission.status !== "in_progress" && Boolean(question.answer);
          const answer = question.answer;

          return (
            <section key={question.id} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 py-4 md:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)] text-sm font-semibold text-[var(--primary-color)]">
                    {index + 1}
                  </span>
                  <h2 className="pt-1 font-semibold text-[var(--text-primary)]">
                    {locale === "ar" ? question.promptAr || question.prompt : question.prompt}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    {t(`questionTypes.${questionTypeMessageKey(question.type)}`)}
                  </span>
                  {question.required ? <span className="rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--warning-text)]">{t("required")}</span> : null}
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">{question.points} {t("points")}</span>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <SubmissionQuestionAnswerField
                  question={question}
                  definition={definition}
                  draft={draft}
                  canEnter={canEnter}
                  onAnswerTextChange={(answerText) => updateDraft(setDrafts, question.id, { answerText })}
                  onSelectedOptionIdsChange={(selectedOptionIds) => updateDraft(setDrafts, question.id, { selectedOptionIds })}
                  onMatchingAnswerChange={(promptId, selectedPairId) => updateMatchingDraft(
                    setDrafts,
                    question.id,
                    promptId,
                    selectedPairId,
                  )}
                />

                {canEnter ? (
                  <div className="mt-4 flex justify-end border-t border-[var(--border-color)] pt-4">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={activeAction !== null || !hasSubmissionAnswer(answerPayload) || !canSaveMatchingAnswer}
                    loading={activeAction === `answer-${question.id}`}
                    onClick={() => void runAction(
                      `answer-${question.id}`,
                      () => saveSubmissionAnswer(submission.id, question.id, answerPayload),
                    )}
                  >
                    {t("saveAnswer")}
                  </Button>
                  </div>
                ) : null}

                {showCorrectionDetails && question.answer && !canViewReview ? (
                  <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-3 text-sm text-[var(--text-secondary)]">
                    <div className="font-medium text-[var(--text-primary)]">
                      {t("correctionStatus")}: {t(`correctionStatuses.${question.answer.correctionStatus}`)}
                    </div>
                    {question.answer.reviewedAt ? <div className="mt-1">{t("reviewedAt")}: {formatSubmissionDate(question.answer.reviewedAt, locale)}</div> : null}
                  </div>
                ) : null}

                {canViewReview && answer ? (
                  <SubmissionAnswerReviewFields
                    draft={reviewDrafts[answer.id] ?? createSubmissionReviewDraft(answer)}
                    maxPoints={answer.maxPoints ?? question.points}
                    validation={validateSubmissionReviewDraft(
                      reviewDrafts[answer.id] ?? createSubmissionReviewDraft(answer),
                      answer.maxPoints ?? question.points,
                    )}
                    dirty={dirtyAnswerIds.includes(answer.id)}
                    readOnly={!canReview}
                    saving={activeAction === `review-${answer.id}`}
                    bulkSaving={activeAction !== null && activeAction !== `review-${answer.id}`}
                    onChange={(next) => setReviewDrafts((current) => ({ ...current, [answer.id]: next }))}
                    onSave={() => void runAction(
                      `review-${answer.id}`,
                      () => reviewSubmissionAnswer(
                        submission.id,
                        answer.id,
                        toSubmissionReviewPayload(
                          reviewDrafts[answer.id] ?? createSubmissionReviewDraft(answer),
                        ),
                      ),
                    )}
                  />
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

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
      <ConfirmDialog isOpen={isDiscardDialogOpen} onClose={() => setIsDiscardDialogOpen(false)} onConfirm={() => router.push(returnHref)} title={t("discardReviewTitle")} description={t("discardReviewDescription")} confirmLabel={t("discardReviewConfirm")} cancelLabel={commonT("cancel")} severity="warning" />
    </div>
  );
}

function updateDraft(
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, SubmissionAnswerDraft>>>,
  questionId: string,
  updates: Partial<SubmissionAnswerDraft>,
) {
  setDrafts((current) => ({
    ...current,
    [questionId]: { ...(current[questionId] ?? EMPTY_DRAFT), ...updates },
  }));
}

function updateMatchingDraft(
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, SubmissionAnswerDraft>>>,
  questionId: string,
  promptId: string,
  selectedPairId: string,
) {
  setDrafts((current) => {
    const draft = current[questionId] ?? EMPTY_DRAFT;
    return {
      ...current,
      [questionId]: {
        ...draft,
        matchingAnswers: changeMatchingAnswer(
          draft.matchingAnswers,
          promptId,
          selectedPairId,
        ),
      },
    };
  });
}

function hasCompleteMatchingAnswer(
  definition: AssessmentQuestion | undefined,
  draft: SubmissionAnswerDraft,
): boolean {
  const matchingPairs = definition?.matchingPairs;
  if (!matchingPairs?.length) return false;
  return matchingPairs.every((pair) => draft.matchingAnswers[pair.id]);
}

function SubmissionSummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-50)] text-[var(--primary-color)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--text-secondary)]">{label}</div>
        <div className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">{value || "—"}</div>
      </div>
    </div>
  );
}

function formatEnrollmentScope(enrollment: GradeSubmissionDetail["enrollment"]): string {
  return [enrollment?.gradeName, enrollment?.sectionName, enrollment?.classroomName]
    .filter(Boolean)
    .join(" · ");
}

function formatScore(totalScore: number | null, maxScore: number | null): string {
  return `${totalScore ?? "—"}/${maxScore ?? "—"}`;
}

function formatSubmissionDate(date: string | null, locale: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function questionTypeMessageKey(questionType: string) {
  return QUESTION_TYPE_MESSAGE_KEYS[questionType.toUpperCase() as keyof typeof QUESTION_TYPE_MESSAGE_KEYS]
    ?? "shortAnswer";
}

function deliveryModeMessageKey(deliveryMode: string | null | undefined): "questionBased" | "scoreOnly" {
  return deliveryMode?.toLowerCase() === "question_based" ? "questionBased" : "scoreOnly";
}
