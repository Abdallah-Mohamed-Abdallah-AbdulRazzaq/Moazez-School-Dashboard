import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationSourceButton from "@/features/communication/components/notifications/NotificationSourceButton";
import type { CommunicationNotification } from "@/features/communication/types/notification.types";
import { apiClient } from "@/lib/api";

const routing = vi.hoisted(() => ({ locale: "en", push: vi.fn() }));
vi.mock("next-intl", () => ({ useLocale: () => routing.locale }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routing.push }) }));
const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  routing.locale = "en";
  routing.push.mockClear();
});
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

describe("NotificationSourceButton", () => {
  it.each([
    ["en", { type: "message_received", metadata: { conversationId: "conversation-1" } }, "Open conversation", "/en/communication/conversations/conversation-1"],
    ["ar", { type: "message_received", deepLink: { conversationId: "conversation-1" } }, "فتح المحادثة", "/ar/communication/conversations/conversation-1"],
    ["en", { type: "announcement_published", sourceId: "announcement-1" }, "View announcement", "/en/communication/announcements/announcement-1"],
    ["ar", { type: "announcement_published", deepLink: { announcementId: "announcement-1" } }, "عرض الإعلان", "/ar/communication/announcements/announcement-1"],
  ] as const)("opens the localized source page in %s", (locale, source, label, target) => {
    routing.locale = locale;
    const onClose = vi.fn();
    render(<NotificationSourceButton notification={{ id: "notification-1", ...source }} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(routing.push).toHaveBeenCalledWith(target);
  });

  it("resolves the conversation when only the message ID is available", async () => {
    apiClient.defaults.adapter = async (config) => ({
      config, status: 200, statusText: "OK", headers: {},
      data: { data: { message: { conversationId: "resolved-conversation" } } },
    });
    render(<NotificationSourceButton notification={{ id: "notification-1", type: "message_received", sourceId: "message-1" }} onClose={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Open conversation" });
    expect(button).toBeDisabled();
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(routing.push).toHaveBeenCalledWith("/en/communication/conversations/resolved-conversation");
  });

  it("keeps navigation disabled if the linked message cannot be loaded", async () => {
    apiClient.defaults.adapter = async () => { throw new Error("Message unavailable"); };
    render(<NotificationSourceButton notification={{ id: "notification-1", type: "message_received", sourceId: "missing-message" }} onClose={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Open conversation" });
    await waitFor(() => expect(button).toHaveAttribute("title", "Conversation unavailable."));
    expect(button).toBeDisabled();
    expect(routing.push).not.toHaveBeenCalled();
  });

  it("omits navigation when no message or announcement source exists", () => {
    const notification: CommunicationNotification = { id: "notification-1", type: "system_alert" };
    render(<NotificationSourceButton notification={notification} onClose={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
