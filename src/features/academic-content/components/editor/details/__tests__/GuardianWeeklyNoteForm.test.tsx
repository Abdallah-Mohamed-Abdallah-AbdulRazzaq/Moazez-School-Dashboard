import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GuardianWeeklyNoteForm from "../GuardianWeeklyNoteForm";

describe("GuardianWeeklyNoteForm", () => {
  it("requires a body and explains acknowledgement configuration", async () => {
    const onSave = vi.fn(async () => true);
    render(<GuardianWeeklyNoteForm initial={{ body: "", priority: "NORMAL", requiresAcknowledgement: false }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    expect(screen.getByText(/Acknowledgement is configuration only/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Note body is required");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sends the exact acknowledgement configuration", () => {
    const onSave = vi.fn(async () => true);
    render(<GuardianWeeklyNoteForm initial={{ body: "  Bring the workbook  ", priority: "IMPORTANT", requiresAcknowledgement: true }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith({ body: "Bring the workbook", priority: "IMPORTANT", requiresAcknowledgement: true });
  });
});
