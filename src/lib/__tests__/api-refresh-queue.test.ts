import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type InterceptorFulfilled = (value: Record<string, unknown>) => unknown;
type InterceptorRejected = (error: Record<string, unknown>) => unknown;

const axiosMocks = vi.hoisted(() => {
  const state: {
    requestFulfilled?: InterceptorFulfilled;
    responseFulfilled?: InterceptorFulfilled;
    responseRejected?: InterceptorRejected;
    retriedRequests: Array<Record<string, unknown>>;
  } = {
    retriedRequests: [],
  };

  const refreshPost = vi.fn();

  const request = vi.fn(async (inputConfig: Record<string, unknown>) => {
    const config = {
      headers: {},
      ...inputConfig,
    };
    const nextConfig =
      (await state.requestFulfilled?.(config)) ?? config;

    if (nextConfig._retry) {
      state.retriedRequests.push(nextConfig);
      return state.responseFulfilled?.({
        config: nextConfig,
        data: { ok: true },
      }) ?? { config: nextConfig, data: { ok: true } };
    }

    const error = {
      config: nextConfig,
      isAxiosError: true,
      message: "Unauthorized",
      response: {
        data: { message: "Unauthorized" },
        status: 401,
      },
    };

    return state.responseRejected?.(error);
  });

  const instance = Object.assign(
    vi.fn((config: Record<string, unknown>) => request(config)),
    {
      get: vi.fn((url: string, config?: Record<string, unknown>) =>
        request({ ...config, headers: {}, method: "get", url }),
      ),
      interceptors: {
        request: {
          use: vi.fn((fulfilled: InterceptorFulfilled) => {
            state.requestFulfilled = fulfilled;
          }),
        },
        response: {
          use: vi.fn(
            (
              fulfilled: InterceptorFulfilled,
              rejected: InterceptorRejected,
            ) => {
              state.responseFulfilled = fulfilled;
              state.responseRejected = rejected;
            },
          ),
        },
      },
    },
  );

  const axios = Object.assign(
    vi.fn((config: Record<string, unknown>) => request(config)),
    {
      create: vi.fn(() => instance),
      isAxiosError: vi.fn(
        (error: Record<string, unknown>) => Boolean(error?.isAxiosError),
      ),
      post: refreshPost,
    },
  );

  return { axios, refreshPost, state };
});

vi.mock("axios", () => ({
  default: axiosMocks.axios,
}));

describe("api refresh queue", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "https://api.test/api/v1";
    localStorage.clear();
    axiosMocks.refreshPost.mockReset();
    axiosMocks.state.requestFulfilled = undefined;
    axiosMocks.state.responseFulfilled = undefined;
    axiosMocks.state.responseRejected = undefined;
    axiosMocks.state.retriedRequests = [];
  });

  it("shares one refresh request across simultaneous 401 responses and retries all requests", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    axiosMocks.refreshPost.mockResolvedValue({
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      },
    });

    const { apiGet } = await import("../api");

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) => apiGet(`/resource-${index}`)),
    );

    expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1);
    expect(axiosMocks.refreshPost).toHaveBeenCalledWith(
      "https://api.test/api/v1/auth/refresh",
      { refreshToken: "old-refresh-token" },
      { withCredentials: true },
    );
    expect(results).toEqual(Array.from({ length: 5 }, () => ({ ok: true })));
    expect(axiosMocks.state.retriedRequests).toHaveLength(5);
    expect(
      axiosMocks.state.retriedRequests.every(
        (requestConfig) =>
          (requestConfig.headers as Record<string, unknown>).Authorization ===
          "Bearer new-access-token",
      ),
    ).toBe(true);
    expect(localStorage.getItem("moazez_access_token")).toBe(
      "new-access-token",
    );
    expect(localStorage.getItem("moazez_refresh_token")).toBe(
      "new-refresh-token",
    );
  });

  it("rejects all waiting requests and clears tokens when refresh fails", async () => {
    localStorage.setItem("moazez_access_token", "old-access-token");
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    axiosMocks.refreshPost.mockRejectedValue({
      isAxiosError: true,
      message: "Refresh failed",
      response: {
        data: { message: "Refresh failed" },
        status: 401,
      },
    });

    const { apiGet } = await import("../api");

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) => apiGet(`/resource-${index}`)),
    );

    expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1);
    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
    expect(axiosMocks.state.retriedRequests).toHaveLength(0);
  });

  it("rejects locally without calling refresh when no refresh token is stored", async () => {
    const { apiGet } = await import("../api");

    await expect(apiGet("/resource")).rejects.toThrow(
      "Your session has expired. Please sign in again.",
    );

    expect(axiosMocks.refreshPost).not.toHaveBeenCalled();
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
  });

  it("does not refresh again when the failed request is already the refresh endpoint", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");

    const { apiGet } = await import("../api");

    await expect(apiGet("/auth/refresh")).rejects.toThrow();

    expect(axiosMocks.refreshPost).not.toHaveBeenCalled();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
  });

  it("does not open the scope-permission dialog for a regular forbidden request", async () => {
    const { SCOPE_PERMISSION_DENIED_EVENT } = await import("../api");
    const onScopePermissionDenied = vi.fn();
    window.addEventListener(
      SCOPE_PERMISSION_DENIED_EVENT,
      onScopePermissionDenied,
    );

    const error = {
      config: { headers: {} },
      isAxiosError: true,
      message: "Forbidden",
      response: { data: { message: "Forbidden" }, status: 403 },
    };

    await expect(axiosMocks.state.responseRejected?.(error)).rejects.toThrow(
      "Forbidden",
    );
    expect(onScopePermissionDenied).not.toHaveBeenCalled();

    window.removeEventListener(
      SCOPE_PERMISSION_DENIED_EVENT,
      onScopePermissionDenied,
    );
  });

  it("publishes the missing permissions with the global permission event", async () => {
    const { SCOPE_PERMISSION_DENIED_EVENT } = await import("../api");
    const deniedPermissionEvents: CustomEvent[] = [];
    const onScopePermissionDenied = (event: Event) => {
      deniedPermissionEvents.push(event as CustomEvent);
    };
    window.addEventListener(
      SCOPE_PERMISSION_DENIED_EVENT,
      onScopePermissionDenied,
    );

    const error = {
      config: { headers: {} },
      isAxiosError: true,
      message: "Forbidden",
      response: {
        data: {
          error: {
            code: "auth.scope.missing",
            details: { missingPermissions: ["attendance.excuses.review"] },
            message: "Forbidden",
          },
        },
        status: 403,
      },
    };

    await expect(axiosMocks.state.responseRejected?.(error)).rejects.toThrow(
      "Forbidden",
    );
    expect(deniedPermissionEvents).toHaveLength(1);
    expect(deniedPermissionEvents[0].detail).toEqual({
      missingPermissions: ["attendance.excuses.review"],
    });

    window.removeEventListener(
      SCOPE_PERMISSION_DENIED_EVENT,
      onScopePermissionDenied,
    );
  });

  it("throws a clear error when NEXT_PUBLIC_API_URL is missing", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "";

    await expect(import("../api")).rejects.toThrow(
      "Missing NEXT_PUBLIC_API_URL. Set it in your environment.",
    );
  });
  it("does not restore credentials from a refresh completed after logout", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    let finishRefresh!: (response: unknown) => void;
    axiosMocks.refreshPost.mockReturnValueOnce(new Promise(resolve => { finishRefresh = resolve; }));
    const { apiGet } = await import("../api");
    const { tokenStorage } = await import("@/lib/token-storage");
    const pending = apiGet("/private-resource").catch(error => error);
    await waitFor(() => expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1));
    tokenStorage.clearTokens();
    finishRefresh({ data: { accessToken: "late-access", refreshToken: "late-refresh" } });
    await pending;
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it("does not erase a newer login when an earlier refresh fails", async () => {
    localStorage.setItem("moazez_refresh_token", "old-refresh-token");
    let failRefresh!: (error: unknown) => void;
    axiosMocks.refreshPost.mockReturnValueOnce(new Promise((_resolve, reject) => { failRefresh = reject; }));
    const { apiGet } = await import("../api");
    const { tokenStorage } = await import("@/lib/token-storage");
    const pending = apiGet("/old-private-resource").catch(error => error);
    await waitFor(() => expect(axiosMocks.refreshPost).toHaveBeenCalledTimes(1));
    tokenStorage.clearTokens();
    tokenStorage.setAccessToken("new-school-access");
    tokenStorage.setRefreshToken("new-school-refresh");
    failRefresh({ isAxiosError: true, message: "Old refresh rejected", response: { status: 401 } });
    await pending;
    expect(tokenStorage.getAccessToken()).toBe("new-school-access");
    expect(tokenStorage.getRefreshToken()).toBe("new-school-refresh");
  });

  it("does not refresh an explicitly excluded logout request", async () => {
    localStorage.setItem("moazez_refresh_token", "active-refresh");
    const { apiClient } = await import("../api");
    const logoutRequest = { url: "/auth/logout", method: "post", skipAuthRefresh: true };
    await expect(apiClient(logoutRequest)).rejects.toThrow();
    expect(axiosMocks.refreshPost).not.toHaveBeenCalled();
    expect(localStorage.getItem("moazez_refresh_token")).toBe("active-refresh");
  });

  it("does not refresh a late 401 from the previous login", async () => {
    await import("../api");
    const { getAuthSessionVersion, tokenStorage } = await import("../token-storage");
    const oldVersion = getAuthSessionVersion();
    tokenStorage.clearTokens();
    tokenStorage.setAccessToken("current-access");
    tokenStorage.setRefreshToken("current-refresh");
    await expect(axiosMocks.state.responseRejected?.({
      config: { headers: {}, url: "/old-request", _authSessionVersion: oldVersion },
      isAxiosError: true, message: "Unauthorized", response: { status: 401, data: {} },
    })).rejects.toThrow();
    expect(axiosMocks.refreshPost).not.toHaveBeenCalled();
    expect(tokenStorage.getAccessToken()).toBe("current-access");
  });

  it("does not deliver a successful old-session response after logout", async () => {
    await import("../api");
    const { getAuthSessionVersion, tokenStorage } = await import("../token-storage");
    const oldVersion = getAuthSessionVersion();
    tokenStorage.clearTokens();
    expect(() => axiosMocks.state.responseFulfilled?.({
      config: { _authSessionVersion: oldVersion }, data: { privateSchool: "previous-school" },
    })).toThrow("The authentication session has changed.");
  });
});
