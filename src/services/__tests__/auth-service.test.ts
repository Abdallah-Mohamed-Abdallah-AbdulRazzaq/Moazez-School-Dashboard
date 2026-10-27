import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api";
import { getAuthSessionVersion } from "@/lib/auth/session-client";
import { authService } from "../auth-service";
import type { InternalAxiosRequestConfig } from "axios";

const loginResponse = { user: { id: "next-user", email: "next@example.test", firstName: "QA", lastName: "Admin", userType: "SCHOOL_USER" } };
function response(config: InternalAxiosRequestConfig, body: unknown) {
  return { data: body, status: 200, statusText: "OK", headers: {}, config };
}
const network = vi.fn(async (config: InternalAxiosRequestConfig) => response(config, config.url === "/auth/login" ? loginResponse : undefined));
const credentials = { email: "qa@example.test", password: "test-only" };

describe("authentication service session ordering", () => {
  beforeEach(() => { network.mockClear(); apiClient.defaults.adapter = network; localStorage.clear(); });

  it("returns a user without storing credentials in browser storage", async () => {
    expect(await authService.login(credentials)).toEqual(loginResponse);
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
    expect(JSON.parse(localStorage.getItem("moazez:session-change")!).kind).toBe("login");
  });

  it("invalidates local requests immediately while server logout is delayed", async () => {
    let finishLogout!: () => void;
    network.mockImplementationOnce(config => new Promise(resolve => { finishLogout = () => resolve(response(config, undefined)); }));
    const version = getAuthSessionVersion();
    const pending = authService.logout();
    expect(getAuthSessionVersion()).toBeGreaterThan(version);
    await vi.waitFor(() => expect(finishLogout).toBeTypeOf("function"));
    expect(network.mock.calls[0][0].headers.has("Authorization")).toBe(false);
    finishLogout();
    await pending;
  });

  it.each(["success", "failure"])("serializes a new login after a delayed logout %s so old cookies cannot erase the new session", async outcome => {
    let finishLogout!: () => void;
    network.mockImplementationOnce(config => new Promise((resolve, reject) => { finishLogout = outcome === "success" ? () => resolve(response(config, undefined)) : () => reject(new Error("Old logout failed")); }));
    const pendingLogout = authService.logout().catch(error => error);
    await vi.waitFor(() => expect(finishLogout).toBeTypeOf("function"));
    const pendingLogin = authService.login(credentials);
    expect(network.mock.calls).toHaveLength(1);
    finishLogout();
    await pendingLogout;
    expect(await pendingLogin).toEqual(loginResponse);
    expect(network.mock.calls.map(([config]) => config.url)).toEqual(["/auth/logout", "/auth/login"]);
  });

  it("rejects a login completed after logout and clears server cookies in the following logout request", async () => {
    let finishLogin!: () => void;
    network.mockImplementationOnce(config => new Promise(resolve => { finishLogin = () => resolve(response(config, loginResponse)); }));
    const pendingLogin = authService.login(credentials).catch(error => error);
    await vi.waitFor(() => expect(finishLogin).toBeTypeOf("function"));
    const pendingLogout = authService.logout();
    finishLogin();
    expect(await pendingLogin).toBeInstanceOf(Error);
    await pendingLogout;
    expect(network.mock.calls.map(([config]) => config.url)).toEqual(["/auth/login", "/auth/logout"]);
    expect(JSON.parse(localStorage.getItem("moazez:session-change")!).kind).toBe("logout");
  });
});
