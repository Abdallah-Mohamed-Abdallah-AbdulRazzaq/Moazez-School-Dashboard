import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UsernamePreviewCard from "../UsernamePreviewCard";

describe("UsernamePreviewCard Sprint 11 behavior", () => {
  it("shows the generated login email and unavailable username reason", () => {
    render(
      <UsernamePreviewCard
        username="taken"
        onUsernameChange={vi.fn()}
        preview={{ username: "taken", loginEmail: "taken@school.edu" }}
        availability={{
          username: "taken",
          loginEmail: "taken@school.edu",
          available: false,
          reason: "reserved_username",
        }}
        previewError={null}
        availabilityError={null}
        isTesting={false}
        onTest={vi.fn()}
      />,
    );

    expect(screen.getByText("taken@school.edu")).toBeInTheDocument();
    expect(screen.getByText("reasons.reserved_username")).toBeInTheDocument();
  });
});
