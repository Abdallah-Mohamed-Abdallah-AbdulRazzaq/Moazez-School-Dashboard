"use client";

import DataTable, { type Column } from "@/components/ui/data-table/DataTable";

interface BatchTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyTitle: string;
  rowKey: (row: T) => string;
}

export default function HomeworkImportBatchTable<T extends Record<string, unknown>>({ columns, rows, emptyTitle, rowKey }: BatchTableProps<T>) {
  const responsiveColumns = columns.map(column => ({ ...column, render: (cell: unknown, row: T) => {
    const content = column.render ? column.render(cell, row) : String(cell ?? "");
    if (content === null) return null;
    return <div><span className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">{column.label}</span>{content}</div>;
  } }));
  return <div className="min-w-0 [&_table]:min-w-0 [&_thead]:hidden [&_tbody]:block [&_tbody_tr]:mb-3 [&_tbody_tr]:grid [&_tbody_tr]:grid-cols-2 [&_tbody_tr]:rounded-xl [&_tbody_tr]:border [&_tbody_tr]:border-gray-200 [&_td]:block [&_td]:border-0 [&_td]:px-4 [&_td]:py-2 [&_td:first-child]:col-span-2 [&_td:last-child]:col-span-2 [&_td:nth-child(4)]:col-span-2 [&_td:empty]:hidden sm:[&_table]:min-w-[640px] sm:[&_thead]:table-header-group sm:[&_tbody]:table-row-group sm:[&_tbody_tr]:mb-0 sm:[&_tbody_tr]:table-row sm:[&_tbody_tr]:rounded-none sm:[&_tbody_tr]:border-x-0 sm:[&_tbody_tr]:border-t-0 sm:[&_td]:table-cell sm:[&_td]:py-4 sm:[&_td:empty]:table-cell">
    <DataTable columns={responsiveColumns} data={rows} getRowKey={rowKey} itemsPerPage={10} showDensityToggle={false} emptyTitle={emptyTitle} />
  </div>;
}
