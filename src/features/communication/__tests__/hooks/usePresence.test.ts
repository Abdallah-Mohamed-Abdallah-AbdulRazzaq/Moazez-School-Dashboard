import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresence } from "@/features/communication/hooks/usePresence";

describe("usePresence", () => {
  it("maps backend online state without treating updatedAt as last seen", () => {
    const { result } = renderHook(() => usePresence());

    act(() => {
      result.current.handlePresenceUpdated({
        userId: "user-1",
        status: "online",
        online: true,
        updatedAt: "2026-07-26T10:00:00.000Z",
      });
    });

    expect(result.current.presenceByUserId["user-1"]).toEqual({
      userId: "user-1",
      status: "online",
      isOnline: true,
    });
  });

  it.each([
    ["online", true],
    ["offline", false],
  ])("uses the backend %s status when an online flag is absent", (status, isOnline) => {
    const { result } = renderHook(() => usePresence());

    act(() => {
      result.current.handlePresenceUpdated({ userId: "user-1", status });
    });

    expect(result.current.presenceByUserId["user-1"]?.isOnline).toBe(isOnline);
  });

  it("hides and ignores presence when online presence is disabled", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => usePresence({ enabled }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      result.current.handlePresenceUpdated({ userId: "user-1", online: true });
    });
    rerender({ enabled: false });

    expect(result.current.presenceByUserId).toEqual({});

    act(() => {
      result.current.handlePresenceUpdated({ userId: "user-2", online: true });
    });

    expect(result.current.presenceByUserId).toEqual({});
  });
});
