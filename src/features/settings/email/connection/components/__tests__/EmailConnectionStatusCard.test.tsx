import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmailConnectionStatusCard from "../EmailConnectionStatusCard";
import type { EmailConnection } from "../../types";

const labels = {
  title: "Connection status",
  description: "Saved secrets are hidden.",
  status: "Status",
  provider: "Provider",
  lastTest: "Last test",
  password: "Password",
  apiKey: "API key",
  configured: "Configured",
  notConfigured: "Not configured",
  failureReason: "Failure reason",
  notAvailable: "Not available",
  statusLabels: {
    DRAFT: "Draft",
    VERIFIED: "Verified",
    ACTIVE: "Active",
    DISABLED: "Disabled",
    FAILED: "Failed",
  },
  failureReasonLabels: {
    smtp_configuration_invalid: "The SMTP configuration is invalid.",
    smtp_password_missing: "The SMTP password is missing.",
    secret_decryption_failed: "The saved secret could not be read.",
    unknown: "The connection test failed.",
  },
};

const connection: EmailConnection = {
  configured: true,
  providerType: "SMTP",
  fromName: "School",
  fromEmail: "school@example.com",
  replyToEmail: null,
  host: "smtp.example.com",
  port: 587,
  secure: true,
  username: "school",
  hasPassword: true,
  hasApiKey: false,
  status: "FAILED",
  lastTestedAt: null,
  verifiedAt: null,
  failureReason: "smtp_password_missing",
  createdAt: null,
  updatedAt: null,
};

describe("EmailConnectionStatusCard", () => {
  it("renders a localized backend failure reason", () => {
    render(<EmailConnectionStatusCard connection={connection} labels={labels} />);

    expect(screen.getByText("The SMTP password is missing.")).toBeVisible();
    expect(screen.queryByText("smtp_password_missing")).not.toBeInTheDocument();
  });

  it("uses a safe localized fallback for an unknown reason", () => {
    render(
      <EmailConnectionStatusCard
        connection={{ ...connection, failureReason: "unexpected_reason" }}
        labels={labels}
      />,
    );

    expect(screen.getByText("The connection test failed.")).toBeVisible();
    expect(screen.queryByText("unexpected_reason")).not.toBeInTheDocument();
  });
});
