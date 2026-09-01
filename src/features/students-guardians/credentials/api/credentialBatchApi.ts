import { apiGet, apiPost } from "@/lib/api";
import { downloadBackendAttachment } from "@/features/students-guardians/shared/utils/downloadBackendAttachment";
import type {
  CreateCredentialBatchInput,
  CredentialAudience,
  CredentialAudiencePreview,
  CredentialBatch,
} from "./credentialBatchDtos";

const CREDENTIAL_BATCHES_PATH = "/students-guardians/credential-batches";

export function previewCredentialAudience(
  audience: CredentialAudience,
): Promise<CredentialAudiencePreview> {
  return apiPost<CredentialAudiencePreview>(
    `${CREDENTIAL_BATCHES_PATH}/preview`,
    audience,
  );
}

export function createCredentialBatch({
  audience,
  credentialMode,
  sharedPassword,
}: CreateCredentialBatchInput): Promise<CredentialBatch> {
  return apiPost<CredentialBatch>(CREDENTIAL_BATCHES_PATH, {
    ...audience,
    credentialMode,
    ...(credentialMode === "shared_admin_provided" &&
    sharedPassword !== undefined
      ? { sharedPassword }
      : {}),
  });
}

export function getCredentialBatch(
  batchId: string,
  signal?: AbortSignal,
): Promise<CredentialBatch> {
  return apiGet<CredentialBatch>(
    `${CREDENTIAL_BATCHES_PATH}/${batchId}`,
    signal ? { signal } : undefined,
  );
}

export function downloadCredentialBatch(batchId: string): Promise<void> {
  return downloadBackendAttachment(
    `${CREDENTIAL_BATCHES_PATH}/${batchId}/export`,
    `student-credentials-${batchId}.csv`,
  );
}
