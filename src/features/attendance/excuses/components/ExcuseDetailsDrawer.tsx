"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { X, User, CalendarDays, Paperclip, Clock3, Check, Ban, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { EffectiveExcusePolicy } from "@/features/attendance/policies/services/attendancePolicyService";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import { getThresholdState } from "@/features/attendance/shared/policyThresholds";
import { formatAttendanceDateTime } from "@/features/attendance/utils/dateFormatting";
import { formatFileSize } from "@/utils/upload/validateFile";
import type { AttachmentMeta, ExcuseRequest } from "../types";
import { formatExcuseDateRange } from "../utils/excusePresentation";

interface ExcuseDetailsDrawerProps {
  request: ExcuseRequest | null;
  effectivePolicy: EffectiveExcusePolicy | null;
  isReadOnly: boolean;
  canManageExcuses: boolean;
  canReviewExcuses: boolean;
  onClose: () => void;
  onApprove: (request: ExcuseRequest) => void;
  onReject: (request: ExcuseRequest) => void;
  onEdit: (request: ExcuseRequest) => void;
  onAttachmentPreviewChange?: (open: boolean) => void;
}

export default function ExcuseDetailsDrawer({ request, effectivePolicy, isReadOnly, canManageExcuses, canReviewExcuses, onClose, onApprove, onReject, onEdit, onAttachmentPreviewChange }: ExcuseDetailsDrawerProps) {
  const t = useTranslations("attendance.excuses.details");
  const tTable = useTranslations("attendance.excuses.table");
  const locale = useLocale();
  const router = useRouter();
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const openAttachmentPreview = (attachment: AttachmentMeta) => {
    setPreviewAttachment(attachment);
    onAttachmentPreviewChange?.(true);
  };
  const closeAttachmentPreview = () => {
    setPreviewAttachment(null);
    onAttachmentPreviewChange?.(false);
  };

  if (!request) {
    return <div className="h-full flex items-center justify-center p-6" style={{ color: "var(--text-secondary)" }}>{t("selectRequest")}</div>;
  }

  const canManage = request.status === "PENDING" && !isReadOnly && canManageExcuses;
  const canReview = request.status === "PENDING" && !isReadOnly && canReviewExcuses;
  const thresholdState =
    request.type === "LATE"
      ? getThresholdState("LATE", request.minutesLate, effectivePolicy)
      : request.type === "EARLY_LEAVE"
        ? getThresholdState("EARLY_LEAVE", request.minutesEarlyLeave, effectivePolicy)
        : null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return tTable("pending");
      case "APPROVED": return tTable("approved");
      case "REJECTED": return tTable("rejected");
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ABSENCE": return tTable("absence");
      case "LATE": return tTable("late");
      case "EARLY_LEAVE": return tTable("earlyLeave");
      default: return type;
    }
  };

  const handleOpenStudentProfile = () => {
    router.push(`/${locale}/students-guardians/students/${request.studentId}`);
  };

  return (
    <>
      <div className="h-full flex flex-col" style={{ backgroundColor: "var(--card-background)" }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("title")}</h3>
          <button onClick={onClose} className="p-1" style={{ color: "var(--text-secondary)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section>
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold">{t("student")}</span>
            </div>
            <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
              <button
                type="button"
                onClick={handleOpenStudentProfile}
                className="font-medium text-start underline underline-offset-2"
                style={{ color: "var(--color-primary-700)" }}
                title={t("openStudentProfile")}
              >
                {locale === "ar" ? request.studentNameAr : request.studentNameEn}
              </button>
              {request.studentNumber && <div style={{ color: "var(--text-secondary)" }}>{request.studentNumber}</div>}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-semibold">{t("requestInfo")}</span>
            </div>
            <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
              <div>{t("type")}: {getTypeLabel(request.type)}</div>
              <div>{t("range")}: {formatExcuseDateRange(request.dateFrom, request.dateTo, locale)}</div>
              <div>
                {t("periods")}: {
                  request.selectedPeriodIds && request.selectedPeriodIds.length > 0
                    ? tTable("selectedPeriods", { count: request.selectedPeriodIds.length })
                    : request.periodIndexes && request.periodIndexes.length > 0
                      ? request.periodIndexes.map((p) => `P${p}`).join(", ")
                      : t("allPolicyPeriods")
                }
              </div>
              {request.type === "LATE" && typeof request.minutesLate === "number" && (
                <div className="space-y-2">
                  <div>{t("minutesLate")}: {request.minutesLate}</div>
                  {thresholdState?.isReached && typeof thresholdState.threshold === "number" && (
                    <div className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)", color: "var(--color-accent-700)" }}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-xs">{t("thresholdReached", { threshold: thresholdState.threshold })}</span>
                    </div>
                  )}
                </div>
              )}
              {request.type === "EARLY_LEAVE" && typeof request.minutesEarlyLeave === "number" && (
                <div className="space-y-2">
                  <div>{t("minutesEarlyLeave")}: {request.minutesEarlyLeave}</div>
                  {thresholdState?.isReached && typeof thresholdState.threshold === "number" && (
                    <div className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: "var(--color-accent-50)", color: "var(--color-accent-700)" }}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-xs">{t("thresholdReached", { threshold: thresholdState.threshold })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{t("reason")}</div>
            <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
              {request.reasonAr && <div className="whitespace-pre-wrap">{request.reasonAr}</div>}
              {request.reasonEn && <div className="whitespace-pre-wrap">{request.reasonEn}</div>}
              {!request.reasonAr && !request.reasonEn && <div style={{ color: "var(--text-secondary)" }}>-</div>}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
              <Paperclip className="w-4 h-4" />
              <span className="text-sm font-semibold">{t("attachments")}</span>
            </div>
            {request.attachments.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("noAttachments")}</p>
            ) : (
              <div className="space-y-2">
                {request.attachments.map((attachment) => (
                  <button
                    key={attachment.id}
                    type="button"
                    onClick={() => openAttachmentPreview(attachment)}
                    className="w-full text-start text-sm p-3 rounded border transition-colors"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", backgroundColor: "var(--background)" }}
                    title={t("previewAttachment")}
                  >
                    <div className="font-medium truncate">{attachment.name}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      {formatFileSize(attachment.size)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--text-secondary)" }}>
              <Clock3 className="w-4 h-4" />
              <span className="text-sm font-semibold">{t("timeline")}</span>
            </div>
            <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
              <div>{t("status")}: {getStatusLabel(request.status)}</div>
              <div>{t("submittedAt")}: {formatAttendanceDateTime(request.createdAt, locale)}</div>
              <div>{t("updatedAt")}: {formatAttendanceDateTime(request.updatedAt, locale)}</div>
              {request.decidedBy && <div>{t("decidedBy")}: {request.decidedBy}</div>}
              {request.decidedAt && <div>{t("decidedAt")}: {formatAttendanceDateTime(request.decidedAt, locale)}</div>}
              {request.decisionNote && <div>{t("decisionNote")}: {request.decisionNote}</div>}
            </div>
          </section>
        </div>

        {request.status === "PENDING" && (
          <div className="p-4 border-t grid grid-cols-3 gap-2" style={{ borderColor: "var(--border-color)" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(request)}
              disabled={!canManage}
            >
              {t("edit")}
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />} onClick={() => onApprove(request)} disabled={!canReview}>{t("approve")}</Button>
            <Button variant="danger" size="sm" leftIcon={<Ban className="w-4 h-4" />} onClick={() => onReject(request)} disabled={!canReview}>{t("reject")}</Button>
          </div>
        )}
      </div>

      <FilePreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={closeAttachmentPreview}
      />
    </>
  );
}
