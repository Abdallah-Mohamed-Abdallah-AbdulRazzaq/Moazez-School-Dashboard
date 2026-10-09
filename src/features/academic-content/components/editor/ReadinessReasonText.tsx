"use client";

import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentReadinessReason } from "../../types/contracts";

const REASON_KEYS: Readonly<Record<string, string>> = {
  "academic_content.readiness.read_only": "read_only",
  "academic_content.readiness.title_invalid": "title_invalid",
  "academic_content.readiness.academic_year_missing": "academic_year_missing",
  "academic_content.readiness.term_missing": "term_missing",
  "academic_content.readiness.term_year_mismatch": "term_year_mismatch",
  "academic_content.readiness.term_closed": "term_closed",
  "academic_content.readiness.audience_invalid": "audience_invalid",
  "academic_content.readiness.targets_missing": "targets_missing",
  "academic_content.readiness.subject_target_missing": "subject_target_missing",
  "academic_content.readiness.type_detail_missing": "type_detail_missing",
};

export default function ReadinessReasonText({
  reason,
}: {
  reason: AcademicContentReadinessReason;
}) {
  const t = useAcademicContentTranslations("readiness.reasons");
  const translationKey = REASON_KEYS[reason.code];

  return <>{t(translationKey ?? "unknown")}</>;
}
