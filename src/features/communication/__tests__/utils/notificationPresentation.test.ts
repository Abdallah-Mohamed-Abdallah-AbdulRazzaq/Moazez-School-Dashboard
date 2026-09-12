import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationPresentation } from "@/features/communication/utils/notificationPresentation";

const apiMocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  getMessageInfo: vi.fn(),
}));

vi.mock("@/features/communication/api/communication.service", () => apiMocks);

function deferred<T>(resolvedValue: T) {
  let resolvePromise!: () => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = () => resolve(resolvedValue);
  });
  return { promise, resolve: resolvePromise };
}

function messageNotification() {
  return {
    conversationId: "conversation-1",
    createdAt: "2026-09-12T10:00:00.000Z",
    id: "notification-1",
    sourceId: "message-1",
    type: "message_created",
  };
}

describe("notificationPresentation request sharing", () => {
  beforeEach(() => {
    apiMocks.getConversation.mockReset();
    apiMocks.getMessageInfo.mockReset();
  });

  it("shares concurrent message and conversation context requests", async () => {
    const messageRequest = deferred({
      message: {
        conversationId: "conversation-1",
        sender: { name: "Sender" },
      },
    });
    const conversationRequest = deferred({ titleEn: "Classroom" });
    apiMocks.getMessageInfo.mockReturnValue(messageRequest.promise);
    apiMocks.getConversation.mockReturnValue(conversationRequest.promise);

    const firstPresentation = notificationPresentation(
      messageNotification(),
      "en",
    );
    const secondPresentation = notificationPresentation(
      messageNotification(),
      "en",
    );

    expect(apiMocks.getMessageInfo).toHaveBeenCalledOnce();
    expect(apiMocks.getConversation).toHaveBeenCalledOnce();
    messageRequest.resolve();
    conversationRequest.resolve();
    const presentations = await Promise.all([
      firstPresentation,
      secondPresentation,
    ]);
    expect(presentations.map(({ contextLabel }) => contextLabel)).toEqual([
      "Classroom",
      "Classroom",
    ]);
  });

  it("starts fresh requests after shared requests settle", async () => {
    apiMocks.getMessageInfo.mockResolvedValue({
      message: { conversationId: "conversation-1" },
    });
    apiMocks.getConversation.mockResolvedValue({ titleEn: "Classroom" });

    await notificationPresentation(messageNotification(), "en");
    await notificationPresentation(messageNotification(), "en");

    expect(apiMocks.getMessageInfo).toHaveBeenCalledTimes(2);
    expect(apiMocks.getConversation).toHaveBeenCalledTimes(2);
  });

  it("shares rejected requests, falls back, and permits a later retry", async () => {
    apiMocks.getMessageInfo.mockRejectedValueOnce(new Error("offline"));
    apiMocks.getConversation.mockRejectedValueOnce(new Error("offline"));

    const presentations = await Promise.all([
      notificationPresentation(messageNotification(), "en"),
      notificationPresentation(messageNotification(), "en"),
    ]);

    expect(presentations.map(({ kind }) => kind)).toEqual([
      "message",
      "message",
    ]);
    expect(apiMocks.getMessageInfo).toHaveBeenCalledOnce();
    expect(apiMocks.getConversation).toHaveBeenCalledOnce();

    apiMocks.getMessageInfo.mockResolvedValueOnce({ message: {} });
    apiMocks.getConversation.mockResolvedValueOnce({ titleEn: "Classroom" });
    await notificationPresentation(messageNotification(), "en");
    expect(apiMocks.getMessageInfo).toHaveBeenCalledTimes(2);
    expect(apiMocks.getConversation).toHaveBeenCalledTimes(2);
  });
});
