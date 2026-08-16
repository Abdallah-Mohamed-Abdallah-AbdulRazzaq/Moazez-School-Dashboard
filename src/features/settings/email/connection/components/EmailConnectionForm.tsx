"use client";

import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  EmailConnection,
  EmailConnectionProviderType,
  UpdateEmailConnectionRequest,
} from "@/features/settings/email/connection/types";

export interface EmailConnectionFormValues {
  providerType: EmailConnectionProviderType;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  apiKey: string;
  testRecipientEmail: string;
}

export type EmailConnectionFormErrors = Partial<
  Record<keyof EmailConnectionFormValues, string>
>;

interface EmailConnectionFormProps {
  values: EmailConnectionFormValues;
  errors?: EmailConnectionFormErrors;
  canManage: boolean;
  hasPassword: boolean;
  hasApiKey: boolean;
  onChange: <K extends keyof EmailConnectionFormValues>(
    field: K,
    value: EmailConnectionFormValues[K],
  ) => void;
  labels: {
    providerType: string;
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    host: string;
    port: string;
    secure: string;
    username: string;
    password: string;
    apiKey: string;
    testRecipientEmail: string;
    smtp: string;
    configured: string;
    notConfigured: string;
    secretHelp: string;
    testRecipientHelp: string;
  };
}

export function toEmailConnectionFormValues(
  connection: EmailConnection | null,
): EmailConnectionFormValues {
  return {
    providerType: connection?.providerType || "SMTP",
    fromName: connection?.fromName || "",
    fromEmail: connection?.fromEmail || "",
    replyToEmail: connection?.replyToEmail || "",
    host: connection?.host || "",
    port: connection?.port ? String(connection.port) : "",
    secure: Boolean(connection?.secure),
    username: connection?.username || "",
    password: "",
    apiKey: "",
    testRecipientEmail: "",
  };
}

export function toUpdateEmailConnectionRequest(
  values: EmailConnectionFormValues,
): UpdateEmailConnectionRequest {
  const payload: UpdateEmailConnectionRequest = {
    providerType: values.providerType,
    fromName: values.fromName.trim(),
    fromEmail: values.fromEmail.trim(),
    replyToEmail: values.replyToEmail.trim() || null,
    host: values.host.trim() || undefined,
    port: values.port.trim() ? Number(values.port) : undefined,
    secure: values.secure,
    username: values.username.trim() || undefined,
  };

  if (values.password.trim()) {
    payload.password = values.password;
  }
  if (values.apiKey.trim()) {
    payload.apiKey = values.apiKey;
  }

  return payload;
}

export function validateEmailConnectionForm(
  values: EmailConnectionFormValues,
  messages: {
    fromNameRequired: string;
    fromEmailRequired: string;
    providerRequired: string;
    hostRequired: string;
    portInvalid: string;
  },
): EmailConnectionFormErrors {
  const errors: EmailConnectionFormErrors = {};
  if (!values.providerType) {
    errors.providerType = messages.providerRequired;
  }
  if (!values.fromName.trim()) {
    errors.fromName = messages.fromNameRequired;
  }
  if (!values.fromEmail.trim()) {
    errors.fromEmail = messages.fromEmailRequired;
  }
  if (values.providerType === "SMTP" && !values.host.trim()) {
    errors.host = messages.hostRequired;
  }
  if (
    values.port.trim() &&
    (!Number.isInteger(Number(values.port)) ||
      Number(values.port) < 1 ||
      Number(values.port) > 65535)
  ) {
    errors.port = messages.portInvalid;
  }
  return errors;
}

export default function EmailConnectionForm({
  values,
  errors,
  canManage,
  hasPassword,
  hasApiKey,
  onChange,
  labels,
}: EmailConnectionFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Select
        label={labels.providerType}
        value={values.providerType}
        disabled={!canManage}
        onChange={(value) =>
          onChange("providerType", value as EmailConnectionProviderType)
        }
        options={[
          { value: "SMTP", label: labels.smtp },
        ]}
        error={errors?.providerType}
      />
      <Input
        label={labels.fromName}
        value={values.fromName}
        disabled={!canManage}
        onChange={(event) => onChange("fromName", event.target.value)}
        error={errors?.fromName}
      />
      <Input
        label={labels.fromEmail}
        type="email"
        value={values.fromEmail}
        disabled={!canManage}
        onChange={(event) => onChange("fromEmail", event.target.value)}
        error={errors?.fromEmail}
      />
      <Input
        label={labels.replyToEmail}
        type="email"
        value={values.replyToEmail}
        disabled={!canManage}
        onChange={(event) => onChange("replyToEmail", event.target.value)}
        error={errors?.replyToEmail}
      />
      <Input
        label={labels.host}
        value={values.host}
        disabled={!canManage || values.providerType !== "SMTP"}
        onChange={(event) => onChange("host", event.target.value)}
        error={errors?.host}
      />
      <Input
        label={labels.port}
        type="number"
        value={values.port}
        disabled={!canManage || values.providerType !== "SMTP"}
        onChange={(event) => onChange("port", event.target.value)}
        error={errors?.port}
      />
      <Input
        label={labels.username}
        value={values.username}
        disabled={!canManage}
        onChange={(event) => onChange("username", event.target.value)}
        error={errors?.username}
      />
      <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 lg:mt-6">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300"
          checked={values.secure}
          disabled={!canManage || values.providerType !== "SMTP"}
          onChange={(event) => onChange("secure", event.target.checked)}
        />
        <span>{labels.secure}</span>
      </label>
      <Input
        label={`${labels.password} (${hasPassword ? labels.configured : labels.notConfigured})`}
        type="password"
        value={values.password}
        disabled={!canManage}
        helperText={labels.secretHelp}
        onChange={(event) => onChange("password", event.target.value)}
        error={errors?.password}
      />
      <Input
        label={`${labels.apiKey} (${hasApiKey ? labels.configured : labels.notConfigured})`}
        type="password"
        value={values.apiKey}
        disabled={!canManage}
        helperText={labels.secretHelp}
        onChange={(event) => onChange("apiKey", event.target.value)}
        error={errors?.apiKey}
      />
      <div className="lg:col-span-2">
        <Input
          label={labels.testRecipientEmail}
          type="email"
          value={values.testRecipientEmail}
          disabled={!canManage}
          helperText={labels.testRecipientHelp}
          onChange={(event) => onChange("testRecipientEmail", event.target.value)}
          error={errors?.testRecipientEmail}
        />
      </div>
    </div>
  );
}
