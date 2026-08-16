import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import type { EmailConnection } from "@/features/settings/email/connection/types";

const serviceMocks = vi.hoisted(() => ({
  fetchEmailConnection: vi.fn(),
  updateEmailConnection: vi.fn(),
  testEmailConnection: vi.fn(),
  activateEmailConnection: vi.fn(),
  disableEmailConnection: vi.fn(),
}));
const toastMocks = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));
const translate = vi.hoisted(() => (key: string) => key);

vi.mock("next-intl", () => ({
  useTranslations: () => translate,
  useLocale: () => "en",
}));

vi.mock(
  "@/features/settings/email/connection/services/emailConnectionService",
  () => serviceMocks,
);

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => toastMocks,
}));

vi.mock("@/features/settings/components/SettingsAccessGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock(
  "@/features/settings/email/connection/components/EmailConnectionStatusCard",
  () => ({
    default: ({ connection }: { connection: EmailConnection | null }) => (
      <span>status:{connection?.status ?? "none"}</span>
    ),
  }),
);

vi.mock("@/features/settings/shared/components/SettingsWorkflowErrorAlert", () => ({
  default: ({ error }: { error: { kind: string } }) => (
    <span>error:{error.kind}</span>
  ),
}));

import EmailConnectionPage from "../EmailConnectionPage";

function connection(
  status: EmailConnection["status"],
): EmailConnection {
  return {
    configured: true,
    providerType: "SMTP",
    fromName: "School",
    fromEmail: "school@example.com",
    replyToEmail: null,
    host: "smtp.example.com",
    port: 587,
    secure: true,
    username: "mailer",
    hasPassword: true,
    hasApiKey: false,
    status,
    lastTestedAt: null,
    verifiedAt: null,
    failureReason: null,
    createdAt: "2026-07-30T10:00:00.000Z",
    updatedAt: "2026-07-30T10:00:00.000Z",
  };
}

describe("EmailConnectionPage backend lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables activation only after a successful test returns VERIFIED", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchEmailConnection.mockResolvedValue(connection("DRAFT"));
    serviceMocks.testEmailConnection.mockResolvedValue({
      ...connection("VERIFIED"),
      testRecipient: "admin@example.com",
      deliveryMode: "configuration_validation",
      message: "Verified",
    });
    render(<EmailConnectionPage />);

    const activate = await screen.findByRole("button", {
      name: "actions.activate",
    });
    expect(activate).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "fields.test_recipient_email" }),
      "admin@example.com",
    );
    await user.click(screen.getByRole("button", { name: "actions.test" }));

    await waitFor(() =>
      expect(serviceMocks.testEmailConnection).toHaveBeenCalled(),
    );
    expect(await screen.findByText("status:VERIFIED")).toBeVisible();
    expect(activate).toBeEnabled();
  });

  it("omits a blank test recipient so the backend can use the actor email", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchEmailConnection.mockResolvedValue(connection("DRAFT"));
    serviceMocks.testEmailConnection.mockResolvedValue({
      ...connection("VERIFIED"),
      testRecipient: "actor@example.com",
      deliveryMode: "configuration_validation",
      message: "Verified",
    });
    render(<EmailConnectionPage />);

    await user.click(
      await screen.findByRole("button", { name: "actions.test" }),
    );

    await waitFor(() =>
      expect(serviceMocks.testEmailConnection).toHaveBeenCalledWith({}),
    );
  });

  it("preserves the test error while refreshing authoritative FAILED state", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchEmailConnection
      .mockResolvedValueOnce(connection("DRAFT"))
      .mockResolvedValueOnce(connection("FAILED"));
    serviceMocks.testEmailConnection.mockRejectedValue(
      new ApiError(
        "raw diagnostic",
        422,
        "settings.email.connection_test_failed",
      ),
    );
    render(<EmailConnectionPage />);

    await user.type(
      await screen.findByRole("textbox", {
        name: "fields.test_recipient_email",
      }),
      "admin@example.com",
    );
    await user.click(screen.getByRole("button", { name: "actions.test" }));

    await waitFor(() =>
      expect(serviceMocks.testEmailConnection).toHaveBeenCalled(),
    );
    expect(await screen.findByText("status:FAILED")).toBeVisible();
    expect(screen.getByText("error:email-connection-test")).toBeVisible();
    expect(screen.queryByText("raw diagnostic")).not.toBeInTheDocument();
  });

  it("requires confirmation before disabling the connection", async () => {
    const user = userEvent.setup();
    serviceMocks.fetchEmailConnection.mockResolvedValue(connection("ACTIVE"));
    serviceMocks.disableEmailConnection.mockResolvedValue(
      connection("DISABLED"),
    );
    render(<EmailConnectionPage />);

    await user.click(
      await screen.findByRole("button", { name: "actions.disable" }),
    );

    expect(serviceMocks.disableEmailConnection).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "confirm.disable_title" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "confirm.disable_confirm" }),
    );

    await waitFor(() =>
      expect(serviceMocks.disableEmailConnection).toHaveBeenCalledOnce(),
    );
    expect(await screen.findByText("status:DISABLED")).toBeVisible();
  });
});
