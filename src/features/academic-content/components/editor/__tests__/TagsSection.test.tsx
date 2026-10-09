import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TagsSection from "../TagsSection";

describe("TagsSection", () => {
  it("submits the displayed order and backend-bounded values", () => {
    const onSave = vi.fn(async () => true);
    render(<TagsSection initial={[{ id: "tag-1", value: "Algebra", sortOrder: 0 }, { id: "tag-2", value: "Revision", sortOrder: 1 }]} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    expect(screen.getByLabelText("Tag 1")).toHaveAttribute("maxlength", "80");
    fireEvent.click(screen.getByRole("button", { name: "Move tag 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save tags" }));
    expect(onSave).toHaveBeenCalledWith([
      { value: "Revision" },
      { value: "Algebra" },
    ]);
  });

  it("does not create more than one hundred tags", () => {
    render(<TagsSection initial={Array.from({ length: 100 }, (_, index) => ({ id: `tag-${index}`, value: `Tag ${index}`, sortOrder: index }))} disabled={false} sectionState={{ dirty: false, saving: false, error: null }} onDirty={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Add tag" })).toBeDisabled();
  });
});
