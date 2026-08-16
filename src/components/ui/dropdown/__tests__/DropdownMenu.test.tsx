import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DropdownMenu from "../DropdownMenu";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("DropdownMenu", () => {
  it("renders the open menu outside the component container", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-testid="clipping-container" className="overflow-hidden">
        <DropdownMenu
          trigger={<button type="button">Actions</button>}
          items={[
            { value: "publish", label: "Publish" },
            { value: "close", label: "Close" },
          ]}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    const menuItem = screen.getByRole("menuitem", { name: "Publish" });

    expect(document.body.contains(menuItem)).toBe(true);
    expect(container.contains(menuItem)).toBe(false);
  });
});
