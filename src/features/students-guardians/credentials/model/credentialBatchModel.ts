import type {
  CredentialBatch,
  CredentialBatchCounters,
  CredentialBatchStatus,
} from "../api/credentialBatchDtos";

export const CREDENTIAL_BATCH_STATUSES = [
  "pending",
  "processing",
  "completed",
  "partial_failed",
  "failed",
] as const satisfies readonly CredentialBatchStatus[];

const TERMINAL_STATUSES: ReadonlySet<CredentialBatchStatus> = new Set([
  "completed",
  "partial_failed",
  "failed",
]);

const PASSWORD_REASON_CODES = new Set([
  "password_required",
  "password_too_short",
  "password_missing_uppercase",
  "password_missing_lowercase",
  "password_missing_number",
  "password_missing_symbol",
  "password_common",
]);

const EXPORT_ERROR_CODES = new Set([
  "students.credentials.export_not_ready",
  "students.credentials.export_empty",
  "students.credentials.export_too_large",
  "students.credentials.secret_artifact_unavailable",
  "students.credentials.secret_artifact_expired",
  "students.credentials.secret_artifact_invalid",
]);

const PLACEMENT_PROVENANCE_ERROR =
  "students.credentials.execution_invariant_invalid.export_placement_provenance_invalid";

export interface CredentialBatchState {
  status: CredentialBatchStatus;
  terminal: boolean;
  exportEligible: boolean;
  counters: CredentialBatchCounters;
  timestamps: {
    createdAt: string;
    updatedAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
}

export function isCredentialBatchStatus(
  status: string,
): status is CredentialBatchStatus {
  return CREDENTIAL_BATCH_STATUSES.includes(status as CredentialBatchStatus);
}

export function isCredentialBatchTerminal(
  status: CredentialBatchStatus,
): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function getCredentialBatchState(
  batch: CredentialBatch,
): CredentialBatchState {
  return {
    status: batch.status,
    terminal: isCredentialBatchTerminal(batch.status),
    exportEligible:
      (batch.status === "completed" || batch.status === "partial_failed") &&
      batch.counters.generatedRows > 0,
    counters: batch.counters,
    timestamps: {
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
    },
  };
}

export function getCredentialPasswordReasonCode(
  reasonCode: string | undefined,
): string {
  return reasonCode && PASSWORD_REASON_CODES.has(reasonCode)
    ? reasonCode
    : "unknown";
}

export function getCredentialExportErrorCode(
  code: string | undefined,
  reasonCode?: string,
): string {
  if (code && EXPORT_ERROR_CODES.has(code)) return code;
  if (
    code === "students.credentials.execution_invariant_invalid" &&
    reasonCode === "export_placement_provenance_invalid"
  ) {
    return PLACEMENT_PROVENANCE_ERROR;
  }
  return "unknown";
}
