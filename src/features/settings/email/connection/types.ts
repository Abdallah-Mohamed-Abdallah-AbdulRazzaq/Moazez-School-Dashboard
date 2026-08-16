export type EmailConnectionProviderType =
  | "SMTP"
  | "SENDGRID"
  | "MAILGUN"
  | "SES"
  | "CUSTOM";

export type EmailConnectionStatus =
  | "DRAFT"
  | "VERIFIED"
  | "ACTIVE"
  | "DISABLED"
  | "FAILED";

export interface EmailConnectionResponseDto {
  configured: boolean;
  providerType: EmailConnectionProviderType | null;
  fromName: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  status: EmailConnectionStatus | null;
  lastTestedAt: string | null;
  verifiedAt: string | null;
  failureReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type EmailConnection = EmailConnectionResponseDto;

export interface UpdateEmailConnectionRequest {
  providerType?: EmailConnectionProviderType;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string | null;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface TestEmailConnectionRequest {
  toEmail?: string;
}

export interface TestEmailConnectionResponseDto
  extends EmailConnectionResponseDto {
  testRecipient: string;
  deliveryMode: "configuration_validation";
  message: string;
}

export type TestEmailConnectionResponse = TestEmailConnectionResponseDto;
