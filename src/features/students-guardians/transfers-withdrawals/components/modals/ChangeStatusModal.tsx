"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, AlertTriangle } from "lucide-react";
import type { ApplicationStatus } from "@/features/students-guardians/transfers-withdrawals/types/transfers-withdrawals";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: ApplicationStatus, reason?: string) => void;
  currentStatus: ApplicationStatus;
}

export default function ChangeStatusModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
}: ChangeStatusModalProps) {
  const t = useTranslations("students_guardians.transfers_withdrawals");
  const tDetails = useTranslations(
    "students_guardians.transfers_withdrawals.details",
  );
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [showReasonField, setShowReasonField] = useState(false);

  const statuses: ApplicationStatus[] = [
    "draft",
    "submitted",
    "under_review",
    "finance_clearance",
    "behavior_review",
    "approved",
    "rejected",
    "executed",
  ];

  const handleStatusChange = (status: ApplicationStatus) => {
    setSelectedStatus(status);
    // Show reason field for rejected status
    setShowReasonField(status === "rejected");
    if (status !== "rejected") {
      setReason("");
    }
  };

  const handleConfirm = () => {
    if (selectedStatus === "rejected" && !reason.trim()) {
      alert(tDetails("reason_required"));
      return;
    }
    onConfirm(selectedStatus, reason || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {tDetails("change_status")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tDetails("current_status")}
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
              {t(`filters.statuses.${currentStatus}`)}
            </div>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tDetails("new_status")}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as ApplicationStatus)
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {t(`filters.statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Field (for rejected status) */}
          {showReasonField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tDetails("rejection_reason")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={tDetails("reason_placeholder")}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Warning for critical statuses */}
          {(selectedStatus === "executed" || selectedStatus === "rejected") && (
            <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  {tDetails("status_change_warning")}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {selectedStatus === "executed"
                    ? tDetails("execute_warning")
                    : tDetails("reject_warning")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            {tDetails("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedStatus === currentStatus}
            className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tDetails("confirm_change")}
          </button>
        </div>
      </div>
    </div>
  );
}
