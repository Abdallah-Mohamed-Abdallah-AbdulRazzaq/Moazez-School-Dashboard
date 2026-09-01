"use client";

import { useEffect, useState } from "react";
import { listBulkRegistrationRows } from "../api/bulkRegistrationApi";
import type {
  BulkRegistrationBatchStatus,
  BulkRegistrationRow,
  BulkRegistrationRowStatus,
} from "../api/bulkRegistrationDtos";
import { getBulkRegistrationDefaultRowStatus } from "../model/bulkRegistrationModel";

interface BulkRegistrationRowsOptions {
  batchId: string;
  batchStatus: BulkRegistrationBatchStatus | undefined;
}

interface RowsQueryState {
  batchId: string;
  page: number;
  limit: number;
  selectedStatus: BulkRegistrationRowStatus | undefined;
  filterTouched: boolean;
}

function initialQuery(batchId: string): RowsQueryState {
  return {
    batchId,
    page: 1,
    limit: 50,
    selectedStatus: undefined,
    filterTouched: false,
  };
}

export function useBulkRegistrationRows({
  batchId,
  batchStatus,
}: BulkRegistrationRowsOptions) {
  const [rows, setRows] = useState<BulkRegistrationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [storedQuery, setStoredQuery] = useState<RowsQueryState>(() =>
    initialQuery(batchId),
  );
  const query = storedQuery.batchId === batchId ? storedQuery : initialQuery(batchId);
  const defaultStatus = batchStatus
    ? getBulkRegistrationDefaultRowStatus(batchStatus)
    : undefined;
  const status = query.filterTouched ? query.selectedStatus : defaultStatus;

  useEffect(() => {
    if (!batchStatus) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setLoading(true);
      setLoadFailed(false);
    });
    void listBulkRegistrationRows(
      batchId,
      {
        page: query.page,
        limit: query.limit,
        ...(status ? { status } : {}),
      },
      controller.signal,
    ).then(
      (rowsPage) => {
        if (controller.signal.aborted) return;
        setRows(rowsPage.items);
        setTotal(rowsPage.total);
        setLoading(false);
      },
      () => {
        if (controller.signal.aborted) return;
        setLoadFailed(true);
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [batchId, batchStatus, query.limit, query.page, retryKey, status]);

  return {
    rows,
    total,
    loading,
    loadFailed,
    page: query.page,
    limit: query.limit,
    status,
    setPage: (page: number) => setStoredQuery({ ...query, page }),
    changeLimit: (nextLimit: number) => {
      setStoredQuery({ ...query, limit: nextLimit, page: 1 });
    },
    changeStatus: (nextStatus: BulkRegistrationRowStatus | undefined) => {
      setStoredQuery({
        ...query,
        filterTouched: true,
        selectedStatus: nextStatus,
        page: 1,
      });
    },
    retry: () => setRetryKey((currentKey) => currentKey + 1),
  };
}
