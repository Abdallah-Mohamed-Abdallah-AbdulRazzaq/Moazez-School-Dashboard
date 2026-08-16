import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileAppsWidget } from "../MobileAppsWidget";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "mobile_apps.title": "School mobile apps",
      "mobile_apps.description": "Download the right app for each school role.",
      "app_download.student": "Student App",
      "app_download.teacher": "Teacher App",
      "app_download.parent": "Parent App",
      "app_download.dismissal_staff": "Dismissal Staff App",
      "app_download.android": "Download for Android",
      "app_download.ios": "Download on the App Store",
    };
    return translations[key] ?? key;
  },
}));

describe("MobileAppsWidget", () => {
  it("presents each role-specific school app on the dashboard", () => {
    render(<MobileAppsWidget />);

    expect(
      screen.getByRole("heading", { name: "School mobile apps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Student App")).toBeInTheDocument();
    expect(screen.getByText("Teacher App")).toBeInTheDocument();
    expect(screen.getByText("Parent App")).toBeInTheDocument();
    expect(screen.getByText("Dismissal Staff App")).toBeInTheDocument();
  });
});
