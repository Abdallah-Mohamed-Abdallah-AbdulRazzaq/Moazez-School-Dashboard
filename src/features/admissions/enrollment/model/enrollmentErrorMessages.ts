import { isApiError } from "@/lib/api-error";

export type EnrollmentErrorKey =
  | "placement_conflict"
  | "inactive_academic_year"
  | "no_active_enrollment"
  | "unauthorized"
  | "permission_denied"
  | "not_found"
  | "validation_failed"
  | "generic";

const backendErrorKeys: Record<string, EnrollmentErrorKey> = {
  "students.enrollment.placement_conflict": "placement_conflict",
  "students.enrollment.inactive_year": "inactive_academic_year",
  "students.enrollment.already_withdrawn": "no_active_enrollment",
  "validation.failed": "validation_failed",
};

const statusErrorKeys: Record<number, EnrollmentErrorKey> = {
  401: "unauthorized",
  403: "permission_denied",
  404: "not_found",
  400: "validation_failed",
  422: "validation_failed",
};

export function enrollmentErrorKey(error: unknown): EnrollmentErrorKey {
  if (!isApiError(error)) return "generic";

  return backendErrorKeys[error.code] ?? statusErrorKeys[error.status] ?? "generic";
}

export function enrollmentValidationErrorKey(code: string): EnrollmentErrorKey {
  return backendErrorKeys[code] ?? "validation_failed";
}

function enrollmentCapacityDetails(error: unknown) {
  if (!isApiError(error) || error.code !== "students.enrollment.placement_conflict") return null;
  if (!error.details || typeof error.details !== "object") return null;

  const { capacity, activeCount, projectedActiveCount } = error.details as Record<string, unknown>;
  if (
    typeof capacity !== "number" || !Number.isFinite(capacity) || capacity < 0 ||
    typeof activeCount !== "number" || !Number.isFinite(activeCount) || activeCount < 0 ||
    typeof projectedActiveCount !== "number" || !Number.isFinite(projectedActiveCount) ||
    projectedActiveCount <= capacity
  ) return null;

  return { capacity, activeCount, projectedActiveCount };
}

export function enrollmentErrorMessage(
  error: unknown,
  translate: (key: string, counts?: Record<string, number>) => string,
): string {
  const capacityDetails = enrollmentCapacityDetails(error);
  return capacityDetails
    ? translate("errors.capacity_exceeded", capacityDetails)
    : translate(`errors.${enrollmentErrorKey(error)}`);
}
