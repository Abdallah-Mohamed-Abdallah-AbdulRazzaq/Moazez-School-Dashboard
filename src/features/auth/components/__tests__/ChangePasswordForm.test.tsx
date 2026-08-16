import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "../ChangePasswordForm";

const mockPush = vi.fn();
const mockChangePassword = vi.fn();
const mockRefreshCurrentUser = vi.fn();
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    changePassword: mockChangePassword,
    refreshCurrentUser: mockRefreshCurrentUser,
  }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe("ChangePasswordForm Sprint 11 behavior", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockChangePassword.mockReset();
    mockRefreshCurrentUser.mockReset();
    mockShowSuccess.mockClear();
    mockShowError.mockClear();
  });

  it("validates matching passwords before calling the change-password service", async () => {
    const user = userEvent.setup();
    const { container } = render(<ChangePasswordForm currentYear={2026} />);
    const inputs = container.querySelectorAll("input");

    await user.type(inputs[0], "old-password");
    await user.type(inputs[1], "New-password-1!");
    await user.type(inputs[2], "different-password");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByText("errors.confirmMismatch")).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("calls /auth/change-password through auth state and returns to dashboard", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue(undefined);
    mockRefreshCurrentUser.mockResolvedValue(undefined);

    const { container } = render(<ChangePasswordForm currentYear={2026} />);
    const inputs = container.querySelectorAll("input");

    await user.type(inputs[0], "old-password");
    await user.type(inputs[1], "New-password-1!");
    await user.type(inputs[2], "New-password-1!");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "old-password",
        newPassword: "New-password-1!",
      });
    });
    expect(mockRefreshCurrentUser).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith("messages.success");
    expect(mockPush).toHaveBeenCalledWith("/en/dashboard");
  });
});
