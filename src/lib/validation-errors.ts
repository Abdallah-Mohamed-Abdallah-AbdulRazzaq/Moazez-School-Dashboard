import { ApiError, isApiError } from "@/lib/api-error";

export type ValidationFieldErrors = Record<string, string>;

interface ValidationFieldPayload {
  field?: string;
  path?: string;
  key?: string;
  message?: string;
  code?: string;
}

function normalizeFieldName(field: string): string {
  return field
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .pop() || field;
}

function inferFieldFromMessage(message: string): string | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const firstToken = normalized.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9_.[\]]/g, "");
  if (!firstToken) {
    return null;
  }

  const canonicalFieldByToken: Record<string, string> = {
    fullname: "fullName",
    primarycontactname: "primaryContactName",
    roleid: "roleId",
    studentname: "studentName",
  };
  const canonicalField = canonicalFieldByToken[firstToken];
  if (canonicalField) {
    return canonicalField;
  }

  if (
    firstToken.includes(".") ||
    firstToken.includes("[") ||
    [
      "email",
      "phone",
      "password",
      "name",
      "description",
      "channel",
      "status",
      "notes",
    ].includes(firstToken)
  ) {
    return normalizeFieldName(firstToken);
  }

  return null;
}

function extractFieldMessage(field: ValidationFieldPayload): string {
  return field.message?.trim() || field.code?.trim() || "Invalid value";
}

function mapFieldsList(fields: unknown): ValidationFieldErrors {
  if (!Array.isArray(fields)) {
    return {};
  }

  const mapped: ValidationFieldErrors = {};
  for (const item of fields) {
    if (typeof item === "string") {
      const inferredField = inferFieldFromMessage(item);
      if (inferredField) {
        mapped[inferredField] = item;
      }
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const payload = item as ValidationFieldPayload;
    const rawField = payload.field || payload.path || payload.key;
    if (!rawField) {
      continue;
    }

    mapped[normalizeFieldName(rawField)] = extractFieldMessage(payload);
  }

  return mapped;
}

function mapErrorsObject(errors: unknown): ValidationFieldErrors {
  if (!errors || typeof errors !== "object") {
    return {};
  }

  const mapped: ValidationFieldErrors = {};
  for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
    if (typeof value === "string") {
      mapped[normalizeFieldName(field)] = value;
      continue;
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      mapped[normalizeFieldName(field)] = value[0];
    }
  }
  return mapped;
}

export function getValidationFieldErrors(error: unknown): ValidationFieldErrors {
  if (!isApiError(error)) {
    return {};
  }

  const apiError = error as ApiError;
  const fromDetails = mapFieldsList(
    (apiError.details as { fields?: unknown } | undefined)?.fields,
  );
  if (Object.keys(fromDetails).length > 0) {
    return fromDetails;
  }

  const fromErrors = mapErrorsObject(apiError.errors);
  if (Object.keys(fromErrors).length > 0) {
    return fromErrors;
  }

  return {};
}
