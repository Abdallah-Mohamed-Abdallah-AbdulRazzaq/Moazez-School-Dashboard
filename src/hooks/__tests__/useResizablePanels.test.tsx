import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useResizablePanels } from "../useResizablePanels";

const hookOptions = {
  defaultLeftWidth: 400,
  defaultRightWidth: 0,
  constraints: {
    leftMin: 280,
    leftMax: 600,
    rightMin: 0,
    rightMax: 0,
    centerMin: 500,
  },
  storageKey: "academic-structure-panels-test",
};

const pointerMove = (clientX: number) => {
  const event = new Event("pointermove") as PointerEvent;
  Object.defineProperty(event, "clientX", { value: clientX });
  window.dispatchEvent(event);
};

describe("useResizablePanels", () => {
  beforeEach(() => localStorage.clear());

  it("resizes the left panel while dragging and respects its limits", () => {
    const { result } = renderHook(() => useResizablePanels(hookOptions));
    const container = document.createElement("div");
    container.getBoundingClientRect = () =>
      ({ left: 0, right: 1200, width: 1200 }) as DOMRect;
    result.current.containerRef.current = container;

    act(() => result.current.handleResizeStart("left"));
    act(() => pointerMove(700));

    expect(result.current.state.leftWidth).toBe(600);
  });

  it("resizes the left panel by a keyboard step", () => {
    const { result } = renderHook(() => useResizablePanels(hookOptions));

    act(() => result.current.resizeLeftBy(24));

    expect(result.current.state.leftWidth).toBe(424);
  });
});
