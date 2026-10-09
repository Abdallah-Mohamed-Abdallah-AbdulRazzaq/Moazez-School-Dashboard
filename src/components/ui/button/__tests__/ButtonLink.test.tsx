import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a data-router-link="true" {...props}>
      {children}
    </a>
  ),
}));

import ButtonLink from "../ButtonLink";

describe("ButtonLink", () => {
  it("renders internal destinations through the router link", () => {
    render(
      <ButtonLink href="/en/academic-content-hub/settings">
        Open settings
      </ButtonLink>,
    );

    const settingsLink = screen.getByRole("link", { name: "Open settings" });

    expect(settingsLink).toHaveAttribute("data-router-link", "true");
    expect(settingsLink).toHaveAttribute(
      "href",
      "/en/academic-content-hub/settings",
    );
  });
});
