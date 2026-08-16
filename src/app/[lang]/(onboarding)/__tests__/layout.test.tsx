import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { useSetupStatusContext } from "@/features/onboarding/context/SetupStatusContext";
import OnboardingLayout from "../layout";

vi.mock("@/components/ui/toast/Toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

function SetupStatusConsumer() {
  useSetupStatusContext();
  return <div>Onboarding setup content</div>;
}

describe("OnboardingLayout", () => {
  it("provides setup status to onboarding content inside its standalone layout", async () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: true,
          mustChangePassword: false,
          login: vi.fn(),
          logout: vi.fn(),
          refreshCurrentUser: vi.fn(),
          changePassword: vi.fn(),
        }}
      >
        {await OnboardingLayout({ children: <SetupStatusConsumer /> })}
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole("main", { name: "layout.label" }),
    ).toContainElement(screen.getByText("Onboarding setup content"));
  });
});
