import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";
import { ApiError } from "@/lib/api-error";
import CreateTeacherDialog from "../CreateTeacherDialog";
import EditTeacherDialog from "../EditTeacherDialog";

const { previewLoginIdentityUsername, checkUsernameAvailability } = vi.hoisted(() => ({
  previewLoginIdentityUsername: vi.fn().mockResolvedValue({
    loginEmail: "nour@school.example",
  }),
  checkUsernameAvailability: vi.fn().mockResolvedValue({
    username: "nour",
    available: true,
  }),
}));

vi.mock("@/features/settings/login-identity/services/loginIdentityService", () => ({
  previewLoginIdentityUsername,
  checkUsernameAvailability,
}));

describe("teacher form dialogs", () => {
  it("shows the generated login email and checks a new username", async () => {
    const user = userEvent.setup();
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/fields\.username/), "nour");
    await user.click(screen.getByRole("button", { name: "identity.check_availability" }));

    expect(await screen.findByText("nour@school.example")).toBeVisible();
    expect(await screen.findByText("identity.username_available")).toBeVisible();
  });

  it("serializes login-email identity without a conflicting username", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("form.identity_modes.loginEmail"));
    expect(screen.getByText("form.legacy_login_email_help")).toBeVisible();
    fireEvent.change(screen.getByLabelText(/fields.login_email/), {
      target: { value: "nour@school.example" },
    });
    fireEvent.change(screen.getByLabelText(/fields.code/), {
      target: { value: "tch 001" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(arabic\)/), {
      target: { value: "نور" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(english\)/), {
      target: { value: "Nour" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(arabic\)/), {
      target: { value: "علي" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(english\)/), {
      target: { value: "Ali" },
    });
    await user.click(screen.getByLabelText(/fields.gender/));
    await user.click(screen.getByRole("button", { name: "gender.female" }));
    await user.click(screen.getByRole("button", { name: "dialog.create_action" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      loginEmail: "nour@school.example",
      teacherCode: "TCH001",
      gender: "FEMALE",
    }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("username");
  });

  it("shows a clear, localized username-policy error without a duplicate form alert", async () => {
    const user = userEvent.setup();
    checkUsernameAvailability.mockResolvedValueOnce({
      username: "nour",
      available: true,
    });
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError("Username is invalid", 422, "iam.user.username_invalid"),
    );
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/fields\.username/), "nour");
    fireEvent.change(screen.getByLabelText(/fields\.code/), { target: { value: "TCH001" } });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(arabic\)/), { target: { value: "نور" } });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(english\)/), { target: { value: "Nour" } });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(arabic\)/), { target: { value: "علي" } });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(english\)/), { target: { value: "Ali" } });
    await user.click(screen.getByLabelText(/fields\.gender/));
    await user.click(screen.getByRole("button", { name: "gender.female" }));
    await user.click(screen.getByRole("button", { name: "dialog.create_action" }));

    expect((await screen.findAllByText("identity.username_invalid")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Username is invalid")).not.toBeInTheDocument();
  });

  it("keeps an identity-conflict message visible for the selected identity mode", async () => {
    const user = userEvent.setup();
    checkUsernameAvailability.mockResolvedValue({
      username: "nour",
      available: true,
    });
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError("This identity is already in use", 409, "teachers.account.identity_conflict"),
    );
    render(<CreateTeacherDialog isOpen isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/fields\.username/), "nour");
    fireEvent.change(screen.getByLabelText(/fields\.code/), { target: { value: "TCH001" } });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(arabic\)/), { target: { value: "Ù†ÙˆØ±" } });
    fireEvent.change(screen.getByLabelText(/fields\.first_name \(english\)/), { target: { value: "Nour" } });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(arabic\)/), { target: { value: "Ø¹Ù„ÙŠ" } });
    fireEvent.change(screen.getByLabelText(/fields\.last_name \(english\)/), { target: { value: "Ali" } });
    await user.click(screen.getByLabelText(/fields\.gender/));
    await user.click(screen.getByRole("button", { name: "gender.female" }));
    await user.click(screen.getByRole("button", { name: "dialog.create_action" }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((alert) => alert.textContent?.includes("errors.username_conflict"))).toBe(true);
  });

  it("prevents an empty edit patch", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EditTeacherDialog isOpen teacher={teacherFixture} isSubmitting={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "dialog.save_action" }));
    expect(await screen.findByText("validation.no_changes")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows login identity as read-only while editing a teacher", () => {
    render(<EditTeacherDialog isOpen teacher={teacherFixture} isSubmitting={false} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/fields\.username/)).toBeDisabled();
    expect(screen.getByLabelText(/fields\.login_email/)).toBeDisabled();
    expect(screen.queryByLabelText("form.identity_modes.username")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("form.identity_modes.loginEmail")).not.toBeInTheDocument();
  });
});
