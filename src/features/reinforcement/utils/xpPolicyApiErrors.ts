import { isApiError } from "@/lib/api-error";

export interface XpPolicyApiErrorDescriptor {
  field?: "scope" | "caps" | "dates";
  messageKey: string;
}

const isErrorDetails = (details: unknown): details is Record<string, unknown> =>
  Boolean(details) && typeof details === "object" && !Array.isArray(details);

const hasCapDetails = (details: Record<string, unknown>): boolean =>
  Boolean(details.dailyCap || details.weeklyCap);

const hasDateDetails = (details: Record<string, unknown>): boolean =>
  Boolean(details.startsAt || details.endsAt);

function validationFeedback(details: unknown): XpPolicyApiErrorDescriptor {
  const field = isErrorDetails(details) && typeof details.field === "string"
    ? details.field
    : "";
  if (field === "scopeId" || field === "scopeType") {
    return { field: "scope", messageKey: "validation.targetRequired" };
  }
  if (
    field === "dailyCap" ||
    field === "weeklyCap" ||
    field === "cooldownMinutes" ||
    (isErrorDetails(details) && hasCapDetails(details))
  ) {
    return { field: "caps", messageKey: "xp.validation.invalidCaps" };
  }
  if (
    field === "startsAt" ||
    field === "endsAt" ||
    (isErrorDetails(details) && hasDateDetails(details))
  ) {
    return { field: "dates", messageKey: "xp.invalidDateRange" };
  }
  return { messageKey: "common.validationError" };
}

export function describeXpPolicyApiError(
  error: unknown,
): XpPolicyApiErrorDescriptor {
  if (!isApiError(error)) return { messageKey: "common.error" };
  if (error.code === "reinforcement.policy.conflict") {
    return { messageKey: "xp.validation.policyConflict" };
  }
  return error.isValidationError()
    ? validationFeedback(error.details)
    : { messageKey: "common.error" };
}
