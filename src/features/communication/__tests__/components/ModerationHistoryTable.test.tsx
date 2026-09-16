import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ModerationHistoryTable from "@/features/communication/components/safety/ModerationHistoryTable";

const labels = {
  title: "Moderation history",
  action: "Action",
  moderator: "Moderator",
  reason: "Reason",
  createdAt: "Created",
  hide: "Hide",
  unhide: "Unhide",
  delete: "Delete",
  emptyTitle: "No history",
  emptyDescription: "No moderation actions yet.",
  unknown: "Unknown",
};

describe("ModerationHistoryTable", () => {
  it("shows the backend actor UUID when no moderator name is provided", () => {
    render(
      <ModerationHistoryTable
        actions={[
          {
            id: "action-1",
            actorUserId: "4d3b0e76-7bea-4141-8e66-4e3b0e47d195",
            action: "delete",
            reason: "Removed by moderator",
            createdAt: "2026-09-16T18:21:00.000Z",
          },
        ]}
        labels={labels}
      />,
    );

    expect(
      screen.getByText("4d3b0e76-7bea-4141-8e66-4e3b0e47d195"),
    ).toBeInTheDocument();
    expect(screen.queryByText(labels.unknown)).not.toBeInTheDocument();
  });
});
