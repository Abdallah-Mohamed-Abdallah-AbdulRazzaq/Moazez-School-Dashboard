import { isApiError } from "@/lib/api-error";

export type SettingsWorkflowErrorKind =
  | "teacher-directory"
  | "email-connection"
  | "email-connection-unverified"
  | "email-connection-test"
  | "email-template"
  | "email-content-invalid"
  | "login-identity"
  | "no-recipients"
  | "recipient-invalid"
  | "recipient-limit"
  | "delivery-not-found"
  | "delivery-not-cancelable"
  | "campaign-invalid"
  | "credential-variables"
  | "credential-mode"
  | "credential-state"
  | "user-state"
  | "validation"
  | "not-found"
  | "conflict"
  | "permission"
  | "retryable"
  | "generic";

type SettingsEmailBatchStatus =
  | "DRAFT"
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export interface SettingsWorkflowError {
  kind: SettingsWorkflowErrorKind;
  code?: string;
  traceId?: string;
  invalidFields?: string[];
  reasonCode?: string;
  recipientCount?: number;
  recipientLimit?: number;
  batchStatus?: SettingsEmailBatchStatus;
  variables?: string[];
}

const EMAIL_ERROR_KIND_BY_CODE: Record<string, SettingsWorkflowErrorKind> = {
  "settings.email.connection_missing": "email-connection",
  "settings.email.connection_not_verified": "email-connection-unverified",
  "settings.email.connection_test_failed": "email-connection-test",
  "settings.email.secret_encryption_failed": "retryable",
  "settings.email.template_invalid": "email-content-invalid",
  "settings.email.delivery_connection_inactive": "email-connection",
  "settings.email.delivery_template_missing": "email-template",
  "settings.email.delivery_no_recipients": "no-recipients",
  "settings.email.delivery_recipient_invalid": "recipient-invalid",
  "settings.email.delivery_batch_not_found": "delivery-not-found",
  "settings.email.delivery_batch_not_cancelable": "delivery-not-cancelable",
  "settings.email.delivery_too_many_recipients": "recipient-limit",
  "settings.email.delivery_send_failed": "retryable",
  "settings.email.campaign_invalid": "campaign-invalid",
  "settings.email.campaign_credential_variables_forbidden":
    "credential-variables",
};

const CREDENTIAL_MODE_CODES = new Set([
  "iam.credentials.missing_password",
  "iam.credentials.already_set",
  "iam.credentials.temporary_password_unavailable",
]);

const PERMISSION_CODES = new Set([
  "auth.token.expired",
  "auth.token.invalid",
  "auth.session.revoked",
  "auth.account.disabled",
  "auth.scope.missing",
]);

const RETRYABLE_CODES = new Set([
  "rate_limit.exceeded",
  "internal_error",
  "service_unavailable",
  "teachers.lifecycle.revocation_failed",
]);

const EMAIL_BATCH_STATUSES = new Set<SettingsEmailBatchStatus>([
  "DRAFT",
  "QUEUED",
  "PROCESSING",
  "SUCCEEDED",
  "PARTIAL_FAILED",
  "FAILED",
  "CANCELLED",
]);

function detailRecord(details: unknown): Record<string, unknown> | undefined {
  return details && typeof details === "object" && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : undefined;
}

function numericDetail(details: unknown, key: string): number | undefined {
  const detail = detailRecord(details)?.[key];
  return typeof detail === "number" &&
    Number.isSafeInteger(detail) &&
    detail >= 0
    ? detail
    : undefined;
}

function identifierDetail(details: unknown, key: string): string | undefined {
  const detail = detailRecord(details)?.[key];
  return typeof detail === "string" &&
    /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(detail)
    ? detail
    : undefined;
}

function stringArrayDetail(
  details: unknown,
  key: string,
): string[] | undefined {
  const detail = detailRecord(details)?.[key];
  if (!Array.isArray(detail)) return undefined;
  const identifiers = detail
    .filter(
      (entry): entry is string =>
        typeof entry === "string" &&
        /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(entry),
    )
    .slice(0, 20);
  return identifiers.length ? identifiers : undefined;
}

function validationFieldNames(details: unknown): string[] | undefined {
  const record = detailRecord(details);
  const fields = [
    ...(typeof record?.field === "string" ? [record.field] : []),
    ...(Array.isArray(record?.fields) ? record.fields : []),
  ];
  const names = fields.flatMap((field) => {
    if (typeof field !== "string") return [];
    const match = field.match(/^[A-Za-z][A-Za-z0-9_.]{0,99}/);
    return match ? [match[0]] : [];
  });
  const uniqueNames = Array.from(new Set(names)).slice(0, 20);
  return uniqueNames.length ? uniqueNames : undefined;
}

function batchStatusDetail(details: unknown): SettingsEmailBatchStatus | undefined {
  const status = identifierDetail(details, "status") as
    | SettingsEmailBatchStatus
    | undefined;
  return status && EMAIL_BATCH_STATUSES.has(status) ? status : undefined;
}

function emailErrorDetails(
  code: string,
  details: unknown,
): Omit<SettingsWorkflowError, "kind" | "code" | "traceId"> {
  if (code === "settings.email.delivery_too_many_recipients") {
    return {
      recipientCount: numericDetail(details, "count"),
      recipientLimit: numericDetail(details, "limit"),
    };
  }
  if (code === "settings.email.delivery_batch_not_cancelable") {
    return { batchStatus: batchStatusDetail(details) };
  }
  if (code === "settings.email.template_invalid") {
    return {
      invalidFields: validationFieldNames(details),
      variables: stringArrayDetail(details, "unknownVariables"),
    };
  }
  if (code === "settings.email.campaign_credential_variables_forbidden") {
    return { variables: stringArrayDetail(details, "variables") };
  }
  if (
    code === "settings.email.connection_test_failed" ||
    code === "settings.email.delivery_send_failed"
  ) {
    return { reasonCode: identifierDetail(details, "reason") };
  }
  return {};
}

function fallbackKind(status: number, code: string): SettingsWorkflowErrorKind {
  if (code === "validation.failed" || status === 400 || status === 422) {
    return "validation";
  }
  if (code === "not_found" || status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (PERMISSION_CODES.has(code) || status === 401 || status === 403) {
    return "permission";
  }
  if (RETRYABLE_CODES.has(code) || status === 0 || status === 429 || status >= 500) {
    return "retryable";
  }
  return "generic";
}

export function classifySettingsWorkflowError(
  error: unknown,
): SettingsWorkflowError {
  if (!isApiError(error)) return { kind: "generic" };

  const base = { code: error.code, traceId: error.traceId };
  const emailKind = EMAIL_ERROR_KIND_BY_CODE[error.code];
  if (emailKind) {
    return {
      kind: emailKind,
      ...base,
      ...emailErrorDetails(error.code, error.details),
    };
  }
  if (RETRYABLE_CODES.has(error.code)) {
    return { kind: "retryable", ...base };
  }
  if (
    error.code.startsWith("teachers.") ||
    error.code === "iam.membership.teacher_conflict"
  ) {
    return { kind: "teacher-directory", ...base };
  }
  if (
    error.code === "iam.user.login_domain_missing" ||
    error.code === "iam.user.login_domain_invalid"
  ) {
    return { kind: "login-identity", ...base };
  }
  if (error.code === "iam.credentials.no_eligible_users") {
    return { kind: "no-recipients", ...base };
  }
  if (error.code === "iam.credentials.bulk_too_large") {
    return {
      kind: "recipient-limit",
      ...base,
      recipientCount: numericDetail(error.details, "count"),
      recipientLimit: numericDetail(error.details, "limit"),
    };
  }
  if (CREDENTIAL_MODE_CODES.has(error.code)) {
    return { kind: "credential-mode", ...base };
  }
  if (error.code === "iam.credentials.user_not_manageable") {
    return { kind: "credential-state", ...base };
  }
  if (error.code === "iam.user.not_invitable") {
    return { kind: "user-state", ...base };
  }
  const kind = fallbackKind(error.status, error.code);
  return {
    kind,
    ...base,
    invalidFields:
      kind === "validation"
        ? validationFieldNames(error.details)
        : undefined,
  };
}
