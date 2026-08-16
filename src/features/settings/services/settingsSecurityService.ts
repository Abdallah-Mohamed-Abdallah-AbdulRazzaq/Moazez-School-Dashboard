import { apiGet, apiPatch } from "@/lib/api";
import type {
  SecuritySettings,
  SecuritySettingsApiDto,
} from "@/features/settings/types";

function mapSecuritySettings(
  payload: SecuritySettingsApiDto,
): SecuritySettings {
  return {
    enforceTwoFactor: payload.enforceTwoFactor,
    ipAllowlistEnabled: payload.ipAllowlistEnabled,
    ipAllowlist: payload.ipAllowlist,
    sessionTimeoutMinutes: payload.sessionTimeoutMinutes,
    suspiciousLoginAlerts: payload.suspiciousLoginAlerts,
    passwordMinLength: payload.passwordMinLength,
    passwordRotationDays: payload.passwordRotationDays,
  };
}

export async function fetchSettingsSecuritySettings(): Promise<SecuritySettings> {
  const response = await apiGet<SecuritySettingsApiDto>("/settings/security");
  return mapSecuritySettings(response);
}

export async function updateSettingsSecuritySettings(
  payload: SecuritySettings,
): Promise<SecuritySettings> {
  const response = await apiPatch<SecuritySettingsApiDto>(
    "/settings/security",
    payload,
  );
  return mapSecuritySettings(response);
}
