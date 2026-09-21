import { describe, expect, it } from "vitest";
import type { PermissionKey } from "@/hooks/usePermissions";
import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";
import type { Message } from "@/features/communication/types/message.types";
import {
  getCommunicationConversationCapabilities,
  getCommunicationMessageCapabilities,
  getCommunicationModuleCapabilities,
} from "./communication-capabilities";

const activeConversation: Conversation = {
  id: "conversation-1",
  type: "group",
  status: "active",
};

const otherUsersMessage: Message = {
  id: "message-1",
  conversationId: activeConversation.id,
  senderUserId: "user-2",
  type: "text",
  status: "sent",
};

function participant(
  role: ConversationParticipant["role"] = "member",
  status: ConversationParticipant["status"] = "active",
): ConversationParticipant {
  return {
    id: "participant-1",
    userId: "admin-1",
    role,
    status,
  };
}

describe("communication conversation capabilities", () => {
  it("allows global managers to manage a conversation without participating", () => {
    const capabilities = getCommunicationConversationCapabilities({
      permissions: [
        "communication.conversations.manage",
        "communication.participants.manage",
      ],
      currentUserId: "admin-1",
      participants: [],
      conversation: activeConversation,
    });

    expect(capabilities.canManageConversation).toBe(true);
    expect(capabilities.canManageParticipants).toBe(true);
    expect(capabilities.canSendMessage).toBe(false);
  });

  it.each(["owner", "admin", "moderator"] as const)(
    "allows an active %s to send in a read-only conversation",
    (role) => {
      const capabilities = getCommunicationConversationCapabilities({
        permissions: ["communication.messages.send"],
        currentUserId: "admin-1",
        participants: [participant(role)],
        conversation: { ...activeConversation, isReadOnly: true },
      });

      expect(capabilities.canSendMessage).toBe(true);
    },
  );

  it("allows an active global moderator to send in a read-only conversation", () => {
    const capabilities = getCommunicationConversationCapabilities({
      permissions: [
        "communication.messages.send",
        "communication.messages.moderate",
      ],
      currentUserId: "admin-1",
      participants: [participant("member")],
      conversation: { ...activeConversation, isReadOnly: true },
    });

    expect(capabilities.canSendMessage).toBe(true);
  });

  it.each([
    ["no participant", [], activeConversation],
    ["muted participant", [participant("member", "muted")], activeConversation],
    ["closed conversation", [participant()], { ...activeConversation, status: "closed" }],
  ] as const)("denies sending for a %s", (_scenario, participants, conversation) => {
    const capabilities = getCommunicationConversationCapabilities({
      permissions: ["communication.messages.send"],
      currentUserId: "admin-1",
      participants: [...participants],
      conversation,
    });

    expect(capabilities.canSendMessage).toBe(false);
    if (_scenario === "muted participant") {
      expect(capabilities.isActiveParticipant).toBe(false);
      expect(capabilities.hasParticipantAccess).toBe(true);
    }
  });
});

describe("communication module capabilities", () => {
  it("exposes only granted safety and administration areas", () => {
    expect(
      getCommunicationModuleCapabilities([
        "communication.messages.moderate",
        "communication.conversations.manage",
      ]),
    ).toEqual({
      canViewReports: true,
      canModerateMessages: true,
      canManageConversations: true,
      canManageParticipants: false,
    });
  });
});

describe("communication message capabilities", () => {
  const moderatorPermissions: PermissionKey[] = [
    "communication.messages.edit",
    "communication.messages.delete",
    "communication.messages.moderate",
    "communication.messages.attachments.manage",
  ];

  it("allows an active moderator to edit and attach to another user's text message", () => {
    const capabilities = getCommunicationMessageCapabilities({
      permissions: moderatorPermissions,
      currentUserId: "admin-1",
      participant: participant(),
      conversation: activeConversation,
      message: otherUsersMessage,
      allowAttachments: true,
    });

    expect(capabilities.canEditMessage).toBe(true);
    expect(capabilities.canAddAttachment).toBe(true);
    expect(capabilities.deleteMode).toBe("moderation");
  });

  it("allows a non-participant moderator to delete or hide another user's message", () => {
    const capabilities = getCommunicationMessageCapabilities({
      permissions: ["communication.messages.moderate"],
      currentUserId: "admin-1",
      conversation: activeConversation,
      message: otherUsersMessage,
      allowAttachments: true,
    });

    expect(capabilities.canEditMessage).toBe(false);
    expect(capabilities.canAddAttachment).toBe(false);
    expect(capabilities.canHideMessage).toBe(true);
    expect(capabilities.deleteMode).toBe("moderation");
  });

  it("offers unhide and moderation delete for a hidden message", () => {
    const capabilities = getCommunicationMessageCapabilities({
      permissions: ["communication.messages.moderate"],
      currentUserId: "admin-1",
      conversation: activeConversation,
      message: { ...otherUsersMessage, status: "HIDDEN" },
      allowAttachments: true,
    });

    expect(capabilities.canHideMessage).toBe(false);
    expect(capabilities.canUnhideMessage).toBe(true);
    expect(capabilities.deleteMode).toBe("moderation");
  });

  it("suppresses mutations for deleted messages", () => {
    const capabilities = getCommunicationMessageCapabilities({
      permissions: moderatorPermissions,
      currentUserId: "admin-1",
      participant: participant(),
      conversation: activeConversation,
      message: { ...otherUsersMessage, status: "deleted" },
      allowAttachments: true,
    });

    expect(capabilities).toMatchObject({
      canEditMessage: false,
      canAddAttachment: false,
      canRemoveAttachment: false,
      canHideMessage: false,
      canUnhideMessage: false,
      deleteMode: null,
    });
  });
});
