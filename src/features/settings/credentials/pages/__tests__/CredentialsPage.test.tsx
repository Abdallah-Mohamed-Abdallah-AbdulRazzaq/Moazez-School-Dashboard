import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import CredentialsPage from "@/features/settings/credentials/pages/CredentialsPage";

const loadedRole = {
  roleId: "role-teacher",
  roleKey: "teacher",
  roleName: "Educators",
};

let fetchRolesResponse: () => Promise<unknown>;
let fetchSettingsRolesResponse: () => Promise<unknown>;

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
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
        roleKey: "admin",
        permissions: ["settings.users.view", "settings.users.manage"],
      },
    },
  }),
}));

describe("CredentialsPage filters", () => {
  beforeEach(() => {
    fetchRolesResponse = () =>
      Promise.resolve({
        items: [],
        pagination: { page: 1, limit: 100, total: 0 },
      });
    fetchSettingsRolesResponse = () =>
      Promise.resolve({
        items: [],
        pagination: { page: 1, limit: 100, total: 0 },
      });
    apiMocks.apiPost.mockReset();
    apiMocks.apiGet.mockReset().mockImplementation((path: string) => {
      if (path.startsWith("/settings/users/credentials/status")) {
        if (path.includes("limit=100")) {
          return fetchRolesResponse();
        }
        return Promise.resolve({
          items: [],
          pagination: { page: 1, limit: 10, total: 0 },
        });
      }
      if (path.startsWith("/settings/roles")) {
        return fetchSettingsRolesResponse();
      }

      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
  });

  async function renderOpenFilters() {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <CredentialsPage />
      </ToastProvider>,
    );
    await screen.findByText("empty.title");
    await user.click(screen.getByRole("button", { name: "filters.button" }));
    return user;
  }

  function roleFilterTrigger() {
    const roleFilter = screen.getByText("filters.role").parentElement;
    return within(roleFilter as HTMLElement).getByRole("button");
  }

  it("keeps the page visible while credentials load in the table", async () => {
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path.startsWith("/settings/users/credentials/status")) {
        if (path.includes("limit=100")) {
          return fetchRolesResponse();
        }
        return new Promise(() => undefined);
      }
      if (path.startsWith("/settings/roles")) {
        return fetchSettingsRolesResponse();
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });

    render(
      <ToastProvider>
        <CredentialsPage />
      </ToastProvider>,
    );

    expect(await screen.findByText("title")).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("empty.title")).not.toBeInTheDocument();
  });

  it("does not expose the unsupported user status filter", async () => {
    await renderOpenFilters();

    expect(screen.getByText("filters.role")).toBeInTheDocument();
    expect(screen.getByText("filters.has_password")).toBeInTheDocument();
    expect(screen.getByText("filters.must_change")).toBeInTheDocument();
    expect(screen.queryByText("filters.status")).not.toBeInTheDocument();
    expect(screen.queryByText("statuses.active")).not.toBeInTheDocument();
    expect(screen.queryByText("statuses.invited")).not.toBeInTheDocument();
    expect(screen.queryByText("statuses.inactive")).not.toBeInTheDocument();
  });

  it("keeps credentials usable and retries a failed role load on open", async () => {
    const roleRequest = vi
      .fn()
      .mockRejectedValueOnce(new Error("roles unavailable"))
      .mockResolvedValueOnce({
        items: [loadedRole],
        pagination: { page: 1, limit: 100, total: 1 },
      });
    fetchRolesResponse = roleRequest;
    fetchSettingsRolesResponse = () =>
      Promise.resolve({
        items: [{ id: loadedRole.roleId, name: loadedRole.roleName }],
        pagination: { page: 1, limit: 100, total: 1 },
      });
    const user = await renderOpenFilters();

    expect(screen.getByText("empty.title")).toBeInTheDocument();
    expect(await screen.findByText("filters.roles_error")).toBeInTheDocument();
    await user.click(roleFilterTrigger());

    await waitFor(() => expect(roleRequest).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText("filters.roles_loading")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("filters.roles_error")).not.toBeInTheDocument();
  });

  it("does not duplicate an in-flight role request when opened", async () => {
    const pendingRoles = new Promise(() => undefined);
    const roleRequest = vi.fn(() => pendingRoles);
    fetchRolesResponse = roleRequest;
    const user = await renderOpenFilters();

    await waitFor(() => expect(roleRequest).toHaveBeenCalledTimes(1));
    expect(screen.getByText("filters.roles_loading")).toBeInTheDocument();
    await user.click(roleFilterTrigger());
    expect(roleRequest).toHaveBeenCalledTimes(1);
  });

  it("shows an empty role state without failing credentials", async () => {
    await renderOpenFilters();

    expect(await screen.findByText("filters.roles_empty")).toBeInTheDocument();
    expect(screen.getByText("empty.title")).toBeInTheDocument();
  });

  it("shows every settings role and filters known roles with the backend role key", async () => {
    fetchRolesResponse = () =>
      Promise.resolve({
        items: [loadedRole],
        pagination: { page: 1, limit: 100, total: 1 },
      });
    fetchSettingsRolesResponse = () =>
      Promise.resolve({
        items: [
          { id: loadedRole.roleId, name: loadedRole.roleName },
          { id: "role-empty", name: "Empty Custom Role" },
        ],
        pagination: { page: 1, limit: 100, total: 2 },
      });
    const user = await renderOpenFilters();

    await user.click(roleFilterTrigger());
    expect(
      await screen.findByRole("button", { name: "Empty Custom Role" }),
    ).toBeDisabled();
    await user.click(await screen.findByText("Educators"));

    await waitFor(() =>
      expect(apiMocks.apiGet).toHaveBeenCalledWith(
        expect.stringContaining("roleKey=teacher"),
      ),
    );
  });
});
