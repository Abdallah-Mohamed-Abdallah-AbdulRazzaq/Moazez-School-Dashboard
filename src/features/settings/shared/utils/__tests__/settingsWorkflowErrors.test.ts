import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { classifySettingsWorkflowError } from "../settingsWorkflowErrors";

describe("settings workflow error classification", () => {
  it("routes the teacher-directory provisioning conflict to Teachers", () => {
    const error = new ApiError(
      "Teacher identity state is not safe for this operation",
      409,
      "teachers.account.role_transition_conflict",
      undefined,
      { reasonCode: "teacher_directory_provisioning_required" },
      "trace-123",
    );

    expect(classifySettingsWorkflowError(error)).toEqual({
      kind: "teacher-directory",
      code: "teachers.account.role_transition_conflict",
      traceId: "trace-123",
    });
  });

  it.each([
    ["settings.email.connection_missing", "email-connection"],
    ["settings.email.connection_not_verified", "email-connection-unverified"],
    ["settings.email.connection_test_failed", "email-connection-test"],
    ["settings.email.secret_encryption_failed", "retryable"],
    ["settings.email.delivery_connection_inactive", "email-connection"],
    ["settings.email.delivery_template_missing", "email-template"],
    ["settings.email.template_invalid", "email-content-invalid"],
    ["iam.user.login_domain_missing", "login-identity"],
    ["iam.user.login_domain_invalid", "login-identity"],
    ["settings.email.delivery_no_recipients", "no-recipients"],
    ["settings.email.delivery_recipient_invalid", "recipient-invalid"],
    ["settings.email.delivery_batch_not_found", "delivery-not-found"],
    ["settings.email.delivery_batch_not_cancelable", "delivery-not-cancelable"],
    ["settings.email.delivery_send_failed", "retryable"],
    ["settings.email.campaign_invalid", "campaign-invalid"],
    [
      "settings.email.campaign_credential_variables_forbidden",
      "credential-variables",
    ],
    ["iam.credentials.no_eligible_users", "no-recipients"],
    ["iam.credentials.missing_password", "credential-mode"],
    ["iam.credentials.already_set", "credential-mode"],
    ["iam.credentials.temporary_password_unavailable", "credential-mode"],
    ["iam.credentials.user_not_manageable", "credential-state"],
    ["iam.user.not_invitable", "user-state"],
    ["iam.membership.teacher_conflict", "teacher-directory"],
  ] as const)("classifies %s as %s", (code, kind) => {
    expect(
      classifySettingsWorkflowError(new ApiError("Backend message", 409, code)),
    ).toMatchObject({ kind });
  });

  it("preserves safe recipient-limit details", () => {
    const error = new ApiError(
      "Recipient limit exceeded",
      422,
      "settings.email.delivery_too_many_recipients",
      undefined,
      { count: 320, limit: 250 },
    );

    expect(classifySettingsWorkflowError(error)).toMatchObject({
      kind: "recipient-limit",
      recipientCount: 320,
      recipientLimit: 250,
    });
  });

  it("extracts bounded validation field names without exposing raw messages", () => {
    const classified = classifySettingsWorkflowError(
      new ApiError(
        "Raw backend validation text",
        400,
        "validation.failed",
        undefined,
        {
          fields: [
            "subject must be shorter than or equal to 200 characters",
            "bodyHtml",
          ],
        },
        "trace-validation",
      ),
    );

    expect(classified).toEqual({
      kind: "validation",
      code: "validation.failed",
      traceId: "trace-validation",
      invalidFields: ["subject", "bodyHtml"],
    });
    expect(classified).not.toHaveProperty("message");
  });

  it("preserves only whitelisted delivery status details", () => {
    expect(
      classifySettingsWorkflowError(
        new ApiError(
          "Raw",
          409,
          "settings.email.delivery_batch_not_cancelable",
          undefined,
          { status: "SUCCEEDED" },
        ),
      ),
    ).toMatchObject({
      kind: "delivery-not-cancelable",
      batchStatus: "SUCCEEDED",
    });
  });

  it.each([
    [new ApiError("Forbidden", 403, "FORBIDDEN"), "permission"],
    [new ApiError("Missing", 404, "not_found"), "not-found"],
    [new ApiError("Conflict", 409, "unmapped"), "conflict"],
    [new ApiError("Invalid", 422, "unmapped"), "validation"],
    [ApiError.network(), "retryable"],
    [new ApiError("Unavailable", 503, "SERVICE_UNAVAILABLE"), "retryable"],
    [
      new ApiError(
        "Revocation failed",
        503,
        "teachers.lifecycle.revocation_failed",
      ),
      "retryable",
    ],
    [new Error("Unknown"), "generic"],
  ] as const)("uses a safe fallback for remaining failures", (error, kind) => {
    expect(classifySettingsWorkflowError(error)).toMatchObject({ kind });
  });
});
