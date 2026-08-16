import axios, {
  type AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStorage } from "./token-storage";
import { ApiError, isAxiosError } from "./api-error";
import {
  SCOPE_PERMISSION_DENIED_EVENT,
  type ScopePermissionDeniedEventDetail,
} from "./access-denied-event";

export { SCOPE_PERMISSION_DENIED_EVENT } from "./access-denied-event";

export type ApiRequestConfig = AxiosRequestConfig;

function isScopePermissionDenied(error: AxiosError): boolean {
  const response = error.response;
  const payload = response?.data as
    | { code?: string; error?: { code?: string } }
    | undefined;

  return response?.status === 403 &&
    (payload?.code === "auth.scope.missing" ||
      payload?.error?.code === "auth.scope.missing");
}

function getMissingScopePermissions(error: AxiosError): string[] {
  const payload = error.response?.data as
    | { error?: { details?: { missingPermissions?: unknown } } }
    | undefined;
  const missingPermissions = payload?.error?.details?.missingPermissions;

  return Array.isArray(missingPermissions)
    ? missingPermissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];
}

function publishScopePermissionDenied(missingPermissions: string[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ScopePermissionDeniedEventDetail>(
        SCOPE_PERMISSION_DENIED_EVENT,
        { detail: { missingPermissions } },
      ),
    );
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in your environment.");
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

export const SESSION_EXPIRED_EVENT = "moazez:session-expired";

function expireSession() {
  tokenStorage.clearTokens();

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

function getTokenExpiry(token: string): number | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = typeof window !== 'undefined'
      ? decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      : Buffer.from(base64, 'base64').toString('utf8');
    const decoded = JSON.parse(jsonPayload);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function doRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }

  const response = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    {
      withCredentials: true,
    },
  );

  const { accessToken, refreshToken: newRefreshToken } = response.data;

  if (!accessToken) {
    throw new Error("Refresh response did not include an access token");
  }

  tokenStorage.setAccessToken(accessToken);
  if (newRefreshToken) {
    tokenStorage.setRefreshToken(newRefreshToken);
  }

  return accessToken;
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh()
    .catch((refreshError) => {
      expireSession();
      throw refreshError;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Request interceptor: Attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = tokenStorage.getAccessToken();

    // Check if token expires within 15 seconds, refresh proactively
    if (token && !config.url?.includes("/auth/refresh")) {
      const expMs = getTokenExpiry(token);
      if (expMs) {
        const expiresInMs = expMs - Date.now();
        if (expiresInMs < 15000) {
          try {
            token = await refreshAccessToken();
          } catch {
            // Let the request proceed, it will likely fail with 401 and handle redirect
            token = null;
          }
        }
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle errors & auto-refresh token on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the refresh token call itself fails with 401
      if (originalRequest.url?.includes("/auth/refresh")) {
        expireSession();
        // Redirect to login handled by AuthProvider or App logic, returning error
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (isAxiosError(refreshError)) {
          return Promise.reject(ApiError.fromAxiosError(refreshError));
        }
        return Promise.reject(refreshError);
      }
    }

    if (isAxiosError(error) && isScopePermissionDenied(error)) {
      publishScopePermissionDenied(getMissingScopePermissions(error));
    }

    // Wrap any other error in our ApiError class
    if (isAxiosError(error)) {
      return Promise.reject(ApiError.fromAxiosError(error));
    }

    return Promise.reject(error);
  },
);

// Generic wrapper functions
export async function apiGet<T>(
  url: string,
  config?: ApiRequestConfig,
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: ApiRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: ApiRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

// Deprecated: For backwards compatibility, to be gradually replaced
export async function api<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  console.warn(
    "Using deprecated api() fetch wrapper. Please migrate to apiClient or apiGet/apiPost.",
  );
  // simplistic fallback for old code
  if (options?.method === "POST") {
    return apiPost<T>(
      endpoint,
      options.body ? JSON.parse(options.body as string) : undefined,
    );
  }
  return apiGet<T>(endpoint);
}

export async function apiWithToken<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  console.warn(
    "Using deprecated apiWithToken() fetch wrapper. Please migrate to apiClient or apiGet/apiPost.",
  );
  const method = (options?.method || "GET").toUpperCase();
  const body =
    typeof options?.body === "string"
      ? JSON.parse(options.body)
      : undefined;

  if (method === "POST") {
    return apiPost<T>(endpoint, body);
  }
  if (method === "PUT") {
    return apiPut<T>(endpoint, body);
  }
  if (method === "PATCH") {
    return apiPatch<T>(endpoint, body);
  }
  if (method === "DELETE") {
    return apiDelete<T>(endpoint);
  }

  return apiGet<T>(endpoint);
}
