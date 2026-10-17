"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getConfig,
  listPeriods,
  listEntries,
} from "@/features/academics/timetable/services/timetableApiAdapter";
import type {
  BackendTimetableConfigDto,
  BackendTimetablePeriodDto,
  ListResponse,
} from "@/features/academics/timetable/services/timetableApiTypes";
import { isTimetableConfigNotFound } from "@/features/academics/timetable/services/timetableErrorHandling";
import { mapBackendEntriesToUi } from "../services/timetableMappers";
import type { TimetableEntry } from "../types/timetable";
import {
  resolveTimetableSetupStatus,
  type TimetableSetupStatus,
  type TimetableSetupStatusInput,
} from "@/features/academics/timetable/services/timetableSetupStatus";

interface UseTimetableSetupStatusParams {
  academicYearId: string;
  termId: string;
  termStatus: "open" | "closed";
  canManage: boolean;
  enabled?: boolean;
}

interface UseTimetableSetupStatusResult {
  status: TimetableSetupStatus | null;
  entries: TimetableEntry[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

type SetupAccess = Pick<TimetableSetupStatusInput, "canManage" | "termStatus">;

type SetupRequest = SetupAccess & {
  academicYearId: string;
  termId: string;
};

export function useTimetableSetupStatus({
  academicYearId,
  termId,
  termStatus,
  canManage,
  enabled = true,
}: UseTimetableSetupStatusParams): UseTimetableSetupStatusResult {
  const [status, setStatus] = useState<TimetableSetupStatus | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [statusContext, setStatusContext] = useState<string | null>(null);
  const contextKey = JSON.stringify([
    academicYearId,
    termId,
    termStatus,
    canManage,
    enabled,
  ]);
  const [isLoading, setIsLoading] = useState(enabled);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!enabled || !academicYearId || !termId) {
      setStatus(null);
      setEntries([]);
      setStatusContext(contextKey);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const nextStatus = await loadSetupStatus({
      academicYearId,
      termId,
      termStatus,
      canManage,
    });
    if (requestId !== requestIdRef.current) return;
    setStatus(nextStatus.status);
    setEntries(nextStatus.entries);
    setStatusContext(contextKey);
    setIsLoading(false);
  }, [academicYearId, canManage, contextKey, enabled, termId, termStatus]);

  useEffect(() => {
    void Promise.resolve().then(reload);
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  return {
    status: statusContext === contextKey ? status : null,
    entries: statusContext === contextKey ? entries : [],
    isLoading: isLoading || (enabled && statusContext !== contextKey),
    reload,
  };
}

async function loadSetupStatus(
  request: SetupRequest,
): Promise<{ status: TimetableSetupStatus; entries: TimetableEntry[] }> {
  try {
    const config = await exactTermConfig(request);
    const [periods, savedEntries] = config
      ? await Promise.all([
          configPeriods(config.id),
          listEntries({ timetableConfigId: config.id }),
        ])
      : [[], []];
    return {
      status: resolveTimetableSetupStatus({ ...request, config, periods }),
      entries: mapBackendEntriesToUi(listResponseItems(savedEntries)).entries,
    };
  } catch (error) {
    return {
      entries: [],
      status: resolveTimetableSetupStatus({
        ...request,
        config: null,
        periods: [],
        error,
      }),
    };
  }
}

async function exactTermConfig({
  academicYearId,
  termId,
}: SetupRequest): Promise<BackendTimetableConfigDto | null> {
  try {
    return await getConfig({ academicYearId, termId, scopeType: "TERM" });
  } catch (error) {
    if (isTimetableConfigNotFound(error)) return null;
    throw error;
  }
}

async function configPeriods(
  timetableConfigId: string,
): Promise<BackendTimetablePeriodDto[]> {
  const response = await listPeriods(timetableConfigId);
  return listResponseItems(response);
}

function listResponseItems<T>(response: ListResponse<T> | T[]): T[] {
  return Array.isArray(response) ? response : response.items;
}
