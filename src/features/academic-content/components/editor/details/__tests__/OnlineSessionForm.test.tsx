import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnlineSessionForm from "../OnlineSessionForm";
import type { AcademicOnlineSessionPlatform } from "../../../../types/contracts";

const initialSession = {
  platform: "ZOOM" as AcademicOnlineSessionPlatform,
  providerName: null,
  joinUrl: "https://example.com/meeting",
  accessCode: null,
  instructions: null,
  startAt: "2026-09-01T08:00:00.000Z",
  endAt: "2026-09-01T09:00:00.000Z",
  timezone: "Africa/Cairo",
  timetableEntryId: null,
};

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

  it("selects a meeting timezone from the shared timezone options", () => {
    const onDirty = vi.fn();
    render(
      <OnlineSessionForm
        initial={initialSession}
        disabled={false}
        sectionState={{ dirty: false, saving: false, error: null }}
        onDirty={onDirty}
        onSave={vi.fn(async () => true)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Timezone" }));
    expect(screen.getByText("Asia/Dubai")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Asia/Riyadh" }));

    expect(screen.getByRole("button", { name: "Timezone" })).toHaveTextContent(
      "Asia/Riyadh",
    );
    expect(onDirty).toHaveBeenCalledOnce();
  });

  it.each([
    ["GOOGLE_MEET", "Google Meet", "https://meet.google.com/"],
    ["ZOOM", "Zoom", "https://zoom.us/start/videomeeting"],
    [
      "MICROSOFT_TEAMS",
      "Microsoft Teams",
      "https://teams.microsoft.com/l/meeting/new",
    ],
    ["WEBEX", "Webex", "https://www.webex.com/"],
  ] as const)(
    "opens %s in a separate browser tab",
    (platform, platformLabel, expectedUrl) => {
      render(
        <OnlineSessionForm
          initial={{ ...initialSession, platform }}
          disabled={false}
          sectionState={{ dirty: false, saving: false, error: null }}
          onDirty={vi.fn()}
          onSave={vi.fn(async () => true)}
        />,
      );

      const platformLink = screen.getByRole("link", {
        name: `Open ${platformLabel}`,
      });
      expect(platformLink).toHaveAttribute("href", expectedUrl);
      expect(platformLink).toHaveAttribute("target", "_blank");
      expect(platformLink).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it("does not invent a destination for a custom meeting provider", () => {
    render(
      <OnlineSessionForm
        initial={{ ...initialSession, platform: "OTHER", providerName: "Custom" }}
        disabled={false}
        sectionState={{ dirty: false, saving: false, error: null }}
        onDirty={vi.fn()}
        onSave={vi.fn(async () => true)}
      />,
    );

    expect(screen.queryByRole("link", { name: /Open/ })).not.toBeInTheDocument();
  });
});
