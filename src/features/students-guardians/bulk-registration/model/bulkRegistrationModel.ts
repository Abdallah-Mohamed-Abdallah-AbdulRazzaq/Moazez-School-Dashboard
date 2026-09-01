import type {
  BulkRegistrationBatchDetail,
  BulkRegistrationBatchStatus,
  BulkRegistrationCounters,
  BulkRegistrationRowStatus,
} from "../api/bulkRegistrationDtos";

export interface BulkRegistrationBatchState {
  status: BulkRegistrationBatchStatus;
  terminal: boolean;
  pausesPolling: boolean;
  defaultRowStatus: BulkRegistrationRowStatus | undefined;
  counters: BulkRegistrationCounters;
  timestamps: {
    createdAt: string;
    updatedAt: string;
    validatedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
  };
  validationErrorCodes: string[];
}

export const BULK_REGISTRATION_BATCH_STATUSES = [
  "UPLOADED",
  "VALIDATING",
  "VALIDATION_FAILED",
  "READY",
  "EXECUTING",
  "EXECUTION_PARTIAL_FAILED",
  "FAILED",
  "COMPLETED",
] as const satisfies readonly BulkRegistrationBatchStatus[];

export const BULK_REGISTRATION_ROW_STATUSES = [
  "PENDING",
  "VALID",
  "INVALID",
  "PROCESSING",
  "CREATED",
  "FAILED",
] as const satisfies readonly BulkRegistrationRowStatus[];

export const BULK_REGISTRATION_TERMINAL_STATUSES: ReadonlySet<
  BulkRegistrationBatchStatus
> = new Set([
  "VALIDATION_FAILED",
  "EXECUTION_PARTIAL_FAILED",
  "FAILED",
  "COMPLETED",
]);

const KNOWN_BULK_REGISTRATION_ERROR_CODES = new Set([
  "students.bulk_registration.csv_malformed",
  "students.bulk_registration.header_invalid",
  "students.bulk_registration.no_data_rows",
  "students.bulk_registration.field_invalid",
  "students.bulk_registration.duplicate_username",
  "students.bulk_registration.duplicate_row",
  "students.bulk_registration.confirm_conflict",
  "students.bulk_registration.execution_invariant_invalid",
  "students.bulk_registration.execution_metadata_invalid",
  "students.bulk_registration.execution_tenant_ineligible",
  "students.bulk_registration.row_data_invalid",
  "students.bulk_registration.execution_placement_invalid",
  "iam.user.login_email_taken",
  "iam.user.username_invalid",
  "settings.login_identity.not_configured",
]);

export function isBulkRegistrationBatchStatus(
  status: string,
): status is BulkRegistrationBatchStatus {
  return BULK_REGISTRATION_BATCH_STATUSES.includes(
    status as BulkRegistrationBatchStatus,
  );
}

export function isBulkRegistrationRowStatus(
  status: string,
): status is BulkRegistrationRowStatus {
  return BULK_REGISTRATION_ROW_STATUSES.includes(
    status as BulkRegistrationRowStatus,
  );
}

export function isBulkRegistrationTerminalStatus(
  status: BulkRegistrationBatchStatus,
): boolean {
  return BULK_REGISTRATION_TERMINAL_STATUSES.has(status);
}

export function shouldPauseBulkRegistrationPolling(
  status: BulkRegistrationBatchStatus,
): boolean {
  return status === "READY";
}

export function getBulkRegistrationDefaultRowStatus(
  status: BulkRegistrationBatchStatus,
): BulkRegistrationRowStatus | undefined {
  if (status === "VALIDATION_FAILED") return "INVALID";
  if (status === "EXECUTION_PARTIAL_FAILED") return "FAILED";
  return undefined;
}

export function getBulkRegistrationErrorCode(
  errorCode: string | undefined,
): string {
  return errorCode && KNOWN_BULK_REGISTRATION_ERROR_CODES.has(errorCode)
    ? errorCode
    : "unknown";
}

export function getBulkRegistrationBatchState(
  batch: BulkRegistrationBatchDetail,
): BulkRegistrationBatchState {
  return {
    status: batch.status,
    terminal: isBulkRegistrationTerminalStatus(batch.status),
    pausesPolling: shouldPauseBulkRegistrationPolling(batch.status),
    defaultRowStatus: getBulkRegistrationDefaultRowStatus(batch.status),
    counters: batch.counters,
    timestamps: {
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      validatedAt: batch.validatedAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
    },
    validationErrorCodes: batch.validationErrors.map(getBulkRegistrationErrorCode),
  };
}
