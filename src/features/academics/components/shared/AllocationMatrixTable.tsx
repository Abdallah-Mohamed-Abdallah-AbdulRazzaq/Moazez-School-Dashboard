"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface MatrixColumn {
  id: string;
  label: string;
  code?: string | null;
  minWidth?: string;
  maxWidth?: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  secondaryLabel?: string;
}

interface AllocationMatrixTableProps<
  TRow extends MatrixRow,
  TColumn extends MatrixColumn,
> {
  rows: TRow[];
  columns: TColumn[];
  rowHeaderLabel: string;
  totalColumnLabel?: string;
  renderCell: (row: TRow, column: TColumn) => ReactNode;
  renderColumnHeader?: (column: TColumn) => ReactNode;
  getRowTotal?: (row: TRow) => number;
  renderRowTotal?: (row: TRow) => ReactNode;
  isEvenRow?: (index: number) => boolean;
  className?: string;
  showPagination?: boolean;
  itemsPerPage?: number;
  pageSizeOptions?: number[];
}

export default function AllocationMatrixTable<
  TRow extends MatrixRow,
  TColumn extends MatrixColumn,
>({
  rows,
  columns,
  rowHeaderLabel,
  totalColumnLabel,
  renderCell,
  renderColumnHeader,
  getRowTotal,
  renderRowTotal,
  isEvenRow = (index) => index % 2 === 0,
  className = "",
  showPagination = false,
  itemsPerPage = 10,
  pageSizeOptions = [10, 25, 50, 100],
}: AllocationMatrixTableProps<TRow, TColumn>) {
  const locale = useLocale();
  const t = useTranslations("common");
  const isRTL = locale === "ar";
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  useEffect(() => {
    void Promise.resolve().then(() => setPageSize(itemsPerPage));
  }, [itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => {
    if (!showPagination) {
      return rows;
    }

    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, rows, showPagination]);

  useEffect(() => {
    if (!showPagination) {
      return;
    }

    void Promise.resolve().then(() => {
      setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
    });
  }, [showPagination, totalPages]);

  const startRow = showPagination ? (currentPage - 1) * pageSize + 1 : 0;
  const endRow = showPagination
    ? Math.min(currentPage * pageSize, rows.length)
    : rows.length;

  return (
    <div
      className={`overflow-x-auto ${className}`}
      style={{ fontFamily: "inherit" }}
    >
      <table
        className="min-w-full border-collapse shadow-sm rounded-lg overflow-hidden"
        style={{ backgroundColor: "var(--background)", fontFamily: "inherit" }}
      >
        <thead>
          <tr>
            <th
              className={`sticky ${
                isRTL ? "right-0" : "left-0"
              } z-20 px-4 py-3 text-${isRTL ? "right" : "left"} text-xs font-bold uppercase tracking-wider shadow-sm`}
              style={{
                minWidth: "200px",
                backgroundColor: "var(--color-primary-100)",
                borderBottom: "2px solid var(--color-primary-200)",
                color: "var(--color-primary-900)",
              }}
            >
              {rowHeaderLabel}
            </th>

            {columns.map((column) => (
              <th
                key={column.id}
                className={`px-3 py-3 ${
                  isRTL ? "text-right" : "text-left"
                } text-xs font-bold uppercase tracking-wider`}
                style={{
                  minWidth: column.minWidth || "160px",
                  maxWidth: column.maxWidth || "160px",
                  backgroundColor: "var(--color-primary-100)",
                  borderBottom: "2px solid var(--color-primary-200)",
                  color: "var(--color-primary-900)",
                }}
              >
                {renderColumnHeader ? (
                  renderColumnHeader(column)
                ) : (
                  <div className="flex flex-col gap-1">
                    <div
                      className="font-bold truncate text-center"
                      style={{ color: "var(--color-primary-900)" }}
                    >
                      {column.label}
                    </div>
                  </div>
                )}
              </th>
            ))}

            {totalColumnLabel && (
              <th
                className={`sticky ${
                  isRTL ? "left-0" : "right-0"
                } z-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider shadow-sm`}
                style={{
                  minWidth: "110px",
                  backgroundColor: "var(--color-primary-50)",
                  borderBottom: "2px solid var(--color-primary-200)",
                  color: "var(--color-primary-900)",
                }}
              >
                {totalColumnLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, rowIndex) => {
            const visibleRowIndex = showPagination
              ? (currentPage - 1) * pageSize + rowIndex
              : rowIndex;

            return (
              <tr
                key={row.id}
                className="transition-colors"
                style={{
                  backgroundColor: isEvenRow(visibleRowIndex)
                    ? "var(--background)"
                    : "var(--color-gray-50)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-primary-50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isEvenRow(
                    visibleRowIndex,
                  )
                    ? "var(--background)"
                    : "var(--color-gray-50)";
                }}
              >
                {/* Row Header Cell - Pinned */}
                <td
                  className={`sticky ${
                    isRTL ? "right-0" : "left-0"
                  } z-10 px-4 py-3 text-sm shadow-sm`}
                  style={{
                    backgroundColor: "inherit",
                    borderBottom: "1px solid var(--color-primary-100)",
                    color: "var(--color-primary-900)",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="font-semibold">{row.label}</div>
                    {row.secondaryLabel && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--color-primary-600)" }}
                      >
                        {row.secondaryLabel}
                      </div>
                    )}
                  </div>
                </td>

                {/* Data Cells */}
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className="p-0"
                    style={{
                      borderBottom: "1px solid var(--color-primary-100)",
                    }}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}

                {/* Total Cell - Pinned (if enabled) */}
                {totalColumnLabel && (
                  <td
                    className={`sticky ${
                      isRTL ? "left-0" : "right-0"
                    } z-10 px-4 py-3 text-sm font-bold text-center shadow-sm`}
                    style={{
                      backgroundColor: "var(--color-primary-50)",
                      borderBottom: "2px solid var(--color-primary-200)",
                      color: "var(--color-primary-900)",
                    }}
                  >
                    {renderRowTotal
                      ? renderRowTotal(row)
                      : getRowTotal
                        ? getRowTotal(row)
                        : null}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {showPagination && rows.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t("show")}:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="min-h-[36px] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {t("showing")} {startRow} {t("to")} {endRow} {t("of")}{" "}
              {rows.length} {t("entries")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("previous_page")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("next_page")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hide number input spinners */}
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
