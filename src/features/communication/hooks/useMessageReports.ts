"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createMessageReport,
  getMessageReports,
  updateMessageReport,
} from "@/features/communication/api/communication.service";
import { createCommunicationMetadata } from "@/features/communication/utils/communication-metadata";
import { isApiError } from "@/lib/api-error";
import type {
  CommunicationList,
  CommunicationRecord,
} from "@/features/communication/types/communication.types";
import type {
  CreateMessageReportPayload,
  MessageReport,
  MessageReportStatus,
  ReportReason,
} from "@/features/communication/types/safety.types";

export type MessageReportStatusFilter = MessageReportStatus | "";

export interface MessageReportFiltersState {
  status: MessageReportStatusFilter;
  reason: ReportReason | "";
  page: number;
  limit: number;
}

export interface CreateReportResult {
  report: MessageReport | null;
  duplicate: boolean;
}

const DEFAULT_FILTERS: MessageReportFiltersState = {
  status: "",
  reason: "",
  page: 1,
  limit: 25,
};

const isRecord = (value: unknown): value is CommunicationRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function numberFromUnknown(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function unwrapItem<T>(response: unknown): T | null {
  if (!isRecord(response)) return (response ?? null) as T | null;

  const item = [response.data, response.item, response.result, response.payload].find(
    (candidate) => isRecord(candidate) && !Array.isArray(candidate),
  );

  return (item ?? response) as T;
}

function unwrapList<T>(response: unknown): CommunicationList<T> {
  if (Array.isArray(response)) {
    return { items: response as T[], total: response.length };
  }

  if (!isRecord(response)) {
    return { items: [], total: 0 };
  }

  const sources = [
    response,
    response.data,
    response.result,
    response.payload,
  ].filter(isRecord);
  const itemSource = sources.find((source) => Array.isArray(source.items));

  if (itemSource) {
    const items = itemSource.items as T[];
    return {
      ...itemSource,
      items,
      total:
        numberFromUnknown(itemSource.total) ??
        numberFromUnknown(itemSource.count) ??
        items.length,
      page: numberFromUnknown(itemSource.page),
      limit: numberFromUnknown(itemSource.limit),
      totalPages: numberFromUnknown(itemSource.totalPages),
    };
  }

  const arraySource = [
    response.data,
    response.result,
    response.payload,
  ].find(Array.isArray);

  if (arraySource) {
    const items = arraySource as T[];
    return { items, total: items.length };
  }

  return { items: [], total: 0 };
}

function errorMessageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load reports.";
}

function sortReports(reports: MessageReport[]) {
  return [...reports].sort((left, right) => {
    const leftDate = left.updatedAt ?? left.createdAt ?? "";
    const rightDate = right.updatedAt ?? right.createdAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

export function useMessageReports() {
  const mountedRef = useRef(false);
  const [filters, setFilters] =
    useState<MessageReportFiltersState>(DEFAULT_FILTERS);
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await getMessageReports({
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.reason
          ? { reason: filters.reason }
          : {}),
        limit: filters.limit,
        page: filters.page,
      });
      const list = unwrapList<MessageReport>(response);
      const normalized = sortReports(list.items);

      if (!mountedRef.current) return;
      setReports(normalized);
      setTotal(list.total ?? normalized.length);
    } catch (nextError) {
      if (!mountedRef.current) return;
      setError(errorMessageFromUnknown(nextError));
      setReports([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters.limit, filters.page, filters.reason, filters.status]);

  useEffect(() => {
    mountedRef.current = true;
    void Promise.resolve().then(refresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setIsMutating(true);
      setError(null);

      try {
        const response = await operation();
        await refresh();
        return response;
      } catch (nextError) {
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const updateStatus = useCallback(
    async (
      reportId: string,
      status: MessageReportStatus,
      resolutionNote?: string,
    ) => {
      const response = await mutate(() =>
        updateMessageReport(reportId, {
          status,
          ...(resolutionNote?.trim()
            ? { resolutionNote: resolutionNote.trim() }
            : {}),
        }),
      );
      return unwrapItem<MessageReport>(response);
    },
    [mutate],
  );

  const createReport = useCallback(
    async (
      messageId: string,
      payload: CreateMessageReportPayload,
    ): Promise<CreateReportResult> => {
      setIsMutating(true);
      setError(null);

      try {
        const metadata = createCommunicationMetadata("report_create", {
          reportedFrom: "message_actions_menu",
          clientPlatform: "web",
        });
        const response = await createMessageReport(messageId, {
          ...payload,
          metadata: {
            ...(metadata ?? {}),
            ...(payload.metadata ?? {}),
          },
        });
        await refresh();
        return { report: unwrapItem<MessageReport>(response), duplicate: false };
      } catch (nextError) {
        if (isApiError(nextError) && nextError.status === 409) {
          return { report: null, duplicate: true };
        }
        setError(errorMessageFromUnknown(nextError));
        throw nextError;
      } finally {
        if (mountedRef.current) setIsMutating(false);
      }
    },
    [refresh],
  );

  const hasFilters = useMemo(
    () => Boolean(filters.status || filters.reason),
    [filters.reason, filters.status],
  );

  return {
    reports,
    total,
    filters,
    pageSize: filters.limit,
    setFilters,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    hasFilters,
    refresh,
    updateStatus,
    createReport,
  };
}
