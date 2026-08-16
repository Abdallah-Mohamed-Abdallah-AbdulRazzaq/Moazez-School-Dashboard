"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, FileText, Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  fetchTransfersWithdrawalsRequestRows,
  type TransferWithdrawalRequestRow,
} from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import StudentsGuardiansGlobalExportModal from "@/features/students-guardians/shared/components/export/StudentsGuardiansGlobalExportModal";
import {
  downloadStudentsGuardiansExport,
  getStudentsGuardiansExportLocaleForFormat,
  type StudentsGuardiansExportFormat,
} from "@/features/students-guardians/shared/utils/studentsGuardiansExport";
import { formatTransferWithdrawalRequestsForExport } from "@/features/students-guardians/shared/utils/studentsGuardiansExportFormatters";

interface TransfersWithdrawalsTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function TransfersWithdrawalsTable({
  searchQuery,
  onSearchChange,
}: TransfersWithdrawalsTableProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const locale = useLocale();
  const [requests, setRequests] = useState<TransferWithdrawalRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      if (isCancelled) {
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const rows = await fetchTransfersWithdrawalsRequestRows();
        if (!isCancelled) {
          setRequests(rows);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(
            error instanceof Error ? error.message : t("table.no_requests"),
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [t]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;

    return requests.filter(
      (request) =>
        request.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.studentNameAr.includes(searchQuery) ||
        request.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [requests, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
      case "under_review":
      case "behavior_review":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
      case "executed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReasonLabel = (reason: string) => {
    const normalized = reason.toLowerCase();
    const reasonMap: Record<string, string> = {
      relocation: "relocation",
      financial: "financial",
      academic: "academic",
      behavior: "behavior",
      "transfer in": "transfer_in",
      other: "other",
    };
    return t(`table.reasons.${reasonMap[normalized] || "other"}`);
  };

  const getBehaviorColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-semibold";
    if (score >= 60) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      primary: "primary",
      preparatory: "preparatory",
      secondary: "secondary",
    };
    return t(`table.stages.${stageMap[stage.toLowerCase()] || "primary"}`);
  };

  const getGradeLabel = (grade: string) => {
    const gradeNumber = grade.replace("Grade ", "");
    return locale === "ar" ? `الصف ${gradeNumber}` : grade;
  };

  const columns = [
    {
      key: "studentName",
      label: t("table.columns.student_name"),
      searchable: true,
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
      label: t("table.columns.stage"),
      render: (value: unknown) => getStageLabel(value as string),
    },
    {
      key: "grade",
      label: t("table.columns.grade"),
      render: (value: unknown) => getGradeLabel(value as string),
    },
    {
      key: "behaviorAvg",
      label: t("table.columns.behavior_avg"),
      render: (value: unknown) => (
        <span className={getBehaviorColor(value as number)}>
          {value as number}
        </span>
      ),
    },
    {
      key: "attendancePercent",
      label: t("table.columns.attendance"),
      render: (value: unknown) =>
        value && Number(value) > 0 ? `${value}%` : "-",
    },
    {
      key: "reason",
      label: t("table.columns.reason"),
      render: (value: unknown) => getReasonLabel(value as string),
    },
    {
      key: "status",
      label: t("table.columns.status"),
      render: (value: unknown) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
            value as string,
          )}`}
        >
          {t(`filters.statuses.${value as string}`)}
        </span>
      ),
    },
    {
      key: "requestDate",
      label: t("table.columns.request_date"),
      sortable: true,
    },
  ];

  const handleExport = (format: StudentsGuardiansExportFormat) => {
    const exportLocale = getStudentsGuardiansExportLocaleForFormat(
      format,
      locale,
    );

    downloadStudentsGuardiansExport({
      data: formatTransferWithdrawalRequestsForExport(
        filteredRequests,
        exportLocale,
      ),
      format,
      filenameBase: "transfers-withdrawals",
      emptyMessage: t("table.no_requests"),
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t("table.title")}
          </h2>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("table.search_placeholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 placeholder:text-black/60 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <PartialLoader />
      ) : loadError ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{loadError}</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t("table.no_requests")}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRequests as unknown as Record<string, unknown>[]}
          showPagination={true}
          itemsPerPage={10}
          searchQuery={searchQuery}
        />
      )}

      <StudentsGuardiansGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={t("export")}
        subtitle={t("table.title")}
        datasetCount={filteredRequests.length}
        emptyStateMessage={t("table.no_requests")}
      />
    </div>
  );
}
