import { apiGet, apiPut } from "@/lib/api";
import type {
  LoginIdentitySettings,
  LoginIdentitySettingsResponse,
  UpdateLoginIdentityRequest,
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";

function mapLoginIdentitySettings(
  payload: LoginIdentitySettingsResponse,
): LoginIdentitySettings {
  return {
    loginDomain: payload.loginDomain,
    usernameMinLength: payload.usernameMinLength ?? 3,
    usernameMaxLength: payload.usernameMaxLength ?? 64,
    allowedCharacters: payload.allowedCharacters ?? undefined,
    reservedUsernames: payload.reservedUsernames ?? [],
    status: payload.status ?? "disabled",
    configured: payload.configured ?? Boolean(payload.loginDomain),
    updatedAt: payload.updatedAt ?? undefined,
  };
}

export async function fetchLoginIdentitySettings(): Promise<LoginIdentitySettings> {
  const response = await apiGet<LoginIdentitySettingsResponse>(
    "/settings/login-identity",
  );
  return mapLoginIdentitySettings(response);
}

export async function updateLoginIdentitySettings(
  payload: UpdateLoginIdentityRequest,
): Promise<LoginIdentitySettings> {
  const response = await apiPut<LoginIdentitySettingsResponse>(
    "/settings/login-identity",
    payload,
  );
  return mapLoginIdentitySettings(response);
}

export async function previewLoginIdentityUsername(
  username: string,
): Promise<UsernamePreviewResponse> {
  const query = new URLSearchParams({ username });
  return apiGet<UsernamePreviewResponse>(
    `/settings/login-identity/preview?${query.toString()}`,
  );
}

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailabilityResponse> {
  const query = new URLSearchParams({ username });
  return apiGet<UsernameAvailabilityResponse>(
    `/settings/users/usernames/available?${query.toString()}`,
  );
}
