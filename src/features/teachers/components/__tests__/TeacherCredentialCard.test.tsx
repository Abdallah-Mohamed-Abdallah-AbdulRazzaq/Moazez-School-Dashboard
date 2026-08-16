import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { apiPost } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import TeacherCredentialCard from "../TeacherCredentialCard";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

function renderCredentialCard(
  teacher = teacherFixture,
  canManage = true,
  onChanged = vi.fn().mockResolvedValue(undefined),
) {
  render(
    <ToastProvider>
      <TeacherCredentialCard teacher={teacher} canManage={canManage} onChanged={onChanged} />
    </ToastProvider>,
  );
  return onChanged;
}

describe("TeacherCredentialCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiPost).mockResolvedValue({
      user: { userId: "user-1", fullName: "Nour Ali", username: "nour.ali", loginEmail: "nour@school.test", contactEmail: null },
      temporaryPassword: "one-time-secret",
      mustChangePassword: true,
      generatedAt: "2026-07-21T09:00:00Z",
      credentialVersion: 2,
    });
  });

  it("generates with teacher.userId, reveals once, and refreshes detail", async () => {
    const user = userEvent.setup();
    const teacher = { ...teacherFixture, credentialSummary: { ...teacherFixture.credentialSummary, hasPassword: false, status: "missing" as const } };
    const onChanged = renderCredentialCard(teacher);

    await user.click(screen.getByRole("button", { name: "actions.generate" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "actions.generate" }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith("/settings/users/user-1/credentials/generate"));
    expect(await screen.findByText("one-time-secret")).toBeVisible();
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("hides credential mutations without credential-management permission", () => {
    renderCredentialCard(teacherFixture, false);
    expect(screen.queryByRole("button", { name: "actions.regenerate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "actions.set_password" })).not.toBeInTheDocument();
  });

  it("keeps password-policy errors on the custom-password form", async () => {
    const user = userEvent.setup();
    vi.mocked(apiPost).mockRejectedValue(new ApiError("Password policy failed", 422, "iam.credentials.password_policy_failed"));
    renderCredentialCard();

    await user.click(screen.getByRole("button", { name: "actions.set_password" }));
    await user.type(screen.getByLabelText("set.password"), "SecurePass!2026");
    await user.type(screen.getByLabelText("set.confirm_password"), "SecurePass!2026");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("Password policy failed")).toBeVisible();
  });

  it("submits a custom password that meets the credential policy", async () => {
    const user = userEvent.setup();
    renderCredentialCard();

    await user.click(screen.getByRole("button", { name: "actions.set_password" }));
    await user.type(screen.getByLabelText("set.password"), "SecurePass!2026");
    await user.type(screen.getByLabelText("set.confirm_password"), "SecurePass!2026");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith(
      "/settings/users/user-1/credentials/set",
      { password: "SecurePass!2026", forceResetOnLogin: true },
    ));
  });

  it("does not offer credential actions for suspended accounts", () => {
    renderCredentialCard({ ...teacherFixture, accountStatus: "SUSPENDED" });
    expect(screen.getByText("credentials.management_unavailable")).toBeVisible();
    expect(screen.queryByRole("button", { name: "actions.regenerate" })).not.toBeInTheDocument();
  });
});
