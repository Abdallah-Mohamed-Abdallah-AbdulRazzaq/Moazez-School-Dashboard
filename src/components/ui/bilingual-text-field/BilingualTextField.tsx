"use client";

import { useTranslations } from "next-intl";
import Input from "../input/Input";

export interface BilingualValue {
  ar: string;
  en: string;
}

export interface BilingualTextFieldProps {
  label: string;
  value: BilingualValue;
  onChange: (value: BilingualValue) => void;
  onBlur?: () => void;
  requiredAr?: boolean;
  requiredEn?: boolean;
  disabled?: boolean;
  errors?: {
    ar?: string;
    en?: string;
  };
  helperText?: {
    ar?: string;
    en?: string;
  };
  placeholder?: {
    ar?: string;
    en?: string;
  };
}

export default function BilingualTextField({
  label,
  value,
  onChange,
  onBlur,
  requiredAr = true,
  requiredEn = true,
  disabled = false,
  errors = {},
  helperText = {},
  placeholder = {},
}: BilingualTextFieldProps) {
  const t = useTranslations("common");

  return (
    <div className="space-y-3">
      {/* Arabic Input */}
      <Input
        label={`${label} (${t("arabic")})`}
        value={value.ar}
        onChange={(e) => onChange({ ...value, ar: e.target.value })}
        onBlur={onBlur}
        required={requiredAr}
        disabled={disabled}
        error={errors.ar}
        helperText={helperText.ar}
        placeholder={placeholder.ar}
        dir="rtl"
      />

      {/* English Input */}
      <Input
        label={`${label} (${t("english")})`}
        value={value.en}
        onChange={(e) => onChange({ ...value, en: e.target.value })}
        onBlur={onBlur}
        required={requiredEn}
        disabled={disabled}
        error={errors.en}
        helperText={helperText.en}
        placeholder={placeholder.en}
        dir="ltr"
      />
    </div>
  );
}
