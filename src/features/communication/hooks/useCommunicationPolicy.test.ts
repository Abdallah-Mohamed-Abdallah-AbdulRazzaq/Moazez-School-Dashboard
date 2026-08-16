import { describe, expect, it } from "vitest";
import { payloadFromValues } from "./useCommunicationPolicy";

describe("communication policy form payloads", () => {
  it("includes every backend-supported policy field from settings values", () => {
    const payload = payloadFromValues({
      isEnabled: true,
      allowAdminToAnyone: true,
      allowDirectStaffToStaff: true,
      allowTeacherToParent: true,
      allowTeacherToStudent: true,
      allowStudentToTeacher: true,
      allowStudentToStudent: false,
      allowTeacherCreatedGroups: true,
      allowStudentCreatedGroups: false,
      requireApprovalForStudentGroups: true,
      allowParentToParent: false,
      allowAttachments: true,
      allowVoiceMessages: false,
      allowVideoMessages: true,
      allowReactions: true,
      allowMessageEdit: false,
      allowMessageDelete: true,
      allowReadReceipts: true,
      allowDeliveryReceipts: false,
      allowOnlinePresence: true,
      maxGroupMembers: "30",
      maxMessageLength: "500",
      maxAttachmentSizeMb: "10",
      retentionDays: "90",
      moderationMode: "strict",
      studentDirectMode: "approval_required",
      metadataText: '{"source":"settings-test"}',
    });

    expect(payload).toEqual({
      isEnabled: true,
      allowAdminToAnyone: true,
      allowDirectStaffToStaff: true,
      allowTeacherToParent: true,
      allowTeacherToStudent: true,
      allowStudentToTeacher: true,
      allowStudentToStudent: false,
      allowTeacherCreatedGroups: true,
      allowStudentCreatedGroups: false,
      requireApprovalForStudentGroups: true,
      allowParentToParent: false,
      allowAttachments: true,
      allowVoiceMessages: false,
      allowVideoMessages: true,
      allowReactions: true,
      allowMessageEdit: false,
      allowMessageDelete: true,
      allowReadReceipts: true,
      allowDeliveryReceipts: false,
      allowOnlinePresence: true,
      moderationMode: "strict",
      studentDirectMode: "approval_required",
      maxGroupMembers: 30,
      maxMessageLength: 500,
      maxAttachmentSizeMb: 10,
      retentionDays: 90,
      metadata: expect.objectContaining({
        source: "settings-test",
        clientPlatform: "web",
        uiModule: "communication",
        context: "policy_update",
        updatedFrom: "communication_settings_page",
      }),
    });
  });

  it("does not emit unsupported legacy policy fields", () => {
    const payload = payloadFromValues({
      isEnabled: true,
      allowAttachments: true,
      allowAnnouncements: true,
      allowConversations: true,
      moderationEnabled: true,
      allowMessageEditing: true,
      allowMessageDeleting: true,
      allowedAttachmentMimeTypes: ["image/png"],
    } as never);

    expect(payload).not.toHaveProperty("allowAnnouncements");
    expect(payload).not.toHaveProperty("allowConversations");
    expect(payload).not.toHaveProperty("moderationEnabled");
    expect(payload).not.toHaveProperty("allowMessageEditing");
    expect(payload).not.toHaveProperty("allowMessageDeleting");
    expect(payload).not.toHaveProperty("allowedAttachmentMimeTypes");
  });
});
