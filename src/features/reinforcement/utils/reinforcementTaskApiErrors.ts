import { isApiError } from "@/lib/api-error";
import type { ReinforcementTaskStatus } from "../types";

export type ReinforcementTaskApiErrorField =
  | "title"
  | "targets"
  | "dueDate"
  | "cancelReason";

export interface ReinforcementTaskApiErrorDescriptor {
  field?: ReinforcementTaskApiErrorField;
  messageKey: string;
}

const isErrorDetails = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function validationFeedback(details: unknown): ReinforcementTaskApiErrorDescriptor {
  const field = isErrorDetails(details) && typeof details.field === "string"
    ? details.field
    : "";
  if (field === "titleEn" || field === "titleAr") {
    return { field: "title", messageKey: "validation.titleRequired" };
  }
  if (field === "dueDate" || (isErrorDetails(details) && (details.dueFrom || details.dueTo))) {
    return { field: "dueDate", messageKey: "validation.invalidDueDateRange" };
  }
  return { messageKey: "common.validationError" };
}

export function describeReinforcementTaskApiError(
  error: unknown,
): ReinforcementTaskApiErrorDescriptor {
  if (!isApiError(error)) return { messageKey: "common.error" };
  if (error.code === "reinforcement.task.duplicate_target") {
    return { field: "targets", messageKey: "validation.duplicateTarget" };
  }
  if (error.code === "reinforcement.task.cancelled") {
    return { messageKey: "tasks.messages.alreadyCancelled" };
  }
  return error.isValidationError()
    ? validationFeedback(error.details)
    : { messageKey: "common.error" };
}

export function shouldIncludeCancelledTasks(
  status: ReinforcementTaskStatus | "",
  includeCancelled: boolean,
): boolean {
  return includeCancelled || status === "cancelled";
}
