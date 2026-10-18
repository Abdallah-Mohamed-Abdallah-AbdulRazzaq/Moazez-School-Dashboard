"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Save, Trash2 } from "lucide-react";
import BuilderSaveStatus from "@/features/academics/curriculum/components/BuilderSaveStatus";
import Button from "@/components/ui/button/Button";
import type { Assessment } from "../types";

export type AssessmentWorkflowAction = "publish" | "approve" | "lock";

interface AssessmentQuestionBuilderHeaderProps {
  assessment: Assessment;
  isReadOnly: boolean;
  isAssessmentDirty: boolean;
  isQuestionDirty: boolean;
  isAssignmentSaving: boolean;
  isQuestionSaving: boolean;
  saveLabel?: string;
  canSaveAssessment?: boolean;
  workflowAction: AssessmentWorkflowAction | null;
  isWorkflowActionSaving: boolean;
  isWorkflowActionDisabled: boolean;
  canDeleteAssessment: boolean;
  isDeletingAssessment: boolean;
  onBack: () => void;
  onSaveAssessment: () => void;
  onWorkflowAction: (action: AssessmentWorkflowAction) => void;
  onDeleteAssessment: () => void;
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
  workflowAction,
  isWorkflowActionSaving,
  isWorkflowActionDisabled,
  canDeleteAssessment,
  isDeletingAssessment,
  onBack,
  onSaveAssessment,
  onWorkflowAction,
  onDeleteAssessment,
}: AssessmentQuestionBuilderHeaderProps) {
  const t = useTranslations("academics.grades.questions");
  const tGrades = useTranslations("academics.grades");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-20 border-b bg-white shadow-sm" style={{ borderColor: "var(--border-color)" }}>
      <div className="px-4 py-4 md:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:flex lg:flex-wrap lg:justify-between">
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

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
            <h1 className="max-w-xs truncate text-base font-semibold md:max-w-md md:text-lg" style={{ color: "var(--text-primary)" }}>
              {locale === "ar" ? assessment.titleAr : assessment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {isReadOnly && (
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" }}>
                  {t("readOnly")}
                </span>
              )}
              {!isReadOnly && <BuilderSaveStatus isSettingsDirty={isAssessmentDirty} isQuestionDirty={isQuestionDirty} isSettingsSaving={isAssignmentSaving} isQuestionSaving={isQuestionSaving} />}
            </div>
          </div>

          <div className="col-span-2 flex flex-wrap items-center justify-end gap-2">
            {workflowAction && (
              <Button
                onClick={() => onWorkflowAction(workflowAction)}
                variant="secondary"
                size="sm"
                disabled={isWorkflowActionDisabled}
                loading={isWorkflowActionSaving}
              >
                {tGrades(`actions.${workflowAction}`)}
              </Button>
            )}
            {canDeleteAssessment && (
              <Button
                onClick={onDeleteAssessment}
                variant="danger"
                size="sm"
                loading={isDeletingAssessment}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                {tGrades("actions.delete")}
              </Button>
            )}
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
