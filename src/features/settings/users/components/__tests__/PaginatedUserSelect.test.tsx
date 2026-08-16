import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import PaginatedUserSelect from "../PaginatedUserSelect";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      select: "Select a user",
      search_placeholder: "Search users...",
      loading: "Loading users...",
      loading_more: "Loading more users...",
      no_users: "No users found",
      load_failed: "Unable to load users.",
      load_more_failed: "Unable to load more users.",
      permission_denied: "Permission denied",
      retry: "Retry",
    })[key] ?? key,
}));

const mockedApiGet = vi.mocked(apiGet);

describe("PaginatedUserSelect", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("loads on open, searches on the server, and appends the next page", async () => {
    const user = userEvent.setup();
    mockedApiGet
      .mockResolvedValueOnce({
        items: [
          {
            id: "user-1",
            fullName: "First User",
            email: "first@example.com",
            loginEmail: "first@example.com",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: 1, limit: 20, total: 21 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "user-2",
            fullName: "Second User",
            email: "second@example.com",
            loginEmail: "second@example.com",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: 2, limit: 20, total: 21 },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "user-3",
            fullName: "Searched User",
            email: "searched@example.com",
            loginEmail: "searched@example.com",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1 },
      });

    render(
      <PaginatedUserSelect
        label="User"
        value=""
        roleId="role-1"
        status="active"
        onChange={vi.fn()}
      />,
    );

    expect(mockedApiGet).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "User" }));
    await screen.findByText(/First User/);
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/settings/users?page=1&limit=20&roleId=role-1&status=active",
    );

    const firstOption = screen.getByRole("button", {
      name: /First User/,
    });
    const list = firstOption.closest("ul") as HTMLUListElement;
    Object.defineProperties(list, {
      scrollHeight: { configurable: true, value: 100 },
      scrollTop: { configurable: true, value: 60 },
      clientHeight: { configurable: true, value: 40 },
    });
    fireEvent.scroll(list);
    await screen.findByText(/Second User/);
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/settings/users?page=2&limit=20&roleId=role-1&status=active",
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const search = screen.getByPlaceholderText("Search users...");
    fireEvent.change(search, { target: { value: "searched" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await waitFor(() => expect(screen.getByText(/Searched User/)).toBeVisible());
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/settings/users?search=searched&page=1&limit=20&roleId=role-1&status=active",
    );
  });
});
