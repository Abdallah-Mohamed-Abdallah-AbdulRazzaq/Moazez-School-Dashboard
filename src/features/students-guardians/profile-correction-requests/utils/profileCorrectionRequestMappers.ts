import type {
  ProfileCorrectionRequestDetail,
  ProfileCorrectionRequestListItem,
  ProfileCorrectionRequestStatus,
  ProfileCorrectionRequestedChange,
} from "@/features/students-guardians/profile-correction-requests/types/profileCorrectionRequests";

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pickString = (
  source: ApiRecord,
  keys: string[],
  fallback = "",
): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
  }
  return fallback;
};

function normalizeStatus(value: string): ProfileCorrectionRequestStatus {
  const normalized = value.trim().toUpperCase();
  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function readChanges(raw: ApiRecord): ProfileCorrectionRequestedChange[] {
  const explicitChanges = raw.changes ?? raw.requestedChanges;
  if (Array.isArray(explicitChanges)) {
    return explicitChanges.filter(isRecord).map((change) => {
      const field = pickString(change, ["field", "fieldName", "path"]);
      return {
        field,
        label: pickString(change, ["label", "fieldLabel"], field),
        currentValue: formatValue(
          change.currentValue ?? change.current_value ?? change.current,
        ),
        requestedValue: formatValue(
          change.requestedValue ?? change.requested_value ?? change.requested,
        ),
      };
    });
  }

  const currentValues = isRecord(raw.currentSnapshot)
    ? raw.currentSnapshot
    : isRecord(raw.currentValues)
      ? raw.currentValues
      : isRecord(raw.current)
        ? raw.current
        : {};
  const requestedValues = isRecord(raw.requestedChanges)
    ? raw.requestedChanges
    : isRecord(raw.requestedValues)
      ? raw.requestedValues
      : isRecord(raw.requested)
        ? raw.requested
        : {};

  return Object.keys(requestedValues).map((field) => ({
    field,
    label: field,
    currentValue: formatValue(currentValues[field]),
    requestedValue: formatValue(requestedValues[field]),
  }));
}

export function normalizeProfileCorrectionRequestListItem(
  raw: unknown,
): ProfileCorrectionRequestListItem {
  if (!isRecord(raw)) {
    throw new Error("Profile correction request API item must be an object.");
  }

  const changes = readChanges(raw);
  const student = isRecord(raw.student) ? raw.student : {};
  const id = pickString(raw, ["id", "requestId", "request_id"]);

  return {
    id,
    studentId: pickString(
      raw,
      ["studentId", "student_id"],
      pickString(student, ["studentId", "id"]),
    ),
    studentName: pickString(
      raw,
      ["studentName", "student_name"],
      pickString(student, ["displayName", "name", "full_name_en", "fullName"]),
    ),
    studentNumber: pickString(student, ["studentNumber"]) || undefined,
    status: normalizeStatus(pickString(raw, ["status"], "pending")),
    requestedAt: pickString(raw, [
      "submittedAt",
      "requestedAt",
      "createdAt",
      "created_at",
    ]),
    reviewedAt:
      pickString(raw, ["resolvedAt", "reviewedAt", "reviewed_at"]) || undefined,
    cancelledAt: pickString(raw, ["cancelledAt"]) || undefined,
    reviewerNote:
      pickString(raw, ["reviewerNote", "reviewer_note"]) || undefined,
    reason: pickString(raw, ["reason"]) || undefined,
    changeCount: changes.length,
  };
}

export function normalizeProfileCorrectionRequestDetail(
  raw: unknown,
): ProfileCorrectionRequestDetail {
  if (!isRecord(raw)) {
    throw new Error("Profile correction request API detail must be an object.");
  }

  return {
    ...normalizeProfileCorrectionRequestListItem(raw),
    changes: readChanges(raw),
    currentSnapshot: isRecord(raw.currentSnapshot) ? raw.currentSnapshot : null,
  };
}
