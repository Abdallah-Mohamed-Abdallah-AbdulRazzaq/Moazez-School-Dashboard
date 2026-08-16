import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserEditorModal from "../UserEditorModal";

const loginIdentityMocks = vi.hoisted(() => ({
  fetchLoginIdentitySettings: vi.fn(),
  previewLoginIdentityUsername: vi.fn(),
  checkUsernameAvailability: vi.fn(),
}));

vi.mock("@/features/settings/login-identity/services/loginIdentityService", () => loginIdentityMocks);

describe("UserEditorModal Sprint 11 behavior", () => {
  beforeEach(() => {
    loginIdentityMocks.fetchLoginIdentitySettings.mockReset();
    loginIdentityMocks.previewLoginIdentityUsername.mockReset();
    loginIdentityMocks.checkUsernameAvailability.mockReset();
    loginIdentityMocks.fetchLoginIdentitySettings.mockResolvedValue({
      configured: true,
      loginDomain: "school.edu",
      status: "active",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      reservedUsernames: [],
    });
  });

  it("submits username and contactEmail without using personal email as login email", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    loginIdentityMocks.previewLoginIdentityUsername.mockResolvedValue({
      username: "amina",
      loginEmail: "amina@school.edu",
      email: "amina@school.edu",
    });
    loginIdentityMocks.checkUsernameAvailability.mockResolvedValue({
      username: "amina",
      available: true,
    });

    render(
      <UserEditorModal
        isOpen
        mode="create"
        roles={[
          {
            id: "role-1",
            key: "school_admin",
            name: "School admin",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^table\.name/), "Amina Teacher");
    await user.type(await screen.findByLabelText(/^table\.username/), "amina");
    await user.click(screen.getByLabelText(/^filters\.role/));
    await user.click(screen.getByText("School admin"));
    await user.type(
      screen.getByLabelText(/^table\.contact_email/),
      "amina.personal@example.com",
    );
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: "Amina Teacher",
        username: "amina",
        contactEmail: "amina.personal@example.com",
        roleId: "role-1",
      });
    });
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("email");
  });

  it("falls back to login email when generated identity is inactive", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    loginIdentityMocks.fetchLoginIdentitySettings.mockResolvedValue({
      configured: false,
      loginDomain: null,
      status: "disabled",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      reservedUsernames: [],
    });

    render(
      <UserEditorModal
        isOpen
        mode="invite"
        roles={[
          {
            id: "role-1",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^table\.name/), "Amina Parent");
    await user.click(screen.getByLabelText(/^filters\.role/));
    await user.click(screen.getByText("Parent"));
    await user.type(
      await screen.findByLabelText(/^table\.login_email/),
      "amina@example.com",
    );
    await user.click(screen.getByRole("button", { name: "send_invite" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: "Amina Parent",
        email: "amina@example.com",
        contactEmail: undefined,
        username: undefined,
        roleId: "role-1",
      });
    });
  });

  it("does not offer the Teacher role for generic creation", async () => {
    render(
      <UserEditorModal
        isOpen
        mode="create"
        roles={[
          {
            id: "teacher-role",
            key: "teacher",
            name: "Teacher",
            permissions: [],
          },
          {
            id: "parent-role",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText(/^filters\.role/));
    expect(await screen.findByText("Parent")).toBeInTheDocument();
    expect(screen.queryByText("Teacher")).not.toBeInTheDocument();
  });

  it("does not offer the Teacher role while editing a generic user", async () => {
    render(
      <UserEditorModal
        isOpen
        mode="edit"
        user={{
          id: "user-1",
          fullName: "Amina Parent",
          email: "amina@example.com",
          roleId: "parent-role",
          status: "active",
        }}
        roles={[
          {
            id: "teacher-role",
            key: "teacher",
            name: "Teacher",
            permissions: [],
          },
          {
            id: "parent-role",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText(/^filters\.role/));

    expect(screen.queryByText("Teacher")).not.toBeInTheDocument();
  });

  it("requires administrators to choose a role explicitly", async () => {
    loginIdentityMocks.fetchLoginIdentitySettings.mockResolvedValue({
      configured: false,
      loginDomain: null,
      status: "disabled",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      reservedUsernames: [],
    });

    const user = userEvent.setup();
    render(
      <UserEditorModal
        isOpen
        mode="invite"
        roles={[
          {
            id: "parent-role",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^table\.name/), "Amina Parent");
    await user.type(
      await screen.findByLabelText(/^table\.login_email/),
      "amina@example.com",
    );

    expect(
      screen.getByRole("button", { name: "send_invite" }),
    ).toBeDisabled();
  });

  it("shows invalid email feedback before submitting", async () => {
    loginIdentityMocks.fetchLoginIdentitySettings.mockResolvedValue({
      configured: false,
      loginDomain: null,
      status: "disabled",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      reservedUsernames: [],
    });

    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <UserEditorModal
        isOpen
        mode="invite"
        roles={[
          {
            id: "parent-role",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^table\.name/), "Amina Parent");
    await user.click(screen.getByLabelText(/^filters\.role/));
    await user.click(screen.getByText("Parent"));
    await user.type(
      await screen.findByLabelText(/^table\.login_email/),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: "send_invite" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "identity.login_email_invalid",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("asks before discarding entered user details", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <UserEditorModal
        isOpen
        mode="create"
        roles={[
          {
            id: "parent-role",
            key: "parent",
            name: "Parent",
            permissions: [],
          },
        ]}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^table\.name/), "Amina");
    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent("discard.title");
  });
});
