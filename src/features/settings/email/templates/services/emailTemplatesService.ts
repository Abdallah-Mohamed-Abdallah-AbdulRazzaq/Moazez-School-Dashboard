import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  EmailTemplate,
  EmailTemplateListResponseDto,
  EmailTemplateKey,
  EmailTemplatePreviewResponseDto,
  EmailTemplateResponseDto,
  EmailTemplatesListResponse,
  PreviewEmailTemplateRequest,
  PreviewEmailTemplateResponse,
  UpdateEmailTemplateRequest,
} from "@/features/settings/email/templates/types";

export function mapEmailTemplate(
  template: EmailTemplateResponseDto,
): EmailTemplate {
  return {
    ...template,
    socialLinks: template.socialLinks ? { ...template.socialLinks } : null,
    allowedVariables: [...template.allowedVariables],
  };
}

export async function fetchEmailTemplates(): Promise<EmailTemplatesListResponse> {
  const response = await apiGet<EmailTemplateListResponseDto>(
    "/settings/email/templates",
  );
  return {
    items: response.items.map(mapEmailTemplate),
  };
}

export async function fetchEmailTemplate(
  key: EmailTemplateKey,
): Promise<EmailTemplate> {
  const response = await apiGet<EmailTemplateResponseDto>(
    `/settings/email/templates/${key}`,
  );
  return mapEmailTemplate(response);
}

export async function updateEmailTemplate(
  key: EmailTemplateKey,
  payload: UpdateEmailTemplateRequest,
): Promise<EmailTemplate> {
  const response = await apiPut<EmailTemplateResponseDto>(
    `/settings/email/templates/${key}`,
    payload,
  );
  return mapEmailTemplate(response);
}

export async function previewEmailTemplate(
  key: EmailTemplateKey,
  payload: PreviewEmailTemplateRequest,
): Promise<PreviewEmailTemplateResponse> {
  const response = await apiPost<EmailTemplatePreviewResponseDto>(
    `/settings/email/templates/${key}/preview`,
    payload,
  );
  return {
    ...response,
    unknownVariables: [...response.unknownVariables],
    missingVariables: [...response.missingVariables],
  };
}

export async function resetEmailTemplateToDefault(
  key: EmailTemplateKey,
): Promise<EmailTemplate> {
  const response = await apiPost<EmailTemplateResponseDto>(
    `/settings/email/templates/${key}/reset-default`,
    {},
  );
  return mapEmailTemplate(response);
}
