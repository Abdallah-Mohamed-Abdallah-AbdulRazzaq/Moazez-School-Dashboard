"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";

const LOADING_VALUE = "__loading";
const EMPTY_VALUE = "__empty";
const ERROR_VALUE = "__error";

export interface CommunicationEntitySelectProps<TEntity = unknown> {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  search: (query: string) => Promise<CommunicationSelectorOption<TEntity>[]>;
  onChange: (value: string) => void;
  onOptionChange?: (option: CommunicationSelectorOption<TEntity> | null) => void;
  onOptionsChange?: (options: CommunicationSelectorOption<TEntity>[]) => void;
}

function toSelectOption<TEntity>(
  option: CommunicationSelectorOption<TEntity>,
  locale: string,
): SelectOption {
  const description = locale.startsWith("ar") && option.description
    ? `\u2067${option.description}\u2069`
    : option.description;
  const label = option.description
    ? `${option.label} - ${description}`
    : option.label;

  return {
    value: option.id,
    label,
    searchText: `${option.label} ${option.description ?? ""}`,
  };
}

async function searchOptions<TEntity>(
  search: CommunicationEntitySelectProps<TEntity>["search"],
): Promise<{ items: CommunicationSelectorOption<TEntity>[]; failed: boolean }> {
  try {
    return { items: await search(""), failed: false };
  } catch {
    return { items: [], failed: true };
  }
}

export default function CommunicationEntitySelect<TEntity>({
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
}: CommunicationEntitySelectProps<TEntity>) {
  const locale = useLocale();
  const [options, setOptions] = useState<CommunicationSelectorOption<TEntity>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const activeRequestId = useRef(0);
  const loadedSearch = useRef<typeof search | null>(null);

  useEffect(() => {
    activeRequestId.current += 1;
    return () => {
      activeRequestId.current += 1;
    };
  }, [search]);

  const loadOptions = useCallback(() => {
    const sameSearch = loadedSearch.current === search;
    if (disabled || (sameSearch && (isLoading || hasSearched))) return;

    const requestId = activeRequestId.current + 1;
    activeRequestId.current = requestId;
    loadedSearch.current = search;
    setOptions([]);
    setIsLoading(true);
    setLoadError(false);

    void searchOptions(search).then(({ items, failed }) => {
      if (activeRequestId.current !== requestId) return;
      setOptions(items);
      if (!failed) onOptionsChange?.(items);
      setLoadError(failed);
      setHasSearched(true);
      setIsLoading(false);
    });
  }, [disabled, hasSearched, isLoading, onOptionsChange, search]);

  const selectOptions = useMemo(() => {
    const nextOptions = options.map((option) => toSelectOption(option, locale));

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
  }, [
    clearable,
    hasSearched,
    isLoading,
    loadError,
    locale,
    options,
    placeholder,
    value,
  ]);

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
      onOpen={loadOptions}
      noOptionsText={isLoading ? "Loading..." : "No options"}
      noResultsText={loadError ? "Unable to load options" : "No options"}
    />
  );
}
