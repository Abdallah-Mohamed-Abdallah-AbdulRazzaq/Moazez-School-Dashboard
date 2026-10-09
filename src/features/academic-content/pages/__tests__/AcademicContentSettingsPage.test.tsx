import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AcademicContentSettingsPage from "../AcademicContentSettingsPage";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("year=year-1&term=term-1"),
}));

describe("AcademicContentSettingsPage", () => {
  it("links every settings area while preserving academic context", () => {
    render(<AcademicContentSettingsPage />);

    expect(
      screen.getByRole("link", { name: "Open file policy" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings/file-policy?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Open workflow policy" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings/workflow?year=year-1&term=term-1",
    );
    expect(
      screen.getByRole("link", { name: "Open notification policy" }),
    ).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings/notifications?year=year-1&term=term-1",
    );
  });
});
