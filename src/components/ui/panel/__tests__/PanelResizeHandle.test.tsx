import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PanelResizeHandle from "../PanelResizeHandle";

describe("PanelResizeHandle", () => {
  it("resizes in both directions from the keyboard", () => {
    const onResizeBy = vi.fn();
    render(
      <PanelResizeHandle
        ariaLabel="Resize panel"
        onResizeStart={vi.fn()}
        onResizeBy={onResizeBy}
      />,
    );

    const separator = screen.getByRole("separator", { name: "Resize panel" });
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });

    expect(onResizeBy).toHaveBeenNthCalledWith(1, 16);
    expect(onResizeBy).toHaveBeenNthCalledWith(2, -16);
  });
});
