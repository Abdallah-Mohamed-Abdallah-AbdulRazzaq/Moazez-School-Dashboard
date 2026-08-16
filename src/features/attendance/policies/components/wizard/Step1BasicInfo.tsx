"use client";

import { useTranslations } from "next-intl";
import { Info, LoaderCircle, RefreshCw } from "lucide-react";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import type { PolicyFormData } from "../../types";

interface Step1BasicInfoProps {
  formData: PolicyFormData;
  errors: Record<string, string>;
  isReadOnly: boolean;
  nameValidationStatus: "idle" | "checking" | "success" | "error";
  nameValidationError?: string;
  onFieldChange: <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K],
  ) => void;
  onNameBlur: () => void;
  onRetryNameValidation: () => void;
}

export default function Step1BasicInfo({
  formData,
  errors,
  isReadOnly,
  nameValidationStatus,
  nameValidationError,
  onFieldChange,
  onNameBlur,
  onRetryNameValidation,
}: Step1BasicInfoProps) {
  const t = useTranslations("attendance.policies.wizard");

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          {t("steps.basicInfo.description")}
        </div>
      </div>

      {/* Policy Name */}
      <BilingualTextField
        label={t("fields.policyName")}
        value={{ ar: formData.nameAr, en: formData.nameEn }}
        onChange={(value) => {
          onFieldChange("nameAr", value.ar);
          onFieldChange("nameEn", value.en);
        }}
        onBlur={onNameBlur}
        requiredAr
        requiredEn
        disabled={isReadOnly}
        errors={{
          ar: errors.nameAr,
          en: errors.nameEn,
        }}
      />

      {nameValidationStatus === "checking" && (
        <div
          className="flex items-center gap-2 text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t("nameValidation.checking")}
        </div>
      )}

      {nameValidationStatus === "success" &&
        !errors.nameAr &&
        !errors.nameEn && (
          <div
            className="text-sm text-green-700"
            role="status"
            aria-live="polite"
          >
            {t("nameValidation.available")}
          </div>
        )}

      {nameValidationStatus === "error" && nameValidationError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          <span>{nameValidationError}</span>
          <button
            type="button"
            onClick={onRetryNameValidation}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("nameValidation.retry")}
          </button>
        </div>
      )}

      {/* Description */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("fields.description")}
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.description")} (عربي)
            </label>
            <textarea
              value={formData.descriptionAr || ""}
              onChange={(e) => onFieldChange("descriptionAr", e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {t("fields.description")} (English)
            </label>
            <textarea
              value={formData.descriptionEn || ""}
              onChange={(e) => onFieldChange("descriptionEn", e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("fields.notes")}
        </label>
        <textarea
          value={formData.notes || ""}
          onChange={(e) => onFieldChange("notes", e.target.value)}
          disabled={isReadOnly}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Active Status */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => onFieldChange("isActive", e.target.checked)}
          disabled={isReadOnly}
          className="w-4 h-4"
        />
        <span className="text-sm font-medium text-gray-700">
          {t("fields.isActive")}
        </span>
      </label>
    </div>
  );
}
