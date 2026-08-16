"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import { fetchEmailCampaign } from "@/features/settings/email/campaigns/services/emailCampaignsService";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import type { EmailCampaignBatch } from "@/features/settings/email/campaigns/types";
import type { EmailDeliveryStatus } from "@/features/settings/email/deliveries/types";

interface EmailCampaignDetailPageProps {
  batchId: string;
}

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

export default function EmailCampaignDetailPage({
  batchId,
}: EmailCampaignDetailPageProps) {
  const t = useTranslations("settings.email.campaigns");
  const locale = useLocale();
  const { showError } = useToast();
  const [campaign, setCampaign] = useState<EmailCampaignBatch | null>(null);
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      try {
        const result = await fetchEmailCampaign(batchId);
        setCampaign(result);
      } catch (error) {
        setPageError(classifySettingsWorkflowError(error));
        showError(t("messages.detail_load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [batchId, showError, t],
  );

  useEffect(() => {
    void Promise.resolve().then(() => hydrate());
  }, [hydrate]);

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.campaigns.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={campaign?.subject || t("detail.title")}
          subtitle={batchId}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/settings/email/campaigns`}>
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
            </div>
          }
        />

        {pageError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageError} />
          </div>
        ) : null}

        {campaign ? (
          <SettingsSectionCard
            title={t("detail.summary")}
            description={t("detail.summary_description")}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{t("table.status")}</p>
                <div className="mt-2">
                  <DeliveryStatusBadge
                    status={campaign.status}
                    label={
                      statusLabels[campaign.status as EmailDeliveryStatus] ||
                      campaign.status
                    }
                  />
                </div>
              </div>
              <SummaryItem
                label={t("table.total")}
                value={campaign.totalRecipients}
              />
              <SummaryItem label={t("table.sent")} value={campaign.sentCount} />
              <SummaryItem
                label={t("table.failed")}
                value={campaign.failedCount}
              />
              <SummaryItem
                label={t("table.skipped")}
                value={campaign.skippedCount}
              />
              <SummaryItem
                label={t("table.created_at")}
                value={formatDate(campaign.createdAt, t("not_available"))}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryItem
                label={t("fields.subject")}
                value={campaign.subject || t("not_available")}
              />
              <SummaryItem
                label={t("detail.updated_at")}
                value={formatDate(campaign.updatedAt, t("not_available"))}
              />
              <SummaryItem
                label={t("detail.batch_id")}
                value={campaign.batchId}
              />
            </div>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("detail.security_note")}
            </p>
          </SettingsSectionCard>
        ) : (
          <SettingsSectionCard
            title={t("detail.not_found")}
            description={t("messages.detail_load_failed")}
          >
            <p className="text-sm text-gray-500">{batchId}</p>
          </SettingsSectionCard>
        )}
      </main>
    </SettingsAccessGuard>
  );
}
