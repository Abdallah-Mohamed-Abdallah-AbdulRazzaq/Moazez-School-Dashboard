"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Select, {
  type SelectOption,
} from "@/components/ui/input/Select";
import { usePaginatedUsers } from "@/features/settings/users/hooks/usePaginatedUsers";
import type { FetchSettingsUsersParams } from "@/features/settings/services/settingsUsersService";
import type { CommunicationSelectorOption } from "@/features/communication/api/communication-selectors.service";
import { isApiError } from "@/lib/api-error";

export interface PaginatedUserSelectProps {
  label: string;
  value?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  roleId?: string;
  status?: FetchSettingsUsersParams["status"];
  loadOnMount?: boolean;
  initialQuery?: string;
  selectedOption?: CommunicationSelectorOption | null;
  onChange: (value: string) => void;
  onOptionChange?: (option: CommunicationSelectorOption | null) => void;
  onOptionsChange?: (options: CommunicationSelectorOption[]) => void;
}

function userOption(
  user: ReturnType<typeof usePaginatedUsers>["users"][number],
): CommunicationSelectorOption {
  return {
    id: user.id,
    label: user.fullName || user.username || user.email || user.id,
    description: user.username ?? user.email,
  };
}

function selectOption(option: CommunicationSelectorOption): SelectOption {
  return {
    value: option.id,
    label: option.description
      ? `${option.label} - ${option.description}`
      : option.label,
    searchText: `${option.label} ${option.description ?? ""}`,
  };
}

export default function PaginatedUserSelect({
  clearable = true,
  disabled,
  error,
  helperText,
  initialQuery = "",
  label,
  loadOnMount = false,
  onChange,
  onOptionChange,
  onOptionsChange,
  placeholder,
  roleId,
  required,
  selectedOption,
  status,
  value,
}: PaginatedUserSelectProps) {
  const t = useTranslations("user_select");
  const [hasOpened, setHasOpened] = useState(loadOnMount);
  const [query, setQuery] = useState(initialQuery);
  const [cachedSelectedOption, setCachedSelectedOption] =
    useState<CommunicationSelectorOption | null>(selectedOption ?? null);
  const usersState = usePaginatedUsers({
    enabled: hasOpened && !disabled,
    query,
    roleId,
    status,
  });
  const loadedOptions = useMemo(
    () => usersState.users.map(userOption),
    [usersState.users],
  );

  useEffect(() => {
    if (loadedOptions.length === 0) return;
    onOptionsChange?.(loadedOptions);
  }, [loadedOptions, onOptionsChange]);

  const options = useMemo(() => {
    const next = loadedOptions.map(selectOption);
    const selected = value
      ? loadedOptions.find((option) => option.id === value) ??
        (selectedOption?.id === value ? selectedOption : undefined) ??
        (cachedSelectedOption?.id === value
          ? cachedSelectedOption
          : undefined)
      : undefined;
    if (value && !next.some((option) => option.value === value)) {
      next.unshift(
        selected
          ? selectOption(selected)
          : { value, label: value, searchText: value },
      );
    }
    if (clearable) {
      next.unshift({
        value: "",
        label: placeholder || t("select"),
      });
    }
    return next;
  }, [
    cachedSelectedOption,
    clearable,
    loadedOptions,
    placeholder,
    selectedOption,
    t,
    value,
  ]);

  const handleChange = (nextValue: string) => {
    const nextOption =
      loadedOptions.find((option) => option.id === nextValue) ??
      (selectedOption?.id === nextValue ? selectedOption : null) ??
      (cachedSelectedOption?.id === nextValue
        ? cachedSelectedOption
        : null) ??
      null;
    if (nextOption) {
      setCachedSelectedOption(nextOption);
    } else if (!nextValue) {
      setCachedSelectedOption(null);
    }
    onChange(nextValue);
    onOptionChange?.(
      nextValue ? nextOption : null,
    );
  };

  const handleSearchChange = (nextQuery: string) => {
    const currentOption = value
      ? loadedOptions.find((option) => option.id === value)
      : undefined;
    if (currentOption) {
      setCachedSelectedOption(currentOption);
    }
    setQuery(nextQuery);
  };

  const permissionDenied =
    isApiError(usersState.initialError) &&
    usersState.initialError.status === 403;
  let menuFooter = null;
  if (usersState.isInitialLoading) {
    menuFooter = (
      <div
        role="status"
        className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("loading")}
      </div>
    );
  } else if (usersState.initialError) {
    menuFooter = (
      <div role="alert" className="space-y-2 px-3 py-2 text-xs text-red-700">
        <p>{permissionDenied ? t("permission_denied") : t("load_failed")}</p>
        {!permissionDenied ? (
          <button
            type="button"
            className="cursor-pointer font-semibold text-primary hover:underline"
            onClick={usersState.retryInitial}
          >
            {t("retry")}
          </button>
        ) : null}
      </div>
    );
  } else if (usersState.isLoadingMore) {
    menuFooter = (
      <div
        role="status"
        className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t("loading_more")}
      </div>
    );
  } else if (usersState.loadMoreError) {
    menuFooter = (
      <div role="alert" className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-red-700">
        <span>{t("load_more_failed")}</span>
        <button
          type="button"
          className="cursor-pointer font-semibold text-primary hover:underline"
          onClick={usersState.retryLoadMore}
        >
          {t("retry")}
        </button>
      </div>
    );
  } else if (hasOpened && loadedOptions.length === 0) {
    menuFooter = (
      <div className="px-3 py-2 text-center text-xs text-gray-500">
        {t("no_users")}
      </div>
    );
  }

  return (
    <Select
      label={label}
      value={value ?? ""}
      placeholder={placeholder}
      helperText={error ?? helperText}
      error={error}
      disabled={disabled}
      required={required}
      searchable
      searchMode="server"
      searchPlaceholder={t("search_placeholder")}
      noOptionsText={
        usersState.isInitialLoading ? t("loading") : t("no_users")
      }
      noResultsText={t("no_users")}
      options={options}
      menuFooter={menuFooter}
      onOpen={() => setHasOpened(true)}
      onSearchChange={handleSearchChange}
      onEndReached={usersState.loadMore}
      onChange={handleChange}
    />
  );
}
