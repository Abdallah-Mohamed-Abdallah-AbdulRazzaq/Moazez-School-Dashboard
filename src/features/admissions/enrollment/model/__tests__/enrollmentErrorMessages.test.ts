import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  enrollmentErrorKey,
  enrollmentValidationErrorKey,
} from "../enrollmentErrorMessages";

describe("enrollmentErrorMessages", () => {
  it("maps placement conflicts to an actionable message", () => {
    expect(
      enrollmentErrorKey(
        new ApiError("Placement conflict", 409, "students.enrollment.placement_conflict"),
      ),
    ).toBe("placement_conflict");
  });

  it("maps inactive academic years", () => {
    expect(
      enrollmentErrorKey(
        new ApiError("Inactive year", 422, "students.enrollment.inactive_year"),
      ),
    ).toBe("inactive_academic_year");
  });

  it("maps already withdrawn enrollments to no active enrollment", () => {
    expect(
      enrollmentErrorKey(
        new ApiError("Already withdrawn", 409, "students.enrollment.already_withdrawn"),
      ),
    ).toBe("no_active_enrollment");
  });

  it("maps permission statuses", () => {
    expect(enrollmentErrorKey(new ApiError("Forbidden", 403, "forbidden"))).toBe(
      "permission_denied",
    );
  });

  it("maps not found statuses", () => {
    expect(enrollmentErrorKey(new ApiError("Not found", 404, "not_found"))).toBe(
      "not_found",
    );
  });

  it("uses safe fallbacks for unknown errors and validation codes", () => {
    expect(enrollmentErrorKey(new Error("Unexpected"))).toBe("generic");
    expect(enrollmentValidationErrorKey("unknown.validation.code")).toBe(
      "validation_failed",
    );
  });
});
