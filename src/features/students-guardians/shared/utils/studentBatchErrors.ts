import { isApiError } from "@/lib/api-error";

export type StudentBatchErrorArea = "bulk_registration" | "credentials";

export interface StudentBatchPresentationError {
  status: number;
  code: string;
  messageKey: string;
  errors?: Record<string, string[]>;
  details?: {
    reasonCode?: string;
    reasons?: string[];
    count?: number;
    limit?: number;
  };
  traceId?: string;
}

const BULK_REGISTRATION_ERROR_KEYS: Record<string, string> = {
  "students.bulk_registration.csv_malformed": "csv_malformed",
  "students.bulk_registration.header_invalid": "header_invalid",
  "students.bulk_registration.no_data_rows": "no_data_rows",
  "students.bulk_registration.field_invalid": "field_invalid",
  "students.bulk_registration.duplicate_username": "duplicate_username",
  "students.bulk_registration.duplicate_row": "duplicate_row",
  "students.bulk_registration.confirm_conflict": "confirm_conflict",
  "students.bulk_registration.execution_invariant_invalid":
    "execution_invariant_invalid",
  "students.bulk_registration.execution_metadata_invalid":
    "execution_metadata_invalid",
  "students.bulk_registration.execution_tenant_ineligible":
    "execution_tenant_ineligible",
  "students.bulk_registration.row_data_invalid": "row_data_invalid",
  "students.bulk_registration.execution_placement_invalid":
    "execution_placement_invalid",
  "iam.user.login_email_taken": "login_email_taken",
  "iam.user.username_invalid": "username_invalid",
  "settings.login_identity.not_configured": "login_identity_not_configured",
};

const CREDENTIAL_ERROR_KEYS: Record<string, string> = {
  "students.credentials.audience_invalid": "audience_invalid",
  "students.credentials.no_eligible_students": "no_eligible_students",
  "students.credentials.execution_invariant_invalid":
    "execution_invariant_invalid",
  "students.credentials.execution_tenant_ineligible":
    "execution_tenant_ineligible",
  "students.credentials.export_not_ready": "export_not_ready",
  "students.credentials.export_empty": "export_empty",
  "students.credentials.export_too_large": "export_too_large",
  "students.credentials.secret_artifact_unavailable":
    "secret_artifact_unavailable",
  "students.credentials.secret_artifact_expired": "secret_artifact_expired",
  "students.credentials.secret_artifact_invalid": "secret_artifact_invalid",
  "iam.credentials.password_policy_failed": "password_policy_failed",
};

function safeDetails(details: unknown): StudentBatchPresentationError["details"] {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return undefined;
  }
  const source = details as Record<string, unknown>;
  const sanitized = {
    ...(typeof source.reasonCode === "string"
      ? { reasonCode: source.reasonCode }
      : {}),
    ...(Array.isArray(source.reasons)
      ? {
          reasons: source.reasons.filter(
            (reason): reason is string => typeof reason === "string",
          ),
        }
      : {}),
    ...(typeof source.count === "number" ? { count: source.count } : {}),
    ...(typeof source.limit === "number" ? { limit: source.limit } : {}),
  };

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function toStudentBatchPresentationError(
  error: unknown,
  area: StudentBatchErrorArea,
): StudentBatchPresentationError {
  const fallbackKey = `students_guardians.${area}.errors.unknown`;
  if (!isApiError(error)) {
    return { status: 0, code: "UNKNOWN_ERROR", messageKey: fallbackKey };
  }

  const knownKeys =
    area === "bulk_registration"
      ? BULK_REGISTRATION_ERROR_KEYS
      : CREDENTIAL_ERROR_KEYS;
  const mappedKey = knownKeys[error.code];
  const details = safeDetails(error.details);

  return {
    status: error.status,
    code: error.code,
    ...(error.errors ? { errors: error.errors } : {}),
    ...(details ? { details } : {}),
    ...(error.traceId ? { traceId: error.traceId } : {}),
    messageKey: mappedKey
      ? `students_guardians.${area}.errors.${mappedKey}`
      : fallbackKey,
  };
}
