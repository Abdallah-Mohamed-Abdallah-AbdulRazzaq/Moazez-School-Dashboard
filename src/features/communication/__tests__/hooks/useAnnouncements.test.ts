import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnnouncements } from "@/features/communication/hooks/useAnnouncements";
import type { Announcement } from "@/features/communication/types/announcement.types";

const getAnnouncements = vi.hoisted(() => vi.fn());

vi.mock("@/features/communication/api/communication.service", () => ({
  getAnnouncements,
}));

const announcement = (id: string) => ({ id, title: id, status: "draft" }) as Announcement;

describe("useAnnouncements", () => {
  beforeEach(() => {
    getAnnouncements.mockReset();
  });

  it("loads later pages without duplicating announcements", async () => {
    getAnnouncements.mockImplementation(({ page }: { page?: number }) => Promise.resolve({
      items: !page || page === 1 ? [announcement("one"), announcement("two")] : [announcement("two"), announcement("three")],
      total: 3,
    }));

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.announcements.map(({ id }) => id)).toEqual(["one", "two"]));

    await act(async () => { await result.current.loadMore(); });
    await waitFor(() => expect(result.current.announcements.map(({ id }) => id)).toEqual(["one", "two", "three"]));
    expect(result.current.hasMore).toBe(false);
  });

  it("keeps the current page and allows retry after a later page fails", async () => {
    getAnnouncements
      .mockResolvedValueOnce({ items: [announcement("one")], total: 2 })
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValueOnce({ items: [announcement("two")], total: 2 });

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(result.current.announcements).toHaveLength(1));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.announcements.map(({ id }) => id)).toEqual(["one"]);
    expect(result.current.hasMore).toBe(true);

    await act(async () => { await result.current.loadMore(); });
    expect(result.current.announcements.map(({ id }) => id)).toEqual(["one", "two"]);
    expect(getAnnouncements.mock.calls[2][0]).toMatchObject({ page: 2, limit: 20 });
  });

  it("keeps the newer filtered results when an older request resolves last", async () => {
    let resolveOlder!: (value: unknown) => void;
    getAnnouncements
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOlder = resolve; }))
      .mockResolvedValue({ items: [announcement("published")], total: 1 });

    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    act(() => result.current.setFilters((current) => ({ ...current, status: "published" })));
    await waitFor(() => expect(result.current.announcements.map(({ id }) => id)).toEqual(["published"]));

    act(() => resolveOlder({ items: [announcement("stale")], total: 1 }));
    await waitFor(() => expect(result.current.announcements.map(({ id }) => id)).toEqual(["published"]));
  });

  it("waits for typing to pause before searching", async () => {
    getAnnouncements.mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => useAnnouncements());
    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    act(() => result.current.setFilters((current) => ({ ...current, search: "school" })));
    act(() => result.current.setFilters((current) => ({ ...current, search: "school news" })));
    expect(getAnnouncements).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(2));
    expect(getAnnouncements.mock.calls[1][0]).toMatchObject({ search: "school news", page: 1, limit: 20 });
  });

  it("refreshes on focus only when the announcement list is stale", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    getAnnouncements.mockResolvedValue({ items: [], total: 0 });
    try {
      renderHook(() => useAnnouncements());
      await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

      act(() => window.dispatchEvent(new Event("focus")));
      expect(getAnnouncements).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_060_001);
      act(() => window.dispatchEvent(new Event("focus")));
      await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(2));
    } finally {
      now.mockRestore();
    }
  });
});
