export type CommunicationConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "auth-error"
  | "degraded";

export type CommunicationConnectionFailure =
  | "auth"
  | "rate-limit"
  | "temporary";

export const RECONNECTION_ATTEMPTS = 8;
export const RECONNECTION_DELAY_MS = 1_000;
export const RECONNECTION_DELAY_MAX_MS = 30_000;
export const RECONNECTION_RANDOMIZATION_FACTOR = 0.5;
export const RECONNECTION_COOLDOWN_MS = 60_000;

interface ConnectionErrorFields {
  code?: unknown;
  retryAfter?: unknown;
  retryAfterMs?: unknown;
  status?: unknown;
}

function connectionErrorFields(error: unknown): ConnectionErrorFields {
  if (!error || typeof error !== "object") return {};

  const outerFields = error as ConnectionErrorFields & { data?: unknown };
  const nestedFields =
    outerFields.data && typeof outerFields.data === "object"
      ? (outerFields.data as ConnectionErrorFields)
      : {};

  return {
    code: nestedFields.code ?? outerFields.code,
    retryAfter: nestedFields.retryAfter ?? outerFields.retryAfter,
    retryAfterMs: nestedFields.retryAfterMs ?? outerFields.retryAfterMs,
    status: nestedFields.status ?? outerFields.status,
  };
}

export function classifyConnectionFailure(
  error: unknown,
): CommunicationConnectionFailure {
  const { code, status } = connectionErrorFields(error);
  if (
    status === 401 ||
    status === 403 ||
    code === "AUTHENTICATION_ERROR" ||
    code === "UNAUTHORIZED" ||
    code === "FORBIDDEN"
  ) {
    return "auth";
  }

  return status === 429 || code === "RATE_LIMITED"
    ? "rate-limit"
    : "temporary";
}

export function retryDelayFromError(error: unknown): number | undefined {
  const { retryAfter, retryAfterMs } = connectionErrorFields(error);
  if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
    return retryAfterMs;
  }
  if (typeof retryAfter === "number" && retryAfter > 0) {
    return retryAfter * 1_000;
  }
  return undefined;
}

export function reconnectDelayForAttempt(
  attempt: number,
  random: () => number = Math.random,
): number {
  const exponentialDelay = Math.min(
    RECONNECTION_DELAY_MS * 2 ** Math.max(0, attempt),
    RECONNECTION_DELAY_MAX_MS,
  );
  const jitterMultiplier =
    1 + RECONNECTION_RANDOMIZATION_FACTOR * (2 * random() - 1);
  return Math.min(
    Math.round(exponentialDelay * jitterMultiplier),
    RECONNECTION_DELAY_MAX_MS,
  );
}
