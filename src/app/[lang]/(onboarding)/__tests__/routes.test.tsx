import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingWelcomeRoute from "../settings/onboarding/page";
import OnboardingSetupRoute from "../settings/onboarding/setup/page";

vi.mock("@/features/onboarding/pages/OnboardingWelcomePage", () => ({
  default: () => <div>Welcome route content</div>,
}));

vi.mock("@/features/onboarding/pages/SchoolOnboardingPage", () => ({
  default: () => <div>Setup route content</div>,
}));

describe("onboarding routes", () => {
  it("renders the welcome page at the onboarding root", () => {
    render(<OnboardingWelcomeRoute />);

    expect(screen.getByText("Welcome route content")).toBeVisible();
  });

  it("renders the setup workflow at the nested setup route", () => {
    render(<OnboardingSetupRoute />);

    expect(screen.getByText("Setup route content")).toBeVisible();
  });
});
