import { apiGet, apiPost } from "@/lib/api";
import type {
  CreateEmailCampaignRequest,
  EmailCampaignBatch,
  EmailCampaignPreviewRecipientsRequest,
  EmailCampaignPreviewRecipientsResponse,
  EmailCampaignPreviewRecipientsResponseDto,
  EmailCampaignPreviewRequest,
  EmailCampaignPreviewResponse,
  EmailCampaignPreviewResponseDto,
  EmailCampaignsListResponse,
  FetchEmailCampaignsParams,
} from "@/features/settings/email/campaigns/types";
import {
  mapDeliveryBatch,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import type {
  EmailDeliveriesListResponseDto,
  EmailDeliveryBatchDto,
} from "@/features/settings/email/deliveries/types";
import { mapRecipientPreview } from "@/features/settings/email/shared/recipientPreview";

function toCampaignsQuery(params: FetchEmailCampaignsParams): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function mapEmailCampaignRecipientsPreview(
  response: EmailCampaignPreviewRecipientsResponseDto,
): EmailCampaignPreviewRecipientsResponse {
  const preview = mapRecipientPreview(response);
  return {
    totalMatched: preview.totalMatched,
    eligibleCount: preview.eligibleCount,
    skippedCount: preview.skippedCount,
    skippedReasons: preview.skippedReasons,
    recipients: preview.recipients,
  };
}

export async function previewEmailCampaignRecipients(
  payload: EmailCampaignPreviewRecipientsRequest,
): Promise<EmailCampaignPreviewRecipientsResponse> {
  const response = await apiPost<EmailCampaignPreviewRecipientsResponseDto>(
    "/settings/email/campaigns/preview-recipients",
    payload,
  );
  return mapEmailCampaignRecipientsPreview(response);
}

export async function previewEmailCampaign(
  payload: EmailCampaignPreviewRequest,
): Promise<EmailCampaignPreviewResponse> {
  const response = await apiPost<EmailCampaignPreviewResponseDto>(
    "/settings/email/campaigns/preview",
    payload,
  );
  return mapEmailCampaignPreview(response);
}

export function mapEmailCampaignPreview(
  response: EmailCampaignPreviewResponseDto,
): EmailCampaignPreviewResponse {
  return {
    ...response,
    missingVariables: [...response.missingVariables],
    unknownVariables: [...response.unknownVariables],
  };
}

export async function createEmailCampaign(
  payload: CreateEmailCampaignRequest,
): Promise<EmailCampaignBatch> {
  const response = await apiPost<EmailDeliveryBatchDto>(
    "/settings/email/campaigns",
    payload,
  );
  return mapEmailCampaignBatch(response);
}

export async function fetchEmailCampaigns(
  params: FetchEmailCampaignsParams = {},
): Promise<EmailCampaignsListResponse> {
  const response = await apiGet<EmailDeliveriesListResponseDto>(
    `/settings/email/campaigns${toCampaignsQuery(params)}`,
  );
  return {
    items: response.items.map(mapEmailCampaignBatch),
    pagination: response.pagination,
  };
}

export async function fetchEmailCampaign(
  batchId: string,
): Promise<EmailCampaignBatch> {
  const response = await apiGet<EmailDeliveryBatchDto>(
    `/settings/email/campaigns/${batchId}`,
  );
  return mapEmailCampaignBatch(response);
}

function mapEmailCampaignBatch(
  response: EmailDeliveryBatchDto,
): EmailCampaignBatch {
  return {
    ...mapDeliveryBatch(response),
    kind: "GENERAL_CAMPAIGN",
  };
}
