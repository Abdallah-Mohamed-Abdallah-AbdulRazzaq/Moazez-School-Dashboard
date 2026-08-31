import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import CredentialModeForm from "../CredentialModeForm";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

async function chooseMode(user: ReturnType<typeof userEvent.setup>, mode: string) {
  await user.click(screen.getByRole("button", { name: /Credential mode/ }));
  await user.click(screen.getByRole("button", { name: mode }));
}

describe("CredentialModeForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("offers all three exact modes and limits password fields to admin-provided mode", async () => {
    const user = userEvent.setup();
    render(<CredentialModeForm enabled onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Credential mode/ }));
    expect(screen.getByRole("button", { name: "Unique generated" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shared temporary" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Administrator-provided shared" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Administrator-provided shared" }),
    );

    expect(screen.getByLabelText(/^Password/)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText(/^Confirm password/)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("shows immediate policy guidance and submits the exact untrimmed password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CredentialModeForm enabled onSubmit={onSubmit} />);
    await chooseMode(user, "Administrator-provided shared");

    const password = screen.getByLabelText(/^Password/);
    const confirmation = screen.getByLabelText(/^Confirm password/);
    await user.type(password, "short");

    expect(screen.getByText("At least 12 characters")).toHaveAttribute(
      "data-valid",
      "false",
    );
    expect(screen.getByText("One uppercase letter")).toHaveAttribute(
      "data-valid",
      "false",
    );

    await user.clear(password);
    await user.type(password, "  F2Admin!Pass123  ");
    await user.type(confirmation, "  F2Admin!Pass123  ");
    await user.click(screen.getByRole("button", { name: "Create credentials" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        credentialMode: "shared_admin_provided",
        sharedPassword: "  F2Admin!Pass123  ",
      }),
    );
    expect(password).toHaveValue("");
    expect(confirmation).toHaveValue("");
  });

  it("blocks confirmation mismatch and clears secrets on mode change and cancel", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(
      <CredentialModeForm enabled onSubmit={onSubmit} onCancel={onCancel} />,
    );
    await chooseMode(user, "Administrator-provided shared");

    const password = screen.getByLabelText(/^Password/);
    const confirmation = screen.getByLabelText(/^Confirm password/);
    await user.type(password, "F2Admin!Pass123");
    await user.type(confirmation, "F2Admin!Pass124");
    expect(screen.getByText("Passwords must match.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create credentials" })).toBeDisabled();

    await chooseMode(user, "Unique generated");
    await chooseMode(user, "Administrator-provided shared");
    expect(screen.getByLabelText(/^Password/)).toHaveValue("");
    expect(screen.getByLabelText(/^Confirm password/)).toHaveValue("");

    await user.type(screen.getByLabelText(/^Password/), "F2Admin!Pass123");
    await user.type(
      screen.getByLabelText(/^Confirm password/),
      "F2Admin!Pass123",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByLabelText(/^Password/)).toHaveValue("");
    expect(screen.getByLabelText(/^Confirm password/)).toHaveValue("");
  });

  it("renders only safe known and unknown backend policy reasons", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError(
          "unsafe backend message F2Admin!Pass123",
          422,
          "iam.credentials.password_policy_failed",
          undefined,
          { reasons: ["password_common", "future_policy_reason"] },
        ),
      );
    render(<CredentialModeForm enabled onSubmit={onSubmit} />);
    await chooseMode(user, "Administrator-provided shared");
    await user.type(screen.getByLabelText(/^Password/), "F2Admin!Pass123");
    await user.type(
      screen.getByLabelText(/^Confirm password/),
      "F2Admin!Pass123",
    );
    await user.click(screen.getByRole("button", { name: "Create credentials" }));

    expect(await screen.findByText("This password is too common.")).toBeInTheDocument();
    expect(screen.getByText("The password was rejected.")).toBeInTheDocument();
    expect(screen.queryByText(/unsafe backend message/)).not.toBeInTheDocument();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
