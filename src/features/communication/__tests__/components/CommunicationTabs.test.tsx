import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CommunicationTabs from "@/features/communication/components/layout/CommunicationTabs";

vi.mock("next-intl", () => ({
  useLocale: () => "ar",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/ar/communication/safety/moderation",
}));

describe("CommunicationTabs", () => {
  it("marks Safety as active for a safety subpage", () => {
    render(<CommunicationTabs />);

    expect(screen.getByRole("link", { name: "الأمان" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
