// FILE: src/components/students-guardians/transfers-withdrawals/TransfersTable.tsx

"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { TransferApplication } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

interface TransfersTableProps {
  data: TransferApplication[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onExecute?: (id: string) => void;
  urlStateKeyPrefix?: string;
}

export default function TransfersTable({
  data,
  onApprove,
  onReject,
  onExecute,
  urlStateKeyPrefix,
}: TransfersTableProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const router = useRouter();

  const handleRowClick = (row: { [key: string]: unknown }) => {
    router.push(
      `/${locale}/students-guardians/transfers-withdrawals/transfers/${row.id}`,
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      under_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      executed: "bg-purple-100 text-purple-700",
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
      label: t("transfers.table.student_name"),
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
      label: t("transfers.table.stage"),
      render: (value: unknown) => t(`filters.stages.${value as string}`),
    },
    {
      key: "grade",
      label: t("transfers.table.grade"),
    },
    {
      key: "section",
      label: t("transfers.table.section"),
      render: (value: unknown) => (value as string) || t("na"),
    },
    {
      key: "classroom",
      label: t("transfers.table.classroom"),
      render: (value: unknown) => (value as string) || t("na"),
    },
    {
      key: "type",
      label: t("transfers.table.type"),
      render: (value: unknown) => t(`filters.types.${value as string}`),
    },
    {
      key: "behaviorScore",
      label: t("transfers.table.behavior_score"),
      render: (value: unknown) => (
        <span className={getBehaviorColor(value as number)}>
          {value as number}
        </span>
      ),
    },
    {
      key: "status",
      label: t("transfers.table.status"),
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
      label: t("transfers.table.request_date"),
      sortable: true,
    },
    {
      key: "actions",
      label: t("transfers.table.actions"),
      render: (_: unknown, row: { [key: string]: unknown }) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() =>
              router.push(
                `/${locale}/students-guardians/transfers-withdrawals/transfers/${row.id}`,
              )
            }
            className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
            title={t("transfers.table.view")}
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === "under_review" && (
            <>
              <button
                onClick={() => onApprove?.(row.id as string)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title={t("transfers.table.approve")}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onReject?.(row.id as string)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t("transfers.table.reject")}
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
          {t("transfers.table.title")}
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t("transfers.table.no_data")}</p>
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
