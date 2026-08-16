"use client";

import { useTranslations, useLocale } from "next-intl";
import { Drawer } from "@mui/material";
import { Ban, X, Send, CheckCircle, XCircle, Pencil } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { BehaviorRecord, BehaviorStatus, BehaviorType } from "../../types";
import type { BehaviorTableAction } from "./BehaviorTable";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canSubmitBehaviorRecord,
  canEditBehaviorRecord,
} from "../utils/behaviorUiRules";

// ─── Status / Type badge helpers ───────────────────────────────────────────
const STATUS_STYLES: Record<BehaviorStatus, { bg: string; fg: string; border: string }> = {
  draft:     { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-800)", border: "var(--color-neutral-200)" },
  submitted: { bg: "#fef3c7", fg: "#78350f",                 border: "#fde68a" },
  approved:  { bg: "#dcfce7", fg: "#14532d",                 border: "#bbf7d0" },
  rejected:  { bg: "#fef2f2", fg: "#991b1b",                 border: "#fecaca" },
  cancelled: { bg: "var(--color-neutral-100)", fg: "var(--color-neutral-500)", border: "var(--color-neutral-200)" },
};
const TYPE_STYLES: Record<BehaviorType, { bg: string; fg: string; border: string }> = {
  positive: { bg: "#dcfce7", fg: "#14532d", border: "#bbf7d0" },
  negative:  { bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
};

function Chip({
  label,
  style,
}: {
  label: string;
  style: { bg: string; fg: string; border: string };
}) {
  return (
    <span
      className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border"
      style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
    >
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="text-sm" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
interface BehaviorDetailDrawerProps {
  record: BehaviorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: BehaviorTableAction, record: BehaviorRecord) => void;
  isReadOnly?: boolean;
  canCreate?: boolean;
  canManage?: boolean;
  canReview?: boolean;
}

export default function BehaviorDetailDrawer({
  record,
  isOpen,
  onClose,
  onAction,
  isReadOnly,
  canCreate = false,
  canManage = false,
  canReview = false,
}: BehaviorDetailDrawerProps) {
  const t = useTranslations("behavior");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(isRTL ? "ar-SA" : "en-SA") : "—";

  return (
    <Drawer
      anchor={isRTL ? "left" : "right"}
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 440 }, p: 0 },
      }}
    >
      {record && (
        <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {t("drawer.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              aria-label={isRTL ? "إغلاق" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-6">
              {record.type && (
                <Chip
                  label={t(`type.${record.type}`)}
                  style={TYPE_STYLES[record.type]}
                />
              )}
              <Chip
                label={t(`status.${record.status}`)}
                style={STATUS_STYLES[record.status]}
              />
              {record.points !== undefined && (
                <span
                  className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full border"
                  style={{
                    backgroundColor: record.points >= 0 ? "#dcfce7" : "#fef2f2",
                    color: record.points >= 0 ? "#14532d" : "#991b1b",
                    borderColor: record.points >= 0 ? "#bbf7d0" : "#fecaca",
                  }}
                >
                  {record.points > 0 ? `+${record.points}` : record.points} pts
                </span>
              )}
            </div>

            {/* Details */}
            <dl className="space-y-6">
              {/* Group 1: Behavior Log Details */}
              <div className="space-y-4">
                <DetailRow
                  label={t("record.title")}
                  value={isRTL ? record.titleAr : record.titleEn}
                />
                <DetailRow label={t("table.occurredAt")} value={fmt(record.occurredAt)} />
                <DetailRow label={t("table.category")} value={(isRTL ? record.category?.nameAr : record.category?.nameEn) || record.categoryName || record.categoryId} />
                <DetailRow
                  label={t("record.note")}
                  value={isRTL ? record.noteAr : record.noteEn}
                />
              </div>

              <hr style={{ borderColor: "var(--border-color)" }} />

              {/* Group 2: Student & Academic Info */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  {isRTL ? "معلومات الطالب والدراسة" : "Student & Academic Info"}
                </h4>
                <div className="space-y-3">
                  <DetailRow label={t("table.student")} value={record.student?.displayName || record.studentId} />
                  <DetailRow 
                    label={isRTL ? "الصف" : "Grade"} 
                    value={isRTL ? record.enrollment?.classroom?.section?.grade?.nameAr : record.enrollment?.classroom?.section?.grade?.nameEn} 
                  />
                  <DetailRow 
                    label={isRTL ? "الشعبة" : "Section"} 
                    value={isRTL ? record.enrollment?.classroom?.section?.nameAr : record.enrollment?.classroom?.section?.nameEn} 
                  />
                  <DetailRow 
                    label={isRTL ? "الفصل" : "Classroom"} 
                    value={isRTL ? record.enrollment?.classroom?.nameAr : record.enrollment?.classroom?.nameEn} 
                  />
                  <DetailRow 
                    label={isRTL ? "العام الدراسي" : "Academic Year"} 
                    value={(isRTL ? record.academicYear?.nameAr : record.academicYear?.nameEn) || record.academicYearId} 
                  />
                  <DetailRow 
                    label={isRTL ? "الفصل الدراسي" : "Term"} 
                    value={(isRTL ? record.term?.nameAr : record.term?.nameEn) || record.termId} 
                  />
                </div>
              </div>

              <hr style={{ borderColor: "var(--border-color)" }} />

              {/* Group 3: History & Audit Information */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  {isRTL ? "سجل الأحداث والتدقيق" : "History & Audit Information"}
                </h4>
                <div className="space-y-3">
                  <DetailRow 
                    label={isRTL ? "أنشئ بواسطة" : "Created By"} 
                    value={record.createdBy?.displayName || record.createdById} 
                  />
                  {record.submittedBy && (
                    <DetailRow 
                      label={isRTL ? "قدم بواسطة" : "Submitted By"} 
                      value={
                        <div className="flex flex-col">
                          <span>{record.submittedBy.displayName}</span>
                          {record.submittedAt && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {fmt(record.submittedAt)}
                            </span>
                          )}
                        </div>
                      } 
                    />
                  )}
                  {record.reviewedBy && (
                    <DetailRow 
                      label={isRTL ? "تمت المراجعة بواسطة" : "Reviewed By"} 
                      value={
                        <div className="flex flex-col">
                          <span>{record.reviewedBy.displayName}</span>
                          {record.reviewedAt && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {fmt(record.reviewedAt)}
                            </span>
                          )}
                        </div>
                      } 
                    />
                  )}
                  {((isRTL ? record.reviewNoteAr : record.reviewNoteEn) || record.reviewNoteEn) && (
                    <DetailRow 
                      label={t("modal.reviewerNote")} 
                      value={(isRTL ? record.reviewNoteAr : record.reviewNoteEn) || record.reviewNoteEn} 
                    />
                  )}
                  {record.cancelledBy && (
                    <DetailRow 
                      label={isRTL ? "ألغي بواسطة" : "Cancelled By"} 
                      value={
                        <div className="flex flex-col">
                          <span>{record.cancelledBy.displayName}</span>
                          {record.cancelledAt && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {fmt(record.cancelledAt)}
                            </span>
                          )}
                        </div>
                      } 
                    />
                  )}
                  {((isRTL ? record.cancellationReasonAr : record.cancellationReasonEn) || record.cancellationReasonEn) && (
                    <DetailRow 
                      label={t("modal.cancelReason") || (isRTL ? "سبب الإلغاء" : "Cancellation Reason")} 
                      value={(isRTL ? record.cancellationReasonAr : record.cancellationReasonEn) || record.cancellationReasonEn} 
                    />
                  )}
                </div>
              </div>
            </dl>
          </div>

          {/* Footer actions */}
          {!isReadOnly && (canCreate || canManage || canReview) && (
            <div
              className="flex items-center gap-2 px-6 py-4 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              {canManage && canEditBehaviorRecord(record) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Pencil className="w-4 h-4" />}
                  onClick={() => onAction?.("edit", record)}
                >
                  {t("actions.edit")}
                </Button>
              )}
              {canCreate && canSubmitBehaviorRecord(record) && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => onAction?.("submit", record)}
                >
                  {t("actions.submit")}
                </Button>
              )}
              {canManage && canCancelBehaviorRecord(record) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Ban className="w-4 h-4" />}
                  onClick={() => onAction?.("cancel", record)}
                >
                  {t("actions.cancel")}
                </Button>
              )}
              {canReview && canApproveOrRejectBehaviorRecord(record) && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => onAction?.("approve", record)}
                  >
                    {t("actions.approve")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => onAction?.("reject", record)}
                  >
                    {t("actions.reject")}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
