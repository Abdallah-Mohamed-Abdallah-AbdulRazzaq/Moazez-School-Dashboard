import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppDownloadScreen } from "../AppDownloadScreen";

const authMocks = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ logout: authMocks.logout }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: { appName?: string }) => {
    const labels: Record<string, string> = {
      student: "Student App",
      teacher: "Teacher App",
      android: "android",
      ios: "ios",
      logout: "logout",
    };
    return key === "title" ? values?.appName ?? "" : labels[key] ?? key;
  },
}));

describe("AppDownloadScreen", () => {
  beforeEach(() => {
    authMocks.logout.mockReset();
  });

  it("disables store actions until real download URLs are configured", () => {
    render(<AppDownloadScreen audience="student" />);

    expect(
      screen.getByRole("heading", { name: "Student App" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("app-download-background");
    expect(screen.getByRole("region")).toHaveClass("app-download-card");
    expect(screen.getByRole("button", { name: "Google Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Google Play" })).toHaveClass(
      "app-download-store-link--google-play",
    );
    expect(screen.getByAltText("Google Play")).toHaveAttribute(
      "src",
      "/store-badges/google-play.svg",
    );
    expect(screen.getByAltText("Google Play")).not.toHaveAttribute(
      "data-nimg",
    );
    expect(screen.getByRole("button", { name: "App Store" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "App Store" })).toHaveClass(
      "app-download-store-link--app-store",
    );
    expect(screen.getByAltText("App Store")).toHaveAttribute(
      "src",
      "/store-badges/app-store.svg",
    );
  });

  it("lets the user log out", async () => {
    const user = userEvent.setup();
    render(<AppDownloadScreen audience="teacher" />);

    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(authMocks.logout).toHaveBeenCalledOnce();
  });
});
