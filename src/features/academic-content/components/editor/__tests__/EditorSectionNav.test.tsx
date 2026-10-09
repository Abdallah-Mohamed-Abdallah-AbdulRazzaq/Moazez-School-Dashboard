import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditorSectionNav, { EDITOR_SECTIONS } from "../EditorSectionNav";

describe("EditorSectionNav", () => {
  it("exposes section state with accessible non-color indicators", () => {
    const onChange = vi.fn();
    render(
      <EditorSectionNav
        activeSection="metadata"
        variant="desktop"
        indicators={{
          metadata: "unsaved",
          targets: "saving",
          details: "error",
          readiness: "ready",
          revisions: "blocked",
        }}
        onChange={onChange}
      />,
    );

    for (const label of [
      "Unsaved changes",
      "Saving",
      "Save error",
      "Ready",
      "Blocked",
    ]) {
      expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Content scope" }));
    expect(onChange).toHaveBeenCalledWith("targets");
  });

  it("renders a caller-provided publication section", () => {
    const onChange = vi.fn();
    render(
      <EditorSectionNav
        variant="desktop"
        activeSection="publication"
        sections={EDITOR_SECTIONS.slice(0, -1).concat({
          id: "publication",
          labelKey: "publication",
        })}
        onChange={onChange}
      />,
    );

    const publication = screen.getByRole("button", { name: "Publication" });
    expect(publication).toHaveAttribute("aria-current", "true");
    fireEvent.click(publication);
    expect(onChange).toHaveBeenCalledWith("publication");
  });
});
