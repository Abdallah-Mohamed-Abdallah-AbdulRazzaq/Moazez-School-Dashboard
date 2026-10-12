import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TermWeekSelect from "../TermWeekSelect";

describe("term week selection", () => {
  it("preserves a custom period until a shortened final week is selected", () => {
    const onChange = vi.fn();
    render(<TermWeekSelect
      termBounds={{ startDate: "2026-10-01", endDate: "2026-10-17" }}
      startDate="2026-10-02" endDate="2026-10-05" onChange={onChange}
    />);
    expect(screen.getByRole("button", { name: "Week" })).toHaveTextContent("Custom period");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    fireEvent.click(screen.getByRole("button", { name: /Week 3 ·/ }));
    expect(onChange).toHaveBeenCalledWith({ startDate: "2026-10-15", endDate: "2026-10-17" });
  });

  it("keeps the stored dates visible when term dates are unavailable", () => {
    render(<TermWeekSelect startDate="2026-10-02" endDate="2026-10-05" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Week" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Week" })).toHaveTextContent("Custom period");
    expect(screen.getByText(/Term dates are unavailable/)).toBeVisible();
  });
});
