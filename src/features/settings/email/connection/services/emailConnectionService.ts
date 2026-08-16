import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  EmailConnection,
  EmailConnectionResponseDto,
  TestEmailConnectionRequest,
  TestEmailConnectionResponse,
  TestEmailConnectionResponseDto,
  UpdateEmailConnectionRequest,
} from "@/features/settings/email/connection/types";

export function mapEmailConnection(
  payload: EmailConnectionResponseDto,
): EmailConnection {
  return {
    ...payload,
  };
}

export async function fetchEmailConnection(): Promise<EmailConnection> {
  const response = await apiGet<EmailConnectionResponseDto>(
    "/settings/email/connection",
  );
  return mapEmailConnection(response);
}

export async function updateEmailConnection(
  payload: UpdateEmailConnectionRequest,
): Promise<EmailConnection> {
  const response = await apiPut<EmailConnectionResponseDto>(
    "/settings/email/connection",
    payload,
  );
  return mapEmailConnection(response);
}

export async function testEmailConnection(
  payload: TestEmailConnectionRequest,
): Promise<TestEmailConnectionResponse> {
  const response = await apiPost<TestEmailConnectionResponseDto>(
    "/settings/email/connection/test",
    payload,
  );
  return {
    ...mapEmailConnection(response),
    testRecipient: response.testRecipient,
    deliveryMode: response.deliveryMode,
    message: response.message,
  };
}

export async function activateEmailConnection(): Promise<EmailConnection> {
  const response = await apiPost<EmailConnectionResponseDto>(
    "/settings/email/connection/activate",
    {},
  );
  return mapEmailConnection(response);
}

export async function disableEmailConnection(): Promise<EmailConnection> {
  const response = await apiPost<EmailConnectionResponseDto>(
    "/settings/email/connection/disable",
    {},
  );
  return mapEmailConnection(response);
}
