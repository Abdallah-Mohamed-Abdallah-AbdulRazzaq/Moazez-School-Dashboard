import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiPost } from "@/lib/api";
import UserProvisioningModal from "../UserProvisioningModal";
import type { SettingsUserRecord } from "@/features/settings/types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const savedUser: SettingsUserRecord = {
  id: "user-1",
  fullName: "Amina Parent",
  username: "amina",
  email: "amina@school.test",
  contactEmail: "amina@example.test",
  roleId: "parent-role",
  status: "invited",
};

describe("UserProvisioningModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates and reveals a temporary password after the user is saved", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(apiPost).mockResolvedValue({
      user: {
        userId: savedUser.id,
        fullName: savedUser.fullName,
        username: savedUser.username,
        loginEmail: savedUser.email,
      },
      temporaryPassword: "one-time-secret",
      mustChangePassword: true,
      generatedAt: "2026-07-29T12:00:00Z",
      credentialVersion: 1,
    });

    render(
      <UserProvisioningModal
        isOpen
        user={savedUser}
        canGenerate
        canDeliver
        onDeliver={vi.fn()}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "generate" }));

    expect(await screen.findByText("one-time-secret")).toBeInTheDocument();
    expect(screen.queryByText("separate_outcomes")).not.toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith(
      "/settings/users/user-1/credentials/generate",
    );

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("hands the saved user to delivery without generating a secret", async () => {
    const user = userEvent.setup();
    const onDeliver = vi.fn();

    render(
      <UserProvisioningModal
        isOpen
        user={savedUser}
        canGenerate
        canDeliver
        onDeliver={onDeliver}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "deliver" }));

    await waitFor(() => expect(onDeliver).toHaveBeenCalledWith(savedUser));
    expect(apiPost).not.toHaveBeenCalled();
  });
});
