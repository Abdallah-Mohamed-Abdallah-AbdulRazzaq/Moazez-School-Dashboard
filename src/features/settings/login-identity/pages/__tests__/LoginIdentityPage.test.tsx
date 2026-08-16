import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast/Toast";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import LoginIdentityPage from "../LoginIdentityPage";

const authState = vi.hoisted(() => ({
  permissions: [] as string[],
}));

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

const translations = vi.hoisted(() => ({
  translate: (key: string) => key,
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => translations.translate,
}));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isLoading: false,
    user: {
      id: "admin-1",
      activeMembership: {
        roleKey: "custom_admin",
        permissions: authState.permissions,
      },
    },
  }),
}));

const settingsResponse = {
  configured: true,
  loginDomain: "school.edu",
  usernameMinLength: 3,
  usernameMaxLength: 32,
  allowedCharacters: "letters and numbers",
  reservedUsernames: ["admin"],
  status: "active",
  updatedAt: "2026-06-29T12:00:00.000Z",
};

function renderPage() {
  render(
    <UnsavedChangesProvider>
      <ToastProvider>
        <LoginIdentityPage />
      </ToastProvider>
    </UnsavedChangesProvider>,
  );
}

describe("LoginIdentityPage UX", () => {
  beforeEach(() => {
    authState.permissions = ["settings.users.view", "settings.users.manage"];
    apiMocks.apiGet.mockReset().mockImplementation((path: string) => {
      if (path === "/settings/login-identity") {
        return Promise.resolve(settingsResponse);
      }
      if (path.startsWith("/settings/login-identity/preview")) {
        return Promise.resolve({
          username: "sara",
          loginEmail: "sara@school.edu",
        });
      }
      if (path.startsWith("/settings/users/usernames/available")) {
        return Promise.resolve({
          username: "sara",
          loginEmail: "sara@school.edu",
          available: true,
          reason: null,
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${path}`));
    });
    apiMocks.apiPut.mockReset().mockImplementation((_path, payload) =>
      Promise.resolve({ ...settingsResponse, ...payload }),
    );
  });

  it("lets view-only administrators test usernames without edit controls", async () => {
    authState.permissions = ["settings.users.view"];
    apiMocks.apiGet.mockImplementation((path: string) => {
      if (path === "/settings/login-identity") return Promise.resolve(settingsResponse);
      if (path.startsWith("/settings/login-identity/preview")) {
        return Promise.resolve({ username: "sara", loginEmail: "sara@school.edu" });
      }
      return Promise.reject(new Error("availability unavailable"));
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findAllByText("school.edu")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "save" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("username_label"), "sara");
    await user.click(screen.getByRole("button", { name: "test_button" }));

    expect(await screen.findByText("sara@school.edu")).toBeInTheDocument();
    expect(screen.getByText("preview.errors.availability_failed")).toBeInTheDocument();
  });

  it("requires confirmation for a domain change and keeps the summary persisted", async () => {
    const user = userEvent.setup();
    renderPage();

    const domain = await screen.findByLabelText("fields.login_domain");
    await user.clear(domain);
    await user.type(domain, "new-school.edu");

    expect(screen.getByText("school.edu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(screen.getByText("confirmation.title")).toBeInTheDocument();
    expect(apiMocks.apiPut).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "confirmation.confirm" }));
    await waitFor(() => expect(apiMocks.apiPut).toHaveBeenCalledTimes(1));
  });

  it("discards policy edits and saves policy-only changes without confirmation", async () => {
    const user = userEvent.setup();
    renderPage();

    const minimum = await screen.findByLabelText("fields.username_min");
    await user.clear(minimum);
    await user.type(minimum, "4");
    await user.click(screen.getByRole("button", { name: "discard" }));
    expect(minimum).toHaveValue(3);

    await user.clear(minimum);
    await user.type(minimum, "5");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(apiMocks.apiPut).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("confirmation.title")).not.toBeInTheDocument();
  });
});
