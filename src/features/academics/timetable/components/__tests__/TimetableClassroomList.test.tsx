import { createRef } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import TimetableClassroomList from "../TimetableClassroomList";

vi.mock("next-intl", async () => {
  const { createTranslator } =
    await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    useTranslations: (namespace: string) =>
      createTranslator({ locale: "en", messages: en, namespace }),
  };
});

const intersections = new Map<Element, IntersectionObserverCallback>();
const classrooms = ["Alpha", "Beta", "Gamma", "Delta"].map((label) => ({
  id: label,
  label,
}));
const scrollRef = createRef<HTMLDivElement>();

function list(
  overrides: Partial<React.ComponentProps<typeof TimetableClassroomList>> = {},
) {
  return (
    <TimetableClassroomList
      classrooms={classrooms}
      scrollRef={scrollRef}
      activeDrag={false}
      printing={false}
      revealRequest={0}
      {...overrides}
    >
      {(id) => <input aria-label={`${id} lesson`} defaultValue="Math" />}
    </TimetableClassroomList>
  );
}

beforeEach(() => {
  intersections.clear();
  // IntersectionObserver is the browser boundary for progressive rendering.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(element: Element) {
        intersections.set(element, this.callback);
      }
      disconnect() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("classroom timetable list", () => {
  it("shows every classroom header, loads grids near the viewport and retains them after scrolling away", async () => {
    const user = userEvent.setup();
    render(list());
    expect(screen.getAllByRole("region")).toHaveLength(4);
    expect(
      screen.queryByRole("textbox", { name: "Gamma lesson" }),
    ).not.toBeInTheDocument();
    const gamma = screen.getByRole("region", { name: "Gamma" });
    act(() =>
      intersections.get(gamma)!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Gamma lesson" }),
      " edited",
    );
    act(() =>
      intersections.get(gamma)!(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("textbox", { name: "Gamma lesson" })).toHaveValue(
      "Math edited",
    );
    await user.click(
      within(screen.getByRole("region", { name: "Delta" })).getByRole(
        "button",
        { name: "Load timetable" },
      ),
    );
    expect(screen.getByRole("textbox", { name: "Delta lesson" })).toBeVisible();
  });

  it("supports individual and bulk collapse, revealing search targets and printing collapsed unloaded classrooms", async () => {
    const user = userEvent.setup();
    const view = render(list());
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    expect(
      screen.queryByRole("textbox", { name: "Alpha lesson" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    view.rerender(list({ revealClassroomId: "Delta", revealRequest: 1 }));
    expect(screen.getByRole("textbox", { name: "Delta lesson" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delta" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    view.rerender(list({ printing: true }));
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    view.rerender(list());
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("textbox", { name: "Alpha lesson" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeDisabled();
  });

  it("prevents collapsing a drag source and expands collapsed destinations on pointer entry", async () => {
    const user = userEvent.setup();
    const view = render(list());
    await user.click(screen.getByRole("button", { name: "Beta" }));
    view.rerender(list({ activeDrag: true }));
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Alpha" })).toBeDisabled();
    await user.hover(screen.getByRole("heading", { name: "Beta" }));
    expect(screen.getByRole("textbox", { name: "Beta lesson" })).toBeVisible();
  });

  it("shows a previously collapsed unloaded classroom when it becomes the only selected classroom", async () => {
    const user = userEvent.setup();
    const view = render(list());
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    view.rerender(list({ classrooms: [classrooms[3]] }));
    expect(screen.getByRole("textbox", { name: "Delta lesson" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Expand all" }),
    ).not.toBeInTheDocument();
  });
});
