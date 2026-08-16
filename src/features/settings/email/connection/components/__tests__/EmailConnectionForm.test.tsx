import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmailConnectionForm, {
  toEmailConnectionFormValues,
  toUpdateEmailConnectionRequest,
  validateEmailConnectionForm,
} from "../EmailConnectionForm";

const labels = {
  providerType: "Provider",
  fromName: "From name",
  fromEmail: "From email",
  replyToEmail: "Reply-to",
  host: "Host",
  port: "Port",
  secure: "Secure",
  username: "Username",
  password: "Password",
  apiKey: "API key",
  testRecipientEmail: "Test recipient",
  smtp: "SMTP",
  api: "API",
  configured: "Configured",
  notConfigured: "Not configured",
  secretHelp: "Leave blank to keep saved secret.",
  testRecipientHelp: "Leave blank to use your account email.",
};

const validationMessages = {
  fromNameRequired: "From name is required.",
  fromEmailRequired: "From email is required.",
  providerRequired: "Provider is required.",
  hostRequired: "Host is required.",
  portInvalid: "Port must be between 1 and 65535.",
};

describe("EmailConnectionForm Sprint 11 behavior", () => {
  it("does not display or resubmit raw saved secrets from GET responses", () => {
    const values = toEmailConnectionFormValues({
      id: "conn-1",
      providerType: "SMTP",
      status: "ACTIVE",
      fromName: "School",
      fromEmail: "school@example.edu",
      replyToEmail: null,
      host: "smtp.example.edu",
      port: 587,
      secure: true,
      username: "mailer",
      hasPassword: true,
      hasApiKey: true,
      encryptedPassword: "encrypted-password",
      encryptedApiKey: "encrypted-api-key",
    } as never);

    render(
      <EmailConnectionForm
        values={values}
        canManage
        hasPassword
        hasApiKey
        onChange={vi.fn()}
        labels={labels}
      />,
    );

    expect(screen.getByText(/Password \(Configured\)/)).toBeInTheDocument();
    expect(screen.getByText(/API key \(Configured\)/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("encrypted-password")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("encrypted-api-key")).not.toBeInTheDocument();
    expect(toUpdateEmailConnectionRequest(values)).not.toMatchObject({
      password: expect.any(String),
      apiKey: expect.any(String),
    });
  });

  it("allows the backend to resolve the optional test recipient", () => {
    const values = {
      ...toEmailConnectionFormValues(null),
      fromName: "School",
      fromEmail: "school@example.edu",
      host: "smtp.example.edu",
      port: "587",
      username: "mailer",
      testRecipientEmail: "",
    };

    expect(
      validateEmailConnectionForm(values, validationMessages),
    ).not.toHaveProperty("testRecipientEmail");
  });

  it("rejects SMTP ports above the backend maximum", () => {
    const values = {
      ...toEmailConnectionFormValues(null),
      fromName: "School",
      fromEmail: "school@example.edu",
      host: "smtp.example.edu",
      port: "65536",
      username: "mailer",
    };

    expect(
      validateEmailConnectionForm(values, validationMessages),
    ).toMatchObject({ port: "Port must be between 1 and 65535." });
  });
});
