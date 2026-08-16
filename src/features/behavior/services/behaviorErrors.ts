import { isApiError } from "@/lib/api-error";

export type BehaviorErrorCode =
  | "behavior.category.in_use"
  | "behavior.category.inactive"
  | "behavior.record.points_invalid"
  | "behavior.record.type_mismatch"
  | "behavior.record.outside_term"
  | "behavior.scope.invalid"
  | "behavior.record.invalid_status_transition"
  | "behavior.record.already_submitted"
  | "behavior.record.already_reviewed"
  | "behavior.record.cancelled"
  | "behavior.record.not_submitted"
  | "behavior.points.duplicate_source";

const behaviorErrorMessageKeys: Record<BehaviorErrorCode, string> = {
  "behavior.category.in_use": "errors.categoryInUse",
  "behavior.category.inactive": "errors.categoryInactive",
  "behavior.record.points_invalid": "errors.invalidPoints",
  "behavior.record.type_mismatch": "errors.categoryTypeMismatch",
  "behavior.record.outside_term": "errors.occurredAtOutsideTerm",
  "behavior.scope.invalid": "errors.scopeInvalid",
  "behavior.record.invalid_status_transition":
    "errors.recordInvalidStatusTransition",
  "behavior.record.already_submitted": "errors.recordAlreadySubmitted",
  "behavior.record.already_reviewed": "errors.recordAlreadyReviewed",
  "behavior.record.cancelled": "errors.recordCancelled",
  "behavior.record.not_submitted": "errors.recordNotSubmitted",
  "behavior.points.duplicate_source": "errors.pointsDuplicateSource",
};

export interface BehaviorUiError {
  message: string;
  traceId?: string;
  details: string[];
}

export function behaviorUiError(
  error: unknown,
  fallbackMessage: string,
  translate?: (key: string) => string,
): BehaviorUiError {
  if (!isApiError(error)) {
    return { message: fallbackMessage, details: [] };
  }

  const messageKey = behaviorErrorMessageKey(error.code);

  return {
    message: messageKey && translate
      ? translate(messageKey)
      : error.message || fallbackMessage,
    traceId: error.traceId,
    details: detailMessages(error.details),
  };
}

export function behaviorErrorMessageKey(code: string): string | null {
  return isBehaviorErrorCode(code) ? behaviorErrorMessageKeys[code] : null;
}

export function isBehaviorErrorCode(code: string): code is BehaviorErrorCode {
  return code in behaviorErrorMessageKeys;
}

function detailMessages(input: unknown): string[] {
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap(detailMessages);
  if (input && typeof input === "object") {
    return Object.values(input).flatMap(detailMessages);
  }
  return [];
}
