import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/lib/api";
import { tokenStorage } from "@/lib/token-storage";
import { authService } from "../auth-service";
import type { LoginResponse } from "@/types/user";

vi.mock("@/lib/api", () => ({ apiPost: vi.fn(), apiGet: vi.fn() }));

const loginResponse: LoginResponse = {
  accessToken: "next-access", refreshToken: "next-refresh", expiresIn: 900,
  user: { id: "next-user", email: "next@example.test", firstName: "QA", lastName: "Admin", userType: "SCHOOL_USER" },
};

describe("authentication service session teardown", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tokenStorage.clearTokens();
    tokenStorage.setAccessToken("original-access");
    tokenStorage.setRefreshToken("original-refresh");
  });
  afterEach(() => tokenStorage.clearTokens());

  it("clears credentials immediately and revokes with a bounded captured-token request", async () => {
    let finishLogout!: () => void;
    vi.mocked(apiPost).mockReturnValueOnce(new Promise<void>(resolve => { finishLogout = resolve; }));
    const pendingLogout = authService.logout();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(apiPost).toHaveBeenCalledWith("/auth/logout", undefined, {
      headers: { Authorization: "Bearer original-access" }, skipAuthRefresh: true, timeout: 5000,
    });
    finishLogout();
    await pendingLogout;
  });

  it.each(["success", "failure"] as const)("preserves a new login after a late logout %s", async outcome => {
    let finishLogout!: () => void;
    vi.mocked(apiPost).mockReturnValueOnce(new Promise<void>((resolve, reject) => {
      finishLogout = outcome === "success" ? resolve : () => reject(new Error("Old logout failed"));
    }));
    const pendingLogout = authService.logout();
    vi.mocked(apiPost).mockResolvedValueOnce(loginResponse);
    await authService.login({ email: "next@example.test", password: "test-only" });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      finishLogout();
      await pendingLogout;
    } finally {
      warning.mockRestore();
    }
    expect(tokenStorage.getAccessToken()).toBe(loginResponse.accessToken);
    expect(tokenStorage.getRefreshToken()).toBe(loginResponse.refreshToken);
  });

  it("does not store a login response completed after the user signs out", async () => {
    let finishLogin!: (response: LoginResponse) => void;
    vi.mocked(apiPost).mockReturnValueOnce(new Promise(resolve => { finishLogin = resolve; }));
    const pendingLogin = authService.login({ email: "next@example.test", password: "test-only" }).catch(error => error);
    await authService.logout();
    finishLogin(loginResponse);
    expect(await pendingLogin).toBeInstanceOf(Error);
    expect(tokenStorage.hasTokens()).toBe(false);
  });

  it("stores a successful explicit refresh for the current session", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce(loginResponse);
    await authService.refreshToken("original-refresh");
    expect(tokenStorage.getAccessToken()).toBe(loginResponse.accessToken);
    expect(tokenStorage.getRefreshToken()).toBe(loginResponse.refreshToken);
  });

  it("rejects an explicit refresh that completes after logout", async () => {
    let finishRefresh!: (response: LoginResponse) => void;
    vi.mocked(apiPost).mockReturnValueOnce(new Promise(resolve => { finishRefresh = resolve; }));
    const pendingRefresh = authService.refreshToken("original-refresh").catch(error => error);
    vi.mocked(apiPost).mockResolvedValueOnce(undefined);
    await authService.logout();
    finishRefresh(loginResponse);
    expect(await pendingRefresh).toBeInstanceOf(Error);
    expect(tokenStorage.hasTokens()).toBe(false);
  });
});
