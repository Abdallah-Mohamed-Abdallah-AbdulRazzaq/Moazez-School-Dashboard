import { describe, expect, it } from "vitest";
import {
  toBackendAnnouncementCreatePayload,
  toBackendConversationCreatePayload,
  toBackendPolicyUpdatePayload,
  toBackendReportCreatePayload,
  toBackendRestrictionCreatePayload,
  toBackendSendMessagePayload,
} from "./communication.mappers";
import type { CreateAnnouncementPayload } from "@/features/communication/types/announcement.types";
import type { CreateConversationPayload } from "@/features/communication/types/conversation.types";
import type { UpdateCommunicationPolicyPayload } from "@/features/communication/types/communication.types";
import type { SendMessagePayload } from "@/features/communication/types/message.types";
import type {
  CreateMessageReportPayload,
  CreateRestrictionPayload,
} from "@/features/communication/types/safety.types";

describe("communication backend request mappers", () => {
  it("removes frontend-only conversation fields", () => {
    const input = {
      type: "group",
      title: "Backend title",
      titleAr: "عنوان",
      titleEn: "Title",
      participantIds: ["user-1"],
      scopeType: "classroom",
      scopeId: "classroom-1",
      classroomId: "classroom-1",
      isReadOnly: false,
      isPinned: true,
      metadata: { source: "test" },
    } satisfies Record<string, unknown>;

    const output = toBackendConversationCreatePayload(
      input as unknown as CreateConversationPayload,
    );

    expect(output).toEqual({
      type: "group",
      title: "Backend title",
      classroomId: "classroom-1",
      isReadOnly: false,
      isPinned: true,
      metadata: { source: "test" },
    });
    expect(output).not.toHaveProperty("titleAr");
    expect(output).not.toHaveProperty("titleEn");
    expect(output).not.toHaveProperty("participantIds");
    expect(output).not.toHaveProperty("scopeType");
    expect(output).not.toHaveProperty("scopeId");
  });

  it("maps message parent ids and removes frontend-only message fields", () => {
    const output = toBackendSendMessagePayload({
      body: "Reply",
      kind: "text",
      parentMessageId: "parent-1",
      attachmentIds: ["att-1"],
      clientMessageId: "client-1",
    } as unknown as SendMessagePayload);

    expect(output).toEqual({
      type: "text",
      body: "Reply",
      clientMessageId: "client-1",
      replyToMessageId: "parent-1",
    });
    expect(output).not.toHaveProperty("kind");
    expect(output).not.toHaveProperty("parentMessageId");
    expect(output).not.toHaveProperty("attachmentIds");
  });

  it("maps voice message attachments to the backend media message contract", () => {
    const output = toBackendSendMessagePayload({
      type: "voice",
      caption: "Voice message",
      clientMessageId: "client-voice-1",
      replyToMessageId: "parent-1",
      attachments: [
        {
          fileId: "550e8400-e29b-41d4-a716-446655440000",
          mediaKind: "audio",
          caption: "Voice message",
          sortOrder: 0,
        },
      ],
    } as unknown as SendMessagePayload);

    expect(output).toEqual({
      type: "voice",
      caption: "Voice message",
      clientMessageId: "client-voice-1",
      replyToMessageId: "parent-1",
      attachments: [
        {
          fileId: "550e8400-e29b-41d4-a716-446655440000",
          mediaKind: "audio",
          caption: "Voice message",
          sortOrder: 0,
        },
      ],
    });
  });

  it("keeps announcement audience fields and removes frontend-only targets", () => {
    const output = toBackendAnnouncementCreatePayload({
      title: "Announcement",
      titleAr: "إعلان",
      body: "Body",
      bodyAr: "المحتوى",
      audienceType: "grade",
      audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
      targets: [{ type: "grade", id: "grade-1" }],
      scopeType: "grade",
      scopeId: "grade-1",
    } as unknown as CreateAnnouncementPayload);

    expect(output).toEqual({
      title: "Announcement",
      body: "Body",
      audienceType: "grade",
      audiences: [{ audienceType: "grade", gradeId: "grade-1" }],
    });
    expect(output).not.toHaveProperty("titleAr");
    expect(output).not.toHaveProperty("bodyAr");
    expect(output).not.toHaveProperty("targets");
    expect(output).not.toHaveProperty("scopeType");
    expect(output).not.toHaveProperty("scopeId");
  });

  it("maps report details to backend description", () => {
    const output = toBackendReportCreatePayload({
      reason: "spam",
      details: "Duplicate message",
    } as unknown as CreateMessageReportPayload);

    expect(output).toEqual({
      reason: "spam",
      description: "Duplicate message",
    });
    expect(output).not.toHaveProperty("details");
  });

  it("normalizes legacy restriction type and drops unsupported restriction types", () => {
    expect(
      toBackendRestrictionCreatePayload({
        targetUserId: "user-1",
        type: "message_send_disabled",
      } as unknown as CreateRestrictionPayload),
    ).toEqual({
      targetUserId: "user-1",
      type: "send_disabled",
    });

    expect(
      toBackendRestrictionCreatePayload({
        targetUserId: "user-1",
        type: "attachment_upload_disabled",
      } as unknown as CreateRestrictionPayload),
    ).toEqual({
      targetUserId: "user-1",
    });

    expect(
      toBackendRestrictionCreatePayload({
        targetUserId: "user-1",
        type: "reaction_disabled",
      } as unknown as CreateRestrictionPayload),
    ).toEqual({
      targetUserId: "user-1",
    });
  });

  it("maps all backend-supported policy fields and removes unsupported policy fields", () => {
    const output = toBackendPolicyUpdatePayload({
      isEnabled: true,
      allowDirectStaffToStaff: true,
      allowAdminToAnyone: true,
      allowTeacherToParent: true,
      allowTeacherToStudent: true,
      allowStudentToTeacher: false,
      allowStudentToStudent: false,
      studentDirectMode: "approval_required",
      allowTeacherCreatedGroups: true,
      allowStudentCreatedGroups: false,
      requireApprovalForStudentGroups: true,
      allowParentToParent: false,
      allowAttachments: false,
      allowVoiceMessages: true,
      allowVideoMessages: false,
      allowMessageEdit: true,
      allowMessageDelete: false,
      allowReactions: true,
      allowReadReceipts: true,
      allowDeliveryReceipts: false,
      allowOnlinePresence: true,
      maxGroupMembers: 30,
      maxMessageLength: 500,
      maxAttachmentSizeMb: 10,
      retentionDays: 90,
      moderationMode: "strict",
      metadata: { source: "test" },
      allowAnnouncements: true,
      allowConversations: true,
      moderationEnabled: true,
      allowMessageEditing: true,
      allowMessageDeleting: true,
      allowedAttachmentMimeTypes: ["image/png"],
    } as unknown as UpdateCommunicationPolicyPayload);

    expect(output).toEqual({
      isEnabled: true,
      allowDirectStaffToStaff: true,
      allowAdminToAnyone: true,
      allowTeacherToParent: true,
      allowTeacherToStudent: true,
      allowStudentToTeacher: false,
      allowStudentToStudent: false,
      studentDirectMode: "approval_required",
      allowTeacherCreatedGroups: true,
      allowStudentCreatedGroups: false,
      requireApprovalForStudentGroups: true,
      allowParentToParent: false,
      allowAttachments: false,
      allowVoiceMessages: true,
      allowVideoMessages: false,
      allowMessageEdit: true,
      allowMessageDelete: false,
      allowReactions: true,
      allowReadReceipts: true,
      allowDeliveryReceipts: false,
      allowOnlinePresence: true,
      maxGroupMembers: 30,
      maxMessageLength: 500,
      maxAttachmentSizeMb: 10,
      retentionDays: 90,
      moderationMode: "strict",
      metadata: { source: "test" },
    });
    expect(output).not.toHaveProperty("allowAnnouncements");
    expect(output).not.toHaveProperty("allowConversations");
    expect(output).not.toHaveProperty("moderationEnabled");
    expect(output).not.toHaveProperty("allowMessageEditing");
    expect(output).not.toHaveProperty("allowMessageDeleting");
    expect(output).not.toHaveProperty("allowedAttachmentMimeTypes");
  });
});
