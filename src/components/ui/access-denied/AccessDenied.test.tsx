import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccessDenied } from "./AccessDenied";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("AccessDenied", () => {
  it("centers the alert when rendered directly in a page", () => {
    render(<AccessDenied />);

    expect(screen.getByRole("alert").parentElement).toHaveClass(
      "items-center",
      "justify-center",
    );
  });
});
