import { apiPost } from "@/lib/api";
import type {
  CreateCredentialDeliveryRequest,
  CredentialDeliveryPreviewRequest,
  CredentialDeliveryPreviewResponse,
  CredentialDeliveryPreviewResponseDto,
} from "@/features/settings/email/credential-deliveries/types";
import { mapRecipientPreview } from "@/features/settings/email/shared/recipientPreview";
import { mapDeliveryBatch } from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import type {
  EmailDeliveryBatch,
  EmailDeliveryBatchDto,
} from "@/features/settings/email/deliveries/types";

export function mapCredentialDeliveryPreviewResponse(
  response: CredentialDeliveryPreviewResponseDto,
): CredentialDeliveryPreviewResponse {
  const preview = mapRecipientPreview(response);
  return {
    totalMatched: preview.totalMatched,
    eligibleCount: preview.eligibleCount,
    skippedCount: preview.skippedCount,
    skippedReasons: preview.skippedReasons,
    eligibleSample: preview.recipients.filter((recipient) => recipient.eligible),
    skippedSample: preview.recipients.filter((recipient) => !recipient.eligible),
  };
}

export async function previewCredentialDeliveryRecipients(
  payload: CredentialDeliveryPreviewRequest,
): Promise<CredentialDeliveryPreviewResponse> {
  const response = await apiPost<CredentialDeliveryPreviewResponseDto>(
    "/settings/email/credential-deliveries/preview-recipients",
    payload,
  );
  return mapCredentialDeliveryPreviewResponse(response);
}

export async function createCredentialDelivery(
  payload: CreateCredentialDeliveryRequest,
): Promise<EmailDeliveryBatch> {
  const response = await apiPost<EmailDeliveryBatchDto>(
    "/settings/email/credential-deliveries",
    payload,
  );
  return mapDeliveryBatch(response);
}
