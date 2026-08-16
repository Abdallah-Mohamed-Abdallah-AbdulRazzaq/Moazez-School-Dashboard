"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Save } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { Assessment } from "../types";

interface AssessmentQuestionBuilderHeaderProps {
  assessment: Assessment;
  isReadOnly: boolean;
  isAssessmentDirty: boolean;
  isQuestionDirty: boolean;
  isAssignmentSaving: boolean;
  isQuestionSaving: boolean;
  saveLabel?: string;
  canSaveAssessment?: boolean;
  onBack: () => void;
  onSaveAssessment: () => void;
}

export default function AssessmentQuestionBuilderHeader({
  assessment,
  isReadOnly,
  isAssessmentDirty,
  isQuestionDirty,
  isAssignmentSaving,
  isQuestionSaving,
  saveLabel,
  canSaveAssessment,
  onBack,
  onSaveAssessment,
}: AssessmentQuestionBuilderHeaderProps) {
  const t = useTranslations("academics.grades.questions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isDirty = isAssessmentDirty || isQuestionDirty;

  return (
    <header className="sticky top-0 z-20 border-b bg-white shadow-sm" style={{ borderColor: "var(--border-color)" }}>
      <div className="px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label={t("back")}
          >
            {locale === "ar" ? <ArrowLeft className="h-5 w-5 rotate-180" /> : <ArrowRight className="h-5 w-5" />}
            <span className="hidden font-medium sm:inline">{t("back")}</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            <h1 className="max-w-xs truncate text-base font-semibold md:max-w-md md:text-lg" style={{ color: "var(--text-primary)" }}>
              {locale === "ar" ? assessment.titleAr : assessment.title}
            </h1>
            <div className="flex items-center gap-2">
              {isReadOnly && (
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" }}>
                  {t("readOnly")}
                </span>
              )}
              {(isAssignmentSaving || isQuestionSaving) && (
                <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--color-primary-50)", color: "var(--primary-color)" }}>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {tCommon("saving")}
                </span>
              )}
              {!isAssignmentSaving && !isQuestionSaving && isDirty && (
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" }}>
                  {tCommon("unsaved")}
                </span>
              )}
              {!isAssignmentSaving && !isQuestionSaving && !isDirty && (
                <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--success-bg)", color: "var(--success-text)" }}>
                  <CheckCircle2 className="h-3 w-3" />
                  {tCommon("saved")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <Button
                onClick={onSaveAssessment}
                variant="secondary"
                size="sm"
                disabled={isAssignmentSaving || !(canSaveAssessment ?? isAssessmentDirty)}
                leftIcon={<Save className="h-4 w-4" />}
              >
                {isAssignmentSaving ? tCommon("saving") : saveLabel || t("saveAssessment")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
