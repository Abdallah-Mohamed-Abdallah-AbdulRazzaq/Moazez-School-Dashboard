import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AudiencePreviewCard from "../AudiencePreviewCard";

describe("AudiencePreviewCard", () => {
  it("renders valid zero counts, timestamp, and current-preview disclaimer", () => {
    render(
      <AudiencePreviewCard
        preview={{
          asOf: "2026-10-05T08:00:00.000Z",
          students: 0,
          guardianContexts: 0,
          guardianUsersWithAccounts: 0,
          guardianNotificationOptOutContexts: 0,
        }}
        error={null}
        onRetry={vi.fn()}
      />,
    );

    const values = screen.getAllByText("0");
    expect(values).toHaveLength(4);
    expect(screen.getByText(/current audience counts/i)).toBeInTheDocument();
    expect(screen.getByText(/Preview calculated at/i)).toBeInTheDocument();
    expect(
      screen.getByText("Guardian–student relationships"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /a guardian with several children may be counted more than once/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("exposes an isolated retry when preview loading fails", () => {
    const onRetry = vi.fn();
    render(
      <AudiencePreviewCard
        preview={null}
        error={{ code: "UNAVAILABLE", message: "Preview unavailable" }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Preview unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
