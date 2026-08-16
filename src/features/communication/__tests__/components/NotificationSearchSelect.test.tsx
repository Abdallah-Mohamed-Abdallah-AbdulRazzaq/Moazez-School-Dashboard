import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationSearchSelect from "../../components/selectors/NotificationSearchSelect";

const getNotificationsMock = vi.fn();

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/features/communication/api/communication.service", () => ({
  getNotifications: (...args: unknown[]) => getNotificationsMock(...args),
}));

describe("NotificationSearchSelect", () => {
  beforeEach(() => {
    getNotificationsMock.mockReset();
  });

  it("loads more on scroll and locally filters human-readable notification labels", async () => {
    getNotificationsMock
      .mockResolvedValueOnce({
        items: [
          {
            id: "notification-secret-1",
            title: "Transport delay",
            body: "School buses are delayed",
            type: "system_alert",
            createdAt: "2026-06-28T08:00:00.000Z",
          },
          {
            id: "notification-secret-2",
            body: "Science fair registration is open",
            type: "announcement_published",
          },
        ],
        total: 100,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "notification-secret-2",
            body: "Science fair registration is open",
            type: "announcement_published",
          },
          {
            id: "notification-secret-3",
            title: "Grade report published",
            type: "grade_posted",
          },
          { id: "notification-secret-4" },
        ],
        total: 4,
      });

    const user = userEvent.setup();
    render(
      <NotificationSearchSelect
        label="Notification"
        value=""
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Notification" }));
    expect(getNotificationsMock).toHaveBeenCalledWith({ page: 1, limit: 50 });
    expect(await screen.findByText(/Transport delay - system_alert/)).toBeVisible();
    expect(screen.getByText(/Science fair registration is open/)).toBeVisible();
    expect(screen.queryByText("notification-secret-1")).not.toBeInTheDocument();

    const list = screen.getByRole("list");
    Object.defineProperties(list, {
      clientHeight: { value: 200, configurable: true },
      scrollHeight: { value: 400, configurable: true },
      scrollTop: { value: 200, configurable: true },
    });
    fireEvent.scroll(list);

    expect(await screen.findByText(/Grade report published/)).toBeVisible();
    expect(
      within(screen.getByRole("list")).getByRole("button", {
        name: "Notification",
      }),
    ).toBeVisible();
    expect(getNotificationsMock).toHaveBeenLastCalledWith({ page: 2, limit: 50 });
    expect(screen.getAllByText(/Science fair registration is open/)).toHaveLength(1);

    await user.type(screen.getByPlaceholderText("Search loaded notifications..."), "grade");
    await waitFor(() => {
      expect(screen.getByText(/Grade report published/)).toBeVisible();
      expect(screen.queryByText(/Transport delay/)).not.toBeInTheDocument();
    });
  });
});
