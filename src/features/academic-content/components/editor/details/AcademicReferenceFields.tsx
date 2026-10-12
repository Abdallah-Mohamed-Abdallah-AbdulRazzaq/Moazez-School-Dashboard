"use client";

import { useId } from "react";
import { ExternalLink } from "lucide-react";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import { buttonClassName } from "@/components/ui/button/Button";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

export interface AcademicReferenceOption {
  value: string;
  label: string;
  description?: string;
  href?: string;
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
  const referenceT = useAcademicContentTranslations("reference_details");
  const selectedValues = new Set(values);
  const availableValues = new Set(options.map((option) => option.value));
  const displayedOptions: AcademicReferenceOption[] = [
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
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {displayedOptions.map((option) => {
            const checked = selectedValues.has(option.value);
            return (
              <div key={option.value} className="flex items-start gap-2">
                <Checkbox
                  className="min-w-0 flex-1"
                  label={option.label}
                  description={option.description}
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
                {option.href ? (
                  <a
                    href={option.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={referenceT("open_reference", { title: option.label })}
                    className={buttonClassName({
                      variant: "ghost", size: "sm", className: "mt-2 shrink-0",
                    })}
                  >
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    {referenceT("open")}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
