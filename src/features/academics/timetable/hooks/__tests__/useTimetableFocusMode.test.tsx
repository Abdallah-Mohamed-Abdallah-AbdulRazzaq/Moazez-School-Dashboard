import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTimetableFocusMode } from "../useTimetableFocusMode";

function FocusHarness() {
  const ref = useRef<HTMLDivElement>(null);
  const { focusMode, setFocusMode } = useTimetableFocusMode(ref);
  return (
    <div ref={ref}>
      <button aria-pressed={focusMode} onClick={() => setFocusMode(!focusMode)}>
        Focus
      </button>
    </div>
  );
}

describe("timetable focus mode", () => {
  it("keeps Escape within open overlays and restores page scrolling when exiting", () => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "auto";
    const { unmount } = render(<FocusHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Focus" }));
    expect(document.body.style.overflow).toBe("hidden");
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "listbox");
    document.body.append(overlay);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Focus" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    overlay.remove();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Focus" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(document.body.style.overflow).toBe("auto");
    fireEvent.click(screen.getByRole("button", { name: "Focus" }));
    unmount();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = previousOverflow;
  });
});
