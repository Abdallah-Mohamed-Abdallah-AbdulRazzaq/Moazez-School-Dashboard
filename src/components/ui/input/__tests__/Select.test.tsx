import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Select from "../Select";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

describe("Select", () => {
  afterEach(() => vi.restoreAllMocks());
  it("navigates enabled options by keyboard, selects, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select
        label="Status"
        value="draft"
        onChange={onChange}
        options={[
          { value: "draft", label: "Draft" },
          { value: "disabled", label: "Unavailable", disabled: true },
          { value: "published", label: "Published" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Status" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Draft" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Published" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("published");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes keyboard-opened options with Escape and moves to the next field with Tab", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(
      document.body,
    );
    const user = userEvent.setup();
    render(
      <>
        <Select
          label="Scope"
          options={[
            { value: "term", label: "School" },
            { value: "grade", label: "Grade" },
          ]}
        />
        <input aria-label="Next field" />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Scope" });
    trigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: "Grade" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowDown}{Tab}");
    expect(screen.getByRole("textbox", { name: "Next field" })).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it.each([
    { name: "empty menu", options: [] },
    {
      name: "disabled options",
      options: [{ value: "disabled", label: "Unavailable", disabled: true }],
    },
  ])("does not trap keyboard focus with $name", async ({ options }) => {
    vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(
      document.body,
    );
    const user = userEvent.setup();
    render(
      <>
        <Select label="Scope" options={options} />
        <input aria-label="Next field" />
      </>,
    );
    screen.getByRole("button", { name: "Scope" }).focus();
    await user.keyboard("{ArrowDown}{Tab}");
    expect(screen.getByRole("textbox", { name: "Next field" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Scope" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("moves from searched options by arrow keys without breaking text editing", async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Classroom"
        searchable
        searchLabel="Find classroom"
        options={[
          { value: "a", label: "Room A" },
          { value: "b", label: "Room B" },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Classroom" }));
    const search = screen.getByRole("textbox", { name: "Find classroom" });
    await user.type(search, "Room B");
    await user.keyboard("{Home}");
    expect(search).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Room B" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Classroom" })).toHaveFocus();
  });

  it("renders the open menu outside the component container", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div data-testid="clipping-container" className="overflow-hidden">
        <Select
          value=""
          onChange={vi.fn()}
          options={[
            { value: "", label: "All statuses" },
            { value: "published", label: "Published outside" },
          ]}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /All statuses/i }));

    const option = screen.getByRole("button", { name: "Published outside" });

    expect(document.body.contains(option)).toBe(true);
    expect(container.contains(option)).toBe(false);
  });

  it("opens the menu above the trigger when there is not enough viewport space below", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        value=""
        onChange={vi.fn()}
        options={[
          { value: "", label: "All modes" },
          { value: "quiz", label: "Quiz" },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: /All modes/i });
    vi.spyOn(
      trigger.parentElement as HTMLElement,
      "getBoundingClientRect",
    ).mockReturnValue({
      bottom: 760,
      height: 40,
      left: 24,
      right: 204,
      top: 720,
      width: 180,
      x: 24,
      y: 720,
      toJSON: () => ({}),
    });
    vi.stubGlobal("innerHeight", 800);

    await user.click(trigger);

    const option = screen.getByRole("button", { name: "Quiz" });
    const menu = option.closest("div");

    expect(menu?.style.top).toBe("");
    expect(menu?.style.bottom).toBe("88px");
    expect(menu?.style.maxHeight).toBe("240px");

    vi.unstubAllGlobals();
    container.remove();
  });

  it("searches options by visible label and supplemental search text", async () => {
    const user = userEvent.setup();
    render(
      <Select
        value="all"
        onChange={vi.fn()}
        searchable
        searchPlaceholder="Search roles"
        options={[
          { value: "all", label: "All roles" },
          {
            value: "teacher",
            label: "Educators",
            searchText: "Educators teacher",
          },
          {
            value: "finance",
            label: "Finance Team",
            searchText: "Finance Team finance",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "All roles" }));
    const searchInput = screen.getByPlaceholderText("Search roles");

    await user.type(searchInput, "teacher");
    expect(screen.getByText("Educators")).toBeInTheDocument();
    expect(screen.queryByText("Finance Team")).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "Finance Team");
    expect(screen.getByText("Finance Team")).toBeInTheDocument();
    expect(screen.queryByText("Educators")).not.toBeInTheDocument();
  });

  it("isolates mixed-direction labels in the trigger and menu options", async () => {
    const user = userEvent.setup();
    render(
      <Select
        value="student-copy"
        onChange={vi.fn()}
        options={[
          {
            value: "student-copy",
            label: "Student Copy · 0 عضو",
          },
          {
            value: "test-account",
            label: "حساب تجريبي · 0 عضو",
          },
        ]}
      />,
    );

    const triggerLabel = screen.getByText("Student Copy · 0 عضو");
    expect(triggerLabel).toHaveAttribute("dir", "auto");

    await user.click(
      screen.getByRole("button", { name: "Student Copy · 0 عضو" }),
    );

    expect(screen.getByText("حساب تجريبي · 0 عضو")).toHaveAttribute(
      "dir",
      "auto",
    );
  });

  it("reports server search without filtering supplied options", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <Select
        value=""
        onChange={vi.fn()}
        searchable
        searchMode="server"
        onSearchChange={onSearchChange}
        searchPlaceholder="Search users"
        options={[
          { value: "one", label: "First user" },
          { value: "two", label: "Second user" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select an option" }));
    await user.type(screen.getByPlaceholderText("Search users"), "missing");

    expect(onSearchChange).toHaveBeenLastCalledWith("missing");
    expect(screen.getByText("First user")).toBeInTheDocument();
    expect(screen.getByText("Second user")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select an option" }));
    expect(onSearchChange).toHaveBeenLastCalledWith("");
    expect(
      screen.queryByPlaceholderText("Search users"),
    ).not.toBeInTheDocument();
  });

  it("renders a menu footer and reports reaching the list end", async () => {
    const user = userEvent.setup();
    const onEndReached = vi.fn();

    render(
      <Select
        value=""
        onChange={vi.fn()}
        onEndReached={onEndReached}
        menuFooter={<p>Loading more users</p>}
        options={[{ value: "one", label: "First user" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select an option" }));
    const option = screen.getByRole("button", { name: "First user" });
    const list = option.closest("ul");

    expect(screen.getByText("Loading more users")).toBeInTheDocument();
    expect(list).not.toBeNull();
    Object.defineProperties(list as HTMLUListElement, {
      scrollHeight: { configurable: true, value: 100 },
      scrollTop: { configurable: true, value: 60 },
      clientHeight: { configurable: true, value: 40 },
    });
    fireEvent.scroll(list as HTMLUListElement);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });
});
