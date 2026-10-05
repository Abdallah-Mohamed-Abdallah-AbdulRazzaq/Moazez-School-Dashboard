"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { academicContentUiError } from "../../services/academicContentErrors";
import type { AcademicContentReadinessResponse } from "../../types/contracts";

const REASON_KEYS: Record<string, string> = {
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

interface TeacherPreparationReadinessCardProps {
  readiness: AcademicContentReadinessResponse | null;
  onRefresh: () => Promise<unknown>;
}

export default function TeacherPreparationReadinessCard({
  readiness,
  onRefresh,
}: TeacherPreparationReadinessCardProps) {
  const t = useAcademicContentTranslations("readiness");
  const isReady = readiness?.canAdvance === true;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await onRefresh();
    } catch (error) {
      setRefreshError(academicContentUiError(error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-labelledby="preparation-readiness-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="preparation-readiness-heading" className="text-base font-semibold text-gray-900">{t("title")}</h2>
          <p className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${isReady ? "text-green-700" : "text-amber-700"}`}>
            {isReady ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <XCircle aria-hidden="true" className="size-4" />}
            {isReady ? t("ready") : readiness ? t("incomplete") : t("unavailable")}
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" loading={isRefreshing} aria-label={t("refresh")} onClick={() => void refresh()}>
          <RefreshCw aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {refreshError ? <p role="alert" className="mt-3 text-sm text-red-700">{refreshError}</p> : null}
      {readiness?.blockingReasons.length ? (
        <ul className="mt-4 space-y-2">
          {readiness.blockingReasons.map((reason, index) => (
            <li key={`${reason.code}:${index}`} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {REASON_KEYS[reason.code] ? t(`reasons.${REASON_KEYS[reason.code]}`) : reason.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
