"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import DeliveryRecipientTable from "@/features/settings/email/deliveries/components/DeliveryRecipientTable";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import {
  cancelEmailDeliveryBatch,
  fetchEmailDeliveryBatch,
  fetchEmailDeliveryRecipients,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  EmailDeliveryBatch,
  EmailDeliveryKind,
  EmailDeliveryRecipient,
  EmailDeliveryStatus,
} from "@/features/settings/email/deliveries/types";

interface EmailDeliveryDetailPageProps {
  batchId: string;
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function EmailDeliveryDetailPage({
  batchId,
}: EmailDeliveryDetailPageProps) {
  const t = useTranslations("settings.email.deliveries");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.email.deliveries.manage");
  const [batch, setBatch] = useState<EmailDeliveryBatch | null>(null);
  const [recipients, setRecipients] = useState<EmailDeliveryRecipient[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const kindLabels = useMemo(
    () => ({
      CREDENTIAL_DELIVERY: t("kinds.CREDENTIAL_DELIVERY"),
      GENERAL_CAMPAIGN: t("kinds.GENERAL_CAMPAIGN"),
    }),
    [t],
  );

  const statusLabels = useMemo(
    () => ({
      DRAFT: t("statuses.DRAFT"),
      QUEUED: t("statuses.QUEUED"),
      PROCESSING: t("statuses.PROCESSING"),
      SUCCEEDED: t("statuses.SUCCEEDED"),
      PARTIAL_FAILED: t("statuses.PARTIAL_FAILED"),
      FAILED: t("statuses.FAILED"),
      CANCELLED: t("statuses.CANCELLED"),
    }),
    [t],
  );

  const recipientStatusLabels = useMemo(
    () => ({
      PENDING: t("recipientStatuses.PENDING"),
      QUEUED: t("recipientStatuses.QUEUED"),
      SENDING: t("recipientStatuses.SENDING"),
      SENT: t("recipientStatuses.SENT"),
      FAILED: t("recipientStatuses.FAILED"),
      SKIPPED: t("recipientStatuses.SKIPPED"),
      CANCELLED: t("recipientStatuses.CANCELLED"),
    }),
    [t],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      try {
        const [batchResult, recipientsResult] = await Promise.all([
          fetchEmailDeliveryBatch(batchId),
          fetchEmailDeliveryRecipients(batchId, { page, limit }),
        ]);
        setBatch(batchResult);
        setRecipients(recipientsResult.items);
        setTotal(recipientsResult.pagination.total);
        setPage(recipientsResult.pagination.page);
        setLimit(recipientsResult.pagination.limit);
      } catch (error) {
        setPageError(classifySettingsWorkflowError(error));
        showError(t("messages.detail_load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [batchId, limit, page, showError, t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
  }, [hydrate]);

  const handleCancel = async () => {
    if (!canManage || !batch?.cancellable) {
      return;
    }
    setIsCancelling(true);
    setIsCancelConfirmOpen(false);
    try {
      await cancelEmailDeliveryBatch(batch.batchId);
      showSuccess(t("messages.cancelled"));
      await hydrate("refresh");
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(tCommon("save_failed"));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.deliveries.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={batch?.subject || t("detail.title")}
          subtitle={batchId}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/settings/email/deliveries`}>
                <Button
                  variant="secondary"
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  {t("actions.back")}
                </Button>
              </Link>
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isRefreshing}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
              {canManage && batch?.cancellable ? (
                <Button
                  variant="danger"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  loading={isCancelling}
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  {t("actions.cancel")}
                </Button>
              ) : null}
            </div>
          }
        />

        {pageError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageError} />
          </div>
        ) : null}

        {batch ? (
          <div className="mb-6">
            <SettingsSectionCard
              title={t("detail.summary")}
              description={t("detail.summary_description")}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <SummaryItem
                  label={t("table.kind")}
                  value={
                    kindLabels[batch.kind as EmailDeliveryKind] || batch.kind
                  }
                />
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t("table.status")}</p>
                  <div className="mt-2">
                    <DeliveryStatusBadge
                      status={batch.status}
                      label={statusLabels[batch.status as EmailDeliveryStatus]}
                    />
                  </div>
                </div>
                <SummaryItem
                  label={t("table.total")}
                  value={String(batch.totalRecipients)}
                />
                <SummaryItem
                  label={t("table.sent")}
                  value={String(batch.sentCount)}
                />
                <SummaryItem
                  label={t("table.failed")}
                  value={String(batch.failedCount)}
                />
                <SummaryItem
                  label={t("table.created_at")}
                  value={formatDate(batch.createdAt, t("not_available"))}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryItem
                  label={t("table.queued")}
                  value={String(batch.queuedCount)}
                />
                <SummaryItem
                  label={t("table.skipped")}
                  value={String(batch.skippedCount)}
                />
                <SummaryItem
                  label={t("detail.updated_at")}
                  value={formatDate(batch.updatedAt, t("not_available"))}
                />
                <SummaryItem
                  label={t("detail.started_at")}
                  value={formatDate(batch.startedAt, t("not_available"))}
                />
                <SummaryItem
                  label={t("detail.completed_at")}
                  value={formatDate(batch.completedAt, t("not_available"))}
                />
                <SummaryItem
                  label={t("detail.cancelled_at")}
                  value={formatDate(batch.cancelledAt, t("not_available"))}
                />
              </div>
              {batch.failureReason ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {batch.failureReason}
                </p>
              ) : null}
              <p className="mt-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                {t("detail.security_note")}
              </p>
            </SettingsSectionCard>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="font-semibold text-gray-900">
              {t("detail.not_found")}
            </p>
          </div>
        )}

        <SettingsSectionCard
          title={t("recipients.title")}
          description={t("recipients.description")}
        >
          {recipients.length > 0 ? (
            <DeliveryRecipientTable
              recipients={recipients}
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              labels={{
                recipient: t("recipients.recipient"),
                email: t("recipients.email"),
                status: t("recipients.status"),
                attempts: t("recipients.attempts"),
                lastAttemptAt: t("recipients.last_attempt_at"),
                failureReason: t("recipients.failure_reason"),
                skippedReason: t("recipients.skipped_reason"),
                sentAt: t("recipients.sent_at"),
                updatedAt: t("recipients.updated_at"),
                notAvailable: t("not_available"),
                statusLabels: recipientStatusLabels,
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-900">
                {t("recipients.empty_title")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t("recipients.empty_description")}
              </p>
            </div>
          )}
        </SettingsSectionCard>
        <ConfirmDialog
          isOpen={isCancelConfirmOpen}
          onClose={() => setIsCancelConfirmOpen(false)}
          onConfirm={() => void handleCancel()}
          title={t("confirm.cancel_title")}
          description={t("confirm.cancel_description")}
          confirmLabel={t("confirm.cancel_confirm")}
          cancelLabel={tCommon("cancel")}
          loading={isCancelling}
          severity="danger"
        />
      </main>
    </SettingsAccessGuard>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">{value}</p>
    </div>
  );
}
