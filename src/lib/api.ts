import axios, {
  type AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getAuthSessionVersion, invalidateAuthSession, publishSessionChange, withSessionLock, SESSION_EXPIRED_EVENT } from "./auth/session-client";
import { CSRF_HEADER, REALTIME_TOKEN_HEADER, SESSION_API_PATH } from "./auth/constants";
import { setRealtimeAccessToken } from "./auth/realtime-token";
import { ApiError, isAxiosError } from "./api-error";
import {
  SCOPE_PERMISSION_DENIED_EVENT,
  type ScopePermissionDeniedEventDetail,
} from "./access-denied-event";

export { SCOPE_PERMISSION_DENIED_EVENT } from "./access-denied-event";

export type ApiRequestConfig = AxiosRequestConfig & { skipAuthRefresh?: boolean };

type SessionRequestConfig = InternalAxiosRequestConfig & {
  skipAuthRefresh?: boolean;
  _authSessionVersion?: number;
  _retry?: boolean;
};

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

export const apiClient: AxiosInstance = axios.create({
  baseURL: SESSION_API_PATH,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json", [CSRF_HEADER]: "1" },
});

let pendingRefresh: { sessionVersion: number; promise: Promise<void> } | null = null;
export { SESSION_EXPIRED_EVENT };

function expireSession() {
  invalidateAuthSession();
  publishSessionChange("logout");

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

async function refreshSession(sessionVersion: number): Promise<void> {
  await withSessionLock(async () => {
    if (sessionVersion !== getAuthSessionVersion()) throw ApiError.unauthorized("The authentication session has changed.");
    // Another tab may have refreshed while this one waited for the shared lock.
    try {
      const response = await axios.get(SESSION_API_PATH + "/auth/me", { withCredentials: true });
      synchronizeRealtimeToken(response, sessionVersion);
      return;
    } catch (error) {
      if (!isAxiosError(error) || error.response?.status !== 401) throw error;
    }
    await axios.post(SESSION_API_PATH + "/auth/refresh", undefined, {
      withCredentials: true, headers: { [CSRF_HEADER]: "1" },
    });
    if (sessionVersion !== getAuthSessionVersion()) throw ApiError.unauthorized("The authentication session has changed.");
    const response = await axios.get(SESSION_API_PATH + "/auth/me", { withCredentials: true });
    synchronizeRealtimeToken(response, sessionVersion);
    publishSessionChange("refresh");
  });
}

function synchronizeRealtimeToken(response: AxiosResponse, sessionVersion: number) {
  if (sessionVersion !== getAuthSessionVersion()) throw ApiError.unauthorized("The authentication session has changed.");
  const token = response.headers[REALTIME_TOKEN_HEADER.toLowerCase()];
  if (typeof token === "string" && token) setRealtimeAccessToken(token);
}

async function refreshAccessToken(): Promise<void> {
  const sessionVersion = getAuthSessionVersion();
  if (pendingRefresh?.sessionVersion === sessionVersion) return pendingRefresh.promise;
  const promise = refreshSession(sessionVersion).catch((error) => {
    if (sessionVersion === getAuthSessionVersion() && isAxiosError(error) && error.response?.status === 401) expireSession();
    throw error;
  }).finally(() => {
    if (pendingRefresh?.promise === promise) pendingRefresh = null;
  });
  pendingRefresh = { sessionVersion, promise };
  return promise;
}

apiClient.interceptors.request.use((config: SessionRequestConfig) => {
  if (!config.skipAuthRefresh) config._authSessionVersion ??= getAuthSessionVersion();
  if (config._authSessionVersion !== undefined && config._authSessionVersion !== getAuthSessionVersion()) {
    throw ApiError.unauthorized("The authentication session has changed.");
  }
  return config;
});

// Response interceptor: Handle errors & auto-refresh token on 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as SessionRequestConfig;
    if (!config.skipAuthRefresh && config._authSessionVersion !== undefined && config._authSessionVersion !== getAuthSessionVersion()) {
      throw ApiError.unauthorized("The authentication session has changed.");
    }
    if (config.url === "/auth/me") synchronizeRealtimeToken(response, getAuthSessionVersion());
    return response;
  },
  async (error) => {
    const originalRequest = error.config as SessionRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest.skipAuthRefresh && !originalRequest._retry) {
      if (originalRequest._authSessionVersion !== undefined && originalRequest._authSessionVersion !== getAuthSessionVersion()) {
        return Promise.reject(ApiError.fromAxiosError(error));
      }
      // Avoid infinite loop if the refresh token call itself fails with 401
      if (originalRequest.url?.includes("/auth/refresh")) {
        expireSession();
        // Redirect to login handled by AuthProvider or App logic, returning error
        return Promise.reject(ApiError.fromAxiosError(error));
      }

      originalRequest._retry = true;

      try {
        await refreshAccessToken();
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
