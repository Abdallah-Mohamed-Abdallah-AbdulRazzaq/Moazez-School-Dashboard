import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SafetyNavigation from "@/features/communication/components/safety/SafetyNavigation";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/communication/safety/moderation",
}));

describe("SafetyNavigation", () => {
  it("exposes only backend-supported safety destinations", () => {
    render(<SafetyNavigation />);

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/en/communication/safety/reports",
    );
    expect(screen.getByRole("link", { name: "Moderation" })).toHaveAttribute(
      "href",
      "/en/communication/safety/moderation",
    );
    expect(screen.getByRole("link", { name: "Moderation" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByText(/block/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/restriction/i)).not.toBeInTheDocument();
  });
});
