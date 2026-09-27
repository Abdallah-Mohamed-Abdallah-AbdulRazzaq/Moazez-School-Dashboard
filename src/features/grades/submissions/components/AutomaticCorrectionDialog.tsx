"use client";

import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
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
}: AutomaticCorrectionDialogProps) {
  const t = useTranslations("academics.grades.submissions.autoCorrection");
  const failedCount = result?.failedSubmissionIds.length ?? 0;

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
            {t("cancel")}
          </Button>
          {failedCount > 0 ? (
            <Button variant="secondary" onClick={onRetryFailed} disabled={isRunning}>
              {t("retryFailed")}
            </Button>
          ) : null}
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isRunning}
            disabled={isPreviewLoading || eligibleCount === 0 || isRunning}
          >
            {t("confirm")}
          </Button>
        </>
      )}
    >
      <div className="space-y-4 py-2">
        <div className="grid gap-2 sm:grid-cols-2">
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
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          {isPreviewLoading ? t("loadingEligible") : t("eligible", { count: eligibleCount })}
        </p>

        <div role="status" aria-live="polite" className="text-sm text-[var(--text-secondary)]">
          {progress ? t("progress", { processed: progress.processed, total: progress.total }) : null}
        </div>

        {result ? (
          <div className="grid gap-2 rounded-xl bg-[var(--surface-secondary)] p-4 text-sm sm:grid-cols-2">
            <span>{t("result.corrected", { count: result.totals.correctedCount })}</span>
            <span>{t("result.manual", { count: result.totals.manualCount })}</span>
            <span>{t("result.missingAnswers", { count: result.totals.missingAnswerCount })}</span>
            <span>{t("result.invalidKeys", { count: result.totals.invalidKeyCount })}</span>
            <span>{t("result.failed", { count: result.totals.studentsFailed })}</span>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
