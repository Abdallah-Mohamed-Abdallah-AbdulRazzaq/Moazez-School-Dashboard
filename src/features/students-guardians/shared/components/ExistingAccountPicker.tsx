"use client";

import { useId, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SettingsUserRecord } from "@/features/settings/types";
import { usePaginatedUsers } from "@/features/settings/users/hooks/usePaginatedUsers";
import { isApiError } from "@/lib/api-error";

interface ExistingAccountPickerProps {
  selectedUser: SettingsUserRecord | null;
  onSelect: (user: SettingsUserRecord) => void;
  onClear: () => void;
}

export default function ExistingAccountPicker({
  selectedUser,
  onSelect,
  onClear,
}: ExistingAccountPickerProps) {
  const t = useTranslations("students_guardians.account_linking");
  const userSelectT = useTranslations("user_select");
  const inputId = useId();
  const [query, setQuery] = useState("");
  const usersState = usePaginatedUsers({
    enabled: true,
    query,
    status: "active",
  });
  const permissionDenied =
    isApiError(usersState.initialError) &&
    usersState.initialError.status === 403;

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">
            {selectedUser.fullName}
          </p>
          <p className="truncate text-gray-600">
            {selectedUser.username || selectedUser.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 shrink-0 cursor-pointer rounded-lg px-3 font-medium text-primary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("actions.change")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {t("fields.search_users")}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search_placeholder")}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {usersState.isInitialLoading && (
          <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
      <div
        className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm"
        onScroll={(event) => {
          const list = event.currentTarget;
          if (list.scrollHeight - list.scrollTop - list.clientHeight <= 40) {
            usersState.loadMore();
          }
        }}
      >
          {usersState.initialError ? (
            <div role="alert" className="space-y-2 p-3 text-sm text-red-700">
              <p>
                {permissionDenied
                  ? userSelectT("permission_denied")
                  : t("search_failed")}
              </p>
              {!permissionDenied ? (
                <button
                  type="button"
                  onClick={usersState.retryInitial}
                  className="cursor-pointer font-semibold text-primary hover:underline"
                >
                  {userSelectT("retry")}
                </button>
              ) : null}
            </div>
          ) : usersState.isInitialLoading ? (
            <p role="status" className="p-3 text-sm text-gray-600">
              {userSelectT("loading")}
            </p>
          ) : usersState.users.length === 0 ? (
            <p className="p-3 text-sm text-gray-600">{t("no_results")}</p>
          ) : (
            usersState.users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user)}
                className="block min-h-11 w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-start text-sm transition-colors last:border-b-0 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <span className="block font-medium text-gray-900">
                  {user.fullName}
                </span>
                <span className="block text-gray-600">
                  {user.username || user.email} {" · "}
                  {user.roleName || t("role_unavailable")}
                </span>
              </button>
            ))
          )}
          {usersState.isLoadingMore ? (
            <p role="status" className="p-3 text-center text-sm text-gray-600">
              {userSelectT("loading_more")}
            </p>
          ) : usersState.loadMoreError ? (
            <div role="alert" className="flex items-center justify-between gap-2 p-3 text-sm text-red-700">
              <span>{userSelectT("load_more_failed")}</span>
              <button
                type="button"
                onClick={usersState.retryLoadMore}
                className="cursor-pointer font-semibold text-primary hover:underline"
              >
                {userSelectT("retry")}
              </button>
            </div>
          ) : null}
      </div>
    </div>
  );
}
