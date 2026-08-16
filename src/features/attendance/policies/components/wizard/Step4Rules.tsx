"use client";

import { useTranslations } from "next-intl";
import Input from "@/components/ui/input/Input";
import type { PolicyFormData } from "../../types";

interface Step4RulesProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => void;
}

export default function Step4Rules({
  formData,
  errors,
  isReadOnly,
  onFieldChange,
}: Step4RulesProps) {
  const t = useTranslations("attendance.policies.wizard");

  return (
    <div className="space-y-6">
      {/* Late & Early Leave Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
            {t("fields.lateThreshold")} <span className="font-normal">({t("optional")})</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.lateThresholdMinutes ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onFieldChange(
                  "lateThresholdMinutes",
                  value === "" ? null : Number.parseInt(value, 10),
                );
              }}
              min={0}
              disabled={isReadOnly}
              error={errors.lateThresholdMinutes}
            />
            <span style={{ color: "var(--color-neutral-500)" }} className="absolute right-15 top-1/2 -translate-y-1/2 text-sm">
              {t("minutes")}
            </span>
          </div>
          <p style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-1">{t("fields.lateThresholdDesc")}</p>

          <div className="mt-4">
            <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
              {t("fields.autoAbsentAfter")} <span className="font-normal">({t("optional")})</span>
            </label>
            <Input
              type="number"
              value={formData.autoAbsentAfterMinutes ?? ""}
              onChange={(e) => onFieldChange("autoAbsentAfterMinutes", e.target.value === "" ? null : Number.parseInt(e.target.value, 10))}
              min={0}
              disabled={isReadOnly}
            />
            <p style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-1">{t("fields.autoAbsentAfterDesc")}</p>
          </div>
        </div>

        <div>
          <label style={{ color: "var(--color-gray-700)" }} className="block text-sm font-medium mb-2">
            {t("fields.earlyThreshold")} <span className="font-normal">({t("optional")})</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              value={formData.earlyLeaveThresholdMinutes ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onFieldChange(
                  "earlyLeaveThresholdMinutes",
                  value === "" ? null : Number.parseInt(value, 10),
                );
              }}
              min={0}
              disabled={isReadOnly}
              error={errors.earlyLeaveThresholdMinutes}
            />
            <span style={{ color: "var(--color-neutral-500)" }} className="absolute right-15 top-1/2 -translate-y-1/2 text-sm">
              {t("minutes")}
            </span>
          </div>
          <p style={{ color: "var(--color-neutral-500)" }} className="text-xs mt-1">{t("fields.earlyThresholdDesc")}</p>
        </div>
      </div>

      {/* Excuses */}
      <div style={{ borderColor: "var(--color-neutral-200)" }} className="border rounded-lg p-4 space-y-3">
        <h4 style={{ color: "var(--color-gray-900)" }} className="font-semibold text-sm">
          {t("fields.excuseSettings")}
        </h4>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.allowExcuses}
            onChange={(e) => onFieldChange("allowExcuses", e.target.checked)}
            disabled={isReadOnly}
            className="w-4 h-4"
          />
          <span style={{ color: "var(--color-gray-700)" }} className="text-sm font-medium">
            {t("fields.allowExcuses")}
          </span>
        </label>

        {formData.allowExcuses && (
          <>
            <label className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                checked={formData.requireExcuseReason}
                onChange={(e) => onFieldChange("requireExcuseReason", e.target.checked)}
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{t("fields.requireReason")}</span>
            </label>

            <label className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                checked={formData.requireAttachmentForExcuse}
                onChange={(e) =>
                  onFieldChange("requireAttachmentForExcuse", e.target.checked)
                }
                disabled={isReadOnly}
                className="w-4 h-4"
              />
              <span style={{ color: "var(--color-gray-700)" }} className="text-sm">
                {t("fields.requireAttachment")}
              </span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
