"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchStructureTree,
  type StructureTree,
} from "../../academic-structure-tree/services/structureService";
import {
  getConfig,
  getDashboardTimetable,
  getPublication,
} from "../services/timetableApiAdapter";
import type {
  PublicationResponse,
  TimetableDashboardAllResponseDto,
  TimetableDashboardConfigSummaryDto,
} from "../services/timetableApiTypes";
import { isTimetableConfigNotFound } from "../services/timetableErrorHandling";
import {
  emptyTimetableScopes,
  overviewConfigurations,
} from "../services/timetableOverview";

interface OverviewData {
  tree: StructureTree;
  dashboard: TimetableDashboardAllResponseDto;
  configurations: TimetableDashboardConfigSummaryDto[];
  publicationStatuses: Map<string, PublicationStatus>;
  publications: Map<string, PublicationResponse>;
}

type PublicationStatus = "published" | "checked" | "unavailable";

export function useTimetableOverview(academicYearId: string, termId: string) {
  const contextKey = `${academicYearId}:${termId}`;
  const [state, setState] = useState<{
    contextKey: string;
    data: OverviewData | null;
    loading: boolean;
    failed: boolean;
  }>({ contextKey, data: null, loading: true, failed: false });
  const requestRef = useRef(0);
  const checkPublications = useCallback(
    async (configIds: string[], request: number) => {
      await loadPublicationStatuses(
        configIds,
        () => request === requestRef.current,
        (configId, status, publication) => {
          if (request !== requestRef.current) return;
          setState((current) => {
            if (request !== requestRef.current || !current.data) return current;
            const publicationStatuses = new Map(
              current.data.publicationStatuses,
            );
            publicationStatuses.set(configId, status);
            const publications = new Map(current.data.publications);
            if (publication) publications.set(configId, publication);
            return {
              ...current,
              data: { ...current.data, publicationStatuses, publications },
            };
          });
        },
      );
    },
    [],
  );
  const reload = useCallback(async () => {
    const request = ++requestRef.current;
    setState({ contextKey, data: null, loading: true, failed: false });
    try {
      const treeRequest = fetchStructureTree(academicYearId, termId);
      const emptyScopeRequest = treeRequest.then((tree) =>
        request === requestRef.current
          ? Promise.all(
              emptyTimetableScopes(tree).map((scope) =>
                loadExactConfiguration({ academicYearId, termId, ...scope }),
              ),
            )
          : [],
      );
      const [tree, dashboard, termConfig, emptyScopeConfigs] =
        await Promise.all([
          treeRequest,
          getDashboardTimetable({ termId }),
          loadExactConfiguration({ academicYearId, termId, scopeType: "TERM" }),
          emptyScopeRequest,
        ]);
      if (request !== requestRef.current) return;
      const configurations = overviewConfigurations(
        dashboard,
        [termConfig, ...emptyScopeConfigs].filter((config) => config !== null),
      );
      setState({
        contextKey,
        data: {
          tree,
          dashboard,
          configurations,
          publicationStatuses: new Map(),
          publications: new Map(),
        },
        loading: false,
        failed: false,
      });
      void checkPublications(
        configurations.map((config) => config.id),
        request,
      );
    } catch {
      if (request === requestRef.current)
        setState({ contextKey, data: null, loading: false, failed: true });
    }
  }, [academicYearId, termId, contextKey, checkPublications]);
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void reload();
    });
    return () => {
      cancelled = true;
      requestRef.current += 1;
    };
  }, [reload]);
  const retryPublicationStatuses = async () => {
    if (!state.data || state.contextKey !== contextKey) return;
    const publicationStatuses = new Map(state.data.publicationStatuses);
    const failedIds = [...publicationStatuses]
      .filter(([, status]) => status === "unavailable")
      .map(([id]) => id);
    setState((current) => {
      if (!current.data || current.contextKey !== contextKey) return current;
      const publicationStatuses = new Map(current.data.publicationStatuses);
      failedIds.forEach((id) => publicationStatuses.delete(id));
      return { ...current, data: { ...current.data, publicationStatuses } };
    });
    await checkPublications(failedIds, requestRef.current);
  };
  return {
    ...state,
    ...(state.contextKey !== contextKey
      ? { data: null, loading: true, failed: false }
      : {}),
    reload,
    retryPublicationStatuses,
  };
}

async function loadPublicationStatuses(
  configIds: string[],
  isCurrent: () => boolean,
  onStatus: (
    configId: string,
    status: PublicationStatus,
    publication?: PublicationResponse,
  ) => void,
) {
  const queue = configIds.values();
  const worker = async () => {
    for (const id of queue) {
      if (!isCurrent()) return;
      const result = await publicationStatus(id);
      onStatus(id, result.status, result.publication);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(3, configIds.length) }, worker),
  );
}

async function publicationStatus(
  configId: string,
): Promise<{ status: PublicationStatus; publication?: PublicationResponse }> {
  try {
    const publication = await getPublication(configId);
    const status =
      publication.isPublished ||
      publication.status.toLowerCase() === "published"
        ? "published"
        : "checked";
    return { status, publication };
  } catch {
    return { status: "unavailable" };
  }
}

async function loadExactConfiguration(params: Parameters<typeof getConfig>[0]) {
  try {
    return await getConfig(params);
  } catch (error) {
    if (isTimetableConfigNotFound(error)) return null;
    throw error;
  }
}
