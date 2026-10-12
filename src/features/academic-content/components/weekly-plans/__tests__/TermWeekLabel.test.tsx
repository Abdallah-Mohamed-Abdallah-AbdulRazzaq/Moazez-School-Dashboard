import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermWeekLabel from "../TermWeekLabel";

describe("saved week labels", () => {
  it("keeps a custom period distinct from generated term weeks", () => {
    render(<TermWeekLabel range={{ startDate: "2026-10-02", endDate: "2026-10-06" }}
      termBounds={{ startDate: "2026-10-01", endDate: "2026-10-17" }} locale="en" />);
    expect(screen.getByText(/Custom period · Oct 2/)).toHaveTextContent(/6$/);
    expect(screen.queryByText(/Week 1/)).not.toBeInTheDocument();
  });
});
