import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StatusBadge from "@/features/admissions/shared/StatusBadge";

describe("StatusBadge", () => {
  it("renders document statuses with review-specific badge styles", () => {
    const { rerender } = render(<StatusBadge status="pending_review" />);
    expect(screen.getByText("pending_review")).toHaveClass(
      "bg-amber-100",
      "text-amber-800",
      "border-amber-200",
    );

    rerender(<StatusBadge status="complete" />);
    expect(screen.getByText("complete")).toHaveClass(
      "bg-green-100",
      "text-green-800",
      "border-green-200",
    );

    rerender(<StatusBadge status="missing" />);
    expect(screen.getByText("missing")).toHaveClass(
      "bg-red-100",
      "text-red-800",
      "border-red-200",
    );
  });

  it("renders unknown statuses with a neutral fallback", () => {
    render(<StatusBadge status="needs_manual_review" />);

    expect(screen.getByText("needs_manual_review")).toHaveClass(
      "bg-gray-100",
      "text-gray-700",
      "border-gray-200",
    );
  });

  it.each([
    ["active", "bg-emerald-100", "text-emerald-800"],
    ["withdrawn", "bg-red-100", "text-red-800"],
  ] as const)("renders %s enrollment status with its color", (status, background, text) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(status)).toHaveClass(background, text);
  });

  it("uses a supplied color for an enrollment-specific status", () => {
    render(
      <StatusBadge
        status="completed"
        colorClassName="bg-blue-100 text-blue-800 border-blue-200"
      />,
    );

    expect(screen.getByText("completed")).toHaveClass(
      "bg-blue-100",
      "text-blue-800",
      "border-blue-200",
    );
  });
});
