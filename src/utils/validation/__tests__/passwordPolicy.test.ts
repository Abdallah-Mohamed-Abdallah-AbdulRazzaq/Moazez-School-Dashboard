import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { getPasswordPolicyApiFailures } from "@/utils/validation/passwordPolicy";

describe("password policy", () => {
  it("extracts supported reasons from the password policy API error", () => {
    const error = new ApiError(
      "Password does not meet credential policy",
      400,
      "iam.credentials.password_policy_failed",
      undefined,
      {
        reasons: [
          "password_required",
          "password_too_short",
          "password_missing_uppercase",
          "password_common",
          "unknown_reason",
        ],
      },
    );

    expect(getPasswordPolicyApiFailures(error)).toEqual([
      "password_required",
      "password_too_short",
      "password_missing_uppercase",
      "password_common",
    ]);
  });
});
