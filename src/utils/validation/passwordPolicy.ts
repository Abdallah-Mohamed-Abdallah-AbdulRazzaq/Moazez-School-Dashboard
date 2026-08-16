import { isApiError } from "@/lib/api-error";

export type PasswordPolicyReason =
  | "password_required"
  | "password_too_short"
  | "password_missing_uppercase"
  | "password_missing_lowercase"
  | "password_missing_number"
  | "password_missing_symbol"
  | "password_common";

const PASSWORD_POLICY_CODE = "iam.credentials.password_policy_failed";

export function getPasswordPolicyApiFailures(
  error: unknown,
): PasswordPolicyReason[] {
  if (!isApiError(error) || error.code !== PASSWORD_POLICY_CODE) {
    return [];
  }

  const details = error.details;
  if (!details || typeof details !== "object" || !("reasons" in details)) {
    return [];
  }

  const reasons = (details as { reasons?: unknown }).reasons;
  return Array.isArray(reasons) ? reasons.filter(isPasswordPolicyReason) : [];
}

function isPasswordPolicyReason(reason: unknown): reason is PasswordPolicyReason {
  return (
    reason === "password_required" ||
    reason === "password_too_short" ||
    reason === "password_missing_uppercase" ||
    reason === "password_missing_lowercase" ||
    reason === "password_missing_number" ||
    reason === "password_missing_symbol" ||
    reason === "password_common"
  );
}
