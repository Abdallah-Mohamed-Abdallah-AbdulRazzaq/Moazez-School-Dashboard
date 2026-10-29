import { apiPost, apiGet } from "@/lib/api";
import { getAuthSessionVersion, invalidateAuthSession, publishSessionChange, withSessionLock } from "@/lib/auth/session-client";
import { ApiError } from "@/lib/api-error";
import type { ChangePasswordRequest, ChangePasswordResponse, LoginRequest, LoginResponse, MeResponse } from "@/types/user";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    invalidateAuthSession();
    const version = getAuthSessionVersion();
    return withSessionLock(async () => {
      if (version !== getAuthSessionVersion()) throw ApiError.unauthorized("The authentication session has changed.");
      const response = await apiPost<LoginResponse>("/auth/login", credentials, { skipAuthRefresh: true });
      if (version !== getAuthSessionVersion()) throw ApiError.unauthorized("The authentication session has changed.");
      publishSessionChange("login");
      return response;
    });
  },

  async logout(): Promise<void> {
    invalidateAuthSession();
    await withSessionLock(async () => {
      await apiPost<void>("/auth/logout", undefined, { skipAuthRefresh: true });
      publishSessionChange("logout");
    });
  },

  async getCurrentUser(): Promise<MeResponse> {
    return apiGet<MeResponse>("/auth/me");
  },

  async changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiPost<ChangePasswordResponse>("/auth/change-password", payload);
  },
};
