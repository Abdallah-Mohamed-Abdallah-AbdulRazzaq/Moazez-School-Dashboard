import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderedTextList from "../OrderedTextList";

describe("OrderedTextList", () => {
  it("adds, removes, and reorders bounded text items", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <OrderedTextList
        label="Objectives"
        values={["First", "Second"]}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText("Objectives 1")).toHaveAttribute("maxlength", "500");
    fireEvent.click(screen.getByRole("button", { name: "Move objective 2 up" }));
    expect(onChange).toHaveBeenLastCalledWith(["Second", "First"]);

    rerender(
      <OrderedTextList label="Objectives" values={["First"]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add objective" }));
    expect(onChange).toHaveBeenLastCalledWith(["First", ""]);
    fireEvent.click(screen.getByRole("button", { name: "Remove objective 1" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("does not add beyond fifty items", () => {
    const onChange = vi.fn();
    render(
      <OrderedTextList
        label="Activities"
        values={Array.from({ length: 50 }, (_, index) => `Item ${index + 1}`)}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Add activity" })).toBeDisabled();
  });
});
