"use client";

import { useTranslations } from "next-intl";
import { Settings as SettingsIcon, CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import DateTimePicker from "@/components/ui/input/DateTimePicker";
import { Assignment } from "@/features/academics/curriculum/services/curriculumService";
import { ValidationErrors, PointsSummary } from "@/features/academics/curriculum/types/types";

interface AssignmentSettingsPanelProps {
  assignment: Assignment;
  pointsSummary: PointsSummary;
  validationErrors: ValidationErrors;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<Assignment>) => void;
  onAutoDistributePoints: () => void;
  onBlur?: () => void;
  detailsInputMode?: "bilingual" | "single";
}

export default function AssignmentSettingsPanel({
  assignment,
  pointsSummary,
  validationErrors,
  isReadOnly,
  onUpdate,
  onAutoDistributePoints,
  onBlur,
  detailsInputMode = "bilingual",
}: AssignmentSettingsPanelProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const tQuestions = useTranslations("academics.curriculum.questions");
  const tValidation = useTranslations("validation");

  const handleTitleChange = (value: { ar: string; en: string }) => {
    onUpdate({ titleAr: value.ar, titleEn: value.en });
  };

  const handleDescriptionChange = (value: { ar: string; en: string }) => {
    onUpdate({ descriptionAr: value.ar, descriptionEn: value.en });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          {t("assignmentDetails")}
        </h3>

        <div className="space-y-4">
          <div>
            {detailsInputMode === "single" ? (
              <Input
                label={tQuestions("assignment_title")}
                value={assignment.titleEn || assignment.titleAr}
                onChange={(event) => handleTitleChange({
                  ar: event.target.value,
                  en: event.target.value,
                })}
                onBlur={onBlur}
                maxLength={180}
                required
                disabled={isReadOnly}
                placeholder={tQuestions("assignment_title")}
              />
            ) : (
              <BilingualTextField
                label={tQuestions("assignment_title")}
                value={{ ar: assignment.titleAr, en: assignment.titleEn }}
                onChange={handleTitleChange}
                onBlur={onBlur}
                requiredAr
                requiredEn
                disabled={isReadOnly}
                placeholder={{
                  ar: tQuestions("assignment_title"),
                  en: tQuestions("assignment_title"),
                }}
              />
            )}
            {validationErrors?.titleAr && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.titleAr}</span>
              </div>
            )}
            {validationErrors?.titleEn && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.titleEn}</span>
              </div>
            )}
          </div>

          <div>
            {detailsInputMode === "single" ? (
              <TextArea
                label={tQuestions("description")}
                value={assignment.descriptionEn || assignment.descriptionAr || ""}
                onChange={(event) => handleDescriptionChange({
                  ar: event.target.value,
                  en: event.target.value,
                })}
                onBlur={onBlur}
                maxLength={4000}
                disabled={isReadOnly}
                placeholder={tQuestions("description")}
              />
            ) : (
              <BilingualTextField
                label={tQuestions("description")}
                value={{
                  ar: assignment.descriptionAr || "",
                  en: assignment.descriptionEn || "",
                }}
                onChange={handleDescriptionChange}
                onBlur={onBlur}
                disabled={isReadOnly}
                placeholder={{
                  ar: tQuestions("description"),
                  en: tQuestions("description"),
                }}
              />
            )}
            {validationErrors?.descriptionAr && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.descriptionAr}</span>
              </div>
            )}
            {validationErrors?.descriptionEn && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.descriptionEn}</span>
              </div>
            )}
          </div>

          <DateTimePicker
            label={tQuestions("due_date")}
            value={assignment.dueDate ? new Date(assignment.dueDate) : null}
            onChange={(date) => onUpdate({ dueDate: date?.toISOString() })}
            disabled={isReadOnly}
          />

          <div>
            <Input
              label={tQuestions("max_score")}
              type="number"
              value={assignment.maxScore ?? ""}
              onChange={(e) => onUpdate({
                maxScore: e.target.value === "" ? null : Number(e.target.value),
              })}
              onBlur={onBlur}
              disabled={isReadOnly}
              min={0.01}
              step={0.01}
              required
            />
            {validationErrors?.maxScore && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.maxScore}</span>
              </div>
            )}
          </div>

          <div>
            <Input
              label={tQuestions("expected_time_minutes")}
              type="number"
              value={assignment.expectedTimeMinutes ?? ""}
              onChange={(e) =>
                onUpdate({
                  expectedTimeMinutes:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              onBlur={onBlur}
              disabled={isReadOnly}
              min={1}
              step={1}
              placeholder="30"
            />
            {validationErrors?.expectedTimeMinutes && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-xs" data-error="true">
                <AlertCircle className="w-3 h-3" />
                <span>{validationErrors.expectedTimeMinutes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* General Errors */}
      {validationErrors?.general && validationErrors.general.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-error="true">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                {tValidation("validation_failed")}
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {validationErrors.general.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Points Summary */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("pointsSummary")}</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{tQuestions("max_score")}:</span>
            <span className="font-medium">{pointsSummary.maxScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{tQuestions("total_points")}:</span>
            <span className="font-medium">{pointsSummary.totalPoints}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">{tQuestions("difference")}:</span>
            <span
              className={`font-medium ${
                pointsSummary.isMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              {pointsSummary.difference > 0
                ? `+${pointsSummary.difference}`
                : pointsSummary.difference}
            </span>
          </div>

          {pointsSummary.isMatch ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{tQuestions("points_match")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{tQuestions("points_mismatch")}</span>
            </div>
          )}

          {!isReadOnly && !pointsSummary.isMatch && (
            <Button
              onClick={onAutoDistributePoints}
              variant="secondary"
              size="sm"
              className="w-full mt-2"
            >
              {tQuestions("auto_distribute")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
