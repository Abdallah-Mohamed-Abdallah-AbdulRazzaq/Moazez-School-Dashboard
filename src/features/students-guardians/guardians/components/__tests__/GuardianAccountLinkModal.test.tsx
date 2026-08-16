import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import GuardianAccountLinkModal from "@/features/students-guardians/guardians/components/GuardianAccountLinkModal";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

describe("GuardianAccountLinkModal", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({
      items: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          fullName: "Parent One",
          email: "parent.one@school.test",
          loginEmail: "parent.one@school.test",
          roleId: "role-parent",
          roleName: "Parent",
          status: "active",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });
    apiMocks.apiPost.mockReset().mockResolvedValue({
      guardianId: "guardian-1",
      linked: true,
      user: {
        fullName: "Parent One",
        username: "parent.one",
        loginEmail: "parent.one@school.test",
        contactEmail: null,
        userType: "parent",
        roleKey: "parent",
        roleName: "Parent",
        status: "active",
        hasPassword: true,
        mustChangePassword: false,
      },
    });
  });

  it("submits backend link mode with the selected existing user id", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <GuardianAccountLinkModal
          isOpen
          guardian={
            { guardianId: "guardian-1", full_name: "Guardian One" } as never
          }
          onClose={vi.fn()}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "fields.mode" }));
    await user.click(
      screen.getByRole("button", { name: "modes.link_existing" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "fields.search_users" }),
      "Parent",
    );
    await user.click(await screen.findByRole("button", { name: /Parent One/ }));
    await user.click(screen.getByRole("button", { name: "actions.submit" }));

    await waitFor(() =>
      expect(apiMocks.apiPost).toHaveBeenCalledWith(
        "/students-guardians/guardians/guardian-1/account",
        {
          mode: "link",
          userId: "00000000-0000-4000-8000-000000000001",
        },
      ),
    );
  });
});
