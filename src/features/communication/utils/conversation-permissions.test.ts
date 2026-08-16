import { describe, expect, it } from "vitest";
import { getConversationPermissionFlags } from "./conversation-permissions";
import type {
  Conversation,
  ConversationParticipant,
} from "@/features/communication/types/conversation.types";

function participant(
  role: ConversationParticipant["role"],
  status: ConversationParticipant["status"] = "active",
): ConversationParticipant {
  return {
    id: `${role}-participant`,
    userId: `${role}-user`,
    role,
    status,
  };
}

describe("getConversationPermissionFlags", () => {
  it.each(["owner", "admin", "moderator"] as const)(
    "allows %s to manage participants, invites, and join requests",
    (role) => {
      const current = participant(role);
      const flags = getConversationPermissionFlags({
        currentUserId: current.userId,
        participants: [current],
      });

      expect(flags.canManageParticipants).toBe(true);
      expect(flags.canManageInvites).toBe(true);
      expect(flags.canReviewJoinRequests).toBe(true);
    },
  );

  it("does not allow a member to manage participants, invites, or join requests", () => {
    const current = participant("member");
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
    });

    expect(flags.canManageParticipants).toBe(false);
    expect(flags.canManageInvites).toBe(false);
    expect(flags.canReviewJoinRequests).toBe(false);
  });

  it("allows a non-participant to create a join request", () => {
    const flags = getConversationPermissionFlags({
      currentUserId: "outside-user",
      participants: [participant("member")],
    });

    expect(flags.canCreateJoinRequest).toBe(true);
  });

  it.each(["active", "muted"] as const)(
    "treats a %s participant as a current member",
    (status) => {
      const current = participant("member", status);
      const flags = getConversationPermissionFlags({
        currentUserId: current.userId,
        participants: [current],
      });

      expect(flags.isActiveParticipant).toBe(true);
      expect(flags.canCreateJoinRequest).toBe(false);
    },
  );

  it("allows a participant to leave a normal conversation", () => {
    const current = participant("member");
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
      conversation: { id: "conversation-1", type: "group" },
    });

    expect(flags.canLeaveConversation).toBe(true);
  });

  it("does not allow a participant to leave a system conversation", () => {
    const current = participant("member");
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
      conversation: { id: "conversation-1", type: "system" },
    });

    expect(flags.canLeaveConversation).toBe(false);
  });

  it("does not allow a participant to leave a read-only conversation", () => {
    const current = participant("member");
    const readOnlyConversation = {
      id: "conversation-1",
      type: "group",
      isReadOnly: true,
    } satisfies Conversation;
    const flags = getConversationPermissionFlags({
      currentUserId: current.userId,
      participants: [current],
      conversation: readOnlyConversation,
    });

    expect(flags.canLeaveConversation).toBe(false);
  });
});
