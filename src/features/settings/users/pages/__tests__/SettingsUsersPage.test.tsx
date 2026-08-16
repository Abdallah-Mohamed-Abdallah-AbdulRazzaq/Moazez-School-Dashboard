import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SettingsUsersPage from "../SettingsUsersPage";

const mocks = vi.hoisted(() => ({
  fetchSettingsUsers: vi.fn(),
  fetchAllSettingsRoles: vi.fn(),
  setSettingsUserStatus: vi.fn(),
  translate: (key: string) => key,
  router: { push: vi.fn(), replace: vi.fn() },
  showSuccess: vi.fn(),
  showError: vi.fn(),
  permissions: new Set<string>(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => mocks.translate,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/settings/users",
  useRouter: () => mocks.router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => mocks.permissions.has(permission),
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: mocks.showSuccess,
    showError: mocks.showError,
  }),
}));

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchAllSettingsRoles: mocks.fetchAllSettingsRoles,
}));

vi.mock("@/features/settings/services/settingsUsersService", () => ({
  createSettingsUser: vi.fn(),
  fetchSettingsUsers: mocks.fetchSettingsUsers,
  inviteSettingsUser: vi.fn(),
  setSettingsUserStatus: mocks.setSettingsUserStatus,
  updateSettingsUser: vi.fn(),
}));

describe("SettingsUsersPage search", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.fetchAllSettingsRoles.mockReset();
    mocks.fetchSettingsUsers.mockReset();
    mocks.setSettingsUserStatus.mockReset();
    mocks.permissions.clear();
    [
      "settings.users.view",
      "settings.users.manage",
      "settings.email.credential_deliveries.manage",
      "teachers.records.view",
    ].forEach((permission) => mocks.permissions.add(permission));
    mocks.fetchAllSettingsRoles.mockResolvedValue([]);
    mocks.setSettingsUserStatus.mockResolvedValue({
      id: "user-1",
      status: "inactive",
    });
    mocks.fetchSettingsUsers.mockImplementation(({ search }) => {
      const items =
        search === "amina"
          ? [
              {
                id: "user-1",
                fullName: "Amina Hassan",
                username: "amina",
                email: "amina@school.test",
                roleId: "role-1",
                status: "active",
              },
            ]
          : [];
      return Promise.resolve({
        items,
        pagination: { page: 1, limit: 10, total: items.length },
      });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps the current users visible until the search debounce expires", async () => {
    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.queryByText("Amina Hassan")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "amina" },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByText("Amina Hassan")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(299);
      await Promise.resolve();
    });
    expect(screen.queryByText("Amina Hassan")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Amina Hassan")).toBeVisible();
  });

  it("gives the directory search an accessible name", async () => {
    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("textbox", { name: "search" }),
    ).toBeInTheDocument();
  });

  it("keeps the directory usable when role filters fail to load", async () => {
    mocks.fetchAllSettingsRoles.mockRejectedValue(new Error("roles offline"));
    mocks.fetchSettingsUsers.mockResolvedValue({
      items: [
        {
          id: "user-1",
          fullName: "Amina Hassan",
          email: "amina@school.test",
          roleId: "role-1",
          roleName: "Parent",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });

    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Amina Hassan")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("roles.load_failed");
  });

  it("shows an inline retry when the user directory fails to load", async () => {
    mocks.fetchSettingsUsers
      .mockRejectedValueOnce(new Error("users offline"))
      .mockResolvedValueOnce({
        items: [
          {
            id: "user-1",
            fullName: "Recovered User",
            email: "recovered@school.test",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1 },
      });

    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "messages.retry" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Recovered User")).toBeVisible();
  });

  it("requests only page one when a paginated search settles", async () => {
    mocks.fetchSettingsUsers.mockImplementation(({ search, page }) => {
      const fullName = search ? "Filtered User" : `User page ${page}`;
      return Promise.resolve({
        items: [
          {
            id: `user-${search || page}`,
            fullName,
            email: "user@school.test",
            roleId: "role-1",
            status: "active",
          },
        ],
        pagination: { page: page ?? 1, limit: 10, total: 20 },
      });
    });

    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    mocks.fetchSettingsUsers.mockClear();

    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "amina" },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.fetchSettingsUsers).toHaveBeenCalledOnce();
    expect(mocks.fetchSettingsUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: "amina" }),
    );
  });

  it("confirms account deactivation before changing status", async () => {
    mocks.fetchAllSettingsRoles.mockResolvedValue([
      {
        id: "role-1",
        key: "parent",
        name: "Parent",
        permissions: [],
      },
    ]);
    mocks.fetchSettingsUsers.mockResolvedValue({
      items: [
        {
          id: "user-1",
          fullName: "Amina Hassan",
          email: "amina@school.test",
          roleId: "role-1",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });

    await act(async () => {
      render(<SettingsUsersPage />);
      await Promise.resolve();
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "open_actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "deactivate" }));

    expect(mocks.setSettingsUserStatus).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "status_change.deactivate_title",
    );

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "deactivate",
      }),
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.setSettingsUserStatus).toHaveBeenCalledWith(
      "user-1",
      "inactive",
    );
  });
});
