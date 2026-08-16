"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mui/material";
import { Filter, Plus } from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { useAttendanceYearTermLayoutContext } from "@/features/attendance/shared/hooks/AttendanceYearTermLayoutContext";
import { isDateRangeValidationError, isInvalidDateRange } from "@/features/attendance/shared/utils/dateRange";
import AttendanceFiltersPanel from "@/features/attendance/shared/components/AttendanceFiltersPanel";
import AttendanceBottomDrawer from "@/features/attendance/shared/components/AttendanceBottomDrawer";
import {
  AttendanceWorkspaceContentPanel,
  AttendanceWorkspaceHeader,
  AttendanceWorkspaceMobileActions,
  AttendanceWorkspaceShell,
  AttendanceWorkspaceStack,
  AttendanceWorkspaceState,
} from "@/features/attendance/shared/components/AttendanceWorkspaceShell";
import {
  fetchExcuseRequests,
  fetchExcuseRequestDetails,
  createExcuseRequest,
  updateExcuseRequest,
  deleteExcuseRequest,
  approveExcuseRequest,
  rejectExcuseRequest,
  ExcuseApprovalEligibilityError,
} from "../services/attendanceExcusesService";
import type { DecisionResult } from "../components/DecisionModal";
import {
  getExcuseApprovalEligibility,
  type ExcuseApprovalEligibility,
} from "../services/excuseApprovalEligibility";
import { ExcusePolicyValidationError, type ExcusePolicyIssue } from "../utils/excusePolicyValidation";
import {
  resolveEffectiveExcusePolicy,
  type EffectiveExcusePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";
import type { ExcuseRequest, ExcuseRequestFilters, ExcusesKpis } from "../types";
import { exportExcuses } from "../utils/excusesExport";
import AttendanceGlobalExportModal from "@/features/attendance/shared/components/AttendanceGlobalExportModal";
import {
  exportAttendanceData,
  formatAttendanceExportDate,
  generateAttendanceExportFilename,
  type AttendanceExportFormat,
  type ExportColumn,
} from "@/features/attendance/shared/utils/attendanceExport";
import ExcusesKpisBar from "../components/ExcusesKpisBar";
import ExcusesFiltersBar from "../components/ExcusesFiltersBar";
import ExcusesFiltersDrawer from "../components/ExcusesFiltersDrawer";
import ExcusesTable from "../components/ExcusesTable";
import ExcuseDetailsDrawer from "../components/ExcuseDetailsDrawer";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import DecisionModal from "../components/DecisionModal";
import MainLoader from "@/components/ui/loaders/MainLoader";

function computeKpis(requests: ExcuseRequest[]): ExcusesKpis {
  return {
    total: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    approved: requests.filter((request) => request.status === "APPROVED").length,
    rejected: requests.filter((request) => request.status === "REJECTED").length,
    withAttachments: requests.filter(
      (request) => (request.attachmentCount ?? request.attachments.length) > 0,
    ).length,
  };
}

export default function AttendanceExcusesPage() {
  const t = useTranslations("attendance.excuses");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use unified term context
  const termContext = useAttendanceYearTermLayoutContext();

  const [requests, setRequests] = useState<ExcuseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<ExcuseRequestFilters>({
    status: "ALL",
    type: "ALL",
    search: "",
    hasAttachment: "ALL",
  });
  const debouncedSearch = useDebounce(searchInput, 500);
  const requestFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [debouncedSearch, filters],
  );

  const [selectedRequest, setSelectedRequest] = useState<ExcuseRequest | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [attachmentPreviewOpen, setAttachmentPreviewOpen] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ExcuseRequest | null>(null);
  const [decisionRequest, setDecisionRequest] = useState<ExcuseRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalEligibility, setApprovalEligibility] =
    useState<ExcuseApprovalEligibility | null>(null);
  const [isApprovalEligibilityLoading, setIsApprovalEligibilityLoading] = useState(false);
  const [hasApprovalEligibilityError, setHasApprovalEligibilityError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExcuseRequest | null>(null);
  const [selectedRequestPolicy, setSelectedRequestPolicy] = useState<EffectiveExcusePolicy | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const isReadOnly = termContext.isReadOnly;
  const canManageExcuses = hasPermission("attendance.excuses.manage");
  const canReviewExcuses = hasPermission("attendance.excuses.review");
  const kpis = useMemo(() => computeKpis(requests), [requests]);

  // Get current term object
  const term = useMemo(() => {
    return termContext.terms.find((t) => t.id === termContext.termId) || null;
  }, [termContext.terms, termContext.termId]);

  const reloadRequests = useCallback(async () => {
    if (!termContext.yearId || !termContext.termId) return;

    if (isInvalidDateRange(requestFilters.dateFrom, requestFilters.dateTo)) {
      setRequests([]);
      setSelectedRequest(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchExcuseRequests({ yearId: termContext.yearId, termId: termContext.termId, ...requestFilters });
      setRequests(data);

      // Update selected request if it exists in the new list
      setSelectedRequest((prev) => {
        if (!prev) return null;
        return data.find((item) => item.id === prev.id) || null;
      });
    } catch (error) {
      console.error("Failed to load excuse requests", error);
      showError(
        isDateRangeValidationError(error)
          ? tCommon("invalidDateRange")
          : tCommon("error_loading"),
      );
    } finally {
      setLoading(false);
    }
  }, [termContext.yearId, termContext.termId, requestFilters, showError, tCommon]);

  useEffect(() => {
    void Promise.resolve().then(reloadRequests);
  }, [reloadRequests]);

  useEffect(() => {
    if (
      !selectedRequest ||
      !termContext.yearId ||
      !termContext.termId
    ) {
      void Promise.resolve().then(() => setSelectedRequestPolicy(null));
      return;
    }

    let cancelled = false;

    const loadSelectedRequestPolicy = async () => {
      try {
        const policy = await resolveEffectiveExcusePolicy(
          termContext.yearId!,
          termContext.termId!,
          "SCHOOL",
          {},
          selectedRequest.dateFrom
        );

        if (!cancelled) {
          setSelectedRequestPolicy(policy);
        }
      } catch (error) {
        console.error("Failed to resolve selected request policy:", error);
        if (!cancelled) {
          setSelectedRequestPolicy(null);
        }
      }
    };

    loadSelectedRequestPolicy();

    return () => {
      cancelled = true;
    };
  }, [selectedRequest, termContext.yearId, termContext.termId]);

  // Update filters when term changes
  useEffect(() => {
    if (term) {
      void Promise.resolve().then(() => {
        setFilters((prev) => ({
          ...prev,
          dateFrom: term.startDate,
          dateTo: term.endDate,
        }));
      });
    }
  }, [term]);


  const getPolicyIssueMessage = (issue: ExcusePolicyIssue) => {
    if (issue.code === "NO_ACTIVE_POLICY") {
      return t("messages.noActivePolicyOnDate", { date: issue.date });
    }
    if (issue.code === "REASON_REQUIRED") {
      return t("messages.reasonRequiredOnDate", { date: issue.date });
    }
    if (issue.code === "ATTACHMENT_REQUIRED") {
      return t("messages.attachmentRequiredOnDate", { date: issue.date });
    }
    return t("messages.excusesDisabledOnDate", { date: issue.date });
  };

  const selectedYearName =
    (locale === "ar"
      ? termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameAr
      : termContext.academicYears.find((item) => item.id === termContext.yearId)
          ?.nameEn) ||
    termContext.yearId ||
    "";

  const selectedTermName = term
    ? locale === "ar"
      ? term.nameAr || term.name
      : term.nameEn || term.name
    : "";

  const handleLegacyExport = (format: "csv" | "excel") => {
    if (!term || isReadOnly || !canManageExcuses) return;

    exportExcuses(requests, locale, format, {
      yearName: selectedYearName,
      termName: selectedTermName || "",
      scopeName: locale === "ar" ? "كل الطلاب" : "All students",
      dateRange: filters.dateFrom && filters.dateTo ? `${filters.dateFrom} - ${filters.dateTo}` : t("allDates"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleExport = async (format: AttendanceExportFormat) => {
    if (!term) return;

    if (format === "excel") {
      handleLegacyExport("excel");
      return;
    }

    const columns: ExportColumn[] = [
      { key: "submittedAt", label: locale === "ar" ? "تاريخ الإرسال" : "Submitted At" },
      { key: "studentNumber", label: locale === "ar" ? "رقم الطالب" : "Student Number" },
      { key: "studentName", label: locale === "ar" ? "الطالب" : "Student" },
      { key: "studentNameEn", label: locale === "ar" ? "الطالب (بالإنجليزية)" : "Student (English)" },
      { key: "studentNameAr", label: locale === "ar" ? "الطالب (بالعربية)" : "Student (Arabic)" },
      { key: "type", label: locale === "ar" ? "النوع" : "Type" },
      { key: "range", label: locale === "ar" ? "الفترة" : "Range" },
      { key: "attachments", label: locale === "ar" ? "المرفقات" : "Attachments" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "decisionBy", label: locale === "ar" ? "اتخذ القرار بواسطة" : "Decided By" },
      { key: "decisionAt", label: locale === "ar" ? "تاريخ القرار" : "Decided At" },
    ];

    const rowsForExport = requests.map((request) => ({
      submittedAt: request.createdAt.split("T")[0],
      studentNumber: request.studentNumber || "-",
      studentName: locale === "ar" ? request.studentNameAr : request.studentNameEn,
      studentNameEn: request.studentNameEn,
      studentNameAr: request.studentNameAr,
      type: request.type,
      range: `${request.dateFrom} -> ${request.dateTo}`,
      attachments: request.attachments.length,
      status: request.status,
      decisionBy: request.decidedBy || "",
      decisionAt: request.decidedAt || "",
    }));

    exportAttendanceData({
      title: locale === "ar" ? "الأعذار" : "Excuses",
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        dateLabel:
          filters.dateFrom && filters.dateTo
            ? `${filters.dateFrom} - ${filters.dateTo}`
            : t("allDates"),
        viewName: locale === "ar" ? "الأعذار" : "Excuses",
        exportDate: formatAttendanceExportDate(locale),
      },
      filename: generateAttendanceExportFilename(
        "attendance-excuses",
        termContext.termId || undefined,
        filters.status.toLowerCase(),
      ),
      format,
      columns,
      rows: rowsForExport,
      jsonData: {
        title: "Attendance Excuses",
        metadata: {
          yearName:
            termContext.academicYears.find((item) => item.id === termContext.yearId)
              ?.nameEn || termContext.yearId || "",
          termName: term.nameEn || term.name,
          dateLabel:
            filters.dateFrom && filters.dateTo
              ? `${filters.dateFrom} - ${filters.dateTo}`
              : "All dates",
          viewName: "Excuses",
          exportDate: formatAttendanceExportDate("en"),
        },
        filters,
        requests,
      },
      locale,
      emptyMessage: t("emptyStates.noRecords.description"),
    });

    showSuccess(t("exportSuccess"));
  };

  const handleSaveRequest = async (payload: Omit<ExcuseRequest, "id" | "status" | "createdAt" | "updatedAt" | "decidedAt" | "decidedBy" | "decisionNote" | "linkedSessionIds" | "yearId" | "termId">) => {
    if (!term) return;

    if (editingRequest) {
      await updateExcuseRequest(
        editingRequest.id,
        payload,
        editingRequest.attachments,
      );
      showSuccess(t("updated"));
    } else {
      await createExcuseRequest({
        ...payload,
        yearId: termContext.yearId!,
        termId: termContext.termId!,
      });
      showSuccess(t("created"));
    }

    setEditingRequest(null);
    await reloadRequests();
  };

  const handleApproveReject = async (note: string): Promise<DecisionResult | void> => {
    if (!decisionRequest || isReadOnly || !canReviewExcuses) return;

    try {
      if (decisionAction === "APPROVE") {
        await approveExcuseRequest(decisionRequest.id, note, "Attendance Admin");
        showSuccess(t("approved"));
      } else {
        await rejectExcuseRequest(decisionRequest.id, note, "Attendance Admin");
        showSuccess(t("rejected"));
      }

      setDecisionRequest(null);
      await reloadRequests();
    } catch (error) {
      console.error("Decision failed", error);
      if (error instanceof ExcuseApprovalEligibilityError) {
        return {
          keepOpen: true,
          recoveryMessage: t("modal.noMatchingSubmittedAttendance"),
        };
      }
      if (error instanceof ExcusePolicyValidationError) {
        showError(getPolicyIssueMessage(error.issue));
      } else {
        showError(error instanceof Error ? error.message : tCommon("save_failed"));
      }
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isReadOnly || !canManageExcuses) return;

    try {
      await deleteExcuseRequest(deleteTarget.id);
      showSuccess(t("deleted"));
      setDeleteTarget(null);
      await reloadRequests();
    } catch (error) {
      showError(error instanceof Error ? error.message : tCommon("error_deleting"));
    }
  };

  const openDecision = async (request: ExcuseRequest, action: "APPROVE" | "REJECT") => {
    if (isReadOnly || !canReviewExcuses) return;
    setDecisionRequest(request);
    setDecisionAction(action);
    setApprovalEligibility(null);
    setHasApprovalEligibilityError(false);

    if (action !== "APPROVE") return;

    setIsApprovalEligibilityLoading(true);
    try {
      setApprovalEligibility(await getExcuseApprovalEligibility(request));
    } catch (error) {
      console.error("Failed to check excuse approval eligibility", error);
      setHasApprovalEligibilityError(true);
    } finally {
      setIsApprovalEligibilityLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (isReadOnly) return;

    setEditingRequest(null);
    setShowRequestModal(true);
  };

  const handleEditRequest = async (request: ExcuseRequest) => {
    if (isReadOnly) return;
    try {
      const detailedRequest = await fetchExcuseRequestDetails(request.id);
      setEditingRequest(detailedRequest);
      setShowRequestModal(true);
    } catch (error) {
      console.error("Failed to load excuse request details", error);
      showError(tCommon("error_loading"));
    }
  };

  const handleViewRequest = async (request: ExcuseRequest) => {
    try {
      const detailedRequest = await fetchExcuseRequestDetails(request.id);
      setSelectedRequest(detailedRequest);
      setShowDetailsDrawer(true);
    } catch (error) {
      console.error("Failed to load excuse request details", error);
      showError(tCommon("error_loading"));
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setFilters({
      status: "ALL",
      type: "ALL",
      search: "",
      hasAttachment: "ALL",
    });
  };

  const handleFiltersChange = (patch: Partial<ExcuseRequestFilters>) => {
    if ("search" in patch) {
      setSearchInput(patch.search || "");
    }

    const nonSearchPatch = { ...patch };
    delete nonSearchPatch.search;
    if (Object.keys(nonSearchPatch).length > 0) {
      setFilters((previousFilters) => ({ ...previousFilters, ...nonSearchPatch }));
    }
  };

  if (termContext.isLoading) {
    return (
      <MainLoader />
    );
  }

  if (!termContext.yearId || !termContext.termId) {
    return (
      <AttendanceWorkspaceShell>
        <AttendanceWorkspaceState
          title={t("emptyStates.noYearTerm.title")}
          description={t("emptyStates.noYearTerm.description")}
        />
      </AttendanceWorkspaceShell>
    );
  }

  const requestsBody = requests.length === 0 ? (
    <AttendanceWorkspaceState
      title={t("emptyStates.noRecords.title")}
      description={t("emptyStates.noRecords.description")}
    />
  ) : (
    <ExcusesTable
      requests={requests}
      isReadOnly={isReadOnly}
      canManageExcuses={canManageExcuses}
      canReviewExcuses={canReviewExcuses}
      onView={handleViewRequest}
      onApprove={(request) => openDecision(request, "APPROVE")}
      onReject={(request) => openDecision(request, "REJECT")}
      onEdit={handleEditRequest}
      onDelete={(request) => setDeleteTarget(request)}
    />
  );

  return (
    <>
      <AttendanceWorkspaceShell>
        <AttendanceWorkspaceHeader>
          <div>
            <ExcusesKpisBar kpis={kpis} />
          </div>
          {!isMobile && (
            <div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={isReadOnly || !canManageExcuses}
                onClick={handleCreateRequest}
              >
                {t("createRequest")}
              </Button>
            </div>
          )}
        </AttendanceWorkspaceHeader>

        {!isMobile && (
          <>
            <AttendanceFiltersPanel>
              <ExcusesFiltersBar
                filters={{ ...filters, search: searchInput }}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
                onOpenExport={() => setShowExportModal(true)}
              />
            </AttendanceFiltersPanel>
            <AttendanceWorkspaceContentPanel loading={loading}>
              {requestsBody}
            </AttendanceWorkspaceContentPanel>
          </>
        )}

        {isMobile && (
          <AttendanceWorkspaceStack>
            <AttendanceWorkspaceMobileActions columns={2}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFiltersDrawer(true)}
              >
                {t("filters.filters")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                disabled={isReadOnly || !canManageExcuses}
                onClick={handleCreateRequest}
              >
                {t("createRequest")}
              </Button>
            </AttendanceWorkspaceMobileActions>

            <AttendanceWorkspaceContentPanel loading={loading}>
              {requestsBody}
            </AttendanceWorkspaceContentPanel>
          </AttendanceWorkspaceStack>
        )}
      </AttendanceWorkspaceShell>

      <ExcusesFiltersDrawer
        isOpen={showFiltersDrawer}
        filters={{ ...filters, search: searchInput }}
        onClose={() => setShowFiltersDrawer(false)}
        onApply={() => setShowFiltersDrawer(false)}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
        onOpenExport={() => setShowExportModal(true)}
      />

      <AttendanceBottomDrawer
        isOpen={showDetailsDrawer}
        disableEnforceFocus={attachmentPreviewOpen}
        onClose={() => {
          setAttachmentPreviewOpen(false);
          setShowDetailsDrawer(false);
          setSelectedRequest(null);
        }}
        anchor={isMobile ? "bottom" : "left"}
        heightClassName={isMobile ? "h-[85vh]" : "h-full w-[min(32rem,100vw)]"}
      >
        <ExcuseDetailsDrawer
          request={selectedRequest}
          effectivePolicy={selectedRequestPolicy}
          isReadOnly={isReadOnly}
          canManageExcuses={canManageExcuses}
          canReviewExcuses={canReviewExcuses}
          onClose={() => {
            setAttachmentPreviewOpen(false);
            setShowDetailsDrawer(false);
            setSelectedRequest(null);
          }}
          onApprove={(request) => openDecision(request, "APPROVE")}
          onReject={(request) => openDecision(request, "REJECT")}
          onEdit={handleEditRequest}
          onAttachmentPreviewChange={setAttachmentPreviewOpen}
        />
      </AttendanceBottomDrawer>

      <ExcuseRequestModal
        isOpen={showRequestModal}
        isReadOnly={isReadOnly || !canManageExcuses}
        yearId={termContext.yearId || ""}
        termId={termContext.termId || ""}
        termRange={{ startDate: term?.startDate || "", endDate: term?.endDate || "" }}
        initialRequest={editingRequest}
        onClose={() => {
          setShowRequestModal(false);
          setEditingRequest(null);
        }}
        onRefresh={reloadRequests}
        onSave={handleSaveRequest}
      />

      <DecisionModal
        isOpen={!!decisionRequest}
        request={decisionRequest}
        action={decisionAction}
        onClose={() => setDecisionRequest(null)}
        onConfirm={handleApproveReject}
        onViewAttendance={() => router.push(`/${locale}/attendance/roll-call`)}
        approvalEligibility={approvalEligibility}
        isApprovalEligibilityLoading={isApprovalEligibilityLoading}
        approvalEligibilityError={hasApprovalEligibilityError}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        severity="danger"
      />

      <AttendanceGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={requests.length}
        emptyStateMessage={t("emptyStates.noRecords.description")}
      />
    </>
  );
}








