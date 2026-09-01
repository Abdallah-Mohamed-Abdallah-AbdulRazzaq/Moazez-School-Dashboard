"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import DataTable, { type Column } from "@/components/ui/data-table/DataTable";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Select from "@/components/ui/input/Select";
import type {
  BulkRegistrationRow,
  BulkRegistrationRowStatus,
} from "../api/bulkRegistrationDtos";
import { BULK_REGISTRATION_ROW_STATUSES } from "../model/bulkRegistrationModel";

interface BulkRegistrationRowsTableProps {
  rows: BulkRegistrationRow[];
  page: number;
  limit: number;
  total: number;
  status: BulkRegistrationRowStatus | undefined;
  loading: boolean;
  loadFailed: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  onStatusChange: (status: BulkRegistrationRowStatus | undefined) => void;
  onRetry: () => void;
  onOpenStudent: (studentId: string) => void;
}

const copy = {
  en: {
    title: "Registration rows",
    subtitle: "Rows are loaded independently with server pagination.",
    filter: "Row status",
    all: "All statuses",
    showFilters: "Show row filters",
    clear: "Clear filter",
    row: "CSV row",
    student: "Student",
    username: "Username",
    status: "Status",
    errors: "Errors",
    action: "Action",
    viewStudent: "View student",
    notAvailable: "Not available",
    loadFailed: "Registration rows could not be loaded.",
    retry: "Refresh rows",
  },
  ar: {
    title: "صفوف التسجيل",
    subtitle: "يتم تحميل الصفوف بشكل مستقل مع ترقيم صفحات الخادم.",
    filter: "حالة الصف",
    all: "كل الحالات",
    showFilters: "عرض مرشحات الصفوف",
    clear: "مسح المرشح",
    row: "صف CSV",
    student: "الطالب",
    username: "اسم المستخدم",
    status: "الحالة",
    errors: "الأخطاء",
    action: "الإجراء",
    viewStudent: "عرض الطالب",
    notAvailable: "غير متاح",
    loadFailed: "تعذر تحميل صفوف التسجيل.",
    retry: "تحديث الصفوف",
  },
} as const;

const rowStatusLabels = {
  en: {
    PENDING: "Pending",
    VALID: "Valid",
    INVALID: "Invalid",
    PROCESSING: "Processing",
    CREATED: "Created",
    FAILED: "Failed",
  },
  ar: {
    PENDING: "قيد الانتظار",
    VALID: "صحيح",
    INVALID: "غير صحيح",
    PROCESSING: "قيد المعالجة",
    CREATED: "تم الإنشاء",
    FAILED: "فشل",
  },
} as const;

// Boundary cases: non-positive values become 1, decimals are truncated, and values above 200 use the API maximum.
export function cappedBulkRegistrationRowsLimit(requestedLimit: number): number {
  return Math.min(Math.max(Math.trunc(requestedLimit), 1), 200);
}

function studentName(row: BulkRegistrationRow, locale: "ar" | "en"): string {
  const localizedParts =
    locale === "ar"
      ? [
          row.normalizedData.firstNameAr,
          row.normalizedData.fatherNameAr,
          row.normalizedData.grandfatherNameAr,
          row.normalizedData.familyNameAr,
        ]
      : [
          row.normalizedData.firstNameEn,
          row.normalizedData.fatherNameEn,
          row.normalizedData.grandfatherNameEn,
          row.normalizedData.familyNameEn,
        ];
  return localizedParts.filter(Boolean).join(" ");
}

export default function BulkRegistrationRowsTable({
  rows,
  page,
  limit,
  total,
  status,
  loading,
  loadFailed,
  onPageChange,
  onPageSizeChange,
  onStatusChange,
  onRetry,
  onOpenStudent,
}: BulkRegistrationRowsTableProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const commonTranslations = useTranslations("common");
  const text = copy[locale];
  const [showFilters, setShowFilters] = useState(false);
  const columns = useMemo<Column<Record<string, unknown>>[]>(
    () => [
      { key: "rowNumber", label: text.row },
      {
        key: "studentName",
        label: text.student,
        render: (_field, tableRow) => {
          const row = tableRow as unknown as BulkRegistrationRow;
          return studentName(row, locale) || text.notAvailable;
        },
      },
      {
        key: "username",
        label: text.username,
        render: (_field, tableRow) =>
          (tableRow as unknown as BulkRegistrationRow).normalizedData.username,
      },
      {
        key: "status",
        label: text.status,
        render: (field) =>
          rowStatusLabels[locale][field as BulkRegistrationRowStatus],
      },
      {
        key: "errors",
        label: text.errors,
        render: (_field, tableRow) => {
          const row = tableRow as unknown as BulkRegistrationRow;
          return row.errors.length
            ? row.errors.map((error) => error.reason || error.code).join(", ")
            : text.notAvailable;
        },
      },
      {
        key: "action",
        label: text.action,
        render: (_field, tableRow) => {
          const studentId = (tableRow as unknown as BulkRegistrationRow).studentId;
          return studentId ? (
            <Button size="sm" variant="ghost" onClick={() => onOpenStudent(studentId)}>
              {text.viewStudent}
            </Button>
          ) : (
            text.notAvailable
          );
        },
      },
    ],
    [locale, onOpenStudent, text],
  );

  if (loadFailed) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <EmptyState
          message={text.loadFailed}
          action={<Button onClick={onRetry}>{text.retry}</Button>}
        />
      </section>
    );
  }

  const filterOptions = [
    { value: "", label: text.all },
    ...BULK_REGISTRATION_ROW_STATUSES.map((rowStatus) => ({
      value: rowStatus,
      label: rowStatusLabels[locale][rowStatus],
    })),
  ];

  return (
    <section className="space-y-3">
      <FilterPanel
        title={text.title}
        subtitle={text.subtitle}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((visible) => !visible)}
        toggleAriaLabel={text.showFilters}
        filtersSlot={
          <Select
            label={text.filter}
            value={status ?? ""}
            options={filterOptions}
            onChange={(nextStatus) =>
              onStatusChange(
                nextStatus
                  ? (nextStatus as BulkRegistrationRowStatus)
                  : undefined,
              )
            }
          />
        }
        hasActiveFilters={Boolean(status)}
        clearAction={
          <Button size="sm" variant="ghost" onClick={() => onStatusChange(undefined)}>
            {text.clear}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={rows as unknown as Record<string, unknown>[]}
        isLoading={loading}
        skeletonRows={Math.min(limit, 10)}
        showPagination
        itemsPerPage={limit}
        showDensityToggle={false}
        emptyTitle={commonTranslations("no_data_available")}
        emptyDescription={commonTranslations("no_matching_records")}
        serverPagination={{
          enabled: true,
          currentPage: page,
          pageSize: limit,
          totalItems: total,
          onPageChange,
          onPageSizeChange: (requestedLimit) =>
            onPageSizeChange(cappedBulkRegistrationRowsLimit(requestedLimit)),
        }}
      />
    </section>
  );
}
