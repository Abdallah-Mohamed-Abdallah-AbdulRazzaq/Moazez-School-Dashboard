"use client";

import { useTranslations } from "next-intl";

interface ManualCorrectionWarningProps {
  pendingCount: number;
  compact?: boolean;
}

export default function ManualCorrectionWarning({
  pendingCount,
  compact = false,
}: ManualCorrectionWarningProps) {
  const t = useTranslations("academics.grades.submissions.autoCorrection");

  return (
    <div
      role="status"
      className={
        compact
          ? "inline-flex rounded-full bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--warning-text)]"
          : "rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-sm text-[var(--warning-text)]"
      }
    >
      {compact
        ? t("needsManualBadge")
        : t("needsManual", { count: pendingCount })}
    </div>
  );
}

