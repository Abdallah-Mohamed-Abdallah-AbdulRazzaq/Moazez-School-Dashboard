// FILE: src/components/common/DataTable.tsx

"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
} from "lucide-react";

// Highlight Text Component
interface HighlightTextProps {
  text: string;
  highlight: string;
}

function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  // Escape special regex characters to prevent crashes and security issues
  const escapeRegExp = (str: string): string =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const safeHighlight = escapeRegExp(highlight);
  const regex = new RegExp(`(${safeHighlight})`, "gi");
  const parts = text.split(regex);

  // Create a non-global regex for testing (avoids stateful .test() issues)
  const testRegex = new RegExp(safeHighlight, "i");

  return (
    <span>
      {parts.map((part, index) =>
        testRegex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

function skeletonCellWidth(columnIndex: number, columnCount: number) {
  if (columnIndex === 0) {
    return "70%";
  }

  if (columnIndex === columnCount - 1) {
    return "44%";
  }

  return "58%";
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean; // New: Enable search highlighting for this column
  render?: (value: unknown, row: T) => React.ReactNode;
  sticky?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => React.Key;
  itemsPerPage?: number;
  showPagination?: boolean;
  showDensityToggle?: boolean;
  defaultDensity?: TableDensity;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  searchQuery?: string; // New: Search query for highlighting
  virtualize?: boolean; // New: Enable virtualization for large datasets
  rowHeight?: number; // New: Row height for virtualization (default: 56px)
  urlState?: {
    keyPrefix: string;
    syncPagination?: boolean;
    syncSorting?: boolean;
  };
  serverPagination?: {
    enabled: boolean;
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

type SortDirection = "asc" | "desc" | null;
type TableDensity = "comfortable" | "compact";
const TABLE_DENSITY_STORAGE_KEY = "sis:data-table-density";

function isTableDensity(value: string | null): value is TableDensity {
  return value === "comfortable" || value === "compact";
}

function getStoredTableDensity() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
  } catch (error) {
    if (error instanceof DOMException) {
      return null;
    }

    throw error;
  }
}

function setStoredTableDensity(density: TableDensity) {
  try {
    window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, density);
  } catch (error) {
    if (error instanceof DOMException) {
      return;
    }

    throw error;
  }
}

export default function DataTable<T extends { [key: string]: unknown }>({
  columns,
  data,
  onRowClick,
  getRowKey,
  itemsPerPage = 10,
  showPagination = true,
  showDensityToggle = true,
  defaultDensity = "comfortable",
  isLoading = false,
  skeletonRows = 6,
  emptyTitle,
  emptyDescription,
  searchQuery = "", // New: Default empty search
  virtualize = false, // New: Virtualization disabled by default
  rowHeight = 56, // New: Default row height in pixels
  urlState,
  serverPagination,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSyncEnabled = Boolean(urlState?.keyPrefix);
  const pageParamName = urlState ? `${urlState.keyPrefix}Page` : "";
  const pageSizeParamName = urlState ? `${urlState.keyPrefix}PageSize` : "";
  const sortKeyParamName = urlState ? `${urlState.keyPrefix}SortKey` : "";
  const sortDirParamName = urlState ? `${urlState.keyPrefix}SortDir` : "";

  const allowedSortKeys = useMemo(
    () => new Set(columns.map((column) => column.key)),
    [columns],
  );

  const urlPage = urlSyncEnabled
    ? Number(searchParams.get(pageParamName) || "1")
    : 1;
  const urlPageSize = urlSyncEnabled
    ? Number(searchParams.get(pageSizeParamName) || String(itemsPerPage))
    : itemsPerPage;
  const urlSortKey = urlSyncEnabled ? searchParams.get(sortKeyParamName) : null;
  const urlSortDirection = urlSyncEnabled
    ? (searchParams.get(sortDirParamName) as SortDirection)
    : null;
  const isServerPagination = Boolean(serverPagination?.enabled);

  const [sortKey, setSortKey] = useState<string | null>(
    urlSyncEnabled &&
      urlState?.syncSorting &&
      urlSortKey &&
      allowedSortKeys.has(urlSortKey)
      ? urlSortKey
      : null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    urlSyncEnabled &&
      urlState?.syncSorting &&
      (urlSortDirection === "asc" || urlSortDirection === "desc")
      ? urlSortDirection
      : null,
  );
  const [currentPage, setCurrentPage] = useState(
    urlSyncEnabled &&
      urlState?.syncPagination &&
      Number.isFinite(urlPage) &&
      urlPage > 0
      ? urlPage
      : 1,
  );
  const [pageSize, setPageSize] = useState(
    urlSyncEnabled &&
      urlState?.syncPagination &&
      Number.isFinite(urlPageSize) &&
      urlPageSize > 0
      ? urlPageSize
      : itemsPerPage,
  );
  const [density, setDensity] = useState<TableDensity>(() => {
    const storedDensity = getStoredTableDensity();
    return isTableDensity(storedDensity) ? storedDensity : defaultDensity;
  });

  const handleDensityChange = (nextDensity: TableDensity) => {
    setDensity(nextDensity);
    setStoredTableDensity(nextDensity);
  };

  const densityClasses = {
    comfortable: {
      header: "py-2.5 sm:py-3",
      cell: "py-3 sm:py-4 text-sm sm:text-[15px]",
      skeleton: "h-5",
      rowHeight,
    },
    compact: {
      header: "py-2",
      cell: "py-2 text-sm",
      skeleton: "h-4",
      rowHeight: Math.min(rowHeight, 44),
    },
  }[density];

  // Virtualization state
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const updateTableUrl = useCallback(
    (
      updates: Record<string, string | null>,
      mode: "push" | "replace" = "push",
    ) => {
      if (!urlSyncEnabled) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });

      const nextQuery = nextParams.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      if (mode === "replace") {
        router.replace(href, { scroll: false });
        return;
      }

      router.push(href, { scroll: false });
    },
    [pathname, router, searchParams, urlSyncEnabled],
  );

  useEffect(() => {
    if (!urlSyncEnabled || !urlState?.syncPagination) {
      return;
    }

    const nextPage = Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1;
    const nextPageSize =
      Number.isFinite(urlPageSize) && urlPageSize > 0
        ? urlPageSize
        : itemsPerPage;

    queueMicrotask(() => {
      setCurrentPage((current) => (current === nextPage ? current : nextPage));
      setPageSize((current) =>
        current === nextPageSize ? current : nextPageSize,
      );
    });
  }, [
    itemsPerPage,
    urlPage,
    urlPageSize,
    urlState?.syncPagination,
    urlSyncEnabled,
  ]);

  useEffect(() => {
    if (!urlSyncEnabled || !urlState?.syncSorting) {
      return;
    }

    const nextSortKey =
      urlSortKey && allowedSortKeys.has(urlSortKey) ? urlSortKey : null;
    const nextSortDirection =
      urlSortDirection === "asc" || urlSortDirection === "desc"
        ? urlSortDirection
        : null;

    queueMicrotask(() => {
      setSortKey((current) =>
        current === nextSortKey ? current : nextSortKey,
      );
      setSortDirection((current) =>
        current === nextSortDirection ? current : nextSortDirection,
      );
    });
  }, [
    allowedSortKeys,
    urlSortDirection,
    urlSortKey,
    urlState?.syncSorting,
    urlSyncEnabled,
  ]);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
        if (urlSyncEnabled && urlState?.syncSorting) {
          updateTableUrl(
            {
              [sortKeyParamName]: columnKey,
              [sortDirParamName]: "desc",
            },
            "push",
          );
        }
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
        if (urlSyncEnabled && urlState?.syncSorting) {
          updateTableUrl(
            {
              [sortKeyParamName]: null,
              [sortDirParamName]: null,
            },
            "push",
          );
        }
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
      if (urlSyncEnabled && urlState?.syncSorting) {
        updateTableUrl(
          {
            [sortKeyParamName]: columnKey,
            [sortDirParamName]: "asc",
          },
          "push",
        );
      }
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle different types
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    // Try to parse as dates
    const aDate = new Date(String(aValue));
    const bDate = new Date(String(bValue));
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return sortDirection === "asc"
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // Default string comparison
    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return (
        <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
      );
    }
    if (sortDirection === "asc") {
      return (
        <ArrowUp
          className="w-3 h-3 sm:w-4 sm:h-4 shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
      );
    }
    return (
      <ArrowDown
        className="w-3 h-3 sm:w-4 sm:h-4 shrink-0"
        style={{ color: "var(--primary-color)" }}
      />
    );
  };

  // Pagination calculations
  const effectiveCurrentPage = isServerPagination
    ? serverPagination?.currentPage || 1
    : currentPage;
  const effectivePageSize = isServerPagination
    ? serverPagination?.pageSize || itemsPerPage
    : pageSize;
  const totalItemsCount = isServerPagination
    ? serverPagination?.totalItems || 0
    : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / effectivePageSize));
  const startIndex = (effectiveCurrentPage - 1) * effectivePageSize;
  const endIndex = startIndex + effectivePageSize;
  const paginatedData = showPagination && !isServerPagination
    ? sortedData.slice(startIndex, endIndex)
    : sortedData;

  useEffect(() => {
    if (!showPagination || isServerPagination) {
      return;
    }

    const nextPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

    if (nextPage === currentPage) {
      return;
    }

    queueMicrotask(() => {
      setCurrentPage(nextPage);
    });

    if (urlSyncEnabled && urlState?.syncPagination) {
      updateTableUrl(
        {
          [pageParamName]: nextPage <= 1 ? null : String(nextPage),
        },
        "replace",
      );
    }
  }, [
    currentPage,
    isServerPagination,
    pageParamName,
    showPagination,
    totalPages,
    updateTableUrl,
    urlState?.syncPagination,
    urlSyncEnabled,
  ]);

  // Virtualization calculations
  const dataToRender =
    virtualize && !showPagination ? sortedData : paginatedData;

  const virtualizedData = useMemo(() => {
    if (!virtualize || showPagination) {
      return {
        visibleRows: dataToRender,
        startIndex: 0,
        endIndex: dataToRender.length,
      };
    }

    const visibleRowCount =
      Math.ceil(containerHeight / densityClasses.rowHeight) + 2; // +2 for buffer
    const startRow = Math.floor(scrollTop / densityClasses.rowHeight);
    const endRow = Math.min(startRow + visibleRowCount, dataToRender.length);

    return {
      visibleRows: dataToRender.slice(startRow, endRow),
      startIndex: startRow,
      endIndex: endRow,
      totalHeight: dataToRender.length * densityClasses.rowHeight,
      offsetY: startRow * densityClasses.rowHeight,
    };
  }, [
    virtualize,
    showPagination,
    dataToRender,
    containerHeight,
    scrollTop,
    densityClasses.rowHeight,
  ]);

  // Handle scroll for virtualization
  useEffect(() => {
    if (!virtualize || showPagination) return;

    const container = tableBodyRef.current?.parentElement;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    // Use ResizeObserver to track container height changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [virtualize, showPagination]);

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (isServerPagination && serverPagination) {
      serverPagination.onPageChange(nextPage);
      return;
    }

    setCurrentPage(nextPage);
    if (urlSyncEnabled && urlState?.syncPagination) {
      updateTableUrl({ [pageParamName]: String(nextPage) }, "push");
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServerPagination && serverPagination) {
      serverPagination.onPageSizeChange(newSize);
      return;
    }

    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    if (urlSyncEnabled && urlState?.syncPagination) {
      updateTableUrl(
        {
          [pageSizeParamName]: String(newSize),
          [pageParamName]: null,
        },
        "push",
      );
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (effectiveCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (effectiveCurrentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(effectiveCurrentPage - 1);
        pages.push(effectiveCurrentPage);
        pages.push(effectiveCurrentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        "a,button,input,select,textarea,[role='button'],[data-row-action]",
      ),
    );
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick || isInteractiveTarget(event.target)) {
      return;
    }

    onRowClick(row);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    row: T,
  ) => {
    if (
      !onRowClick ||
      isInteractiveTarget(event.target) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    onRowClick(row);
  };

  const renderEmptyState = () => (
    <tr>
      <td
        colSpan={columns.length}
        className="px-3 py-12 text-center sm:px-4 lg:px-6"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-gray-900">
            {emptyTitle || t("no_data_available")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {emptyDescription || t("no_matching_records")}
          </p>
        </div>
      </td>
    </tr>
  );

  const renderSkeletonRows = () =>
    Array.from({ length: skeletonRows }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="animate-pulse">
        {columns.map((column, columnIndex) => (
          <td
            key={`${column.key}-${rowIndex}`}
            className={`px-3 sm:px-4 lg:px-6 ${densityClasses.cell}`}
          >
            <div
              className={`rounded bg-gray-100 ${densityClasses.skeleton}`}
              style={{ width: skeletonCellWidth(columnIndex, columns.length) }}
            />
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {showDensityToggle ? (
        <div className="flex flex-col gap-3 border-b border-gray-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-6">
          <p className="text-sm font-semibold text-gray-700">
            {t("table_density")}
          </p>
          <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(["comfortable", "compact"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={density === option}
                onClick={() => handleDensityChange(option)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  density === option
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {t(`density_${option}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className="overflow-x-auto"
        style={
          virtualize && !showPagination
            ? {
                maxHeight: "600px",
                overflowY: "auto",
              }
            : undefined
        }
      >
        <table className="w-full min-w-[640px]">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  aria-sort={
                    sortKey === column.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={`px-3 text-start sm:px-4 lg:px-6 ${densityClasses.header} text-xs font-bold uppercase tracking-wide text-gray-600 ${column.sticky ? "sticky start-0 z-20 bg-gray-50 shadow-[1px_0_0_0_var(--border-color)]" : ""} ${
                    column.sortable !== false
                      ? "cursor-pointer select-none"
                      : ""
                  }`}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }
                >
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 sm:gap-2 ${
                      sortKey === column.key
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600"
                    }`}
                  >
                    <span className="truncate">{column.label}</span>
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            ref={tableBodyRef}
            className="divide-y divide-gray-200"
            style={
              virtualize && !showPagination
                ? {
                    position: "relative",
                    height: `${virtualizedData.totalHeight}px`,
                  }
                : undefined
            }
          >
            {virtualize && !showPagination && virtualizedData.totalHeight && (
              <tr style={{ height: `${virtualizedData.offsetY}px` }} />
            )}
            {isLoading
              ? renderSkeletonRows()
              : virtualizedData.visibleRows.length === 0
                ? renderEmptyState()
                : virtualizedData.visibleRows.map((row, index) => {
                    const actualIndex =
                      virtualize && !showPagination
                        ? virtualizedData.startIndex + index
                        : index;

                    return (
                      <tr
                        key={getRowKey?.(row, actualIndex) ?? actualIndex}
                        onClick={(event) => handleRowClick(event, row)}
                        onKeyDown={(event) => handleRowKeyDown(event, row)}
                        tabIndex={onRowClick ? 0 : undefined}
                        className={`${onRowClick ? "cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30" : ""} transition-colors`}
                        style={
                          virtualize && !showPagination
                            ? {
                                height: `${densityClasses.rowHeight}px`,
                              }
                            : undefined
                        }
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-3 text-start sm:px-4 lg:px-6 ${densityClasses.cell} text-gray-900 ${column.sticky ? "sticky start-0 z-10 bg-[var(--surface-color)] shadow-[1px_0_0_0_var(--border-color)]" : ""}`}
                          >
                            {column.render ? (
                              column.render(row[column.key], row)
                            ) : column.searchable && searchQuery ? (
                              <HighlightText
                                text={String(row[column.key] || "")}
                                highlight={searchQuery}
                              />
                            ) : (
                              String(row[column.key] || "")
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && !isLoading && totalItemsCount > 0 && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Left side - Items per page and info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 shrink-0">
                {t("show")}:
              </label>
              <select
                value={effectivePageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 sm:px-3 py-1.5 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:border-transparent min-h-[40px]"
                style={
                  {
                    borderColor: "var(--border-color)",
                    "--tw-ring-color": "var(--primary-color)",
                  } as React.CSSProperties
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {t("showing")} {startIndex + 1} {t("to")}{" "}
              {Math.min(endIndex, totalItemsCount)} {t("of")}{" "}
              {totalItemsCount} {t("entries")}
            </div>
          </div>

          {/* Right side - Page navigation */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
            {/* First page */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={effectiveCurrentPage === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 text-black disabled:text-black/50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              style={{ borderColor: "var(--border-color)" }}
              title={t("first_page")}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous page */}
            <button
              onClick={() => handlePageChange(effectiveCurrentPage - 1)}
              disabled={effectiveCurrentPage === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 text-black disabled:text-black/50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              style={{ borderColor: "var(--border-color)" }}
              title={t("previous_page")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof page === "number" && handlePageChange(page)
                  }
                  disabled={page === "..."}
                  className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 disabled:text-black/50 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                    page === effectiveCurrentPage
                      ? "text-white"
                      : page === "..."
                        ? "cursor-default"
                        : "border hover:bg-gray-50 text-black/50"
                  }`}
                  style={
                    page === effectiveCurrentPage
                      ? { backgroundColor: "var(--primary-color)" }
                      : { borderColor: "var(--border-color)" }
                  }
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next page */}
            <button
              onClick={() => handlePageChange(effectiveCurrentPage + 1)}
              disabled={effectiveCurrentPage === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 text-black disabled:text-black/50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              style={{ borderColor: "var(--border-color)" }}
              title={t("next_page")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={effectiveCurrentPage === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 text-black disabled:text-black/50 disabled:cursor-not-allowed transition-colors shrink-0 min-h-[36px] min-w-[36px]"
              style={{ borderColor: "var(--border-color)" }}
              title={t("last_page")}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
