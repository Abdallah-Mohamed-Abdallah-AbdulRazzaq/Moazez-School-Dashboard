"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type {
  TeacherListQuery,
  TeachersListResponse,
} from "@/features/teachers/types/index";

export function useTeacherList(query: TeacherListQuery, enabled = true) {
  const [response, setResponse] = useState<TeachersListResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestSequence = useRef(0);
  const hasResponse = useRef(false);
  const querySignature = JSON.stringify(query);
  const stableQuery = useMemo(
    () => JSON.parse(querySignature) as TeacherListQuery,
    [querySignature],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const sequence = ++requestSequence.current;
    if (hasResponse.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextResponse = await teacherApi.list(stableQuery);
      if (sequence === requestSequence.current) {
        hasResponse.current = true;
        setResponse(nextResponse);
      }
    } catch (requestError) {
      if (sequence === requestSequence.current) setError(requestError);
    } finally {
      if (sequence === requestSequence.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [enabled, stableQuery]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  return { response, error, isLoading, isRefreshing, refresh };
}
