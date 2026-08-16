"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, Settings as SettingsIcon } from "lucide-react";
import Input from "@/components/ui/input/Input";
import DatePicker from "@/components/ui/input/DatePicker";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import Button from "@/components/ui/button/Button";
import type { ValidationErrors, PointsSummary } from "@/features/academics/curriculum/types/types";
import type { Assessment } from "../types";
import { formatLocalDateOnly } from "../../shared/utils/dateOnly";

interface AssessmentQuestionSettingsPanelProps {
  assessment: Assessment;
  pointsSummary: PointsSummary;
  validationErrors: ValidationErrors;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Assessment>) => void;
  onAutoDistributePoints: () => void;
}

export default function AssessmentQuestionSettingsPanel({
  assessment,
  pointsSummary,
  validationErrors,
  isReadOnly,
  onUpdate,
  onAutoDistributePoints,
}: AssessmentQuestionSettingsPanelProps) {
  const t = useTranslations("academics.grades.questions");
  const tValidation = useTranslations("validation");
  const isMetadataLocked =
    isReadOnly || assessment.approvalStatus === "approved" || assessment.approvalStatus === "published";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <SettingsIcon className="h-4 w-4" />
          {t("settingsTitle")}
        </h3>

        <div className="space-y-4">
          <BilingualTextField
            label={t("assessmentTitle")}
            value={{ ar: assessment.titleAr, en: assessment.title }}
            onChange={(value) => onUpdate({ titleAr: value.ar, title: value.en })}
            requiredAr
            requiredEn
            disabled={isMetadataLocked}
            errors={{
              ar: validationErrors.titleAr,
              en: validationErrors.titleEn,
            }}
          />

          <DatePicker
            label={t("assessmentDate")}
            value={assessment.date ? new Date(assessment.date) : null}
            onChange={(date) => onUpdate({ date: date ? formatLocalDateOnly(date) : assessment.date })}
            disabled={isMetadataLocked}
          />

          <Input
            label={t("maxScore")}
            type="number"
            value={assessment.maxScore}
            onChange={(event) => onUpdate({ maxScore: Number(event.target.value) })}
            disabled={isMetadataLocked}
            min={0}
          />
          {validationErrors.maxScore && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{validationErrors.maxScore}</span>
            </div>
          )}

          <Input
            label={t("expected_time_minutes")}
            type="number"
            value={assessment.expectedTimeMinutes ?? ""}
            onChange={(event) =>
              onUpdate({
                expectedTimeMinutes:
                  event.target.value === "" ? undefined : Number(event.target.value),
              })
            }
            disabled={isMetadataLocked}
            min={0}
          />
          {validationErrors.expectedTimeMinutes && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{validationErrors.expectedTimeMinutes}</span>
            </div>
          )}
        </div>
      </div>

      {validationErrors.general && validationErrors.general.length > 0 && (
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--error-color, #dc2626)" }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-red-700">{tValidation("validation_failed")}</p>
              <ul className="space-y-1 text-xs text-red-600">
                {validationErrors.general.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("pointsSummary")}</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-secondary)" }}>{t("maxScore")}:</span>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{pointsSummary.maxScore}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-secondary)" }}>{t("totalPoints")}:</span>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{pointsSummary.totalPoints}</span>
          </div>
          <div className="flex justify-between border-t pt-2" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{t("difference")}:</span>
            <span className="font-medium" style={{ color: pointsSummary.isMatch ? "var(--success-text)" : "var(--warning-text)" }}>
              {pointsSummary.difference > 0 ? `+${pointsSummary.difference}` : pointsSummary.difference}
            </span>
          </div>

          {pointsSummary.isMatch ? (
            <div className="flex items-center gap-2 rounded p-2" style={{ backgroundColor: "var(--success-bg)", color: "var(--success-text)" }}>
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{t("pointsMatch")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded p-2" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning-text)" }}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{t("pointsMismatch")}</span>
            </div>
          )}

          {!isMetadataLocked && !pointsSummary.isMatch && (
            <Button
              onClick={onAutoDistributePoints}
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
            >
              {t("autoDistribute")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
