import { isApiError } from "@/lib/api-error";

type CalendarErrorMessageKey =
  | "notFound"
  | "invalidScope"
  | "invalidDateRange"
  | "invalidListRange"
  | "invalidPayload"
  | "forbidden"
  | "unexpected";

const errorMessageKeyByCode: Record<string, CalendarErrorMessageKey> = {
  "academics.calendar_event.not_found": "notFound",
  "academics.calendar_event.invalid_scope": "invalidScope",
  "academics.calendar_event.invalid_date_range": "invalidDateRange",
  "academics.calendar_event.invalid_list_range": "invalidListRange",
  "academics.calendar_event.invalid_payload": "invalidPayload",
  "validation.failed": "invalidPayload",
  "auth.scope.missing": "forbidden",
  "auth.token.invalid": "forbidden",
};

export function getCalendarErrorMessage(
  error: unknown,
  translate: (key: CalendarErrorMessageKey) => string
): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : translate("unexpected");
  }

  const messageKey = errorMessageKeyByCode[error.code];
  return messageKey ? translate(messageKey) : error.message;
}
