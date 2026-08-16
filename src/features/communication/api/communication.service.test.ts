import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import * as communicationService from "./communication.service";
import type { CreateAnnouncementPayload } from "@/features/communication/types/announcement.types";
import type { CreateConversationPayload } from "@/features/communication/types/conversation.types";
import type { SendMessagePayload } from "@/features/communication/types/message.types";
import type { NotificationDeliveryStatus } from "@/features/communication/types/notification.types";

describe("communication service backend compatibility", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPut.mockReset().mockResolvedValue({});
    apiMocks.apiPatch.mockReset().mockResolvedValue({});
    apiMocks.apiDelete.mockReset().mockResolvedValue({});
  });

  it("posts sanitized conversation create payloads", async () => {
    await communicationService.createConversation({
      type: "group",
      title: "Team",
      titleAr: "فريق",
      titleEn: "Team",
      participantIds: ["user-1"],
      scopeType: "grade",
      scopeId: "grade-1",
      gradeId: "grade-1",
      isPinned: false,
    } as unknown as CreateConversationPayload);

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/conversations",
      {
        type: "group",
        title: "Team",
        gradeId: "grade-1",
        isPinned: false,
      },
    );
  });

  it("posts sanitized text message payloads and keeps ISO pagination params", async () => {
    await communicationService.sendMessage("conv-1", {
      body: "Hello",
      kind: "text",
      clientMessageId: "client-1",
      parentMessageId: "msg-1",
      attachmentIds: ["file-1"],
    } as unknown as SendMessagePayload);

    await communicationService.getMessages("conv-1", {
      before: "2026-05-17T10:00:00.000Z",
      after: "2026-05-16T10:00:00.000Z",
      limit: 25,
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/conversations/conv-1/messages",
      {
        type: "text",
        body: "Hello",
        clientMessageId: "client-1",
        replyToMessageId: "msg-1",
      },
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/communication/conversations/conv-1/messages",
      {
        params: {
          before: "2026-05-17T10:00:00.000Z",
          after: "2026-05-16T10:00:00.000Z",
          limit: 25,
        },
      },
    );
  });

  it("uses the backend message info endpoint for reader details", async () => {
    await communicationService.getMessageInfo("message-1");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/communication/messages/message-1/info",
    );
  });

  it("posts backend announcement audience payloads", async () => {
    await communicationService.createAnnouncement({
      title: "Announcement",
      body: "Body",
      titleAr: "إعلان",
      bodyAr: "المحتوى",
      audienceType: "grade",
      audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
      targets: [{ type: "grade", id: "grade-1" }],
    } as unknown as CreateAnnouncementPayload);

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/announcements",
      {
        title: "Announcement",
        body: "Body",
        audienceType: "grade",
        audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
      },
    );
  });

  it("uses notification detail, read, archive, and delivery detail endpoints", async () => {
    await communicationService.getNotification("notification-1");
    await communicationService.markNotificationRead("notification-1");
    await communicationService.archiveNotification("notification-1");
    await communicationService.getNotificationDelivery("delivery-1");

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/notifications/notification-1",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/notifications/notification-1/read",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/notifications/notification-1/archive",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/notification-deliveries/delivery-1",
    );
  });


  it("uses invite endpoints with sanitized payloads", async () => {
    await communicationService.getConversationInvites("conv-1");
    await communicationService.createConversationInvite("conv-1", {
      invitedUserId: "user-2",
      expiresAt: null,
      metadata: { source: "test" },
    });
    await communicationService.acceptConversationInvite("invite-1");
    await communicationService.rejectConversationInvite("invite-1", {
      reason: "Not now",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/communication/conversations/conv-1/invites",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/conversations/conv-1/invites",
      {
        invitedUserId: "user-2",
        expiresAt: null,
        metadata: { source: "test" },
      },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/conversation-invites/invite-1/accept",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/communication/conversation-invites/invite-1/reject",
      { reason: "Not now" },
    );
  });

  it("uses join request endpoints with sanitized payloads", async () => {
    await communicationService.getJoinRequests("conv-1");
    await communicationService.createJoinRequest("conv-1", {
      note: "Please add me",
      metadata: { source: "test" },
    });
    await communicationService.approveJoinRequest("request-1", {
      reason: "Approved",
    });
    await communicationService.rejectJoinRequest("request-1", {
      reason: "Rejected",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/communication/conversations/conv-1/join-requests",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/conversations/conv-1/join-requests",
      {
        note: "Please add me",
        metadata: { source: "test" },
      },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/join-requests/request-1/approve",
      { reason: "Approved" },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/communication/join-requests/request-1/reject",
      { reason: "Rejected" },
    );
  });

  it("drops unsupported list query params before calling the backend", async () => {
    await communicationService.getMessageReports({
      status: "open",
      reason: "spam",
      conversationId: "conv-1",
      reporterId: "user-1",
      limit: 50,
    } as never);
    await communicationService.getAnnouncements({
      status: "draft",
      priority: "urgent",
      audienceType: "grade",
      publishedFrom: "2026-05-01T00:00:00.000Z",
      publishedTo: "2026-05-31T23:59:59.000Z",
      createdById: "user-2",
      targets: ["grade-1"],
      audienceIds: ["grade-1"],
      page: 1,
    } as never);
    await communicationService.getRestrictions({
      userId: "admin-1",
      targetUserId: "user-3",
      type: "send_disabled",
      activeOnly: true,
      limit: 20,
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/message-reports",
      {
        params: {
          status: "open",
          reason: "spam",
          conversationId: "conv-1",
          reporterId: "user-1",
          limit: 50,
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/announcements",
      {
        params: {
          status: "draft",
          priority: "urgent",
          audienceType: "grade",
          publishedFrom: "2026-05-01T00:00:00.000Z",
          publishedTo: "2026-05-31T23:59:59.000Z",
          createdById: "user-2",
          page: 1,
        },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/communication/restrictions",
      {
        params: {
          userId: "admin-1",
          targetUserId: "user-3",
          type: "send_disabled",
          activeOnly: true,
          limit: 20,
        },
      },
    );
  });

  it("marks conversations read with only readAt", async () => {
    await communicationService.markConversationRead("conv-1", {
      readAt: "2026-05-17T10:00:00.000Z",
      lastReadMessageId: "msg-1",
    } as never);

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/conversations/conv-1/read",
      { readAt: "2026-05-17T10:00:00.000Z" },
    );
  });

  it("sends moderation action note and metadata", async () => {
    await communicationService.createModerationAction("msg-1", {
      action: "restrict_sender",
      reason: null,
      note: "Escalated",
      metadata: { reportId: "report-1" },
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/messages/msg-1/moderation-actions",
      {
        action: "restrict_sender",
        reason: null,
        note: "Escalated",
        metadata: { reportId: "report-1" },
      },
    );
  });

  it("uses skipped as a notification delivery status", () => {
    const status: NotificationDeliveryStatus = "skipped";
    expect(status).toBe("skipped");
  });
});
