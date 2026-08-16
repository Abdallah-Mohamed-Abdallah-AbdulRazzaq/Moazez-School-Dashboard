"use client";

import { CheckCircle, Clock, Eye, RefreshCw, X, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import FilePreviewModal, { FilePreviewThumbnail } from "@/components/ui/file-preview-modal";
import type { ReinforcementReviewItem, ReinforcementReviewStatus } from "../types";

interface ReinforcementReviewDetailsDrawerProps {
  isOpen: boolean;
  review: ReinforcementReviewItem | null;
  loading: boolean;
  error: string | null;
  canManage: boolean;
  onClose: () => void;
  onRetry: () => void;
  onAction: (action: "approve" | "reject") => void;
}

const STATUS_STYLES: Record<ReinforcementReviewStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="break-words text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function ReinforcementReviewDetailsDrawer({
  isOpen,
  review,
  loading,
  error,
  canManage,
  onClose,
  onRetry,
  onAction,
}: ReinforcementReviewDetailsDrawerProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [proofFileId, setProofFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const missing = "—";
  const localized = (en?: string | null, ar?: string | null) =>
    (locale === "ar" ? ar || en : en || ar) || missing;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return missing;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(parsed)
      : missing;
  };

  const task = review?.task;
  const stage = review?.stage;
  const student = review?.student;
  const proof = review?.proof;

  const studentName = student
    ? localized(
        student.name || student.nameEn || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        student.nameAr
      )
    : missing;

  return (
    <>
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("reviews.detail.title") || "Review Details"}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`absolute inset-y-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl ${
          locale === "ar" ? "left-0" : "right-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-primary">
              {t("reviews.detail.title") || "Review Details"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {review ? localized(task?.titleEn, task?.titleAr) : "—"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close") || "Close"}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={onRetry}
              >
                {t("common.retry") || "Retry"}
              </Button>
            </div>
          ) : null}

          {!loading && !error && review ? (
            <div className="space-y-5">
              {/* Header card info */}
              <section className="flex flex-col gap-2 rounded-2xl border border-gray-200 p-4">
                <div className="min-w-0 space-y-2">
                  <p className="text-lg font-bold text-gray-900">{studentName}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[review.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t(`reviews.status.${review.status}`) || review.status}
                  </span>
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.source") || "Source"}: {task?.source || missing}
                  </p>
                </div>
              </section>

              {/* Task Details */}
              <DetailsSection title={t("reviews.detail.taskInfo") || "Task Information"}>
                <DetailRow
                  label={t("reviews.table.task") || "Task"}
                  value={localized(task?.titleEn, task?.titleAr)}
                />
                <DetailRow
                  label={t("reviews.detail.source") || "Source"}
                  value={task?.source || missing}
                />
                <DetailRow
                  label={t("reviews.detail.dueDate") || "Due Date"}
                  value={formatDate(task?.dueDate)}
                />
              </DetailsSection>

              {/* Stage Details */}
              <DetailsSection title={t("reviews.detail.stageInfo") || "Stage Information"}>
                <DetailRow
                  label={t("reviews.table.stage") || "Stage"}
                  value={localized(stage?.titleEn, stage?.titleAr)}
                />
                <DetailRow
                  label={t("reviews.detail.proofType") || "Proof Type"}
                  value={stage?.proofType || missing}
                />
                <DetailRow
                  label={t("reviews.detail.requiresApproval") || "Requires Approval"}
                  value={stage?.requiresApproval ? t("common.yes") || "Yes" : t("common.no") || "No"}
                />
              </DetailsSection>

              {/* Student Details */}
              <DetailsSection title={t("reviews.detail.studentInfo") || "Student Information"}>
                <DetailRow
                  label={t("reviews.table.student") || "Student"}
                  value={studentName}
                />
                <DetailRow
                  label={t("reviews.detail.studentCode") || "Student Code"}
                  value={student?.code || student?.admissionNo || missing}
                />
                <DetailRow
                  label={t("reviews.detail.submittedAt") || "Submitted At"}
                  value={formatDate(review.submittedAt)}
                />
              </DetailsSection>

              {/* Proof Details */}
              <DetailsSection title={t("reviews.detail.proof") || "Proof Submission"}>
                {proof?.proofText ? (
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                      {t("reviews.detail.proofText") || "Proof Text"}
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {proof.proofText}
                    </p>
                  </div>
                ) : null}
                {proof?.proofFileId ? (
                  <button
                    type="button"
                    onClick={() => setProofFileId(String(proof.proofFileId))}
                    className="group flex w-full items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-start transition-colors hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <FilePreviewThumbnail
                        alt={t("reviews.detail.proofFile") || "Proof File"}
                        fileId={String(proof.proofFileId)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">
                          {t("reviews.detail.proofFile") || "Proof File"}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-primary">
                          {t("reviews.detail.viewFile") || "View File"}
                        </span>
                      </span>
                    </span>
                    <Eye className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                  </button>
                ) : null}
                {!proof?.proofText && !proof?.proofFileId && (
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.noProof") || "No proof submitted"}
                  </p>
                )}
              </DetailsSection>

              {/* Review History */}
              <DetailsSection title={t("reviews.detail.history") || "Review History"}>
                {review.reviewHistory && review.reviewHistory.length > 0 ? (
                  <div className="space-y-4">
                    {review.reviewHistory.map((entry, index) => {
                      const entryStatus = entry.status || entry.outcome;
                      const isApproved = entryStatus === "approved";
                      const isRejected = entryStatus === "rejected";
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 border-s-2 border-gray-200 ps-4"
                        >
                          <div
                            className={`mt-0.5 rounded-full p-1 ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-600"
                                : isRejected
                                  ? "bg-red-100 text-red-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : isRejected ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {entryStatus ? t(`reviews.status.${entryStatus}`) || entryStatus : "-"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(entry.reviewedAt)}
                              </span>
                            </div>
                            {entry.note || entry.noteAr ? (
                              <p className="mt-1 text-sm text-gray-600">
                                {locale === "ar"
                                  ? entry.noteAr || entry.note || ""
                                  : entry.note || entry.noteAr || ""}
                              </p>
                            ) : null}
                            {entry.reviewerName ? (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {entry.reviewerName}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("reviews.detail.noHistory") || "No review history"}
                  </p>
                )}
              </DetailsSection>
            </div>
          ) : null}
        </div>

        {review && !loading && !error && review.status === "submitted" && canManage ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<CheckCircle className="h-4 w-4" />}
              onClick={() => onAction("approve")}
            >
              {t("reviews.actions.approve") || "Approve"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => onAction("reject")}
            >
              {t("reviews.actions.reject") || "Reject"}
            </Button>
          </footer>
        ) : null}
      </aside>
    </div>
      <FilePreviewModal
        attachment={proofFileId ? {
          id: proofFileId,
          name: t("reviews.detail.proofFile"),
          size: 0,
          type: "",
        } : null}
        isOpen={Boolean(proofFileId)}
        onClose={() => setProofFileId(null)}
      />
    </>
  );
}

function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">{title}</h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}
