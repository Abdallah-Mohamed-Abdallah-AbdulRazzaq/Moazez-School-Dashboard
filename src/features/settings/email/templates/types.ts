export type EmailTemplateKey =
  | "ACCOUNT_CREDENTIALS"
  | "PASSWORD_RESET"
  | "GENERAL_MESSAGE";

export interface EmailTemplateSocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
}

export interface EmailTemplateResponseDto {
  id: string | null;
  key: EmailTemplateKey;
  customized: boolean;
  subject: string;
  preheader: string | null;
  title: string | null;
  subtitle: string | null;
  bodyHtml: string;
  bodyText: string | null;
  footerHtml: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  socialLinks: EmailTemplateSocialLinks | null;
  isActive: boolean;
  allowedVariables: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmailTemplateListResponseDto {
  items: EmailTemplateResponseDto[];
}

export type EmailTemplate = EmailTemplateResponseDto;
export type EmailTemplatesListResponse = EmailTemplateListResponseDto;

export interface UpdateEmailTemplateRequest {
  subject?: string;
  preheader?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bodyHtml?: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLinks?: EmailTemplateSocialLinks | null;
  isActive?: boolean;
}

export interface PreviewEmailTemplateRequest
  extends UpdateEmailTemplateRequest {
  previewData?: Record<string, unknown>;
}

export interface EmailTemplatePreviewResponseDto {
  key: EmailTemplateKey;
  subject: string;
  preheader: string | null;
  html: string;
  text: string | null;
  unknownVariables: string[];
  missingVariables: string[];
}

export type PreviewEmailTemplateResponse =
  EmailTemplatePreviewResponseDto;
