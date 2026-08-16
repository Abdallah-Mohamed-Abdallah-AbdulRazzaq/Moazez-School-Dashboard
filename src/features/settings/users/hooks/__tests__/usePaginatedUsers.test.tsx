import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSettingsUsers } from "@/features/settings/services/settingsUsersService";
import { usePaginatedUsers } from "../usePaginatedUsers";
import type { SettingsUserRecord } from "@/features/settings/types";

vi.mock("@/features/settings/services/settingsUsersService", () => ({
  fetchSettingsUsers: vi.fn(),
}));

const mockedFetchSettingsUsers = vi.mocked(fetchSettingsUsers);

function user(id: string): SettingsUserRecord {
  return {
    id,
    fullName: `User ${id}`,
    email: `${id}@example.com`,
    roleId: "role-1",
    status: "active",
  };
}

describe("usePaginatedUsers", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("loads the empty-query first page and appends unique later-page users", async () => {
    mockedFetchSettingsUsers
      .mockResolvedValueOnce({
        items: [user("1"), user("2")],
        pagination: { page: 1, limit: 2, total: 3 },
      })
      .mockResolvedValueOnce({
        items: [user("2"), user("3")],
        pagination: { page: 2, limit: 2, total: 3 },
      });

    const { result } = renderHook(() =>
      usePaginatedUsers({
        enabled: true,
        query: "",
        roleId: "role-1",
        status: "active",
        limit: 2,
      }),
    );

    await waitFor(() => expect(result.current.users).toHaveLength(2));
    expect(mockedFetchSettingsUsers).toHaveBeenNthCalledWith(1, {
      search: undefined,
      page: 1,
      limit: 2,
      roleId: "role-1",
      status: "active",
    });

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.users.map((item) => item.id)).toEqual([
        "1",
        "2",
        "3",
      ]),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it("debounces server search and ignores an older response", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let resolveOld:
      | ((value: Awaited<ReturnType<typeof fetchSettingsUsers>>) => void)
      | undefined;

    mockedFetchSettingsUsers
      .mockResolvedValueOnce({
        items: [user("initial")],
        pagination: { page: 1, limit: 20, total: 1 },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({
        items: [user("new")],
        pagination: { page: 1, limit: 20, total: 1 },
      });

    const { result, rerender } = renderHook(
      ({ query }) => usePaginatedUsers({ enabled: true, query }),
      { initialProps: { query: "" } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await waitFor(() => expect(result.current.users).toHaveLength(1));

    rerender({ query: "old" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mockedFetchSettingsUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "old", page: 1 }),
    );

    rerender({ query: "new" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() =>
      expect(result.current.users.map((item) => item.id)).toEqual(["new"]),
    );

    await act(async () => {
      resolveOld?.({
        items: [user("stale")],
        pagination: { page: 1, limit: 20, total: 1 },
      });
    });
    expect(result.current.users.map((item) => item.id)).toEqual(["new"]);
  });

  it("does not request users while disabled", () => {
    renderHook(() => usePaginatedUsers({ enabled: false, query: "" }));
    expect(mockedFetchSettingsUsers).not.toHaveBeenCalled();
  });
});
