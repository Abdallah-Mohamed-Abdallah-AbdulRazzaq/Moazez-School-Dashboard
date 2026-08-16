import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InvitesPanel from "@/features/communication/conversations_redesign/components/InvitesPanel";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { ConversationInvite } from "@/features/communication/types/conversation.types";

describe("InvitesPanel", () => {
  it("shows the invited user name returned by the invites API", () => {
    const invite: ConversationInvite = {
      id: "invite-1",
      conversationId: "conversation-1",
      invitedUserId: "user-1",
      invitedById: "admin-1",
      status: "pending",
      expiresAt: "2026-08-11T15:48:00.000Z",
      createdAt: "2026-08-09T15:48:56.334Z",
      invitedUser: {
        id: "user-1",
        displayName: "Abdo Mohammed",
        userType: "dismissal_staff",
      },
    };

    render(
      <InvitesPanel
        canCreate={false}
        canManage={false}
        error={null}
        invites={[invite]}
        isLoading={false}
        isMutating={false}
        labels={conversationRedesignLabels.en}
        locale="en"
        onAcceptInvite={() => Promise.resolve()}
        onCreateInvite={() => undefined}
        onRejectInvite={() => undefined}
        total={1}
        userDisplayNames={{}}
      />,
    );

    expect(screen.getByText("Abdo Mohammed")).toBeInTheDocument();
  });
});
