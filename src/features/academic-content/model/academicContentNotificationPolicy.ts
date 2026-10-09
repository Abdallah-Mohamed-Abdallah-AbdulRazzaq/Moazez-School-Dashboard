import type {
  AcademicContentNotificationPolicy,
  UpdateAcademicContentNotificationPolicyRequest,
} from "../types/contracts";

export type ReminderOffsetError = "invalid" | "range" | "too_many";

export function parseReminderOffsets(input: string): {
  value: number[];
  error: ReminderOffsetError | null;
} {
  const tokens = input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return { value: [], error: null };
  if (tokens.some((token) => !/^\d+$/u.test(token))) {
    return { value: [], error: "invalid" };
  }

  const value = [...new Set(tokens.map(Number))].sort(
    (left, right) => left - right,
  );
  if (value.some((offset) => offset < 5 || offset > 10_080)) {
    return { value: [], error: "range" };
  }
  if (value.length > 5) return { value: [], error: "too_many" };
  return { value, error: null };
}

export function notificationPolicyChanges(
  original: AcademicContentNotificationPolicy,
  draft: AcademicContentNotificationPolicy,
): UpdateAcademicContentNotificationPolicyRequest {
  const changes: UpdateAcademicContentNotificationPolicyRequest = {};
  for (const key of Object.keys(original) as Array<
    keyof AcademicContentNotificationPolicy
  >) {
    const originalValue = original[key];
    const draftValue = draft[key];
    const isEqual =
      Array.isArray(originalValue) && Array.isArray(draftValue)
        ? originalValue.length === draftValue.length &&
          originalValue.every((value, index) => value === draftValue[index])
        : originalValue === draftValue;
    if (!isEqual) Object.assign(changes, { [key]: draftValue });
  }
  return changes;
}
