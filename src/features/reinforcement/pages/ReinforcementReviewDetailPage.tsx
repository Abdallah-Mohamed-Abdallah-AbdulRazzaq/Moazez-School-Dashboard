"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import FilePreviewModal, { FilePreviewThumbnail } from "@/components/ui/file-preview-modal";
import ReinforcementReviewActionModal from "../components/ReinforcementReviewActionModal";
import {
  approveReinforcementSubmission,
  getReinforcementReviewItem,
  rejectReinforcementSubmission,
} from "../services/reinforcementReviewsService";
import { grantXpForReinforcementReview } from "../services/reinforcementXpService";
import type {
  GrantXpForReviewPayload,
  ReinforcementReviewItem,
  ReinforcementReviewStatus,
  ReviewReinforcementSubmissionPayload,
} from "../types";

interface ReinforcementReviewDetailPageProps {
  submissionId: string;
}

const STATUS_BADGE_STYLES: Record<ReinforcementReviewStatus, string> = {
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

function AccessNotice() {
  const t = useTranslations("reinforcement.common");
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReinforcementReviewDetailPage({
  submissionId,
}: ReinforcementReviewDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { showSuccess, showError } = useToast();
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const [review, setReview] = useState<ReinforcementReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionLoading, setActionLoading] = useState(false);

  // XP grant state
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState("");
  const [xpGranting, setXpGranting] = useState(false);
  const [proofFileId, setProofFileId] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.reviews.view");
  const canManage = hasPermission("reinforcement.reviews.manage");

  const fetchReview = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const item = await getReinforcementReviewItem(submissionId);
      setReview(item);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [canView, submissionId, showError, t]);

  useEffect(() => {
    void Promise.resolve().then(fetchReview);
  }, [fetchReview]);

  const handleOpenAction = (type: "approve" | "reject") => {
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (payload: ReviewReinforcementSubmissionPayload) => {
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        const updated = await approveReinforcementSubmission(submissionId, payload);
        setReview(updated);
        showSuccess(t("reviews.messages.approved"));
        setActionModalOpen(false);
        // Show XP grant prompt after successful approval
        setXpModalOpen(true);
      } else {
        const updated = await rejectReinforcementSubmission(submissionId, payload);
        setReview(updated);
        showSuccess(t("reviews.messages.rejected"));
        setActionModalOpen(false);
      }
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("reviews.messages.error");
      showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleXpGrant = async () => {
    const parsedAmount = Number(xpAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showError(t("validation.xpAmountRequired"));
      return;
    }
    setXpGranting(true);
    try {
      const payload: GrantXpForReviewPayload = { amount: parsedAmount };
      await grantXpForReinforcementReview(submissionId, payload);
      showSuccess(t("reviews.detail.xpGranted"));
      setXpModalOpen(false);
      setXpAmount("");
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : t("common.error");
      showError(message);
    } finally {
      setXpGranting(false);
    }
  };

  const handleXpSkip = () => {
    setXpModalOpen(false);
    setXpAmount("");
  };

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  const localizedField = (obj: Record<string, unknown> | undefined, enKey: string, arKey: string): string => {
    if (!obj) return "-";
    return locale === "ar"
      ? (obj[arKey] as string) || (obj[enKey] as string) || "-"
      : (obj[enKey] as string) || (obj[arKey] as string) || "-";
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  return (
    <div
      className="min-h-screen space-y-6 bg-gray-50"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Back navigation */}
      <Link
        href={`/${locale}/reinforcement/reviews`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("reviews.title")}
      </Link>

      {/* Page header with status badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            {t("reviews.detail.title")}
          </h1>
          {review && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                STATUS_BADGE_STYLES[review.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {t(`reviews.status.${review.status}`)}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          loading={loading}
          onClick={fetchReview}
        >
          {t("actions.refresh")}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !review && <MainLoader />}

      {/* Content */}
      {review && (
        <>
          {/* Task information */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("reviews.detail.taskInfo")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.table.task")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {localizedField(review.task, "titleEn", "titleAr")}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.source")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {(review.task?.source as string) || "-"}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.dueDate")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(review.task?.dueDate as string | undefined)}
                </div>
              </div>
            </div>
          </section>

          {/* Stage information */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("reviews.detail.stageInfo")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.table.stage")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {localizedField(review.stage, "titleEn", "titleAr")}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.proofType")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {(review.stage?.proofType as string) || "-"}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.requiresApproval")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {review.stage?.requiresApproval ? t("common.yes") : t("common.no")}
                </div>
              </div>
            </div>
          </section>

          {/* Student information */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("reviews.detail.studentInfo")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.table.student")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {localizedField(review.student, "name", "nameAr")}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.studentCode")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {(review.student?.code as string) || (review.student?.admissionNo as string) || "-"}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-3">
                <div className="text-xs font-medium uppercase text-gray-500">
                  {t("reviews.detail.submittedAt")}
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(review.submittedAt)}
                </div>
              </div>
            </div>
          </section>

          {/* Proof section */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("reviews.detail.proof")}
            </h2>
            <div className="mt-4 space-y-3">
              {review.proof?.proofText ? (
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                    {t("reviews.detail.proofText")}
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {review.proof.proofText as string}
                  </p>
                </div>
              ) : null}
              {review.proof?.proofFileId ? (
                <button
                  type="button"
                  onClick={() => setProofFileId(String(review.proof.proofFileId))}
                  className="group flex w-full items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-start transition-colors hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FilePreviewThumbnail
                      alt={t("reviews.detail.proofFile")}
                      fileId={String(review.proof.proofFileId)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">
                        {t("reviews.detail.proofFile")}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-primary">
                        {t("reviews.detail.viewFile")}
                      </span>
                    </span>
                  </span>
                  <Eye className="h-5 w-5 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                </button>
              ) : null}
              {!review.proof?.proofText && !review.proof?.proofFileId && (
                <p className="text-sm text-gray-500">{t("reviews.detail.noProof")}</p>
              )}
            </div>
          </section>

          {/* Review history timeline */}
          <section className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {t("reviews.detail.history")}
            </h2>
            <div className="mt-4">
              {review.reviewHistory && review.reviewHistory.length > 0 ? (
                <div className="space-y-4">
                  {review.reviewHistory.map((entry, index) => {
                    const entryStatus = entry.status as string;
                    const isApproved = entryStatus === "approved";
                    const isRejected = entryStatus === "rejected";
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 border-l-2 border-gray-200 pl-4"
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
                              {entryStatus
                                ? t(`reviews.status.${entryStatus}`)
                                : "-"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(entry.reviewedAt as string | undefined)}
                            </span>
                          </div>
                          {(entry.note || entry.noteAr) ? (
                            <p className="mt-1 text-sm text-gray-600">
                              {locale === "ar"
                                ? String(entry.noteAr || entry.note || "")
                                : String(entry.note || entry.noteAr || "")}
                            </p>
                          ) : null}
                          {entry.reviewerName ? (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {String(entry.reviewerName)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("reviews.detail.noHistory")}
                </p>
              )}
            </div>
          </section>

          {/* Action bar */}
          {canManage && review.status === "submitted" && (
            <section className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                  onClick={() => handleOpenAction("approve")}
                >
                  {t("reviews.actions.approve")}
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => handleOpenAction("reject")}
                >
                  {t("reviews.actions.reject")}
                </Button>
              </div>
            </section>
          )}
        </>
      )}

      {/* Review action modal */}
      <ReinforcementReviewActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSubmit={handleActionSubmit}
        actionType={actionType}
        loading={actionLoading}
      />

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

      {/* XP grant modal (shown after successful approval) */}
      <Modal
        isOpen={xpModalOpen}
        onClose={handleXpSkip}
        title={t("reviews.detail.grantXp")}
        description={t("reviews.detail.grantXpDescription")}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleXpSkip}>
              {t("actions.skip")}
            </Button>
            <Button loading={xpGranting} onClick={handleXpGrant}>
              {t("actions.grantXp")}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2" dir={locale === "ar" ? "rtl" : "ltr"}>
          <Input
            type="number"
            label={t("xp.amount")}
            placeholder="10"
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            min={1}
          />
        </div>
      </Modal>
    </div>
  );
}
