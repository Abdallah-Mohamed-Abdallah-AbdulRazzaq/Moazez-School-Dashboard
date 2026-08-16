import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => apiMocks);

import * as communicationService from "@/features/communication/api/communication.service";
import {
  compactBackendPayload,
  toBackendAnnouncementCreatePayload,
  toBackendConversationCreatePayload,
  toBackendReportCreatePayload,
  toBackendRestrictionCreatePayload,
  toBackendSendMessagePayload,
} from "@/features/communication/api/communication.mappers";
import { uploadFile } from "@/features/communication/api/files.service";

describe("communication API service endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPut.mockReset().mockResolvedValue({});
    apiMocks.apiPatch.mockReset().mockResolvedValue({});
    apiMocks.apiDelete.mockReset().mockResolvedValue({});
    apiMocks.apiClient.post.mockReset().mockResolvedValue({ data: {} });
  });

  it("uses communication policy and admin overview endpoints", async () => {
    await communicationService.getPolicy();
    await communicationService.updatePolicy({ isEnabled: true });
    await communicationService.getAdminOverview();

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(1, "/communication/policies");
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/communication/policies",
      { isEnabled: true },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/admin/overview",
    );
  });

  it("uses announcement endpoints and compact query params", async () => {
    await communicationService.createAnnouncement({ title: "Draft", body: "Body" });
    await communicationService.getAnnouncements({
      status: "draft",
      search: "",
      audienceIds: ["class-1", ""],
      page: 1,
    });
    await communicationService.getAnnouncement("ann-1");
    await communicationService.updateAnnouncement("ann-1", { title: "Updated" });
    await communicationService.publishAnnouncement("ann-1");
    await communicationService.markAnnouncementRead("ann-1");
    await communicationService.getAnnouncementReadSummary("ann-1");
    await communicationService.archiveAnnouncement("ann-1");

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/announcements",
      { title: "Draft", body: "Body" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/announcements",
      { params: { status: "draft", page: 1 } },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/announcements/ann-1",
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/communication/announcements/ann-1",
      { title: "Updated" },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/announcements/ann-1/publish",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/communication/announcements/ann-1/read",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/communication/announcements/ann-1/read-summary",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      4,
      "/communication/announcements/ann-1/archive",
    );
  });

  it("uses conversation, participant, and message endpoints", async () => {
    await communicationService.createConversation({ type: "group", title: "Team" });
    await communicationService.getConversations({ status: "active", page: 2 });
    await communicationService.getConversation("conv-1");
    await communicationService.updateConversation("conv-1", { title: "New" });
    await communicationService.closeConversation("conv-1");
    await communicationService.reopenConversation("conv-1");
    await communicationService.archiveConversation("conv-1");
    await communicationService.addParticipant("conv-1", { userId: "user-1" });
    await communicationService.getParticipants("conv-1");
    await communicationService.sendMessage("conv-1", {
      body: "Hello",
      clientMessageId: "client-1",
    });
    await communicationService.getMessages("conv-1", { limit: 20 });
    await communicationService.getMessage("msg-1");
    await communicationService.updateMessage("msg-1", { body: "Edited" });
    await communicationService.deleteMessage("msg-1");
    await communicationService.markMessageRead("msg-1");
    await communicationService.markConversationRead("conv-1", {
      readAt: "2026-05-17T10:00:00.000Z",
    });
    await communicationService.getConversationReadSummary("conv-1", {
      limit: 10,
    });

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/conversations",
      { type: "group", title: "Team" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/conversations",
      { params: { status: "active", page: 2 } },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/conversations/conv-1",
    );
    expect(apiMocks.apiPatch).toHaveBeenNthCalledWith(
      1,
      "/communication/conversations/conv-1",
      { title: "New" },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/conversations/conv-1/close",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/communication/conversations/conv-1/reopen",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      4,
      "/communication/conversations/conv-1/archive",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      5,
      "/communication/conversations/conv-1/participants",
      { userId: "user-1" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/communication/conversations/conv-1/participants",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      6,
      "/communication/conversations/conv-1/messages",
      { type: "text", body: "Hello", clientMessageId: "client-1" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      4,
      "/communication/conversations/conv-1/messages",
      { params: { limit: 20 } },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      5,
      "/communication/messages/msg-1",
    );
    expect(apiMocks.apiPatch).toHaveBeenNthCalledWith(
      2,
      "/communication/messages/msg-1",
      { body: "Edited" },
    );
    expect(apiMocks.apiDelete).toHaveBeenNthCalledWith(
      1,
      "/communication/messages/msg-1",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      7,
      "/communication/messages/msg-1/read",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      8,
      "/communication/conversations/conv-1/read",
      { readAt: "2026-05-17T10:00:00.000Z" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      6,
      "/communication/conversations/conv-1/read-summary",
      { params: { limit: 10 } },
    );
  });

  it("uses notification endpoints", async () => {
    await communicationService.getNotifications({ status: "unread", page: 1 });
    await communicationService.markAllNotificationsRead();
    await communicationService.getNotificationDeliveries({ status: "sent" });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/notifications",
      { params: { status: "unread", page: 1 } },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/notifications/read-all",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/notification-deliveries",
      { params: { status: "sent" } },
    );
  });

  it("uses reaction and attachment endpoints", async () => {
    await communicationService.upsertReaction("msg-1", "like");
    await communicationService.getReactions("msg-1");
    await communicationService.deleteMyReaction("msg-1");
    await communicationService.linkAttachment("msg-1", { fileId: "file-1" });
    await communicationService.getAttachments("msg-1");
    await communicationService.deleteAttachment("msg-1", "att-1");

    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/communication/messages/msg-1/reactions",
      { type: "like" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/messages/msg-1/reactions",
    );
    expect(apiMocks.apiDelete).toHaveBeenNthCalledWith(
      1,
      "/communication/messages/msg-1/reactions/me",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/communication/messages/msg-1/attachments",
      { fileId: "file-1" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/messages/msg-1/attachments",
    );
    expect(apiMocks.apiDelete).toHaveBeenNthCalledWith(
      2,
      "/communication/messages/msg-1/attachments/att-1",
    );
  });

  it("uses reports, moderation, restrictions, and blocks endpoints", async () => {
    await communicationService.createMessageReport("msg-1", {
      reason: "spam",
    });
    await communicationService.getMessageReports({ status: "open" });
    await communicationService.getMessageReport("report-1");
    await communicationService.updateMessageReport("report-1", {
      status: "resolved",
    });
    await communicationService.createModerationAction("msg-1", {
      action: "hide",
      reason: "Unsafe",
      note: "Audit note",
      metadata: { source: "test" },
    });
    await communicationService.getModerationActions("msg-1");
    await communicationService.createRestriction({
      targetUserId: "user-1",
      type: "send_disabled",
    });
    await communicationService.getRestrictions({ activeOnly: true });
    await communicationService.updateRestriction("restriction-1", {
      reason: "Updated",
    });
    await communicationService.deleteRestriction("restriction-1");
    await communicationService.createBlock({ targetUserId: "user-2" });
    await communicationService.getBlocks({ targetUserId: "user-2" });
    await communicationService.deleteBlock("block-1");

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/communication/messages/msg-1/reports",
      { reason: "spam" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/communication/message-reports",
      { params: { status: "open" } },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/communication/message-reports/report-1",
    );
    expect(apiMocks.apiPatch).toHaveBeenNthCalledWith(
      1,
      "/communication/message-reports/report-1",
      { status: "resolved" },
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/communication/messages/msg-1/moderation-actions",
      {
        action: "hide",
        reason: "Unsafe",
        note: "Audit note",
        metadata: { source: "test" },
      },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      3,
      "/communication/messages/msg-1/moderation-actions",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      3,
      "/communication/restrictions",
      { targetUserId: "user-1", type: "send_disabled" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      4,
      "/communication/restrictions",
      { params: { activeOnly: true } },
    );
    expect(apiMocks.apiPatch).toHaveBeenNthCalledWith(
      2,
      "/communication/restrictions/restriction-1",
      { reason: "Updated" },
    );
    expect(apiMocks.apiDelete).toHaveBeenNthCalledWith(
      1,
      "/communication/restrictions/restriction-1",
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      4,
      "/communication/blocks",
      { targetUserId: "user-2" },
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      5,
      "/communication/blocks",
    );
    expect(apiMocks.apiDelete).toHaveBeenNthCalledWith(
      2,
      "/communication/blocks/block-1",
    );
  });

  it("does not call auth or academic year/term endpoints", async () => {
    await communicationService.getConversations({ page: 1 });
    await communicationService.getPolicy();
    await communicationService.getBlocks();

    const calledUrls = [
      ...apiMocks.apiGet.mock.calls,
      ...apiMocks.apiPost.mock.calls,
      ...apiMocks.apiPut.mock.calls,
      ...apiMocks.apiPatch.mock.calls,
      ...apiMocks.apiDelete.mock.calls,
    ].map((call) => String(call[0]));

    expect(calledUrls).toEqual(
      expect.arrayContaining([
        "/communication/conversations",
        "/communication/policies",
        "/communication/blocks",
      ]),
    );
    expect(calledUrls).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\/auth(?:\/|$)/),
        expect.stringMatching(/academic-years|academic-year|\/terms(?:\/|$)/),
      ]),
    );
  });

  it("uploads files through the existing api client with multipart form data", async () => {
    apiMocks.apiClient.post.mockResolvedValueOnce({
      data: { data: { id: "file-1" } },
    });

    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const response = await uploadFile(file, {
      purpose: "communication",
      folderId: "folder-1",
    });

    expect(response).toEqual({ data: { id: "file-1" } });
    expect(apiMocks.apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiMocks.apiClient.post).toHaveBeenCalledWith(
      "/files",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const formData = apiMocks.apiClient.post.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
    expect(formData.get("purpose")).toBe("communication");
    expect(formData.get("folderId")).toBe("folder-1");
  });

  it("maps request payloads to backend field names only", () => {
    expect(
      toBackendConversationCreatePayload({
        type: "classroom",
        title: "Class chat",
        classroomId: "classroom-1",
        isPinned: false,
        metadata: { source: "test" },
      }),
    ).toEqual({
      type: "classroom",
      title: "Class chat",
      classroomId: "classroom-1",
      isPinned: false,
      metadata: { source: "test" },
    });

    expect(
      toBackendSendMessagePayload({
        body: "Reply",
        replyToMessageId: "msg-parent",
      }),
    ).toEqual({
      type: "text",
      body: "Reply",
      replyToMessageId: "msg-parent",
    });

    expect(
      toBackendAnnouncementCreatePayload({
        title: "Hello",
        body: "Body",
        audienceType: "grade",
        audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
      }),
    ).toEqual({
      title: "Hello",
      body: "Body",
      audienceType: "grade",
      audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
    });

    expect(
      toBackendReportCreatePayload({
        reason: "spam",
        description: "Duplicated",
      }),
    ).toEqual({
      reason: "spam",
      description: "Duplicated",
    });

    expect(
      toBackendRestrictionCreatePayload({
        targetUserId: "user-1",
        type: "send_disabled",
        reason: "Not supported by backend",
      }),
    ).toEqual({
      targetUserId: "user-1",
      type: "send_disabled",
      reason: "Not supported by backend",
    });

    expect(
      compactBackendPayload({
        keepFalse: false,
        keepZero: 0,
        removeUndefined: undefined,
        removeNull: null,
      }),
    ).toEqual({ keepFalse: false, keepZero: 0 });
  });
});
