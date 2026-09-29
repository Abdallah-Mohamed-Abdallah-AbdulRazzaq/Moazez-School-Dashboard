import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LinksSection from "../LinksSection";

describe("LinksSection", () => {
  it("preserves displayed order in the exact replacement payload", () => {
    const onSave = vi.fn(async () => true);
    render(<LinksSection initial={[{ id: "link-1", label: "First", url: "https://first.example", sortOrder: 0 }, { id: "link-2", label: "Second", url: "http://second.example", sortOrder: 1 }]} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Move link 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(onSave).toHaveBeenCalledWith([
      { label: "Second", url: "http://second.example" },
      { label: "First", url: "https://first.example" },
    ]);
    expect(screen.getByLabelText("Link 1 label")).toHaveAttribute("maxlength", "180");
    expect(screen.getByLabelText("Link 1 URL")).toHaveAttribute("maxlength", "2048");
  });

  it("rejects unsafe URL schemes", async () => {
    const onSave = vi.fn(async () => true);
    render(<LinksSection initial={[{ id: "link-1", label: "Unsafe", url: "javascript:alert(1)", sortOrder: 0 }]} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("HTTP or HTTPS");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not create more than one hundred links", () => {
    render(
      <LinksSection
        initial={Array.from({ length: 100 }, (_, index) => ({
          id: `link-${index}`,
          label: `Link ${index}`,
          url: `https://example.com/${index}`,
          sortOrder: index,
        }))}
        disabled={false}
        sectionState={{ dirty: false, saving: false, error: null }}
        onDirty={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Add link" })).toBeDisabled();
  });
});
