import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeliveryRecipientTable from "../DeliveryRecipientTable";

describe("DeliveryRecipientTable", () => {
  it("shows backend recipient lifecycle fields", () => {
    render(
      <DeliveryRecipientTable
        recipients={[
          {
            id: "recipient-1",
            userId: null,
            recipientEmail: "guardian@example.com",
            fullName: "Guardian",
            status: "SKIPPED",
            attempts: 2,
            lastAttemptAt: "2026-07-30T09:01:00.000Z",
            sentAt: null,
            failureReason: null,
            skippedReason: "duplicate_email",
            createdAt: "2026-07-30T09:00:00.000Z",
            updatedAt: "2026-07-30T09:02:00.000Z",
          },
        ]}
        page={1}
        limit={10}
        total={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        labels={{
          recipient: "Recipient",
          email: "Email",
          status: "Status",
          attempts: "Attempts",
          lastAttemptAt: "Last attempt",
          sentAt: "Sent at",
          failureReason: "Failure reason",
          skippedReason: "Skipped reason",
          updatedAt: "Updated at",
          notAvailable: "N/A",
          statusLabels: {
            PENDING: "Pending",
            QUEUED: "Queued",
            SENDING: "Sending",
            SENT: "Sent",
            FAILED: "Failed",
            SKIPPED: "Skipped",
            CANCELLED: "Cancelled",
          },
        }}
      />,
    );

    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("duplicate_email")).toBeVisible();
    expect(screen.getByText("Last attempt")).toBeVisible();
    expect(screen.getByText("Updated at")).toBeVisible();
    expect(screen.queryByText("Skipped at")).not.toBeInTheDocument();
  });
});
