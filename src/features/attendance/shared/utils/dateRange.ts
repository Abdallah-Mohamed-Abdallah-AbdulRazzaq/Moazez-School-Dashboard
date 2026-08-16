/**
 * Attendance filters use ISO calendar dates (YYYY-MM-DD), so a string
 * comparison is stable and does not introduce timezone shifts.
 */
export function isInvalidDateRange(
  dateFrom?: string,
  dateTo?: string,
): boolean {
  return Boolean(dateFrom && dateTo && dateFrom > dateTo);
}

export function isDateRangeValidationError(error: unknown): boolean {
  if (!isApiError(error) || error.code !== "validation.failed") return false;

  const details = error.details;
  return (
    typeof details === "object" &&
    details !== null &&
    "dateFrom" in details &&
    "dateTo" in details
  );
}
import { isApiError } from "@/lib/api-error";
