"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";

const LOADING_VALUE = "__loading";
const EMPTY_VALUE = "__empty";
const ERROR_VALUE = "__error";

export interface CommunicationEntitySelectProps {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  search: (query: string) => Promise<CommunicationSelectorOption[]>;
  onChange: (value: string) => void;
  onOptionChange?: (option: CommunicationSelectorOption | null) => void;
  onOptionsChange?: (options: CommunicationSelectorOption[]) => void;
}

function toSelectOption(option: CommunicationSelectorOption): SelectOption {
  const label = option.description
    ? `${option.label} - ${option.description}`
    : option.label;

  return {
    value: option.id,
    label,
    searchText: `${option.label} ${option.description ?? ""}`,
  };
}

export default function CommunicationEntitySelect({
  clearable = true,
  disabled,
  error,
  helperText,
  label,
  onChange,
  onOptionChange,
  onOptionsChange,
  placeholder,
  search,
  value,
}: CommunicationEntitySelectProps) {
  const [options, setOptions] = useState<CommunicationSelectorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (disabled) return;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError(false);
      search("")
        .then((items) => {
          if (!cancelled) {
            setOptions(items);
            onOptionsChange?.(items);
            setHasSearched(true);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
            setLoadError(true);
            setHasSearched(true);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [disabled, onOptionsChange, search]);

  const selectOptions = useMemo(() => {
    const nextOptions = options.map(toSelectOption);

    if (value && !nextOptions.some((option) => option.value === value)) {
      nextOptions.unshift({ value, label: value, searchText: value });
    }

    if (isLoading) {
      nextOptions.push({
        value: LOADING_VALUE,
        label: "Loading...",
        disabled: true,
      });
    } else if (loadError) {
      nextOptions.push({
        value: ERROR_VALUE,
        label: "Unable to load options",
        disabled: true,
      });
    } else if (hasSearched && nextOptions.length === 0) {
      nextOptions.push({
        value: EMPTY_VALUE,
        label: "No options",
        disabled: true,
      });
    }

    if (clearable) {
      nextOptions.unshift({
        value: "",
        label: placeholder || "Select...",
        searchText: placeholder || "Select",
      });
    }

    return nextOptions;
  }, [clearable, hasSearched, isLoading, loadError, options, placeholder, value]);

  const handleChange = (nextValue: string) => {
    if (
      nextValue === LOADING_VALUE ||
      nextValue === EMPTY_VALUE ||
      nextValue === ERROR_VALUE
    ) {
      return;
    }

    onChange(nextValue);
    onOptionChange?.(
      options.find((option) => option.id === nextValue) ?? null,
    );
  };

  return (
    <Select
      label={label}
      value={value ?? ""}
      placeholder={placeholder}
      helperText={error ?? helperText}
      error={error}
      searchable
      disabled={disabled}
      options={selectOptions}
      onChange={handleChange}
      noOptionsText={isLoading ? "Loading..." : "No options"}
      noResultsText={loadError ? "Unable to load options" : "No options"}
    />
  );
}
