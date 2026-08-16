"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { DataTable } from "@/components/ui";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import CampaignComposer, {
  type CampaignComposerValues,
} from "@/features/settings/email/campaigns/components/CampaignComposer";
import DeliveryStatusBadge from "@/features/settings/email/deliveries/components/DeliveryStatusBadge";
import {
  createEmailCampaign,
  fetchEmailCampaigns,
  previewEmailCampaign,
  previewEmailCampaignRecipients,
} from "@/features/settings/email/campaigns/services/emailCampaignsService";
import { fetchAllSettingsRoles } from "@/features/settings/services/settingsRolesService";
import SettingsWorkflowErrorAlert from "@/features/settings/shared/components/SettingsWorkflowErrorAlert";
import {
  classifySettingsWorkflowError,
  type SettingsWorkflowError,
} from "@/features/settings/shared/utils/settingsWorkflowErrors";
import { usePermissions } from "@/hooks/usePermissions";
import type {
  EmailCampaignBatch,
  EmailCampaignPreviewRecipientsResponse,
  EmailCampaignPreviewResponse,
  FetchEmailCampaignsParams,
} from "@/features/settings/email/campaigns/types";
import type { EmailDeliveryStatus } from "@/features/settings/email/deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";
import {
  buildCampaignRecipientPreviewPayload,
  buildCreateCampaignPayload,
  buildPreviewCampaignPayload,
  campaignRecipientPreviewFingerprint,
} from "@/features/settings/email/campaigns/utils/campaignPayloads";

function formatDate(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function EmailCampaignsPage() {
  const t = useTranslations("settings.email.campaigns");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.email.campaigns.manage");
  const [campaigns, setCampaigns] = useState<EmailCampaignBatch[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [status, setStatus] = useState<EmailDeliveryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [recipientPreview, setRecipientPreview] =
    useState<EmailCampaignPreviewRecipientsResponse | null>(null);
  const [recipientPreviewFingerprint, setRecipientPreviewFingerprint] =
    useState<string | null>(null);
  const [renderedPreview, setRenderedPreview] =
    useState<EmailCampaignPreviewResponse | null>(null);
  const [createdBatch, setCreatedBatch] =
    useState<EmailCampaignBatch | null>(null);
  const [pageError, setPageError] = useState<SettingsWorkflowError | null>(null);
  const [rolesError, setRolesError] = useState<SettingsWorkflowError | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewingRecipients, setIsPreviewingRecipients] = useState(false);
  const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const activeRecipientPreviewFingerprint = useRef<string | null>(null);
  const recipientPreviewRequestId = useRef(0);
  const showErrorRef = useRef(showError);
  const tRef = useRef(t);

  useEffect(() => {
    showErrorRef.current = showError;
    tRef.current = t;
  }, [showError, t]);

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

  const fetchParams = useMemo<FetchEmailCampaignsParams>(
    () => ({ status, page, limit }),
    [limit, page, status],
  );

  const hydrateCampaigns = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);
      try {
        const campaignResult = await fetchEmailCampaigns(fetchParams);
        setCampaigns(campaignResult.items);
        setTotal(campaignResult.pagination.total);
        setPage(campaignResult.pagination.page);
        setLimit(campaignResult.pagination.limit);
      } catch (error) {
        setPageError(classifySettingsWorkflowError(error));
        showErrorRef.current(tRef.current("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchParams],
  );

  const hydrateRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      setRoles(await fetchAllSettingsRoles());
    } catch (error) {
      setRolesError(classifySettingsWorkflowError(error));
      showErrorRef.current(tRef.current("messages.roles_load_failed"));
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => hydrateCampaigns("refresh"));
  }, [hydrateCampaigns]);

  useEffect(() => {
    void Promise.resolve().then(hydrateRoles);
  }, [hydrateRoles]);

  useEffect(() => {
    void Promise.resolve().then(() => setPage(1));
  }, [status]);

  const invalidateRecipientPreview = () => {
    recipientPreviewRequestId.current += 1;
    activeRecipientPreviewFingerprint.current = null;
    setRecipientPreview(null);
    setRecipientPreviewFingerprint(null);
    setCreatedBatch(null);
    setIsPreviewingRecipients(false);
  };

  const handleStartNewCampaign = () => {
    invalidateRecipientPreview();
    setRenderedPreview(null);
  };

  const handlePreviewRecipients = async (values: CampaignComposerValues) => {
    const fingerprint = campaignRecipientPreviewFingerprint(values);
    const requestId = recipientPreviewRequestId.current + 1;
    recipientPreviewRequestId.current = requestId;
    activeRecipientPreviewFingerprint.current = fingerprint;
    setIsPreviewingRecipients(true);
    setPageError(null);
    setRecipientPreview(null);
    setRecipientPreviewFingerprint(null);
    setCreatedBatch(null);
    try {
      const result = await previewEmailCampaignRecipients(
        buildCampaignRecipientPreviewPayload(values),
      );
      if (
        recipientPreviewRequestId.current !== requestId ||
        activeRecipientPreviewFingerprint.current !== fingerprint
      ) {
        return null;
      }
      setRecipientPreview(result);
      setRecipientPreviewFingerprint(fingerprint);
      showSuccess(t("messages.preview_recipients_ready"));
      return result;
    } catch (error) {
      if (recipientPreviewRequestId.current === requestId) {
        setPageError(classifySettingsWorkflowError(error));
        showError(t("messages.preview_recipients_failed"));
      }
      return null;
    } finally {
      if (recipientPreviewRequestId.current === requestId) {
        setIsPreviewingRecipients(false);
      }
    }
  };

  const handlePreviewCampaign = async (values: CampaignComposerValues) => {
    setIsPreviewingCampaign(true);
    setPageError(null);
    try {
      const result = await previewEmailCampaign(
        buildPreviewCampaignPayload(values),
      );
      setRenderedPreview(result);
      showSuccess(t("messages.preview_ready"));
      return result;
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(t("messages.preview_failed"));
      return null;
    } finally {
      setIsPreviewingCampaign(false);
    }
  };

  const handleCreate = async (values: CampaignComposerValues) => {
    if (!canManage) {
      return null;
    }
    if (
      recipientPreviewFingerprint !==
      campaignRecipientPreviewFingerprint(values)
    ) {
      invalidateRecipientPreview();
      return null;
    }
    setIsCreating(true);
    setPageError(null);
    try {
      const result = await createEmailCampaign(
        buildCreateCampaignPayload(values),
      );
      setCreatedBatch(result);
      setRecipientPreview(null);
      setRecipientPreviewFingerprint(null);
      activeRecipientPreviewFingerprint.current = null;
      showSuccess(t("messages.created"));
      await hydrateCampaigns("refresh");
      return result;
    } catch (error) {
      setPageError(classifySettingsWorkflowError(error));
      showError(tCommon("save_failed"));
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "status",
        label: t("table.status"),
        render: (value: unknown) => {
          const batchStatus = value as EmailDeliveryStatus;
          return (
            <DeliveryStatusBadge
              status={batchStatus}
              label={statusLabels[batchStatus] || batchStatus}
            />
          );
        },
      },
      {
        key: "subject",
        label: t("table.subject"),
        searchable: true,
        render: (value: unknown, row: Record<string, unknown>) => {
          const batch = row as unknown as EmailCampaignBatch;
          return (
            <div className="min-w-56">
              <p className="font-medium text-gray-900">
                 {String(value || t("not_available"))}
              </p>
              <p className="mt-1 break-all text-xs text-gray-500">
                {batch.batchId}
              </p>
            </div>
          );
        },
      },
      { key: "totalRecipients", label: t("table.total") },
      { key: "sentCount", label: t("table.sent") },
      { key: "failedCount", label: t("table.failed") },
      { key: "skippedCount", label: t("table.skipped") },
      {
        key: "createdAt",
        label: t("table.created_at"),
        render: (value: unknown) =>
          formatDate(value as string | null | undefined, t("not_available")),
      },
      {
        key: "batchId",
        label: t("table.actions"),
        sortable: false,
        render: (value: unknown) => {
          const batchId = String(value);
          return (
            <Link href={`/${locale}/settings/email/campaigns/${batchId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-lg border border-gray-200 p-0"
                title={t("actions.view")}
                aria-label={t("actions.view")}
              >
                <Eye className="h-4 w-4 text-info" />
              </Button>
            </Link>
          );
        },
      },
    ],
    [locale, statusLabels, t],
  );

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.email.campaigns.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              loading={isRefreshing}
              onClick={() =>
                void Promise.all([
                  hydrateCampaigns("refresh"),
                  hydrateRoles(),
                ])
              }
            >
              {t("refresh")}
            </Button>
          }
        />

        {pageError ? (
          <div className="mb-4">
            <SettingsWorkflowErrorAlert error={pageError} />
          </div>
        ) : null}

        <CampaignComposer
          canManage={canManage}
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          rolesError={Boolean(rolesError)}
          recipientPreview={recipientPreview}
          recipientPreviewFingerprint={recipientPreviewFingerprint}
          renderedPreview={renderedPreview}
          createdBatch={createdBatch}
          isPreviewingRecipients={isPreviewingRecipients}
          isPreviewingCampaign={isPreviewingCampaign}
          isCreating={isCreating}
          onPreviewRecipients={handlePreviewRecipients}
          onPreviewCampaign={handlePreviewCampaign}
          onCreate={handleCreate}
          onRetryRoles={hydrateRoles}
          onRecipientPreviewInvalidated={invalidateRecipientPreview}
          onStartNewCampaign={handleStartNewCampaign}
        />

        <div className="mt-6">
          <SettingsSectionCard
            title={t("list.title")}
            description={t("list.description")}
            actions={
              <Select
                label={t("filters.status")}
                value={status}
                onChange={(value) =>
                  setStatus(value as EmailDeliveryStatus | "all")
                }
                options={[
                  { value: "all", label: t("filters.all") },
                  ...Object.entries(statusLabels).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
                fullWidth={false}
              />
            }
          >
            {campaigns.length > 0 || isRefreshing ? (
              <DataTable
                columns={columns}
                data={campaigns as unknown as Record<string, unknown>[]}
                isLoading={isRefreshing}
                showPagination
                itemsPerPage={limit}
                serverPagination={{
                  enabled: true,
                  currentPage: page,
                  pageSize: limit,
                  totalItems: total,
                  onPageChange: setPage,
                  onPageSizeChange: (nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  },
                }}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <p className="font-semibold text-gray-900">
                  {t("empty.title")}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {t("empty.description")}
                </p>
              </div>
            )}
          </SettingsSectionCard>
        </div>
      </main>
    </SettingsAccessGuard>
  );
}
