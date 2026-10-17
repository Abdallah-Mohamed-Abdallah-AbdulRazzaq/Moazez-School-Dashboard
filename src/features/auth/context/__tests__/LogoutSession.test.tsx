import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { useAuth } from "@/hooks/use-auth";
import { apiGet, apiPost } from "@/lib/api";
import { tokenStorage, ACCESS_TOKEN_KEY } from "@/lib/token-storage";
import type { MeResponse } from "@/types/user";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/en/academics/timetable",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), apiDelete: vi.fn(),
  SESSION_EXPIRED_EVENT: "moazez:session-expired",
}));

const account: MeResponse = {
  id: "audit-admin", email: "audit@example.test", firstName: "QA", lastName: "Admin",
  userType: "SCHOOL_USER", status: "ACTIVE", activeMembership: null,
};

function SessionProbe() {
  const { user, logout, refreshCurrentUser } = useAuth();
  return <>
    <output aria-label="Session">{user?.id ?? "signed-out"}</output>
    <button onClick={() => void logout()}>Logout</button>
    <button onClick={() => void refreshCurrentUser()}>Refresh session</button>
  </>;
}

async function openAuthenticatedSession() {
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await waitFor(() => expect(screen.getByLabelText("Session")).toHaveTextContent(account.id));
}

describe("logout session safeguards", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    tokenStorage.setAccessToken("audit-access");
    tokenStorage.setRefreshToken("audit-refresh");
    vi.mocked(apiGet).mockResolvedValue(account);
    vi.mocked(apiPost).mockResolvedValue(undefined);
  });

  it("does not restore the user when an older me request completes after logout", async () => {
    await openAuthenticatedSession();
    let finishMe!: (user: MeResponse) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise(resolve => { finishMe = resolve; }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh session" }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(tokenStorage.hasTokens()).toBe(false);
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
    await act(async () => finishMe(account));
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
  });

  it("clears the user when another tab removes the access token", async () => {
    await openAuthenticatedSession();
    act(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new StorageEvent("storage", {
        key: ACCESS_TOKEN_KEY, oldValue: "audit-access", newValue: null,
        storageArea: localStorage,
      }));
    });
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
  });

  it("uses one localized login redirect on explicit logout", async () => {
    await openAuthenticatedSession();
    navigation.push.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(navigation.push.mock.calls).toEqual([["/en/login"]]);
  });

  it("clears local credentials even while the logout endpoint is delayed", async () => {
    await openAuthenticatedSession();
    let finishLogout!: () => void;
    vi.mocked(apiPost).mockReturnValueOnce(new Promise<void>(resolve => { finishLogout = resolve; }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    const tokensDuringLogout = tokenStorage.hasTokens();
    await act(async () => finishLogout());
    expect(tokensDuringLogout).toBe(false);
  });

  it("replaces the old user after a different account signs in in another tab", async () => {
    await openAuthenticatedSession();
    const nextAccount = { ...account, id: "next-admin" };
    let finishMe!: (user: MeResponse) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise(resolve => { finishMe = resolve; }));
    act(() => {
      localStorage.setItem(ACCESS_TOKEN_KEY, "next-access");
      window.dispatchEvent(new StorageEvent("storage", {
        key: ACCESS_TOKEN_KEY, oldValue: "audit-access", newValue: "next-access", storageArea: localStorage,
      }));
    });
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
    await act(async () => finishMe(nextAccount));
    expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin");
  });

  it("does not erase the new account when an older me request fails", async () => {
    await openAuthenticatedSession();
    let failOldMe!: (error: Error) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise((_resolve, reject) => { failOldMe = reject; }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh session" }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    vi.mocked(apiGet).mockResolvedValueOnce({ ...account, id: "next-admin" });
    await act(async () => {
      tokenStorage.setAccessToken("next-access");
      tokenStorage.setRefreshToken("next-refresh");
      window.dispatchEvent(new StorageEvent("storage", {
        key: ACCESS_TOKEN_KEY, oldValue: null, newValue: "next-access", storageArea: localStorage,
      }));
    });
    await waitFor(() => expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin"));
    await act(async () => failOldMe(new Error("Old session request failed")));
    expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin");
    expect(tokenStorage.getAccessToken()).toBe("next-access");
  });
});
