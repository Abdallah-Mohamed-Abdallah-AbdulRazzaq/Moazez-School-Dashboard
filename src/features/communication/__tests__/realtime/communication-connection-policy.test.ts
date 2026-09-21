import { describe, expect, it } from "vitest";
import {
  classifyConnectionFailure,
  reconnectDelayForAttempt,
  retryDelayFromError,
} from "@/features/communication/realtime/communication-connection-policy";

describe("communication connection policy", () => {
  it.each([401, 403])("classifies status %s as auth", (status) => {
    expect(classifyConnectionFailure({ data: { status } })).toBe("auth");
  });

  it.each(["AUTHENTICATION_ERROR", "UNAUTHORIZED", "FORBIDDEN"])(
    "classifies server code %s as auth",
    (code) => {
      expect(classifyConnectionFailure({ data: { code } })).toBe("auth");
    },
  );

  it.each([{ status: 429 }, { code: "RATE_LIMITED" }])(
    "classifies $status$code as rate-limit",
    (data) => {
      expect(classifyConnectionFailure({ data })).toBe("rate-limit");
    },
  );

  it.each([
    { description: 429 },
    { description: "fetch read error", context: { status: 429 } },
  ])("classifies Engine.IO transport 429 shape %# as rate-limit", (error) => {
    expect(
      classifyConnectionFailure({
        type: "TransportError",
        ...error,
      }),
    ).toBe("rate-limit");
  });

  it.each([new Error("transport close"), { data: { status: 503 } }])(
    "treats temporary failure %# as temporary",
    (error) => {
      expect(classifyConnectionFailure(error)).toBe("temporary");
    },
  );

  it.each([
    [{ data: { retryAfterMs: 12_000 } }, 12_000],
    [{ data: { retryAfter: 15 } }, 15_000],
    [{ data: { retryAfter: -1 } }, undefined],
    [{ data: { retryAfter: "15" } }, undefined],
  ])("parses supported retry delay %#", (error, expectedDelay) => {
    expect(retryDelayFromError(error)).toBe(expectedDelay);
  });

  it("applies capped exponential backoff with deterministic jitter", () => {
    expect(reconnectDelayForAttempt(0, () => 0)).toBe(500);
    expect(reconnectDelayForAttempt(1, () => 0.5)).toBe(2_000);
    expect(reconnectDelayForAttempt(20, () => 1)).toBe(30_000);
  });

  it("disperses 100 first retries across the complete jitter window", () => {
    const retryDelays = Array.from({ length: 100 }, (_, clientIndex) =>
      reconnectDelayForAttempt(0, () => clientIndex / 99),
    );

    expect(retryDelays[0]).toBe(500);
    expect(retryDelays[99]).toBe(1_500);
    expect(new Set(retryDelays).size).toBe(100);
  });
});
