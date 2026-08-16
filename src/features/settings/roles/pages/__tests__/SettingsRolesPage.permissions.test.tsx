import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import SettingsRolesPage from "../SettingsRolesPage";

const authState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      id: "admin-1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      activeMembership: {
        roleKey: "custom_admin",
        permissions: authState.permissions,
      },
    },
  }),
}));

const role = {
  id: "role-1",
  key: "custom_admin",
  name: "Custom Admin",
  description: "Custom administration role",
  isSystem: false,
  memberCount: 2,
  permissions: ["settings.users.view"],
};

const systemRole = {
  ...role,
  id: "system-role-1",
  key: "system_admin",
  name: "System Admin",
  isSystem: true,
};

function renderPage() {
  return render(
    <ToastProvider>
      <SettingsRolesPage />
    </ToastProvider>,
  );
}

describe("SettingsRolesPage permission catalog access", () => {
  beforeEach(() => {
    authState.permissions = ["settings.roles.view"];
    Object.values(apiMocks).forEach((apiMock) => apiMock.mockReset());
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([role]);
      }
      if (path === "/settings/permissions") {
        return Promise.resolve([
          {
            key: "settings.users.view",
            module: "users",
            action: "view",
            label: "View users",
            description: "View users in the school",
          },
          {
            key: "settings.users.manage",
            module: "users",
            action: "manage",
            label: "Manage users",
            description: "Manage users in the school",
          },
          {
            key: "settings.reports.view",
            module: "reports",
            action: "view",
            label: "View reports",
            description: "View reports in the school",
          },
        ]);
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
  });

  it("keeps the role list available without requesting a forbidden catalog", async () => {
    renderPage();

    expect(await screen.findByText("Custom Admin")).toBeInTheDocument();
    expect(
      screen.getByText("permission_matrix_access_required"),
    ).toBeInTheDocument();
    expect(screen.queryByText("save_permissions")).not.toBeInTheDocument();
    expect(apiMocks.apiGet).not.toHaveBeenCalledWith("/settings/permissions");
  });

  it("shows zero in the members cell when a role has no participants", async () => {
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([{ ...role, memberCount: 0 }]);
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });

    renderPage();

    const roleRow = (await screen.findByText("Custom Admin")).closest("tr");
    expect(roleRow).toHaveTextContent("0");
  });

  it("loads the permission matrix when catalog access is granted", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.permissions.view",
    ];

    renderPage();

    expect(
      await screen.findByRole("button", { name: "users" }),
    ).toBeInTheDocument();
    expect(apiMocks.apiGet).toHaveBeenCalledWith("/settings/permissions");
  });

  it("collapses modules and omits unsupported action placeholders", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.permissions.view",
    ];

    const user = userEvent.setup();
    renderPage();

    const usersModule = await screen.findByRole("button", { name: "users" });
    expect(usersModule).toHaveAttribute("aria-expanded", "false");

    await user.click(usersModule);
    expect(await screen.findByText("Users")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("users bulk permissions")).getByText(
        "manage",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "reports" }));
    expect(await screen.findByText("Reports")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /not supported/i })).not.toBeInTheDocument();
  });

  it("keeps loaded roles visible when the catalog request fails", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.permissions.view",
    ];
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([role]);
      }
      return Promise.reject(new Error("catalog unavailable"));
    });

    renderPage();

    expect(await screen.findByText("Custom Admin")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("permission_matrix_load_failed"),
      ).toBeInTheDocument(),
    );
  });

  it("shows disabled edit and delete actions for system roles", async () => {
    authState.permissions = [
      "settings.roles.view",
      "settings.roles.manage",
    ];
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/roles")) {
        return Promise.resolve([systemRole]);
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });

    renderPage();

    expect(await screen.findByText("System Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "edit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
  });
});
