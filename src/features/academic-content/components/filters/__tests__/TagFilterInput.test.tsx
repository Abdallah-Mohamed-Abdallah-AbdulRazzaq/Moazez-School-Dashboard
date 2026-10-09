import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TagFilterInput from "../TagFilterInput";

describe("TagFilterInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uses the shared input and bounds emitted values to the backend limit", () => {
    const onChange = vi.fn();
    render(<TagFilterInput label="Tag" value="" onChange={onChange} />);

    const input = screen.getByLabelText("Tag");
    expect(input).toHaveAttribute("maxlength", "80");
    fireEvent.change(input, { target: { value: "x".repeat(100) } });
    act(() => vi.advanceTimersByTime(350));
    expect(onChange).toHaveBeenCalledWith("x".repeat(80));
  });

  it("applies only the final tag after typing pauses", () => {
    const onChange = vi.fn();
    render(<TagFilterInput label="Tag" value="" onChange={onChange} />);
    const input = screen.getByLabelText("Tag");
    fireEvent.change(input, { target: { value: "m" } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: "math" } });
    expect(input).toHaveValue("math");
    act(() => vi.advanceTimersByTime(349));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("math");
  });

  it("cancels pending typing when an applied tag is cleared externally", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TagFilterInput label="Tag" value="old" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("Tag"), {
      target: { value: "new" },
    });
    rerender(<TagFilterInput label="Tag" value="" onChange={onChange} />);
    expect(screen.getByLabelText("Tag")).toHaveValue("");
    act(() => vi.advanceTimersByTime(350));
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each(["enter", "blur"])(
    "applies the pending tag immediately on %s without a second update",
    (interaction) => {
      const onChange = vi.fn();
      render(<TagFilterInput label="Tag" value="" onChange={onChange} />);
      const input = screen.getByLabelText("Tag");
      fireEvent.change(input, { target: { value: "math" } });
      if (interaction === "enter") fireEvent.keyDown(input, { key: "Enter" });
      else fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("math");
      act(() => vi.advanceTimersByTime(350));
      expect(onChange).toHaveBeenCalledTimes(1);
    },
  );

  it("does not apply a pending tag after leaving the page", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <TagFilterInput label="Tag" value="" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("Tag"), {
      target: { value: "math" },
    });
    unmount();
    act(() => vi.advanceTimersByTime(350));
    expect(onChange).not.toHaveBeenCalled();
  });
});
