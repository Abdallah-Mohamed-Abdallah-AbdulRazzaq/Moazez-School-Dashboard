"use client";

import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { getHomeworkErrorMessage } from "../services/homeworkErrors";
import { useHomeworkAutomaticCorrection, type HomeworkAutomaticCorrectionOptions } from "../hooks/useHomeworkAutomaticCorrection";
import HomeworkAutomaticCorrectionSummary from "./HomeworkAutomaticCorrectionSummary";

interface HomeworkAutomaticCorrectionControlsProps extends HomeworkAutomaticCorrectionOptions {
  selectedSubmissionId: string | null;
  canCorrectSelected: boolean;
  hasUnsavedChanges: boolean;
}

export default function HomeworkAutomaticCorrectionDialog(props: HomeworkAutomaticCorrectionControlsProps) {
  const t = useTranslations("academics.homework.review.autoCorrection");
  const errorT = useTranslations("academics.homework.errorMessages");
  const correction = useHomeworkAutomaticCorrection(props);
  const failed = correction.outcomes.some(outcome => outcome.outcome === "failed");
  return <>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" disabled={props.blocked || correction.isRunning || !props.canCorrectSelected}
        onClick={() => correction.openCorrection(props.selectedSubmissionId ?? undefined)}>{t("singleAction")}</Button>
      <Button variant="secondary" size="sm" disabled={props.blocked || correction.isRunning}
        onClick={() => correction.openCorrection()}>{t("bulkAction")}</Button>
      {props.hasUnsavedChanges && <p className="text-sm text-amber-800">{t("unsavedEdits")}</p>}
    </div>
    <Modal isOpen={correction.isOpen} onClose={correction.close} title={t("title")}
      closeOnEscape={!correction.isRunning} closeOnOverlayClick={!correction.isRunning} showCloseButton={!correction.isRunning}
      footer={<div className="flex flex-wrap gap-2">
        {!correction.outcomes.length && <Button disabled={correction.isLoadingTargets || !correction.targets.length || props.blocked}
          loading={correction.isRunning} onClick={() => void correction.runCorrection()}>{t("confirm")}</Button>}
        {failed && <Button disabled={props.blocked} loading={correction.isRunning} onClick={correction.retryFailed}>{t("retryFailed")}</Button>}
        {correction.refreshFailed && <Button disabled={correction.isRunning} onClick={() => void correction.refresh()}>{t("reload")}</Button>}
        <Button variant="secondary" disabled={correction.isRunning} onClick={correction.close}>{t("close")}</Button>
      </div>}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t("explanation")}</p>
        {!correction.singleSubmissionId && !correction.outcomes.length && <Select label={t("scope")} value={correction.scope}
          disabled={correction.isRunning} options={[{ value: "filtered", label: t("scopes.filtered") }, { value: "all", label: t("scopes.all") }]}
          onChange={scope => void correction.loadTargets(scope as "all" | "filtered")} />}
        {!correction.outcomes.length && <p role="status">{correction.isLoadingTargets ? t("loadingTargets") : t("eligibleCount", { count: correction.targets.length })}</p>}
        {!correction.isLoadingTargets && !correction.targets.length && !correction.outcomes.length && <p>{t("noTargets")}</p>}
        {correction.isRunning && <p className="text-sm text-amber-800">{t("keepPageOpen")}</p>}
        {correction.progress && <div>
          <p role="status" aria-live="polite">{t("progress", { ...correction.progress })}</p>
          <progress className="w-full" aria-label={t("title")} value={correction.progress.processed} max={Math.max(correction.progress.total, 1)} />
        </div>}
        {correction.error != null && <p role="alert" className="text-red-700">{t("loadFailed", { message: getHomeworkErrorMessage(correction.error, errorT) })}</p>}
        {correction.refreshFailed && <p role="alert" className="text-amber-800">{t("refreshFailed")}</p>}
        {!!correction.outcomes.length && <HomeworkAutomaticCorrectionSummary outcomes={correction.outcomes} />}
        {correction.outcomes.filter(outcome => outcome.outcome === "failed").map(outcome => <p key={outcome.submissionId} role="alert" className="text-sm text-red-700">
          {t("studentFailure", { student: outcome.studentName ?? t("unknownStudent"), stage: t(`stages.${outcome.failedStage}`), message: getHomeworkErrorMessage(outcome.error, errorT) })}
        </p>)}
      </div>
    </Modal>
  </>;
}
