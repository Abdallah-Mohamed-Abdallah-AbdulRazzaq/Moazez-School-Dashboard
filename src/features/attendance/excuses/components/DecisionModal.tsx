"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { ExcuseApprovalEligibility } from "../services/excuseApprovalEligibility";
import type { ExcuseRequest } from "../types";

export interface DecisionResult {
  keepOpen?: boolean;
  recoveryMessage?: string;
}

interface DecisionModalProps {
  isOpen: boolean;
  request: ExcuseRequest | null;
  action: "APPROVE" | "REJECT";
  onClose: () => void;
  onConfirm: (note: string) => Promise<DecisionResult | void>;
  onViewAttendance?: () => void;
  approvalEligibility?: ExcuseApprovalEligibility | null;
  isApprovalEligibilityLoading?: boolean;
  approvalEligibilityError?: boolean;
}

export default function DecisionModal({
  isOpen,
  request,
  action,
  onClose,
  onConfirm,
  onViewAttendance,
  approvalEligibility,
  isApprovalEligibilityLoading = false,
  approvalEligibilityError = false,
}: DecisionModalProps) {
  const t = useTranslations("attendance.excuses.modal");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const isApprove = action === "APPROVE";
  const isApprovalBlocked =
    isApprove &&
    (approvalEligibilityError ||
      (!!approvalEligibility &&
        approvalEligibility.state !== "READY_TO_APPROVE"));

  const eligibilityMessage = approvalEligibility
    ? t(`approvalEligibility.${approvalEligibility.state.toLowerCase()}`)
    : null;

  useEffect(() => {
    void Promise.resolve().then(() => {
      setNote("");
      setRecoveryMessage(null);
    });
  }, [isOpen, request?.id, action]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const result = await onConfirm(note);
      if (result?.keepOpen) {
        setRecoveryMessage(result.recoveryMessage || t("approvalUnavailable"));
        return;
      }
      setNote("");
      setRecoveryMessage(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? t("approveTitle") : t("rejectTitle")}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button
            variant={isApprove ? "primary" : "danger"}
            onClick={handleConfirm}
            loading={loading}
            disabled={isApprovalEligibilityLoading || isApprovalBlocked}
          >
            {isApprove ? t("approve") : t("reject")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {request ? `${request.studentNameEn} / ${request.studentNameAr} - ${request.dateFrom} → ${request.dateTo}` : ""}
        </p>
        <Input
          label={t("decisionNote")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("decisionNotePlaceholder")}
        />
        {isApprove && isApprovalEligibilityLoading && (
          <p role="status" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("checkingApprovalEligibility")}
          </p>
        )}
        {isApprove && approvalEligibilityError && (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
          >
            <p className="font-semibold">{t("approvalEligibilityUnavailable")}</p>
            <p className="mt-1">{t("approvalEligibilityUnavailableDescription")}</p>
          </div>
        )}
        {isApprove && approvalEligibility && eligibilityMessage && (
          <div
            role={isApprovalBlocked ? "alert" : "status"}
            className={
              isApprovalBlocked
                ? "rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
                : "rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950"
            }
          >
            <p className="font-semibold">
              {t(`approvalEligibility.${approvalEligibility.state.toLowerCase()}Title`)}
            </p>
            <p className="mt-1">{eligibilityMessage}</p>
            {approvalEligibility.state === "READY_TO_APPROVE" && (
              <p className="mt-1 text-xs">
                {t("approvalEligibility.eligibleEntries", {
                  count: approvalEligibility.eligibleEntryCount,
                })}
              </p>
            )}
            {isApprovalBlocked && onViewAttendance && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onViewAttendance}
              >
                {t("viewAttendance")}
              </Button>
            )}
          </div>
        )}
        {recoveryMessage && (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
          >
            <p className="font-semibold">{t("approvalUnavailable")}</p>
            <p className="mt-1">{recoveryMessage}</p>
            {onViewAttendance && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onViewAttendance}
              >
                {t("viewAttendance")}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
