import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let getNotificationDeliveriesMock: ReturnType<typeof vi.fn>;

vi.mock("@/features/communication/api/communication.service", () => ({
  getNotificationDeliveries: (...args: unknown[]) =>
    getNotificationDeliveriesMock(...args),
}));

import { useNotificationDeliveries } from "@/features/communication/hooks/useNotificationDeliveries";

describe("useNotificationDeliveries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getNotificationDeliveriesMock = vi
      .fn()
      .mockResolvedValue({ items: [], total: 0 });
  });

  it("does not create a polling interval", async () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    renderHook(() => useNotificationDeliveries());

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(1),
    );
    expect(
      setIntervalSpy.mock.calls.some(([, delay]) => delay === 60_000),
    ).toBe(false);
  });

  it("requests the first page with the default delivery table page size", async () => {
    renderHook(() => useNotificationDeliveries());

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(1),
    );
    expect(getNotificationDeliveriesMock).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it("updates server pagination params and stores backend metadata", async () => {
    getNotificationDeliveriesMock.mockResolvedValueOnce({
      items: [],
      total: 42,
      page: 1,
      limit: 10,
      totalPages: 5,
    });

    const { result } = renderHook(() => useNotificationDeliveries());

    await waitFor(() =>
      expect(result.current.pagination).toEqual({
        total: 42,
        page: 1,
        limit: 10,
        totalPages: 5,
      }),
    );

    getNotificationDeliveriesMock.mockResolvedValueOnce({
      items: [],
      total: 42,
      page: 2,
      limit: 10,
      totalPages: 5,
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(2),
    );
    expect(getNotificationDeliveriesMock).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
    });

    getNotificationDeliveriesMock.mockResolvedValueOnce({
      items: [],
      total: 42,
      page: 1,
      limit: 25,
      totalPages: 2,
    });

    act(() => {
      result.current.setLimit(25);
    });

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(3),
    );
    expect(getNotificationDeliveriesMock).toHaveBeenLastCalledWith({
      page: 1,
      limit: 25,
    });
  });

  it("applies exact filters as ISO query params and resets pagination", async () => {
    const { result } = renderHook(() => useNotificationDeliveries());

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenCalledTimes(1),
    );

    act(() => result.current.setPage(3));
    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenLastCalledWith({
        page: 3,
        limit: 10,
      }),
    );

    act(() => {
      result.current.setFilters({
        notificationId: "notification-1",
        recipientUserId: "user-1",
        channel: "email",
        status: "failed",
        provider: "  sendgrid  ",
        createdFrom: "2026-06-01T00:00",
        createdTo: "2026-06-28T23:59",
      });
    });

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        notificationId: "notification-1",
        recipientUserId: "user-1",
        channel: "email",
        status: "failed",
        provider: "sendgrid",
        createdFrom: new Date("2026-06-01T00:00").toISOString(),
        createdTo: new Date("2026-06-28T23:59").toISOString(),
      }),
    );

    act(() => {
      result.current.setFilters({
        notificationId: "",
        recipientUserId: "",
        channel: "",
        status: "",
        provider: "",
        createdFrom: "",
        createdTo: "",
      });
    });

    await waitFor(() =>
      expect(getNotificationDeliveriesMock).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
      }),
    );
  });
});
