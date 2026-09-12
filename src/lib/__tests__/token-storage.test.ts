import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  subscribeToAccessTokenChanges,
  tokenStorage,
} from "@/lib/token-storage";

describe("tokenStorage access-token changes", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each([
    ["setting", () => tokenStorage.setAccessToken("token-1")],
    ["removing", () => tokenStorage.removeAccessToken()],
    ["clearing", () => tokenStorage.clearTokens()],
  ])("notifies same-tab subscribers after %s the access token", (_, mutate) => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);

    mutate();

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("notifies for cross-tab access-token storage events only", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    window.dispatchEvent(new StorageEvent("storage", { key: ACCESS_TOKEN_KEY }));

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("removes both browser listeners when unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAccessTokenChanges(listener);
    unsubscribe();

    tokenStorage.setAccessToken("token-1");
    window.dispatchEvent(new StorageEvent("storage", { key: ACCESS_TOKEN_KEY }));

    expect(listener).not.toHaveBeenCalled();
  });
});
