"use client";

import { useId } from "react";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

export interface AcademicReferenceOption {
  value: string;
  label: string;
}

export function OptionalReferenceSelect({
  label,
  value,
  options,
  disabled,
  helperText,
  onChange,
}: {
  label: string;
  value: string | null;
  options: AcademicReferenceOption[];
  disabled: boolean;
  helperText?: string;
  onChange: (value: string | null) => void;
}) {
  const t = useAcademicContentTranslations("details");
  const selectOptions: SelectOption[] = [
    { value: "", label: t("no_reference", { label: label.toLowerCase() }) },
    ...options,
  ];
  if (value && !options.some((option) => option.value === value)) {
    selectOptions.push({
      value,
      label: t("unavailable_reference"),
      disabled: true,
    });
  }

  return (
    <Select
      label={label}
      triggerAriaLabel={label}
      value={value ?? ""}
      options={selectOptions}
      disabled={disabled}
      helperText={helperText}
      onChange={(nextValue) => onChange(nextValue || null)}
    />
  );
}

export function ReferenceChecklist({
  label,
  values,
  options,
  disabled,
  helperText,
  maximumItems = 100,
  onChange,
}: {
  label: string;
  values: string[];
  options: AcademicReferenceOption[];
  disabled: boolean;
  helperText?: string;
  maximumItems?: number;
  onChange: (values: string[]) => void;
}) {
  const t = useAcademicContentTranslations("details");
  const helperTextId = useId();
  const selectedValues = new Set(values);
  const availableValues = new Set(options.map((option) => option.value));
  const displayedOptions = [
    ...options,
    ...[...new Set(values)]
      .filter((value) => !availableValues.has(value))
      .map((value) => ({ value, label: t("unavailable_reference") })),
  ];

  return (
    <fieldset
      aria-describedby={helperText ? helperTextId : undefined}
      className="rounded-lg border border-gray-200 p-3"
    >
      <legend className="px-1 text-sm font-medium text-gray-700">{label}</legend>
      {helperText ? (
        <p id={helperTextId} className="mb-3 text-xs leading-5 text-gray-500">
          {helperText}
        </p>
      ) : null}
      {displayedOptions.length === 0 ? (
        <p className="text-sm text-gray-500">{t("no_references")}</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {displayedOptions.map((option) => {
            const checked = selectedValues.has(option.value);
            return (
              <label key={option.value} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || (!checked && values.length >= maximumItems)}
                  onChange={() =>
                    onChange(
                      checked
                        ? values.filter((value) => value !== option.value)
                        : [...values, option.value],
                    )
                  }
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
