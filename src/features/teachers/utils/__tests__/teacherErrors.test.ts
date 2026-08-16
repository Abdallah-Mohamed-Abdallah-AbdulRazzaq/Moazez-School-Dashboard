import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { toTeacherSubmissionFormErrors, toTeacherUiError } from "../teacherErrors";

describe("teacher error mapping", () => {
  it("maps conflicts to the affected form field", () => {
    const uiError = toTeacherUiError(
      new ApiError("Code exists", 409, "teachers.profile.code_conflict"),
    );
    expect(uiError.fieldErrors).toEqual({ teacherCode: "Code exists" });
  });

  it("associates identity conflicts with either supported login mode", () => {
    const uiError = toTeacherUiError(
      new ApiError("Identity exists", 409, "teachers.account.identity_conflict"),
    );
    expect(uiError.fieldErrors).toEqual({
      username: "Identity exists",
      loginEmail: "Identity exists",
      contactEmail: "Identity exists",
      phone: "Identity exists",
    });
  });

  it("maps incomplete profiles and backend identity fields to the affected controls", () => {
    expect(
      toTeacherUiError(
        new ApiError("Complete the profile", 409, "teachers.profile.incomplete", undefined, {
          missingFields: ["firstNameAr", "lastNameEn"],
        }),
      ).fieldErrors,
    ).toEqual({
      firstNameAr: "Complete the profile",
      lastNameEn: "Complete the profile",
    });

    expect(
      toTeacherUiError(
        new ApiError("Email already exists", 409, "teachers.account.identity_conflict", undefined, {
          fields: ["contactEmail"],
        }),
      ).fieldErrors,
    ).toEqual({ contactEmail: "Email already exists" });
  });

  it("keeps identity conflicts visible when the backend omits or uses a legacy field name", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Identity exists", 409, "teachers.account.identity_conflict"),
      ),
    ).toEqual({
      username: "backend.username_conflict",
      loginEmail: "backend.login_email_conflict",
      contactEmail: "backend.contact_email_conflict",
      phone: "backend.phone_conflict",
    });

    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Email exists", 409, "teachers.account.identity_conflict", undefined, {
          fields: ["login_email"],
        }),
      ),
    ).toEqual({ loginEmail: "backend.login_email_conflict" });

    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Phone exists", 409, "teachers.account.identity_conflict", undefined, {
          fields: ["phone"],
        }),
      ),
    ).toEqual({ phone: "backend.phone_conflict" });
  });

  it("turns an invalid username response into a field-level form error", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Username is invalid", 422, "iam.user.username_invalid"),
      ),
    ).toEqual({ username: "username_invalid" });
  });

  it("associates a missing school login domain with username provisioning", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Configure a school domain", 422, "iam.user.login_domain_missing"),
      ),
    ).toEqual({ username: "backend.login_domain_missing" });
  });

  it("maps validation detail messages without exposing the raw error", () => {
    const uiError = toTeacherUiError(
      new ApiError("Validation failed", 400, "validation.failed", undefined, {
        fields: ["phone must be a valid phone number"],
      }),
    );
    expect(uiError.fieldErrors).toEqual({
      phone: "phone must be a valid phone number",
    });
  });

  it("shows a localized phone-validation message for backend validation details", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("phone must be a valid phone number", 400, "validation.failed", undefined, {
          fields: ["phone must be a valid phone number"],
        }),
      ),
    ).toEqual({ phone: "backend.phone_invalid" });
  });

  it("maps the backend work-time pair error to the end-time input", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Invalid work-time pair", 400, "validation.failed", undefined, {
          field: "workEndTime",
        }),
      ),
    ).toEqual({ workEndTime: "backend.work_time_order_invalid" });
  });

  it("normalizes backend field names and keeps unknown validation fields visible", () => {
    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Validation failed", 400, "validation.failed", {
          first_name_ar: ["First Arabic name is required"],
        }),
      ),
    ).toEqual({ firstNameAr: "backend.invalid_field" });

    expect(
      toTeacherSubmissionFormErrors(
        new ApiError("Validation failed", 400, "validation.failed", undefined, {
          fields: ["unsupportedField must be valid"],
        }),
      ),
    ).toEqual({ form: "backend.invalid_field" });
  });

  it("marks lifecycle conflicts for refresh and allocation routing", () => {
    expect(
      toTeacherUiError(
        new ApiError("State changed", 409, "teachers.lifecycle.invalid_transition"),
      ).shouldRefresh,
    ).toBe(true);
    expect(
      toTeacherUiError(
        new ApiError("Assignments exist", 409, "teachers.lifecycle.active_assignments"),
      ).allocationConflict,
    ).toBe(true);
  });

  it("preserves safe support metadata for inconsistent teacher identity", () => {
    const uiError = toTeacherUiError(
      new ApiError(
        "Teacher identity state is not safe for this operation",
        409,
        "teachers.account.role_transition_conflict",
        undefined,
        { reasonCode: "teacher_identity_inconsistent" },
        "trace-123",
      ),
    );

    expect(uiError).toMatchObject({
      reasonCode: "teacher_identity_inconsistent",
      traceId: "trace-123",
      shouldRefresh: true,
      identityIntegrityConflict: true,
    });
  });
});
