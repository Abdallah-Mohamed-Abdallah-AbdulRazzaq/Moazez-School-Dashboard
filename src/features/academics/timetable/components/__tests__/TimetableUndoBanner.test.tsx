import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TimetableUndoBanner from "@/features/academics/timetable/components/TimetableUndoBanner";

describe("TimetableUndoBanner", () => {
  it("announces the latest change and exposes undo and dismiss actions", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    render(
      <TimetableUndoBanner
        message="Lesson moved to a new slot."
        undoLabel="Undo"
        dismissLabel="Dismiss undo message"
        onUndo={onUndo}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Lesson moved to a new slot.",
    );
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(
      screen.getByRole("button", { name: "Dismiss undo message" }),
    );

    expect(onUndo).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
