"use client";

import Select, { type SelectOption } from "@/components/ui/input/Select";

export interface AcademicReferenceOption {
  value: string;
  label: string;
}

export function OptionalReferenceSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  options: AcademicReferenceOption[];
  disabled: boolean;
  onChange: (value: string | null) => void;
}) {
  const selectOptions: SelectOption[] = [
    { value: "", label: `No ${label.toLowerCase()}` },
    ...options,
  ];
  if (value && !options.some((option) => option.value === value)) {
    selectOptions.push({
      value,
      label: `Unavailable (${value})`,
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
      onChange={(nextValue) => onChange(nextValue || null)}
    />
  );
}

export function ReferenceChecklist({
  label,
  values,
  options,
  disabled,
  maximumItems = 100,
  onChange,
}: {
  label: string;
  values: string[];
  options: AcademicReferenceOption[];
  disabled: boolean;
  maximumItems?: number;
  onChange: (values: string[]) => void;
}) {
  const selectedValues = new Set(values);
  const availableValues = new Set(options.map((option) => option.value));
  const displayedOptions = [
    ...options,
    ...[...new Set(values)]
      .filter((value) => !availableValues.has(value))
      .map((value) => ({ value, label: `Unavailable (${value})` })),
  ];

  return (
    <fieldset className="rounded-lg border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-700">{label}</legend>
      {displayedOptions.length === 0 ? (
        <p className="text-sm text-gray-500">No matching references are available.</p>
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
