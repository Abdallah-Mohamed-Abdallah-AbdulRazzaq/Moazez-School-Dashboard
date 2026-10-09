"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UpcomingAcademicContentSession } from "../model/academicContentOverview";
import {
  loadContentTypeTotal,
  loadRecentlyUpdated,
  loadUpcomingSessions,
  loadWorkInProgress,
  type AcademicContentOverviewContext,
} from "../services/academicContentOverviewService";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import {
  ACADEMIC_CONTENT_TYPES,
  type AcademicContentLibraryItem,
  type AcademicContentType,
} from "../types/contracts";

export interface OverviewResource<TData> {
  data: TData;
  isLoading: boolean;
  error: AcademicContentUiError | null;
  partial: boolean;
}

type ContentTypeResources = Record<
  AcademicContentType,
  OverviewResource<number | null>
>;

export interface AcademicContentOverviewState {
  totals: ContentTypeResources;
  workInProgress: OverviewResource<AcademicContentLibraryItem[]>;
  upcomingSessions: OverviewResource<UpcomingAcademicContentSession[]>;
  recentlyUpdated: OverviewResource<AcademicContentLibraryItem[]>;
  retryType: (contentType: AcademicContentType) => void;
  retryWorkInProgress: () => void;
  retryUpcomingSessions: () => void;
  retryRecentlyUpdated: () => void;
}

function resource<TData>(data: TData): OverviewResource<TData> {
  return { data, isLoading: false, error: null, partial: false };
}

function initialTotals(): ContentTypeResources {
  return Object.fromEntries(
    ACADEMIC_CONTENT_TYPES.map((contentType) => [contentType, resource(null)]),
  ) as ContentTypeResources;
}

const systemNow = () => new Date();

export interface UseAcademicContentOverviewInput {
  academicYearId: string;
  termId: string;
  nowFactory?: () => Date;
}

export function useAcademicContentOverview({
  academicYearId,
  termId,
  nowFactory = systemNow,
}: UseAcademicContentOverviewInput): AcademicContentOverviewState {
  const [totals, setTotals] = useState<ContentTypeResources>(initialTotals);
  const [workInProgress, setWorkInProgress] = useState(
    resource<AcademicContentLibraryItem[]>([]),
  );
  const [upcomingSessions, setUpcomingSessions] = useState(
    resource<UpcomingAcademicContentSession[]>([]),
  );
  const [recentlyUpdated, setRecentlyUpdated] = useState(
    resource<AcademicContentLibraryItem[]>([]),
  );
  const contextGeneration = useRef(0);
  const resourceGenerations = useRef(new Map<string, number>());

  const startRequest = useCallback(
    (resourceKey: string, expectedContextGeneration: number) => {
      if (contextGeneration.current !== expectedContextGeneration) return null;
      const requestGeneration =
        (resourceGenerations.current.get(resourceKey) ?? 0) + 1;
      resourceGenerations.current.set(resourceKey, requestGeneration);
      return requestGeneration;
    },
    [],
  );

  const isCurrentRequest = useCallback(
    (
      resourceKey: string,
      expectedContextGeneration: number,
      requestGeneration: number,
    ) =>
      contextGeneration.current === expectedContextGeneration &&
      resourceGenerations.current.get(resourceKey) === requestGeneration,
    [],
  );

  const requestTypeTotal = useCallback(
    async (
      contentType: AcademicContentType,
      context: AcademicContentOverviewContext,
      expectedContextGeneration: number,
    ) => {
      const resourceKey = `total:${contentType}`;
      const requestGeneration = startRequest(
        resourceKey,
        expectedContextGeneration,
      );
      if (requestGeneration === null) return;
      setTotals((currentTotals) => ({
        ...currentTotals,
        [contentType]: {
          ...currentTotals[contentType],
          isLoading: true,
          error: null,
        },
      }));
      try {
        const total = await loadContentTypeTotal(context, contentType);
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setTotals((currentTotals) => ({
          ...currentTotals,
          [contentType]: resource(total),
        }));
      } catch (requestError) {
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setTotals((currentTotals) => ({
          ...currentTotals,
          [contentType]: {
            ...currentTotals[contentType],
            isLoading: false,
            error: academicContentUiError(requestError),
          },
        }));
      }
    },
    [isCurrentRequest, startRequest],
  );

  const requestWorkInProgress = useCallback(
    async (
      context: AcademicContentOverviewContext,
      expectedContextGeneration: number,
    ) => {
      const resourceKey = "work-in-progress";
      const requestGeneration = startRequest(
        resourceKey,
        expectedContextGeneration,
      );
      if (requestGeneration === null) return;
      setWorkInProgress((currentResource) => ({
        ...currentResource,
        isLoading: true,
        error: null,
        partial: false,
      }));
      const result = await loadWorkInProgress(context);
      if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
        return;
      }
      setWorkInProgress({
        data: result.data,
        isLoading: false,
        error: result.error,
        partial: result.partial,
      });
    },
    [isCurrentRequest, startRequest],
  );

  const requestUpcomingSessions = useCallback(
    async (
      context: AcademicContentOverviewContext,
      expectedContextGeneration: number,
    ) => {
      const resourceKey = "upcoming-sessions";
      const requestGeneration = startRequest(
        resourceKey,
        expectedContextGeneration,
      );
      if (requestGeneration === null) return;
      setUpcomingSessions((currentResource) => ({
        ...currentResource,
        isLoading: true,
        error: null,
      }));
      try {
        const sessions = await loadUpcomingSessions(context, nowFactory());
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setUpcomingSessions(resource(sessions));
      } catch (requestError) {
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setUpcomingSessions((currentResource) => ({
          ...currentResource,
          isLoading: false,
          error: academicContentUiError(requestError),
        }));
      }
    },
    [isCurrentRequest, nowFactory, startRequest],
  );

  const requestRecentlyUpdated = useCallback(
    async (
      context: AcademicContentOverviewContext,
      expectedContextGeneration: number,
    ) => {
      const resourceKey = "recently-updated";
      const requestGeneration = startRequest(
        resourceKey,
        expectedContextGeneration,
      );
      if (requestGeneration === null) return;
      setRecentlyUpdated((currentResource) => ({
        ...currentResource,
        isLoading: true,
        error: null,
      }));
      try {
        const contentItems = await loadRecentlyUpdated(context);
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setRecentlyUpdated(resource(contentItems));
      } catch (requestError) {
        if (!isCurrentRequest(resourceKey, expectedContextGeneration, requestGeneration)) {
          return;
        }
        setRecentlyUpdated((currentResource) => ({
          ...currentResource,
          isLoading: false,
          error: academicContentUiError(requestError),
        }));
      }
    },
    [isCurrentRequest, startRequest],
  );

  useEffect(() => {
    const expectedContextGeneration = ++contextGeneration.current;
    if (!academicYearId || !termId) {
      queueMicrotask(() => {
        if (contextGeneration.current !== expectedContextGeneration) return;
        setTotals(initialTotals());
        setWorkInProgress(resource([]));
        setUpcomingSessions(resource([]));
        setRecentlyUpdated(resource([]));
      });
      return () => {
        contextGeneration.current += 1;
      };
    }

    const context = { academicYearId, termId };
    queueMicrotask(() => {
      for (const contentType of ACADEMIC_CONTENT_TYPES) {
        void requestTypeTotal(contentType, context, expectedContextGeneration);
      }
      void requestWorkInProgress(context, expectedContextGeneration);
      void requestUpcomingSessions(context, expectedContextGeneration);
      void requestRecentlyUpdated(context, expectedContextGeneration);
    });

    return () => {
      contextGeneration.current += 1;
    };
  }, [
    academicYearId,
    requestRecentlyUpdated,
    requestTypeTotal,
    requestUpcomingSessions,
    requestWorkInProgress,
    termId,
  ]);

  const currentContext =
    academicYearId && termId ? { academicYearId, termId } : null;
  const retryType = (contentType: AcademicContentType) => {
    if (!currentContext) return;
    void requestTypeTotal(contentType, currentContext, contextGeneration.current);
  };
  const retryWorkInProgress = () => {
    if (!currentContext) return;
    void requestWorkInProgress(currentContext, contextGeneration.current);
  };
  const retryUpcomingSessions = () => {
    if (!currentContext) return;
    void requestUpcomingSessions(currentContext, contextGeneration.current);
  };
  const retryRecentlyUpdated = () => {
    if (!currentContext) return;
    void requestRecentlyUpdated(currentContext, contextGeneration.current);
  };

  return {
    totals,
    workInProgress,
    upcomingSessions,
    recentlyUpdated,
    retryType,
    retryWorkInProgress,
    retryUpcomingSessions,
    retryRecentlyUpdated,
  };
}
