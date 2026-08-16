// FILE: src/components/students-guardians/transfers-withdrawals/WithdrawalsTable.tsx

"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { WithdrawalApplication } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

interface WithdrawalsTableProps {
  data: WithdrawalApplication[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onExecute?: (id: string) => void;
  urlStateKeyPrefix?: string;
}

export default function WithdrawalsTable({
  data,
  onApprove,
  onReject,
  onExecute,
  urlStateKeyPrefix,
}: WithdrawalsTableProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const router = useRouter();

  const handleRowClick = (row: { [key: string]: unknown }) => {
    router.push(
      `/${locale}/students-guardians/transfers-withdrawals/withdrawals/${row.id}`,
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      under_review: "bg-yellow-100 text-yellow-700",
      behavior_review: "bg-purple-100 text-purple-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      executed: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getBehaviorColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const columns = [
    {
      key: "studentName",
      label: t("withdrawals.table.student_name"),
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <span className="font-medium">
          {locale === "ar" && row.studentNameAr
            ? (row.studentNameAr as string)
            : (row.studentName as string)}
        </span>
      ),
    },
    {
      key: "stage",
      label: t("withdrawals.table.stage"),
      render: (value: unknown) => t(`filters.stages.${value as string}`),
    },
    {
      key: "grade",
      label: t("withdrawals.table.grade"),
    },
    {
      key: "section",
      label: t("withdrawals.table.section"),
      render: (value: unknown) => (value as string) || t("na"),
    },
    {
      key: "classroom",
      label: t("withdrawals.table.classroom"),
      render: (value: unknown) => (value as string) || t("na"),
    },
    {
      key: "behaviorAvg",
      label: t("withdrawals.table.behavior_avg"),
      render: (value: unknown) => (
        <span className={getBehaviorColor(value as number)}>
          {value as number}
        </span>
      ),
    },
    {
      key: "attendancePercent",
      label: t("withdrawals.table.attendance"),
      render: (value: unknown) => `${value}%`,
    },
    {
      key: "reason",
      label: t("withdrawals.table.reason"),
      render: (value: unknown) => t(`filters.reasons.${value as string}`),
    },
    {
      key: "status",
      label: t("withdrawals.table.status"),
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(value as string)}`}
        >
          {t(`filters.statuses.${value as string}`)}
        </span>
      ),
    },
    {
      key: "requestDate",
      label: t("withdrawals.table.request_date"),
      sortable: true,
    },
    {
      key: "actions",
      label: t("withdrawals.table.actions"),
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() =>
              router.push(
                `/${locale}/students-guardians/transfers-withdrawals/withdrawals/${row.id}`,
              )
            }
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title={t("withdrawals.table.view")}
          >
            <Eye className="w-4 h-4" />
          </button>
          {(row.status === "under_review" ||
            row.status === "behavior_review") && (
            <>
              <button
                onClick={() => onApprove?.(row.id as string)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title={t("withdrawals.table.approve")}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReject?.(row.id as string)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t("withdrawals.table.reject")}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === "approved" && (
            <button
              onClick={() => onExecute?.(row.id as string)}
              className="p-1.5 text-primary hover:bg-blue-50 rounded transition-colors"
              title={t("details.execute")}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("withdrawals.table.title")}
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t("withdrawals.table.no_data")}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data as unknown as Record<string, unknown>[]}
          showPagination={true}
          itemsPerPage={10}
          onRowClick={handleRowClick}
          urlState={
            urlStateKeyPrefix
              ? {
                  keyPrefix: urlStateKeyPrefix,
                  syncPagination: true,
                  syncSorting: true,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
