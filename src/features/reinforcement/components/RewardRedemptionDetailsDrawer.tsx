"use client";

import { CheckCircle, Gift, RefreshCw, X, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import AuthenticatedFileImage from "@/components/ui/authenticated-file-image/AuthenticatedFileImage";
import Button from "@/components/ui/button/Button";
import type { RedemptionStatus, RewardRedemption } from "../types";

export type RewardRedemptionDrawerAction =
  | "approve"
  | "reject"
  | "fulfill"
  | "cancel";

interface RewardRedemptionDetailsDrawerProps {
  isOpen: boolean;
  redemption: RewardRedemption | null;
  loading: boolean;
  error: string | null;
  canRequest: boolean;
  canReview: boolean;
  canFulfill: boolean;
  canDownloadFiles: boolean;
  onClose: () => void;
  onRetry: () => void;
  onAction: (action: RewardRedemptionDrawerAction) => void;
}

const STATUS_STYLES: Record<RedemptionStatus, string> = {
  requested: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  fulfilled: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-700",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="break-words text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function humanizeCode(code: string) {
  return code
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RewardRedemptionDetailsDrawer({
  isOpen,
  redemption,
  loading,
  error,
  canRequest,
  canReview,
  canFulfill,
  canDownloadFiles,
  onClose,
  onRetry,
  onAction,
}: RewardRedemptionDetailsDrawerProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  if (!isOpen) return null;

  const missing = t("rewardsModule.redemptions.details.notAvailable");
  const localized = (ar?: string | null, en?: string | null) =>
    (locale === "ar" ? ar || en : en || ar) || missing;
  const formatDate = (date: string | null) =>
    date
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date))
      : missing;
  const enumLabel = (namespace: "status" | "source", code: string) => {
    try {
      return t(`rewardsModule.${namespace}.${code}`);
    } catch {
      return humanizeCode(code);
    }
  };
  const studentName = redemption
    ? localized(
        redemption.student.nameAr,
        `${redemption.student.firstName} ${redemption.student.lastName}`.trim(),
      )
    : missing;
  const canCancel = Boolean(
    redemption &&
      canRequest &&
      ["requested", "approved"].includes(redemption.status),
  );

  return (
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("rewardsModule.redemptions.details.title")}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`absolute inset-y-0 flex w-full max-w-2xl flex-col bg-white shadow-2xl ${locale === "ar" ? "left-0" : "right-0"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-primary">
              {t("rewardsModule.redemptions.details.title")}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {redemption ? localized(redemption.catalogItem.titleAr, redemption.catalogItem.titleEn) : "—"}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? <p className="text-sm text-gray-500">{t("common.loading")}</p> : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <Button className="mt-3" size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
                {t("common.retry")}
              </Button>
            </div>
          ) : null}

          {!loading && !error && redemption ? (
            <div className="space-y-5">
              <section className="flex gap-4 rounded-2xl border border-gray-200 p-4">
                <AuthenticatedFileImage
                  fileId={redemption.catalogItem.imageFileId}
                  alt={localized(redemption.catalogItem.titleAr, redemption.catalogItem.titleEn)}
                  canDownload={canDownloadFiles}
                  unavailableLabel={t("rewardsModule.catalog.form.imageUnavailable")}
                  retryLabel={t("rewardsModule.catalog.form.retryImage")}
                  className="h-20 w-20"
                />
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold text-gray-900">{studentName}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[redemption.status]}`}>
                    {enumLabel("status", redemption.status)}
                  </span>
                  <p className="text-sm text-gray-500">
                    {t("rewardsModule.redemptions.table.source")}: {enumLabel("source", redemption.requestSource)}
                  </p>
                </div>
              </section>

              <DetailsSection title={t("rewardsModule.redemptions.details.academicContext")}>
                <DetailRow label={t("rewardsModule.redemptions.details.academicYear")} value={localized(redemption.academicYear.nameAr, redemption.academicYear.nameEn)} />
                <DetailRow label={t("rewardsModule.redemptions.details.term")} value={localized(redemption.term.nameAr, redemption.term.nameEn)} />
                <DetailRow label={t("rewardsModule.redemptions.details.stageId")} value={redemption.enrollment.stageId || missing} />
                <DetailRow label={t("rewardsModule.redemptions.details.gradeId")} value={redemption.enrollment.gradeId || missing} />
                <DetailRow label={t("rewardsModule.redemptions.details.sectionId")} value={redemption.enrollment.sectionId || missing} />
                <DetailRow label={t("rewardsModule.redemptions.details.classroomId")} value={redemption.enrollment.classroomId || missing} />
              </DetailsSection>

              <DetailsSection title={t("rewardsModule.redemptions.details.eligibility")}>
                <DetailRow label={t("rewardsModule.redemptions.details.eligible")} value={redemption.eligibilitySnapshot.eligible ? t("common.yes") : t("common.no")} />
                <DetailRow label={t("rewardsModule.redemptions.details.minTotalXp")} value={String(redemption.eligibilitySnapshot.minTotalXp)} />
                <DetailRow label={t("rewardsModule.redemptions.details.totalEarnedXp")} value={String(redemption.eligibilitySnapshot.totalEarnedXp)} />
                <DetailRow
                  label={t("rewardsModule.redemptions.details.stockRemaining")}
                  value={
                    redemption.eligibilitySnapshot.isUnlimited
                      ? t("rewardsModule.catalog.stock.unlimited")
                      : redemption.eligibilitySnapshot.stockRemaining === null
                        ? missing
                        : String(redemption.eligibilitySnapshot.stockRemaining)
                  }
                />
              </DetailsSection>

              <DetailsSection title={t("rewardsModule.redemptions.details.notes")}>
                <DetailRow label={t("rewardsModule.redemptions.details.requestNote")} value={localized(redemption.requestNoteAr, redemption.requestNoteEn)} />
                <DetailRow label={t("rewardsModule.redemptions.details.reviewNote")} value={localized(redemption.reviewNoteAr, redemption.reviewNoteEn)} />
                <DetailRow label={t("rewardsModule.redemptions.details.fulfillmentNote")} value={localized(redemption.fulfillmentNoteAr, redemption.fulfillmentNoteEn)} />
                <DetailRow label={t("rewardsModule.redemptions.details.cancellationReason")} value={localized(redemption.cancellationReasonAr, redemption.cancellationReasonEn)} />
              </DetailsSection>

              <DetailsSection title={t("rewardsModule.redemptions.details.timeline")}>
                <DetailRow label={t("rewardsModule.redemptions.details.requested")} value={`${formatDate(redemption.requestedAt)} · ${redemption.requestedById}`} />
                <DetailRow label={t("rewardsModule.redemptions.details.reviewed")} value={`${formatDate(redemption.reviewedAt)} · ${redemption.reviewedById || missing}`} />
                <DetailRow label={t("rewardsModule.redemptions.details.fulfilled")} value={`${formatDate(redemption.fulfilledAt)} · ${redemption.fulfilledById || missing}`} />
                <DetailRow label={t("rewardsModule.redemptions.details.cancelled")} value={`${formatDate(redemption.cancelledAt)} · ${redemption.cancelledById || missing}`} />
                <DetailRow label={t("rewardsModule.redemptions.details.createdAt")} value={formatDate(redemption.createdAt)} />
                <DetailRow label={t("rewardsModule.redemptions.details.updatedAt")} value={formatDate(redemption.updatedAt)} />
              </DetailsSection>
            </div>
          ) : null}
        </div>

        {redemption && !loading && !error ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-6 py-4">
            {canReview && redemption.status === "requested" ? (
              <>
                <Button size="sm" variant="secondary" leftIcon={<CheckCircle className="h-4 w-4" />} onClick={() => onAction("approve")}>{t("rewardsModule.actions.approve")}</Button>
                <Button size="sm" variant="danger" leftIcon={<XCircle className="h-4 w-4" />} onClick={() => onAction("reject")}>{t("rewardsModule.actions.reject")}</Button>
              </>
            ) : null}
            {canFulfill && redemption.status === "approved" ? (
              <Button size="sm" variant="secondary" leftIcon={<Gift className="h-4 w-4" />} onClick={() => onAction("fulfill")}>{t("rewardsModule.actions.fulfill")}</Button>
            ) : null}
            {canCancel ? (
              <Button size="sm" variant="danger" leftIcon={<XCircle className="h-4 w-4" />} onClick={() => onAction("cancel")}>{t("rewardsModule.actions.cancel")}</Button>
            ) : null}
          </footer>
        ) : null}
      </aside>
    </div>
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
