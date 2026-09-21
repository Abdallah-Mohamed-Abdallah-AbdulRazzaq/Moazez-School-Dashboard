import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ioMock = vi.hoisted(() => vi.fn(() => ({ id: "socket" })));

vi.mock("socket.io-client", () => ({ io: ioMock }));

describe("createCommunicationSocket", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_REALTIME_URL", "");
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SOCKET_PATH", "");
    ioMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a bounded websocket-first client", async () => {
    const { createCommunicationSocket } = await import(
      "@/features/communication/realtime/communication-socket"
    );

    createCommunicationSocket("token-1");

    expect(ioMock).toHaveBeenCalledWith(
      "https://api.moazez.sa/api/v1/realtime",
      expect.objectContaining({
        auth: { token: "token-1" },
        autoConnect: false,
        randomizationFactor: 0.5,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 30_000,
        transports: ["websocket", "polling"],
        tryAllTransports: true,
        withCredentials: true,
      }),
    );
  });
});
