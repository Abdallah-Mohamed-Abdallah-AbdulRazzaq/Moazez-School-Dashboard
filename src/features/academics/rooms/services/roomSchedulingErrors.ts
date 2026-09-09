import { isApiError } from "@/lib/api-error";

export type RoomSchedulingUiError = {
  code: string;
  message: string;
  operation?: string;
  dependencyCounts: Record<string, number>;
  traceId?: string;
};

export function roomSchedulingUiError(error: unknown): RoomSchedulingUiError | null {
  if (!isApiError(error)) return null;

  const details = error.details;
  const dependencyCounts =
    details && typeof details === "object"
      ? Object.fromEntries(
          Object.entries(details).filter(
            ([, value]) => typeof value === "number" && Number.isFinite(value),
          ),
        )
      : {};
  const operation =
    details && typeof details === "object" && "operation" in details && typeof details.operation === "string"
      ? details.operation
      : undefined;

  return {
    code: error.code,
    message: error.message,
    operation,
    dependencyCounts,
    traceId: error.traceId,
  };
}
