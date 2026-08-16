"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fetchSettingsUsers,
  type FetchSettingsUsersParams,
} from "@/features/settings/services/settingsUsersService";
import type {
  SettingsPaginationApiDto,
  SettingsUserRecord,
} from "@/features/settings/types";

const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

interface UsePaginatedUsersOptions {
  enabled: boolean;
  query: string;
  roleId?: string;
  status?: FetchSettingsUsersParams["status"];
  limit?: number;
}

interface PaginatedUsersState {
  users: SettingsUserRecord[];
  pagination: SettingsPaginationApiDto | null;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  initialError: unknown;
  loadMoreError: unknown;
}

const initialState: PaginatedUsersState = {
  users: [],
  pagination: null,
  isInitialLoading: false,
  isLoadingMore: false,
  initialError: null,
  loadMoreError: null,
};

function appendUniqueUsers(
  current: SettingsUserRecord[],
  incoming: SettingsUserRecord[],
): SettingsUserRecord[] {
  const seen = new Set(current.map((user) => user.id));
  return [
    ...current,
    ...incoming.filter((user) => {
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    }),
  ];
}

export function usePaginatedUsers({
  enabled,
  query,
  roleId,
  status,
  limit = DEFAULT_LIMIT,
}: UsePaginatedUsersOptions) {
  const normalizedLimit = Math.min(100, Math.max(1, limit));
  const debouncedQuery = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);
  const [state, setState] = useState<PaginatedUsersState>(initialState);
  const [initialRetryVersion, setInitialRetryVersion] = useState(0);
  const generationRef = useRef(0);
  const inFlightPagesRef = useRef(new Set<string>());

  const requestPage = useCallback(
    async (page: number, generation: number, replace: boolean) => {
      const requestKey = `${generation}:${page}`;
      if (inFlightPagesRef.current.has(requestKey)) return;
      inFlightPagesRef.current.add(requestKey);

      setState((current) => ({
        ...current,
        isInitialLoading: replace,
        isLoadingMore: !replace,
        initialError: replace ? null : current.initialError,
        loadMoreError: null,
        ...(replace ? { users: [], pagination: null } : {}),
      }));

      try {
        const result = await fetchSettingsUsers({
          search: debouncedQuery || undefined,
          page,
          limit: normalizedLimit,
          roleId,
          status,
        });
        if (generationRef.current !== generation) return;

        setState((current) => ({
          ...current,
          users: replace
            ? appendUniqueUsers([], result.items)
            : appendUniqueUsers(current.users, result.items),
          pagination: result.pagination,
          isInitialLoading: false,
          isLoadingMore: false,
          initialError: null,
          loadMoreError: null,
        }));
      } catch (error) {
        if (generationRef.current !== generation) return;
        setState((current) => ({
          ...current,
          isInitialLoading: false,
          isLoadingMore: false,
          initialError: replace ? error : current.initialError,
          loadMoreError: replace ? null : error,
        }));
      } finally {
        inFlightPagesRef.current.delete(requestKey);
      }
    },
    [debouncedQuery, normalizedLimit, roleId, status],
  );

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    if (!enabled) {
      setState(initialState);
      return;
    }

    void requestPage(1, generation, true);
  }, [
    debouncedQuery,
    enabled,
    initialRetryVersion,
    normalizedLimit,
    requestPage,
    roleId,
    status,
  ]);

  const hasMore = useMemo(() => {
    if (!state.pagination) return false;
    return (
      state.users.length < state.pagination.total &&
      state.pagination.page * state.pagination.limit < state.pagination.total
    );
  }, [state.pagination, state.users.length]);

  const loadMore = useCallback(() => {
    if (
      !enabled ||
      !hasMore ||
      state.isInitialLoading ||
      state.isLoadingMore ||
      state.loadMoreError
    ) {
      return;
    }

    const nextPage = (state.pagination?.page ?? 0) + 1;
    void requestPage(nextPage, generationRef.current, false);
  }, [
    enabled,
    hasMore,
    requestPage,
    state.isInitialLoading,
    state.isLoadingMore,
    state.loadMoreError,
    state.pagination?.page,
  ]);

  const retryInitial = useCallback(() => {
    setInitialRetryVersion((version) => version + 1);
  }, []);

  const retryLoadMore = useCallback(() => {
    if (!enabled || state.isLoadingMore || !state.pagination) return;
    void requestPage(
      state.pagination.page + 1,
      generationRef.current,
      false,
    );
  }, [enabled, requestPage, state.isLoadingMore, state.pagination]);

  return {
    users: state.users,
    isInitialLoading: state.isInitialLoading,
    isLoadingMore: state.isLoadingMore,
    initialError: state.initialError,
    loadMoreError: state.loadMoreError,
    hasMore,
    loadMore,
    retryInitial,
    retryLoadMore,
  };
}
