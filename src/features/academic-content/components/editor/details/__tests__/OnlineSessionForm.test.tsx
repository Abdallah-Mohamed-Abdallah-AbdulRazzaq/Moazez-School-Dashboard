import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnlineSessionForm from "../OnlineSessionForm";

describe("OnlineSessionForm", () => {
  it("rejects non-HTTPS join URLs before saving", async () => {
    const onSave = vi.fn(async () => true);
    render(<OnlineSessionForm initial={{ platform: "ZOOM", providerName: null, joinUrl: "http://example.com", accessCode: null, instructions: null, startAt: "2026-09-01T08:00:00.000Z", endAt: "2026-09-01T09:00:00.000Z", timezone: "Africa/Cairo", timetableEntryId: null }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("HTTPS URL");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a valid ordered session interval", () => {
    const onSave = vi.fn(async () => true);
    render(<OnlineSessionForm initial={{ platform: "ZOOM", providerName: null, joinUrl: "https://example.com/meeting", accessCode: " 123 ", instructions: null, startAt: "2026-09-01T08:00:00.000Z", endAt: "2026-09-01T09:00:00.000Z", timezone: "Africa/Cairo", timetableEntryId: null }} disabled={false} sectionState={{ dirty: true, saving: false, error: null }} onDirty={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Save type details" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ joinUrl: "https://example.com/meeting", accessCode: "123", timezone: "Africa/Cairo" }));
  });
});
