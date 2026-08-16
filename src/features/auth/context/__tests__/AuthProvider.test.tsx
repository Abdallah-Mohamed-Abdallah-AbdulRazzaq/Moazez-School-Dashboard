import { act, render, waitFor } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import {
  clearAuthenticatedFileUrlCache,
  getCachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";

const authProviderMocks = vi.hoisted(() => ({
  pathname: "/ar/login",
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  getCurrentUser: vi.fn(),
  hasTokens: vi.fn(),
  clearTokens: vi.fn(),
  downloadFileBlob: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: authProviderMocks.push }),
  usePathname: () => authProviderMocks.pathname,
  useSearchParams: () => new URLSearchParams(authProviderMocks.searchParams),
}));

vi.mock("@/services/auth-service", () => ({
  authService: {
    getCurrentUser: authProviderMocks.getCurrentUser,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    hasTokens: authProviderMocks.hasTokens,
    clearTokens: authProviderMocks.clearTokens,
    getRefreshToken: vi.fn(),
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
  },
}));

vi.mock("@/services/filesService", () => ({
  downloadFileBlob: authProviderMocks.downloadFileBlob,
}));

const createObjectUrlMock = vi.fn(() => "blob:private-file");
const revokeObjectUrlMock = vi.fn();

describe("AuthProvider route redirects", () => {
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock,
    });
  });

  beforeEach(() => {
    authProviderMocks.pathname = "/ar/login";
    authProviderMocks.searchParams = new URLSearchParams();
    authProviderMocks.push.mockReset();
    authProviderMocks.getCurrentUser.mockReset();
    authProviderMocks.hasTokens.mockReset();
    authProviderMocks.clearTokens.mockReset();
    authProviderMocks.downloadFileBlob.mockReset();
  });

  afterEach(() => {
    clearAuthenticatedFileUrlCache();
  });

  afterAll(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("returns an authenticated user from login to the safe next path", async () => {
    authProviderMocks.searchParams = new URLSearchParams({
      next: "/ar/dashboard/recent-activities",
    });
    authProviderMocks.hasTokens.mockReturnValue(true);
    authProviderMocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      mustChangePassword: false,
    });

    render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authProviderMocks.push).toHaveBeenCalledWith(
        "/ar/dashboard/recent-activities",
      );
    });
  });

  it("redirects an unavailable dashboard overview to the first permitted tab", async () => {
    authProviderMocks.pathname = "/ar/dashboard";
    authProviderMocks.hasTokens.mockReturnValue(true);
    authProviderMocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      mustChangePassword: false,
      activeMembership: { permissions: ["grades.assessments.view"] },
    });

    render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authProviderMocks.push).toHaveBeenCalledWith(
        "/ar/grades/assessments",
      );
    });
  });

  it("redirects once when concurrent requests report an expired session", async () => {
    authProviderMocks.pathname = "/ar/academics";
    authProviderMocks.hasTokens.mockReturnValue(true);
    authProviderMocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
      mustChangePassword: false,
    });

    const { rerender } = render(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authProviderMocks.getCurrentUser).toHaveBeenCalledTimes(1);
    });
    authProviderMocks.push.mockClear();
    authProviderMocks.downloadFileBlob.mockResolvedValue(
      new Blob(["private"], { type: "image/png" }),
    );
    await loadAuthenticatedFileUrl("private-file-1");
    expect(getCachedAuthenticatedFile("private-file-1")).toBeDefined();

    act(() => {
      window.dispatchEvent(new Event("moazez:session-expired"));
      window.dispatchEvent(new Event("moazez:session-expired"));
    });

    expect(getCachedAuthenticatedFile("private-file-1")).toBeUndefined();

    rerender(
      <AuthProvider>
        <div>Protected app</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authProviderMocks.push).toHaveBeenCalledTimes(1);
      expect(authProviderMocks.push).toHaveBeenCalledWith(
        "/ar/login?next=%2Far%2Facademics",
      );
    });
  });
});
