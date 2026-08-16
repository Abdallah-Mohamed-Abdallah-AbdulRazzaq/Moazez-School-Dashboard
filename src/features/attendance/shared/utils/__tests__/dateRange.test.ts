import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { isDateRangeValidationError, isInvalidDateRange } from "../dateRange";

describe("isInvalidDateRange", () => {
  it("accepts an empty or partially selected range", () => {
    expect(isInvalidDateRange()).toBe(false);
    expect(isInvalidDateRange("2026-08-10")).toBe(false);
    expect(isInvalidDateRange(undefined, "2026-08-08")).toBe(false);
  });

  it("accepts ranges whose start is before or equal to the end", () => {
    expect(isInvalidDateRange("2026-08-08", "2026-08-10")).toBe(false);
    expect(isInvalidDateRange("2026-08-08", "2026-08-08")).toBe(false);
  });

  it("rejects a start date after the end date", () => {
    expect(isInvalidDateRange("2026-08-10", "2026-08-08")).toBe(true);
  });
});

describe("isDateRangeValidationError", () => {
  it("recognizes the backend validation payload", () => {
    expect(
      isDateRangeValidationError(
        new ApiError("Attendance date range is invalid", 422, "validation.failed", undefined, {
          dateFrom: "2026-08-10",
          dateTo: "2026-08-08",
        }),
      ),
    ).toBe(true);
  });

  it("does not classify unrelated errors as date-range errors", () => {
    expect(isDateRangeValidationError(new Error("invalid range"))).toBe(false);
    expect(isDateRangeValidationError(new ApiError("invalid", 422, "validation.failed"))).toBe(false);
  });
});
