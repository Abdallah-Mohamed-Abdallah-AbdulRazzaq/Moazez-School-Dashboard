import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { createTranslator } from "next-intl";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import {
  enrollmentErrorKey,
  enrollmentErrorMessage,
  enrollmentValidationErrorKey,
} from "../enrollmentErrorMessages";

vi.unmock("next-intl");

describe("enrollmentErrorMessages", () => {
  it.each([
    ["en", en, "Classroom capacity exceeded"],
    ["ar", ar, "تم تجاوز سعة الفصل"],
  ])("explains the reported 20-to-21 capacity conflict in %s", (locale, messages, explanation) => {
    const translate = createTranslator({ locale, messages, namespace: "admissions.enrollment" });
    const error = new ApiError(
      "Classroom capacity exceeded or placement conflict", 409,
      "students.enrollment.placement_conflict", undefined,
      { capacity: 20, activeCount: 20, incrementBy: 1, projectedActiveCount: 21 },
    );

    const message = enrollmentErrorMessage(error, translate);

    expect(message).toContain(explanation);
    expect(message).toContain("20");
    expect(message).toContain("21");
    expect(message).not.toMatch(/\{\w+\}/);
  });

  it.each([
    undefined,
    { capacity: 20, activeCount: 19, projectedActiveCount: 20 },
    { capacity: "20", activeCount: 20, projectedActiveCount: 21 },
    { capacity: 20, projectedActiveCount: 21 },
    { capacity: -1, activeCount: 0, projectedActiveCount: 1 },
    { capacity: 20, activeCount: 20, projectedActiveCount: NaN },
  ])("keeps the placement fallback when capacity is not proven exceeded: %j", (details) => {
    const translate = createTranslator({ locale: "en", messages: en, namespace: "admissions.enrollment" });
    const error = new ApiError("Placement conflict", 409, "students.enrollment.placement_conflict", undefined, details);

    expect(enrollmentErrorMessage(error, translate)).toBe(en.admissions.enrollment.errors.placement_conflict);
  });

  it("does not treat unrelated errors as capacity conflicts", () => {
    const translate = createTranslator({ locale: "en", messages: en, namespace: "admissions.enrollment" });
    const error = new ApiError("Forbidden", 403, "forbidden", undefined,
      { capacity: 20, activeCount: 20, projectedActiveCount: 21 });

    expect(enrollmentErrorMessage(error, translate)).toBe(en.admissions.enrollment.errors.permission_denied);
  });

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
