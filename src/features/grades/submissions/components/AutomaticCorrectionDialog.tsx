"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import MultipleSelectionPolicyPicker from "@/components/ui/grading/MultipleSelectionPolicyPicker";
import type { MultipleSelectionScoringPolicy } from "@/lib/grading/multipleChoiceScore";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import type {
  AutomaticCorrectionBatchProgress,
  AutomaticCorrectionBatchResult,
} from "../services/automaticCorrectionBatch";

export type AutomaticCorrectionScope = "all" | "filtered";

interface AutomaticCorrectionDialogProps {
  isOpen: boolean;
  scope: AutomaticCorrectionScope;
  eligibleCount: number;
  isPreviewLoading: boolean;
  isRunning: boolean;
  progress: AutomaticCorrectionBatchProgress | null;
  result: AutomaticCorrectionBatchResult | null;
  onScopeChange: (scope: AutomaticCorrectionScope) => void;
  onConfirm: () => void;
  onRetryFailed: () => void;
  onClose: () => void;
  policy: MultipleSelectionScoringPolicy | null;
  onPolicyChange: (policy: MultipleSelectionScoringPolicy) => void;
  onFinalize: () => void;
  singleSubmission?: boolean;
  refreshFailed?: boolean;
  onReload?: () => void;
}

export default function AutomaticCorrectionDialog({
  isOpen,
  scope,
  eligibleCount,
  isPreviewLoading,
  isRunning,
  progress,
  result,
  onScopeChange,
  onConfirm,
  onRetryFailed,
  onClose,
  policy, onPolicyChange, onFinalize, singleSubmission = false, refreshFailed = false, onReload,
}: AutomaticCorrectionDialogProps) {
  const t = useTranslations("academics.grades.submissions.autoCorrection");
  const errorT = useTranslations("academics.grades.errors");
  const failedCount = result?.failedSubmissionIds.length ?? 0;
  const readyCount = result?.results.filter(student => student.status === "review_pending").length ?? 0;
  const hasOpenReviews = result?.results.some(student => student.status === "review_pending" || student.status === "manual_only" || student.status === "failed");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      showCloseButton={!isRunning}
      closeOnEscape={!isRunning}
      closeOnOverlayClick={!isRunning}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isRunning}>
            {t(hasOpenReviews ? "reviewFirst" : "cancel")}
          </Button>
          {failedCount > 0 ? (
            <Button variant="secondary" onClick={onRetryFailed} disabled={isRunning}>
              {t("retryFailed")}
            </Button>
          ) : null}
          {refreshFailed && onReload && <Button variant="secondary" onClick={onReload} disabled={isRunning}>{t("reload")}</Button>}
          {readyCount > 0 && <Button onClick={onFinalize} loading={isRunning} disabled={refreshFailed}>{t("finalize", { count: readyCount })}</Button>}
          {!result && <Button
            variant="primary"
            onClick={onConfirm}
            loading={isRunning}
            disabled={isPreviewLoading || eligibleCount === 0 || isRunning || !policy}
          >
            {t("confirm")}
          </Button>}
        </>
      )}
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-[var(--text-secondary)]">{t("scoringRule")}</p>
        {!result && !singleSubmission && <div className="grid gap-2 sm:grid-cols-2">
          {(["filtered", "all"] as const).map((option) => (
            <Button
              key={option}
              variant={scope === option ? "primary" : "secondary"}
              aria-pressed={scope === option}
              onClick={() => onScopeChange(option)}
              disabled={isRunning}
            >
              {t(`scope.${option}`)}
            </Button>
          ))}
        </div>}

        {!result && <MultipleSelectionPolicyPicker policy={policy} disabled={isRunning} onSelect={onPolicyChange}
          heading={t("scoringPolicy")} hint={t("choosePolicy")} labels={{
            partial_without_penalty: { title: t("policies.partial_without_penalty.title"), description: t("policies.partial_without_penalty.description") },
            partial_with_penalty: { title: t("policies.partial_with_penalty.title"), description: t("policies.partial_with_penalty.description") },
          }} />}

        <p className="text-sm text-[var(--text-secondary)]">
          {isPreviewLoading ? t("loadingEligible") : t("eligible", { count: eligibleCount })}
        </p>

        <div role="status" aria-live="polite" className="text-sm text-[var(--text-secondary)]">
          {progress ? t("progress", { processed: progress.processed, total: progress.total }) : null}
        </div>

        {result ? (
          <div className="grid gap-2 rounded-xl bg-[var(--surface-secondary)] p-4 text-sm sm:grid-cols-2">
            <span>{t("result.corrected", { count: result.totals.correctedCount })}</span>
            <span>{t("result.finalized", { count: result.totals.studentsFinalized })}</span>
            <span>{t("result.manual", { count: result.totals.manualCount })}</span>
            <span>{t("result.missingAnswers", { count: result.totals.missingAnswerCount })}</span>
            <span>{t("result.invalidKeys", { count: result.totals.invalidKeyCount })}</span>
            <span>{t("result.failed", { count: result.totals.studentsFailed })}</span>
          </div>
        ) : null}
        {result && policy && <p className="text-sm text-[var(--text-secondary)]">{t("selectedPolicy", { policy: t(`policies.${policy}.title`) })}</p>}
        {readyCount > 0 && <p role="status" className="text-sm text-[var(--text-secondary)]">{t("reviewChoiceHint", { count: readyCount })}</p>}
        {refreshFailed && <p role="alert" className="text-sm text-red-700">{t("refreshFailed")}</p>}
        {result?.results.filter(student => student.status === "failed").map(student => <p key={student.submissionId} role="alert" className="text-sm text-red-700">
          {t("studentFailure", { submission: student.submissionId, message: errorT(mapGradesApiError(student.error)) })}
        </p>)}
      </div>
    </Modal>
  );
}
