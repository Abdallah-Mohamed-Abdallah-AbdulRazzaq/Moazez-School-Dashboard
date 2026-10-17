import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePrint } from "../usePrint";

afterEach(() => {
  document
    .querySelectorAll("iframe, link[data-print-test]")
    .forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe("print document preparation", () => {
  it("waits for styles, images and fonts before opening print and removes the frame afterward", async () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/print-test.css";
    link.dataset.printTest = "true";
    document.head.append(link);
    const source = document.createElement("article");
    source.dir = "rtl";
    source.lang = "ar";
    source.innerHTML =
      '<h1>Timetable</h1><img src="/school.svg" alt="School" />';
    const { result } = renderHook(() =>
      usePrint({ contentRef: { current: source }, title: "Timetable" }),
    );
    let pending: Promise<void>;
    act(() => {
      pending = result.current();
    });
    const frame = document.querySelector("iframe")!;
    const printWindow = frame.contentWindow!;
    const printed = vi
      .spyOn(printWindow, "print")
      .mockImplementation(() => undefined);
    vi.spyOn(printWindow, "focus").mockImplementation(() => undefined);
    let finishFonts!: () => void;
    Object.defineProperty(frame.contentDocument!, "fonts", {
      value: {
        ready: new Promise<void>((resolve) => {
          finishFonts = resolve;
        }),
      },
    });
    expect(printed).not.toHaveBeenCalled();
    await act(async () => {
      frame
        .contentDocument!.querySelector('link[rel="stylesheet"]')!
        .dispatchEvent(new Event("load"));
    });
    expect(printed).not.toHaveBeenCalled();
    await act(async () => {
      frame
        .contentDocument!.querySelector("img")!
        .dispatchEvent(new Event("load"));
      finishFonts();
      await pending!;
    });
    expect(printed).toHaveBeenCalledOnce();
    expect(frame.contentDocument!.documentElement.dir).toBe("rtl");
    expect(frame.contentDocument!.documentElement.lang).toBe("ar");
    expect(frame.contentDocument!.querySelector("h1")?.textContent).toBe(
      "Timetable",
    );
    printWindow.dispatchEvent(new Event("afterprint"));
    await waitFor(() => expect(document.querySelector("iframe")).toBeNull());
  });
});
