import { apiGet, apiPost } from "@/lib/api";
import type {
  EmailDeliveriesListResponseDto,
  EmailDeliveriesListResponse,
  EmailDeliveryBatch,
  EmailDeliveryBatchDto,
  EmailDeliveryRecipient,
  EmailDeliveryRecipientDto,
  EmailDeliveryRecipientsResponseDto,
  EmailDeliveryRecipientsResponse,
  EmailDeliveryStatus,
  FetchEmailDeliveriesParams,
} from "@/features/settings/email/deliveries/types";

const CANCELLABLE_BATCH_STATUSES = new Set<EmailDeliveryStatus>([
  "DRAFT",
  "QUEUED",
  "PROCESSING",
]);

function toDeliveriesQuery(params: FetchEmailDeliveriesParams): string {
  const query = new URLSearchParams();
  if (params.kind && params.kind !== "all") query.set("kind", params.kind);
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function mapDeliveryBatch(dto: EmailDeliveryBatchDto): EmailDeliveryBatch {
  return {
    batchId: dto.batchId,
    kind: dto.kind,
    status: dto.status,
    templateKey: dto.templateKey,
    subject: dto.subjectSnapshot ?? null,
    totalRecipients: dto.totalRecipients,
    queuedCount: dto.queuedCount,
    sentCount: dto.sentCount,
    failedCount: dto.failedCount,
    skippedCount: dto.skippedCount,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    cancelledAt: dto.cancelledAt,
    failureReason: dto.failureReason,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deliveryMode: dto.deliveryMode,
    cancellable: CANCELLABLE_BATCH_STATUSES.has(dto.status),
  };
}

export function mapDeliveryRecipient(
  dto: EmailDeliveryRecipientDto,
): EmailDeliveryRecipient {
  return {
    id: dto.id,
    userId: dto.userId,
    recipientEmail: dto.toEmail,
    fullName: dto.displayName,
    status: dto.status,
    attempts: dto.attempts,
    lastAttemptAt: dto.lastAttemptAt,
    sentAt: dto.sentAt,
    failureReason: dto.failureReason,
    skippedReason: dto.skippedReason,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function fetchEmailDeliveries(
  params: FetchEmailDeliveriesParams = {},
): Promise<EmailDeliveriesListResponse> {
  const response = await apiGet<EmailDeliveriesListResponseDto>(
    `/settings/email/deliveries${toDeliveriesQuery(params)}`,
  );
  return {
    items: response.items.map(mapDeliveryBatch),
    pagination: response.pagination,
  };
}

export async function fetchEmailDeliveryBatch(
  batchId: string,
): Promise<EmailDeliveryBatch> {
  const response = await apiGet<EmailDeliveryBatchDto>(
    `/settings/email/deliveries/${batchId}`,
  );
  return mapDeliveryBatch(response);
}

export async function fetchEmailDeliveryRecipients(
  batchId: string,
  params: Pick<FetchEmailDeliveriesParams, "page" | "limit"> = {},
): Promise<EmailDeliveryRecipientsResponse> {
  const response = await apiGet<EmailDeliveryRecipientsResponseDto>(
    `/settings/email/deliveries/${batchId}/recipients${toDeliveriesQuery(params)}`,
  );
  return {
    items: response.items.map(mapDeliveryRecipient),
    pagination: response.pagination,
  };
}

export async function cancelEmailDeliveryBatch(
  batchId: string,
): Promise<EmailDeliveryBatch> {
  const response = await apiPost<EmailDeliveryBatchDto>(
    `/settings/email/deliveries/${batchId}/cancel`,
    {},
  );
  return mapDeliveryBatch(response);
}
