import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModerationActionForm from "@/features/communication/components/safety/ModerationActionForm";

const labels = {
  title: "Moderation action",
  reason: "Reason",
  reasonPlaceholder: "Explain the action",
  hide: "Hide message",
  unhide: "Unhide message",
  delete: "Delete message",
  reasonRequired: "A reason is required",
};

describe("ModerationActionForm", () => {
  it("shows only valid actions for a hidden message and trims the reason", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ModerationActionForm
        labels={labels}
        messageStatus="HIDDEN"
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.queryByRole("button", { name: labels.hide }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: labels.unhide }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: labels.delete }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.unhide }));
    expect(screen.getByText(labels.reasonRequired)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(labels.reason), {
      target: { value: "  Reviewed by the safety team  " },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.unhide }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        "unhide",
        "Reviewed by the safety team",
      ),
    );
  });

  it("does not render moderation controls for a deleted message", () => {
    render(
      <ModerationActionForm
        labels={labels}
        messageStatus="deleted"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByText(labels.title)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(labels.reason)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("keeps the reason available when the moderation request fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Request failed"));
    render(
      <ModerationActionForm
        labels={labels}
        messageStatus="sent"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(labels.reason), {
      target: { value: "Retry this reason" },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.hide }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(screen.getByLabelText(labels.reason)).toHaveValue(
      "Retry this reason",
    );
  });
});
