import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  fetchAllSettingsRoles: vi.fn(),
}));

vi.mock("@/features/settings/services/settingsRolesService", () => ({
  fetchAllSettingsRoles: serviceMocks.fetchAllSettingsRoles,
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({ showSuccess: vi.fn() }),
}));

vi.mock("@/features/settings/components/SettingsAccessGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import CredentialDeliveriesPage from "../CredentialDeliveriesPage";

describe("CredentialDeliveriesPage role recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps other audiences usable and retries a failed role request", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchAllSettingsRoles
      .mockRejectedValueOnce(new Error("roles unavailable"))
      .mockResolvedValueOnce([
        {
          id: "role-1",
          key: "teacher",
          name: "Teacher",
          description: "Teachers",
          isSystem: true,
          memberCount: 24,
          permissions: [],
        },
      ]);
    render(<CredentialDeliveriesPage />);

    await user.click(screen.getByRole("button", { name: "audience.mode" }));
    await user.click(
      screen.getByRole("button", { name: "audience.options.role" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "audience.roles_load_failed",
    );
    expect(screen.getByRole("button", { name: "audience.roles_retry" }))
      .toBeEnabled();

    await user.click(
      screen.getByRole("button", { name: "audience.roles_retry" }),
    );

    await waitFor(() =>
      expect(serviceMocks.fetchAllSettingsRoles).toHaveBeenCalledTimes(2),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "audience.role_id" }));
    expect(
      screen.getByRole("button", { name: "audience.role_option" }),
    ).toBeVisible();
  });
});
