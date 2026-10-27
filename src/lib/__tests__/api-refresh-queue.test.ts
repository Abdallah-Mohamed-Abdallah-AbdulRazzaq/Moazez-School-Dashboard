import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, apiGet, SESSION_EXPIRED_EVENT, SCOPE_PERMISSION_DENIED_EVENT } from "../api";
import { getAuthSessionVersion, invalidateAuthSession } from "../auth/session-client";

function response(config: InternalAxiosRequestConfig, body: unknown = {}) {
  return { data: body, status: 200, statusText: "OK", headers: {}, config };
}
function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    data: { message: "Unauthorized" }, status: 401, statusText: "Unauthorized", headers: {}, config,
  });
}
let expired = true;
let finishRefresh: ((error?: AxiosError) => void) | undefined;
async function networkResponse(config: InternalAxiosRequestConfig) {
  if (config.url?.endsWith("/auth/refresh")) {
    if (finishRefresh) await new Promise<void>((resolve, reject) => { finishRefresh = error => error ? reject(error) : resolve(); });
    expired = false;
    return response(config);
  }
  if (expired) throw unauthorized(config);
  return response(config, { school: "current-school" });
}
const network = vi.fn(networkResponse);

describe("cookie session refresh queue", () => {
  beforeEach(() => {
    expired = true;
    finishRefresh = undefined;
    network.mockReset();
    network.mockImplementation(networkResponse);
    apiClient.defaults.adapter = network;
    axios.defaults.adapter = network;
    localStorage.clear();
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("shares one cookie refresh across simultaneous unauthorized requests", async () => {
    const responses = await Promise.all([apiGet("/private-a"), apiGet("/private-b"), apiGet("/private-c")]);
    expect(responses).toEqual(Array(3).fill({ school: "current-school" }));
    expect(network.mock.calls.filter(([config]) => config.url?.endsWith("/auth/refresh"))).toHaveLength(1);
    expect(network.mock.calls.every(([config]) => !config.headers.has("Authorization"))).toBe(true);
    const refreshConfig = network.mock.calls.find(([config]) => config.url?.endsWith("/auth/refresh"))![0];
    expect(refreshConfig.data).toBeUndefined();
    expect(refreshConfig.headers.get("X-Moazez-CSRF")).toBe("1");
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
  });

  it("retries using cookies already refreshed by another tab without rotating again", async () => {
    network.mockImplementationOnce(async config => { expired = false; throw unauthorized(config); });
    expect(await apiGet("/old-request")).toEqual({ school: "current-school" });
    expect(network.mock.calls.some(([config]) => config.url?.endsWith("/auth/refresh"))).toBe(false);
  });

  it("expires the local session once when refresh is revoked", async () => {
    const expiredListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);
    network.mockImplementation(async config => { throw unauthorized(config); });
    try {
      await expect(Promise.all([apiGet("/private-a"), apiGet("/private-b")])).rejects.toMatchObject({ status: 401 });
      expect(expiredListener).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, expiredListener);
      network.mockImplementation(networkResponse);
    }
  });

  it("does not refresh an explicitly excluded logout request", async () => {
    await expect(apiClient.post("/auth/logout", undefined, { skipAuthRefresh: true } as AxiosRequestConfig)).rejects.toMatchObject({ status: 401 });
    expect(network.mock.calls).toHaveLength(1);
  });

  it("does not deliver a successful old-session response after logout", async () => {
    let finishRequest!: () => void;
    network.mockImplementationOnce(config => new Promise(resolve => { finishRequest = () => resolve(response(config, { privateSchool: "previous-school" })); }));
    const pending = apiGet("/private-school");
    await vi.waitFor(() => expect(finishRequest).toBeTypeOf("function"));
    invalidateAuthSession();
    finishRequest();
    await expect(pending).rejects.toThrow("The authentication session has changed.");
  });

  it("does not refresh a late unauthorized response from the previous login", async () => {
    const version = getAuthSessionVersion();
    invalidateAuthSession();
    await expect(apiClient.get("/old-request", { _authSessionVersion: version } as AxiosRequestConfig)).rejects.toThrow("The authentication session has changed.");
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["success", "failure"])("does not deliver or expire a newer session after an earlier refresh %s", async outcome => {
    finishRefresh = () => undefined;
    const expiredListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expiredListener);
    try {
      const pending = apiGet("/old-private").catch(error => error);
      await vi.waitFor(() => expect(network.mock.calls.some(([config]) => config.url?.endsWith("/auth/refresh"))).toBe(true));
      invalidateAuthSession();
      const refreshConfig = network.mock.calls.find(([config]) => config.url?.endsWith("/auth/refresh"))![0];
      finishRefresh!(outcome === "failure" ? unauthorized(refreshConfig) : undefined);
      expect(await pending).toMatchObject({ status: 401 });
      expect(expiredListener).not.toHaveBeenCalled();
    } finally { window.removeEventListener(SESSION_EXPIRED_EVENT, expiredListener); }
  });

  it.each([false, true])("publishes missing-scope permissions only for a scope denial: %s", async missingScope => {
    const listener = vi.fn();
    window.addEventListener(SCOPE_PERMISSION_DENIED_EVENT, listener);
    network.mockImplementationOnce(async config => {
      throw new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, undefined, {
        data: { error: { message: "Forbidden", ...(missingScope ? { code: "auth.scope.missing", details: { missingPermissions: ["attendance.excuses.review"] } } : {}) } },
        status: 403, statusText: "Forbidden", headers: {}, config,
      });
    });
    try {
      await expect(apiGet("/restricted")).rejects.toMatchObject({ status: 403 });
      expect(listener).toHaveBeenCalledTimes(missingScope ? 1 : 0);
      if (missingScope) expect(listener.mock.calls[0][0].detail).toEqual({ missingPermissions: ["attendance.excuses.review"] });
    } finally { window.removeEventListener(SCOPE_PERMISSION_DENIED_EVENT, listener); }
  });
});
