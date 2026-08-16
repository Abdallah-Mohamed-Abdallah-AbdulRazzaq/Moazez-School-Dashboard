"use client";

import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";
import DatePicker from "@/components/ui/input/DatePicker";
import type { PolicyFormData } from "../../types";
import type { Term } from "@/features/academics/academic-structure-tree/services/structureService";

interface Step5ReviewProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  term: Term | null;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step5Review({
  formData,
  errors,
  isReadOnly,
  term,
  onFieldChange,
}: Step5ReviewProps) {
  const t = useTranslations("attendance.policies.wizard");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      {/* Effective Dates */}
      <div>
        <h4 style={{ color: "var(--color-gray-900)" }} className="font-semibold text-sm mb-3">
          {t("fields.effectiveDates")}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("fields.effectiveStart")} <span className="font-normal">({t("optional")})</span>
            </label>
            <DatePicker
              value={
                formData.effectiveStartDate
                  ? new Date(formData.effectiveStartDate)
                  : undefined
              }
              onChange={(value) =>
                onFieldChange(
                  "effectiveStartDate",
                  value ? value.toISOString().split("T")[0] : null
                )
              }
              disabled={isReadOnly}
              error={errors.effectiveStartDate}
            />
          </div>
          <div>
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("fields.effectiveEnd")} <span className="font-normal">({t("optional")})</span>
            </label>
            <DatePicker
              value={
                formData.effectiveEndDate
                  ? new Date(formData.effectiveEndDate)
                  : undefined
              }
              onChange={(value) =>
                onFieldChange(
                  "effectiveEndDate",
                  value ? value.toISOString().split("T")[0] : null
                )
              }
              disabled={isReadOnly}
              error={errors.effectiveEndDate}
            />
          </div>
        </div>
        {term && (
          <p style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-2">
            {t("termRangeHint", { start: term.startDate, end: term.endDate })}
          </p>
        )}
      </div>

      {/* Notifications */}
      <div style={{ borderColor: "var(--color-border)" }} className="border rounded-lg p-4 space-y-4">
        <h4 style={{ color: "var(--color-gray-900)" }} className="font-semibold text-sm">
          {t("fields.notifications")}
        </h4>

        <div>
          <p style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-2">
            {t("fields.notifyWho")}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifyTeachers}
                onChange={(e) => onFieldChange("notifyTeachers", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{t("fields.notifyTeachers")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifyStudents}
                onChange={(e) => onFieldChange("notifyStudents", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{t("fields.notifyStudents")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifyGuardians}
                onChange={(e) => onFieldChange("notifyGuardians", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{t("fields.notifyGuardiansOnAbsence")}</span>
            </label>
          </div>
        </div>

        <div>
          <p style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium mb-2">
            {t("fields.notifyWhen")}
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifyOnLate}
                onChange={(e) => onFieldChange("notifyOnLate", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{t("fields.notifyOnLate")}</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.notifyOnEarlyLeave}
                onChange={(e) => onFieldChange("notifyOnEarlyLeave", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">
                {t("fields.notifyOnEarlyLeave")}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Review Summary */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-5 border border-primary/20">
        <h4 style={{ color: "var(--color-gray-900)" }} className="font-semibold text-sm mb-4">
          {t("reviewSummary")}
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--color-gray-600)" }}>{t("fields.policyName")}:</span>
            <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {locale === "ar" ? formData.nameAr : formData.nameEn}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-gray-600)" }}>{t("fields.scope")}:</span>
            <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {t(`scope.${formData.scopeType.toLowerCase()}`)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-gray-600)" }}>{t("fields.attendanceMode")}:</span>
            <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {t(`mode.${formData.mode.toLowerCase()}`)}
            </span>
          </div>
          {formData.mode === "DAILY" && (
            <div className="flex justify-between">
              <span style={{ color: "var(--color-gray-600)" }}>{t("fields.dailyComputation")}:</span>
              <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
                {formData.dailyComputationStrategy === "DERIVED_FROM_PERIODS"
                  ? t("computation.derived")
                  : t("computation.manual")}
              </span>
            </div>
          )}
          {formData.selectedPeriodIds && formData.selectedPeriodIds.length > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--color-gray-600)" }}>{t("fields.selectPeriods")}:</span>
              <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
                {formData.selectedPeriodIds.length} {t("periodsLower")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: "var(--color-gray-600)" }}>{t("fields.effectiveDates")}:</span>
            <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {formData.effectiveStartDate || t("noStartLimit")} →{" "}
              {formData.effectiveEndDate || t("noEndLimit")}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-gray-600)" }}>{t("fields.allowExcuses")}:</span>
            <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
              {formData.allowExcuses ? tCommon("yes") : tCommon("no")}
            </span>
          </div>
          {formData.autoAbsentAfterMinutes != null && (
            <div className="flex justify-between">
              <span style={{ color: "var(--color-gray-600)" }}>{t("fields.autoAbsentAfter")}:</span>
              <span style={{ color: "var(--color-gray-900)" }} className="font-medium">
                {formData.autoAbsentAfterMinutes} {t("minutes")}
              </span>
            </div>
          )}
        </div>

        {formData.scopeType !== "SCHOOL" && (
          <div className="mt-4 pt-4 border-t border-primary/20">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span>{t("overridesWarning")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
