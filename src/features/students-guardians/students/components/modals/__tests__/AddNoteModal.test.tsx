import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AddNoteModal from "../AddNoteModal";

describe("AddNoteModal", () => {
  it("submits note values from the backend contract", () => {
    const onSubmit = vi.fn();

    render(
      <AddNoteModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        studentName="Ahmed Mostafa"
      />,
    );

    fireEvent.click(screen.getByText("general"));
    fireEvent.click(screen.getByText("behavior"));
    fireEvent.change(screen.getByRole("textbox", { name: /^note/ }), {
      target: { value: "Follow-up required" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^guardian_visible/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "add_note" }));

    expect(onSubmit).toHaveBeenCalledWith({
      category: "behavior",
      note: "Follow-up required",
      visibility: "guardian_visible",
    });
  });
});
