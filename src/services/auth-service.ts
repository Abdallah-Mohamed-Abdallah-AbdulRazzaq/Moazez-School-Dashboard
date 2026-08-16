// FILE: src/services/auth-service.ts
import { apiPost, apiGet } from "@/lib/api";
import { tokenStorage } from "@/lib/token-storage";
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
    const response = await apiPost<LoginResponse>("/auth/login", credentials);

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
    try {
      // Swagger documents logout as 204 No Content.
      await apiPost<void>("/auth/logout");
    } catch (error) {
      console.warn("Server logout failed, clearing local tokens anyway", error);
    } finally {
      tokenStorage.clearTokens();
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
    const payload: RefreshRequest = { refreshToken };
    const response = await apiPost<LoginResponse>("/auth/refresh", payload);

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
