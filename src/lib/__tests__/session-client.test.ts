import { afterEach, describe, expect, it, vi } from "vitest";
import { clearLegacyTokens, publishSessionChange, SESSION_STORAGE_KEY, subscribeToSessionChanges } from "@/lib/auth/session-client";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("credential-free session notifications", () => {
  it("removes legacy tokens from browser storage and JavaScript cookies", () => {
    for (const key of ["moazez_access_token", "moazez_refresh_token"]) {
      localStorage.setItem(key, "legacy-secret");
      document.cookie = key + "=legacy-secret; Path=/";
    }
    clearLegacyTokens();
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(localStorage.getItem("moazez_refresh_token")).toBeNull();
    expect(document.cookie).not.toContain("legacy-secret");
  });

  it("publishes only a session-change notification without credentials", () => {
    publishSessionChange("login");
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!)).toEqual({ kind: "login", id: expect.any(String) });
  });

  it("reacts to cross-tab notifications only and detaches on unsubscribe", () => {
    const received: string[] = [];
    const unsubscribe = subscribeToSessionChanges(kind => received.push(kind));
    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated", newValue: "{}" }));
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: JSON.stringify({ kind: "logout" }) }));
    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: JSON.stringify({ kind: "login" }) }));
    expect(received).toEqual(["logout"]);
  });

  it.each(["SecurityError", "QuotaExceededError"])("does not fail cookie authentication when notifications cannot use storage: %s", name => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Storage unavailable", name); });
    expect(() => publishSessionChange("login")).not.toThrow();
  });

  it("ignores malformed session notifications from browser storage", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionChanges(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY, newValue: "invalid-json" }));
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
