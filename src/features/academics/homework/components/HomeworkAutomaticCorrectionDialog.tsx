"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ChevronDown, Filter, LoaderCircle, Sparkles, Users } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { getHomeworkErrorMessage } from "../services/homeworkErrors";
import { useHomeworkAutomaticCorrection, type HomeworkAutomaticCorrectionOptions } from "../hooks/useHomeworkAutomaticCorrection";
import HomeworkAutomaticCorrectionSummary from "./HomeworkAutomaticCorrectionSummary";
import HomeworkCorrectionScoringPolicy from "./HomeworkCorrectionScoringPolicy";

interface HomeworkAutomaticCorrectionControlsProps extends HomeworkAutomaticCorrectionOptions {
  selectedSubmissionId: string | null;
  canCorrectSelected: boolean;
  hasUnsavedChanges: boolean;
}
type CorrectionState = ReturnType<typeof useHomeworkAutomaticCorrection>;

function CorrectionScope({ correction }: { correction: CorrectionState }) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  return <div role="group" aria-label={t("scope")} className="space-y-3">
    <h3 className="text-sm font-semibold text-gray-900">{t("scope")}</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {(["filtered", "all"] as const).map(scope => {
        const selected = correction.scope === scope;
        const ScopeIcon = scope === "filtered" ? Filter : Users;
        return <Button key={scope} variant="secondary" aria-pressed={selected} disabled={correction.isRunning}
          onClick={() => void correction.loadTargets(scope)}
          className={`h-auto justify-start gap-3 p-4 text-start whitespace-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selected ? "!border-primary !bg-primary/5 !text-gray-900" : "!bg-white"}`}>
          <span className="flex w-full items-center gap-3">
          <ScopeIcon className={`h-5 w-5 shrink-0 ${selected ? "text-primary" : "text-gray-400"}`} aria-hidden="true" />
          <span className="min-w-0 flex-1 space-y-1"><span className="block font-semibold">{t(`scopeTitles.${scope}`)}</span>
            <span className="block text-xs font-normal leading-relaxed text-gray-500">{t(`scopeHints.${scope}`)}</span></span>
          {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
          </span>
        </Button>;
      })}
    </div>
  </div>;
}

function CorrectionPreview({ correction }: { correction: CorrectionState }) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  if (correction.error != null) return null;
  if (correction.isLoadingTargets) return <div role="status" className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
    <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("loadingTargets")}
  </div>;
  if (!correction.targets.length) return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-400"><Users className="h-5 w-5" aria-hidden="true" /></span>
    <h3 className="font-semibold text-gray-900">{t("emptyTitle")}</h3>
    <p role="status" className="mt-2 text-sm leading-relaxed text-gray-500">{t("noTargets")}</p>
    {!correction.singleSubmissionId && correction.scope === "filtered"
      ? <Button variant="secondary" size="sm" className="mt-4" onClick={() => void correction.loadTargets("all")}>{t("checkAll")}</Button>
      : <p className="mt-3 text-xs text-gray-500">{t("emptyHelp")}</p>}
  </div>;
  return <div role="status" className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
    <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-white px-2 text-2xl font-bold tabular-nums text-primary">{correction.targets.length}</span>
    <div><p className="font-semibold text-gray-900">{t("eligibleStudents")}</p><p className="mt-1 text-xs leading-relaxed text-gray-600">{t("eligibleHint")}</p></div>
  </div>;
}

function CorrectionRules() {
  const t = useTranslations("academics.homework.review.autoCorrection");
  return <div className="space-y-3">
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{t("overwriteWarning")}</p>
    </div>
    <details className="group rounded-xl border border-gray-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        {t("rulesTitle")}<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <ul className="space-y-3 border-t border-gray-100 px-4 py-4 text-sm leading-relaxed text-gray-600">
        {(["scoring", "manual", "completion"] as const).map(rule => <li key={rule} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden="true" /><span>{t(`rules.${rule}`)}</span>
        </li>)}
      </ul>
    </details>
  </div>;
}

export default function HomeworkAutomaticCorrectionDialog(props: HomeworkAutomaticCorrectionControlsProps) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  const errorT = useTranslations("academics.homework.errorMessages");
  const correction = useHomeworkAutomaticCorrection(props);
  const failed = correction.outcomes.some(outcome => outcome.outcome === "failed");
  const readyForReview = correction.outcomes.filter(outcome => outcome.outcome === "review_pending").length;
  const hasOpenReviews = correction.outcomes.some(outcome => !outcome.reviewCompleted && outcome.outcome !== "skipped");
  return <>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" disabled={props.blocked || correction.isRunning || !props.canCorrectSelected}
        onClick={() => correction.openCorrection(props.selectedSubmissionId ?? undefined)}>{t("singleAction")}</Button>
      <Button variant="secondary" size="sm" disabled={props.blocked || correction.isRunning}
        onClick={() => correction.openCorrection()}>{t("bulkAction")}</Button>
      {props.hasUnsavedChanges && <p className="text-sm text-amber-800">{t("unsavedEdits")}</p>}
    </div>
    <Modal isOpen={correction.isOpen} onClose={correction.close} title={t("title")} description={t("subtitle")}
      icon={<Sparkles className="h-6 w-6" aria-hidden="true" />} closeOnEscape={!correction.isRunning}
      closeOnOverlayClick={false} showCloseButton={!correction.isRunning}
      footer={<div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" disabled={correction.isRunning} onClick={correction.close}>{t(hasOpenReviews ? "reviewFirst" : "close")}</Button>
        <div className="flex flex-wrap gap-2">
          {correction.refreshFailed && <Button variant="secondary" disabled={correction.isRunning} onClick={() => void correction.refresh()}>{t("reload")}</Button>}
          {failed && <Button disabled={props.blocked} loading={correction.isRunning} onClick={correction.retryFailed}>{t("retryFailed")}</Button>}
          {readyForReview > 0 && <Button disabled={props.blocked || correction.refreshFailed} loading={correction.isRunning}
            onClick={correction.finalizeCorrection}>{t("finalize", { count: readyForReview })}</Button>}
          {!correction.outcomes.length && <Button disabled={correction.isLoadingTargets || !correction.targets.length || props.blocked || !correction.scoringPolicy}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />} loading={correction.isRunning}
            onClick={() => void correction.runCorrection()}>{t("confirm")}</Button>}
        </div>
      </div>}>
      <div className="space-y-5 pb-4">
        {!correction.singleSubmissionId && !correction.outcomes.length && <CorrectionScope correction={correction} />}
        {!correction.outcomes.length && !correction.isRunning && <CorrectionPreview correction={correction} />}
        {!correction.outcomes.length && <HomeworkCorrectionScoringPolicy policy={correction.scoringPolicy}
          disabled={correction.isRunning} onSelect={correction.selectScoringPolicy} />}
        {!correction.outcomes.length && <CorrectionRules />}
        {correction.isRunning && <p className="rounded-lg bg-primary/5 p-3 text-sm text-gray-700">{t("keepPageOpen")}</p>}
        {correction.progress && <div className="space-y-2 rounded-xl border border-gray-200 p-4">
          <p role="status" aria-live="polite" className="text-sm font-medium text-gray-900">{t("progress", { ...correction.progress })}</p>
          <progress className="h-2 w-full overflow-hidden rounded-full accent-primary" aria-label={t("title")} value={correction.progress.processed} max={Math.max(correction.progress.total, 1)} />
        </div>}
        {correction.error != null && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t("loadFailed", { message: getHomeworkErrorMessage(correction.error, errorT) })}</p>}
        {correction.refreshFailed && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("refreshFailed")}</p>}
        {!!correction.outcomes.length && <HomeworkAutomaticCorrectionSummary outcomes={correction.outcomes} />}
        {!!correction.outcomes.length && correction.scoringPolicy && <p className="text-sm text-gray-600">
          {t("selectedPolicy", { policy: t(`policies.${correction.scoringPolicy}.title`) })}
        </p>}
        {readyForReview > 0 && <p className="rounded-lg bg-primary/5 p-3 text-sm text-gray-700">{t("reviewChoiceHint")}</p>}
        {correction.outcomes.filter(outcome => outcome.outcome === "failed").map(outcome => <p key={outcome.submissionId} role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {t("studentFailure", { student: outcome.studentName ?? t("unknownStudent"), stage: t(`stages.${outcome.failedStage}`), message: getHomeworkErrorMessage(outcome.error, errorT) })}
        </p>)}
      </div>
    </Modal>
  </>;
}
