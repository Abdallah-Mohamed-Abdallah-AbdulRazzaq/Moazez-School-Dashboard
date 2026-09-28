"use client";

import { useTranslations } from "next-intl";
import type { AutomaticCorrectionSummary } from "../utils/automaticCorrection";

interface ManualCorrectionWarningProps {
  summary: AutomaticCorrectionSummary;
}

export default function ManualCorrectionWarning({ summary }: ManualCorrectionWarningProps) {
  const t = useTranslations("academics.grades.submissions.autoCorrection");
  const messages = [
    summary.manualCount > 0 ? t("needsManual", { count: summary.manualCount }) : null,
    summary.missingAnswerCount > 0
      ? t("missingAnswerRecords", { count: summary.missingAnswerCount })
      : null,
    summary.invalidKeyCount > 0
      ? t("invalidAnswerKeys", { count: summary.invalidKeyCount })
      : null,
  ].filter((message): message is string => Boolean(message));

  return (
    <div role="status" className="rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]">
      {messages.map((message) => <div key={message}>{message}</div>)}
    </div>
  );
}

export function PendingCorrectionBadge() {
  const t = useTranslations("academics.grades.submissions.autoCorrection");
  return (
    <span className="inline-flex rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--warning-text)]">
      {t("pendingReviewBadge")}
    </span>
  );
}
