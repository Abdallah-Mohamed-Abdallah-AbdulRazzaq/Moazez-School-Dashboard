import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DropdownMenu from "../DropdownMenu";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("DropdownMenu", () => {
  it("supports arrow navigation, skips disabled actions, and restores focus on Escape", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <DropdownMenu
        trigger={
          <button type="button" id="actions-trigger">
            Actions
          </button>
        }
        items={[
          { value: "export", label: "Export" },
          { value: "reset", label: "Reset", disabled: true },
          {
            value: "delete",
            label: "Delete",
            tone: "danger",
            onClick: onDelete,
          },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Export" })).toHaveFocus();
    expect(trigger).toHaveAttribute("id", "actions-trigger");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Export" })).toHaveFocus();
    await user.keyboard("{End}{Enter}");
    expect(onDelete).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each([
    { key: "{Tab}", target: "Next control" },
    { key: "{Shift>}{Tab}{/Shift}", target: "Previous control" },
  ])(
    "allows $key to leave the menu without trapping focus",
    async ({ key, target }) => {
      const layout = vi
        .spyOn(HTMLElement.prototype, "offsetParent", "get")
        .mockReturnValue(document.body);
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Previous control</button>
          <DropdownMenu
            trigger={<button type="button">Actions</button>}
            items={[{ value: "export", label: "Export" }]}
          />
          <button type="button">Next control</button>
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.keyboard(key);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: target })).toHaveFocus();
      layout.mockRestore();
    },
  );

  it("dismisses an all-disabled menu with Escape", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        trigger={<button type="button">Actions</button>}
        items={[{ value: "export", label: "Export", disabled: true }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

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
