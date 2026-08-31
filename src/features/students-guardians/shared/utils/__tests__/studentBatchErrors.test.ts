import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { toStudentBatchPresentationError } from "../studentBatchErrors";

describe("toStudentBatchPresentationError", () => {
  it("retains safe diagnostics and maps known workflow codes", () => {
    const errors = { studentIds: ["Select at least one student."] };
    const result = toStudentBatchPresentationError(
      new ApiError(
        "unsafe backend prose",
        422,
        "students.credentials.audience_invalid",
        errors,
        {
          reasonCode: "student_ids_required",
          requestBody: { sharedPassword: "F2Admin!Pass123" },
          sharedPassword: "F2Admin!Pass123",
        },
        "trace-123",
      ),
      "credentials",
    );

    expect(result).toEqual({
      status: 422,
      code: "students.credentials.audience_invalid",
      errors,
      details: { reasonCode: "student_ids_required" },
      traceId: "trace-123",
      messageKey: "students_guardians.credentials.errors.audience_invalid",
    });
    expect(JSON.stringify(result)).not.toContain("F2Admin!Pass123");
    expect(JSON.stringify(result)).not.toContain("requestBody");
    expect(JSON.stringify(result)).not.toContain("unsafe backend prose");
  });

  it("preserves safe password-policy reasons without arbitrary details", () => {
    const result = toStudentBatchPresentationError(
      new ApiError(
        "rejected",
        422,
        "iam.credentials.password_policy_failed",
        undefined,
        {
          reasons: ["password_common", "future_reason", 12],
          password: "secret",
        },
      ),
      "credentials",
    );

    expect(result.details).toEqual({
      reasons: ["password_common", "future_reason"],
    });
    expect(result.messageKey).toBe(
      "students_guardians.credentials.errors.password_policy_failed",
    );
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("uses the area fallback for unknown API and non-API errors", () => {
    expect(
      toStudentBatchPresentationError(
        new ApiError("raw", 500, "future.backend.code"),
        "bulk_registration",
      ),
    ).toMatchObject({
      code: "future.backend.code",
      messageKey: "students_guardians.bulk_registration.errors.unknown",
    });
    expect(
      toStudentBatchPresentationError(new Error("raw secret"), "credentials"),
    ).toEqual({
      status: 0,
      code: "UNKNOWN_ERROR",
      messageKey: "students_guardians.credentials.errors.unknown",
    });
  });
});
