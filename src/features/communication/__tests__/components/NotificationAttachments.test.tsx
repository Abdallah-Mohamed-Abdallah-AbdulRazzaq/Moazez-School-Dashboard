import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationAttachments from "@/features/communication/components/notifications/NotificationAttachments";
import { apiClient } from "@/lib/api";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";

const originalAdapter = apiClient.defaults.adapter;
const requestedPaths: string[] = [];
const attachments = [
  { id: "video-1", name: "lesson.mp4", mimeType: "video/mp4", url: "https://example.test/lesson.mp4" },
  { id: "voice-1", name: "voice.webm", mimeType: "audio/webm", url: "https://example.test/voice.webm" },
  { id: "image-1", name: "photo.png", mimeType: "image/png", url: "https://example.test/photo.png" },
  { id: "file-1", name: "notes.pdf", mimeType: "application/pdf", size: 2048, url: "https://example.test/notes.pdf" },
];

beforeEach(() => { requestedPaths.length = 0; });
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  clearAuthenticatedFileUrlCache();
  vi.unstubAllGlobals();
});

function serveAttachments(messageStatus = "sent") {
  apiClient.defaults.adapter = async (config) => {
    requestedPaths.push(config.url ?? "");
    return { config, status: 200, statusText: "OK", headers: {}, data:
      config.url?.endsWith("/info") ? { data: { message: { status: messageStatus } } }
        : { data: { items: attachments } },
    };
  };
}

describe("NotificationAttachments", () => {
  it.each([true, false])("uses authenticated file downloads and respects access failure (allowed=%s)", async (allowed) => {
    const NativeURL = globalThis.URL;
    vi.stubGlobal("URL", class extends NativeURL {
      static createObjectURL() { return "blob:authenticated-voice"; }
      static revokeObjectURL() {}
    });
    apiClient.defaults.adapter = async (config) => {
      requestedPaths.push(config.url ?? "");
      if (config.url?.endsWith("/download") && !allowed) throw new Error("Access denied");
      return { config, status: 200, statusText: "OK", headers: {}, data:
        config.url?.endsWith("/download") ? new Blob(["voice"], { type: "audio/webm" }) :
        [{ id: "voice-1", fileId: "protected-voice", name: "voice.webm", mimeType: "audio/webm", url: "https://example.test/raw-voice" }],
      };
    };
    const { container } = render(<NotificationAttachments notification={{ id: "notification-1", type: "announcement_published", sourceId: "announcement-1" }} />);
    if (allowed) {
      await waitFor(() => expect(container.querySelector("audio")).toHaveAttribute("src", "blob:authenticated-voice"));
      await screen.findByTestId("waveform-container");
      expect(screen.getByRole("button", { name: "Play" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Play" }).closest("[dir]")).toHaveAttribute("dir", "ltr");
      expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute("href", "blob:authenticated-voice");
    } else {
      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load attachment.");
      expect(container.querySelector("audio")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Download" })).not.toBeInTheDocument();
    }
    expect(requestedPaths).toContain("/api/files/protected-voice/download");
  });

  it.each([
    { type: "message_received", sourceId: "message-1" },
    { type: "announcement_published", sourceId: "announcement-1" },
    { type: "announcement_published", deepLink: { type: "announcement", announcementId: "announcement-1" } },
  ] as const)("shows media and downloadable files from $type", async (source) => {
    serveAttachments();
    render(<NotificationAttachments notification={{ id: "notification-1", ...source }} />);
    const video = await screen.findByLabelText("lesson.mp4", { selector: "video" });
    expect(video).toHaveAttribute("controls");
    const voice = screen.getByLabelText("voice.webm", { selector: "audio" });
    expect(voice).toHaveAttribute("src", "https://example.test/voice.webm");
    expect(voice).toHaveAttribute("controls");
    expect(screen.getByRole("img", { name: "photo.png" })).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Download" })).toHaveLength(4);
    expect(screen.getAllByRole("link", { name: "Download" })[3]).toHaveAttribute("download", "notes.pdf");
    expect(screen.queryByRole("button", { name: "Remove attachment" })).not.toBeInTheDocument();
  });

  it.each(["hidden", "deleted"])("does not fetch attachments for a %s message", async (status) => {
    serveAttachments(status);
    render(<NotificationAttachments notification={{ id: "notification-1", type: "message_received", sourceId: "message-1" }} />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByRole("region", { name: "Attachments" })).not.toBeInTheDocument();
    expect(requestedPaths.some((path) => path.endsWith("/attachments"))).toBe(false);
  });

  it("shows an independent error when the attachment endpoint fails", async () => {
    apiClient.defaults.adapter = async () => { throw new Error("Network unavailable"); };
    render(<NotificationAttachments notification={{ id: "notification-1", type: "announcement_published", sourceId: "announcement-1" }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load attachments.");
  });

  it("clears the previous media when switching to a notification without a linked source", async () => {
    serveAttachments();
    const first: CommunicationNotification = { id: "notification-1", type: "message_received", sourceId: "message-1" };
    const { rerender } = render(<NotificationAttachments key={first.id} notification={first} />);
    await screen.findByRole("img", { name: "photo.png" });
    const second: CommunicationNotification = { id: "notification-2", type: "system_alert" };
    rerender(<NotificationAttachments key={second.id} notification={second} />);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Attachments" })).not.toBeInTheDocument();
  });
});
