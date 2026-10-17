// FILE: src/services/auth-service.ts
import { apiPost, apiGet } from "@/lib/api";
import { getAuthSessionVersion, tokenStorage } from "@/lib/token-storage";
import { ApiError } from "@/lib/api-error";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RefreshRequest,
} from "@/types/user";

export const authService = {
  /**
   * Authenticate user and store tokens
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    tokenStorage.clearTokens();
    const sessionVersion = getAuthSessionVersion();
    const response = await apiPost<LoginResponse>("/auth/login", credentials, { skipAuthRefresh: true });
    if (sessionVersion !== getAuthSessionVersion()) {
      throw ApiError.unauthorized("The authentication session has changed.");
    }

    // Store tokens on successful login
    if (response.accessToken && response.refreshToken) {
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  /**
   * Log out the user and clear local tokens
   */
  async logout(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();
    tokenStorage.clearTokens();
    if (!accessToken) return;
    try {
      // Swagger documents logout as 204 No Content.
      await apiPost<void>("/auth/logout", undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
        skipAuthRefresh: true,
        timeout: 5000,
      });
    } catch {
      console.warn("Server logout failed; the local session has already been cleared.");
    }
  },

  /**
   * Fetch the currently authenticated user's profile
   */
  async getCurrentUser(): Promise<MeResponse> {
    return apiGet<MeResponse>("/auth/me");
  },

  /**
   * Manually refresh the token (though the interceptor handles this automatically)
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const sessionVersion = getAuthSessionVersion();
    const storedRefreshToken = tokenStorage.getRefreshToken();
    const payload: RefreshRequest = { refreshToken };
    const response = await apiPost<LoginResponse>("/auth/refresh", payload, { skipAuthRefresh: true });
    if (sessionVersion !== getAuthSessionVersion() || storedRefreshToken !== tokenStorage.getRefreshToken()) {
      throw ApiError.unauthorized("The authentication session has changed.");
    }

    if (response.accessToken && response.refreshToken) {
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
    }

    return response;
  },

  async changePassword(
    payload: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> {
    return apiPost<ChangePasswordResponse>("/auth/change-password", payload);
  },
};
