"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  ArrowLeftRight,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import type {
  TransferApplication,
  ApplicationStatus,
} from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";
import ChangeStatusModal from "../modals/ChangeStatusModal";
import { updateTransferStatus } from "@/features/students-guardians/transfers-withdrawals/services/transfersWithdrawalsService";

interface TransferRequestDetailsPageProps {
  transfer: TransferApplication;
}

export default function TransferRequestDetailsPage({
  transfer,
}: TransferRequestDetailsPageProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const tDetails = useTranslations(
    "students_guardians.transfers_withdrawals.details",
  );
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transferState, setTransferState] = useState(transfer);
  const [activeTab, setActiveTab] = useState<
    "details" | "attachments" | "timeline"
  >("details");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleBack = () => {
    const params = searchParams.toString();
    const backUrl = params
      ? `/students-guardians/transfers-withdrawals/transfers/applications?${params}`
      : "/students-guardians/transfers-withdrawals/transfers/applications";
    router.push(`/${locale}${backUrl}`);
  };

  const handleApprove = async () => {
    const updated = await updateTransferStatus(transferState.id, "approved");
    setTransferState({ ...updated });
  };

  const handleReject = async () => {
    const updated = await updateTransferStatus(transferState.id, "rejected");
    setTransferState({ ...updated });
  };

  const handleExecute = async () => {
    const updated = await updateTransferStatus(transferState.id, "executed");
    setTransferState({ ...updated });
  };

  const handleStatusChange = async (
    newStatus: ApplicationStatus,
    reason?: string,
  ) => {
    const updated = await updateTransferStatus(transferState.id, newStatus, reason);
    setTransferState({ ...updated });
    setShowStatusModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <button
          onClick={handleBack}
          className="flex items-center gap-2  hover:text-primary mb-4 transition-colors"
        >
          {locale === "ar" ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
          {tDetails("back_to_list")}
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {tDetails("transfer_request_details")}
            </h1>
            <p className="text-sm ">
              {tDetails("request_id")}: {transfer.id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(transferState.status)}`}
            >
              {t(`filters.statuses.${transferState.status}`)}
            </span>

            {transferState.status === "under_review" ? (
              <>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  {tDetails("approve")}
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  {tDetails("reject")}
                </button>
              </>
            ) : null}

            {transferState.status === "approved" ? (
              <button
                onClick={handleExecute}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                {tDetails("execute")}
              </button>
            ) : null}

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2  hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showActionsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div
                    className={`absolute ${locale === "ar" ? "left-0 " : "right-0"} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20`}
                  >
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowStatusModal(true);
                      }}
                      className={`w-full px-4 py-2 ${locale === "ar" ? "text-right" : "text-left"} text-sm text-gray-700 hover:bg-gray-50 transition-colors`}
                    >
                      {tDetails("change_status")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Student Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              {tDetails("student_info")}
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm">{tDetails("student_name")}</p>
              <p className="font-medium">
              {locale === "ar"
                  ? transferState.studentNameAr
                  : transferState.studentName}
              </p>
            </div>
            <div>
              <p className="text-sm">{tDetails("stage")}</p>
              <p className="font-medium">
                {t(`filters.stages.${transferState.stage}`)}
              </p>
            </div>
            <div>
              <p className="text-sm">{tDetails("grade")}</p>
              <p className="font-medium">{transferState.grade}</p>
            </div>
            <div>
              <p className="text-sm">{tDetails("section")}</p>
              <p className="font-medium">{transferState.section || t("na")}</p>
            </div>
            <div>
              <p className="text-sm">{tDetails("classroom")}</p>
              <p className="font-medium">{transferState.classroom || t("na")}</p>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              {tDetails("request_info")}
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm ">{tDetails("transfer_type")}</p>
              <p className="font-medium">
                {t(`filters.types.${transferState.type}`)}
              </p>
            </div>
            {transferState.type === "internal" && transferState.targetClass && (
              <div>
                <p className="text-sm ">{tDetails("target_class")}</p>
                <p className="font-medium">{transferState.targetClass}</p>
              </div>
            )}
            {transferState.type === "external" && transferState.externalSchool && (
              <div>
                <p className="text-sm ">{tDetails("external_school")}</p>
                <p className="font-medium">{transferState.externalSchool}</p>
              </div>
            )}
            <div>
              <p className="text-sm ">{tDetails("reason")}</p>
              <p className="font-medium">{transferState.reason}</p>
            </div>
            <div>
              <p className="text-sm ">{tDetails("request_date")}</p>
              <p className="font-medium">{transferState.requestDate}</p>
            </div>
            <div>
              <p className="text-sm ">{tDetails("effective_date")}</p>
              <p className="font-medium">{transferState.effectiveDate}</p>
            </div>
          </div>
        </div>

        {/* Behavior Summary */}
        {transferState.behaviorScore != null && transferState.behaviorBand ? (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              {tDetails("behavior_summary")}
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm ">{tDetails("behavior_score")}</p>
              <p
                className={`text-2xl font-bold ${getBehaviorColor(transferState.behaviorScore)}`}
              >
                {transferState.behaviorScore}
              </p>
            </div>
            <div>
              <p className="text-sm ">{tDetails("behavior_band")}</p>
              <p className="font-medium">
                {t(`filters.behavior_bands.${transferState.behaviorBand}`)}
              </p>
            </div>
          </div>
        </div>
        ) : null}
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent  hover:text-gray-700"
              }`}
            >
              {tDetails("tab_details")}
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "attachments"
                  ? "border-primary text-primary"
                  : "border-transparent  hover:text-gray-700"
              }`}
            >
              {tDetails("tab_attachments")}
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "timeline"
                  ? "border-primary text-primary"
                  : "border-transparent  hover:text-gray-700"
              }`}
            >
              {tDetails("tab_timeline")}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {tDetails("notes")}
                </h4>
                <p className="">{transferState.notes || tDetails("no_notes")}</p>
              </div>
              {transferState.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">
                    {tDetails("rejection_reason")}
                  </h4>
                  <p className="text-red-700">{transferState.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="text-center py-8 ">
              {tDetails("no_attachments")}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-medium text-gray-900">
                    {tDetails("request_submitted")}
                  </p>
                  <p className="text-sm ">{transferState.requestDate}</p>
                  <p className="text-sm  mt-1">
                    {tDetails("submitted_by")}: {transferState.createdBy}
                  </p>
                </div>
              </div>
              {(transferState.approvedBy || transferState.status === "executed") && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {transferState.status === "executed"
                        ? tDetails("execute")
                        : tDetails("approve")}
                    </p>
                    <p className="text-sm mt-1">
                      {tDetails("submitted_by")}: {transferState.approvedBy || "system"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Status Modal */}
      <ChangeStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusChange}
        currentStatus={transferState.status}
      />
    </div>
  );
}
