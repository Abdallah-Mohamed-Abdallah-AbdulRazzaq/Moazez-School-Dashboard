import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api";
import type { InternalAxiosRequestConfig } from "axios";
import { SESSION_STORAGE_KEY } from "@/lib/auth/session-client";
import { getRealtimeAccessToken, setRealtimeAccessToken } from "@/lib/auth/realtime-token";
import type { MeResponse } from "@/types/user";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/en/academics/timetable",
  useSearchParams: () => new URLSearchParams(),
}));
function response(config: InternalAxiosRequestConfig, body: unknown) {
  return { data: body, status: 200, statusText: "OK", headers: {}, config };
}
const network = vi.fn(async (config: InternalAxiosRequestConfig) => response(config, account));
function crossTab(kind: "login" | "logout" | "refresh") {
  window.dispatchEvent(new StorageEvent("storage", {
    key: SESSION_STORAGE_KEY, newValue: JSON.stringify({ kind, id: crypto.randomUUID() }), storageArea: localStorage,
  }));
}

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
    network.mockImplementation(async config => response(config, account));
    apiClient.defaults.adapter = network;
  });

  it("resynchronizes a token refreshed in another tab without signing the current user out", async () => {
    await openAuthenticatedSession();
    setRealtimeAccessToken("old-access");
    network.mockImplementationOnce(async config => ({
      ...response(config, account), headers: { "x-moazez-realtime-token": "refreshed-access" },
    }));
    act(() => crossTab("refresh"));
    expect(screen.getByLabelText("Session")).toHaveTextContent(account.id);
    await waitFor(() => expect(getRealtimeAccessToken()).toBe("refreshed-access"));
    expect(screen.getByLabelText("Session")).toHaveTextContent(account.id);
  });

  it("does not restore the user when an older me request completes after logout", async () => {
    await openAuthenticatedSession();
    let finishMe!: (user: MeResponse) => void;
    network.mockImplementationOnce(config => new Promise(resolve => { finishMe = user => resolve(response(config, user)); }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh session" }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
    await act(async () => finishMe(account));
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
  });

  it("clears the user when another tab signs out", async () => {
    await openAuthenticatedSession();
    act(() => crossTab("logout"));
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
    network.mockImplementationOnce(config => new Promise(resolve => { finishLogout = () => resolve(response(config, undefined)); }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    const stateDuringLogout = screen.getByLabelText("Session").textContent;
    await act(async () => finishLogout());
    expect(stateDuringLogout).toBe("signed-out");
  });

  it("replaces the old user after a different account signs in in another tab", async () => {
    await openAuthenticatedSession();
    const nextAccount = { ...account, id: "next-admin" };
    let finishMe!: (user: MeResponse) => void;
    network.mockImplementationOnce(config => new Promise(resolve => { finishMe = user => resolve(response(config, user)); }));
    act(() => crossTab("login"));
    expect(screen.getByLabelText("Session")).toHaveTextContent("signed-out");
    await waitFor(() => expect(finishMe).toBeTypeOf("function"));
    await act(async () => finishMe(nextAccount));
    expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin");
  });

  it("does not erase the new account when an older me request fails", async () => {
    await openAuthenticatedSession();
    let failOldMe!: (error: Error) => void;
    network.mockImplementationOnce(() => new Promise((_resolve, reject) => { failOldMe = reject; }));
    await userEvent.click(screen.getByRole("button", { name: "Refresh session" }));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    network.mockImplementationOnce(async config => response(config, { ...account, id: "next-admin" }));
    await act(async () => crossTab("login"));
    await waitFor(() => expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin"));
    await act(async () => failOldMe(new Error("Old session request failed")));
    expect(screen.getByLabelText("Session")).toHaveTextContent("next-admin");
    expect(localStorage.getItem("moazez_access_token")).toBeNull();
  });
});
