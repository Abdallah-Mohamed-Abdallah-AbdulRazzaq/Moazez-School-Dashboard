import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import JoinRequestsPanel from "@/features/communication/conversations_redesign/components/JoinRequestsPanel";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { ConversationJoinRequest } from "@/features/communication/types/conversation.types";

describe("JoinRequestsPanel", () => {
  it("shows the requester name returned by the join requests API", () => {
    const joinRequest: ConversationJoinRequest = {
      id: "request-1",
      conversationId: "conversation-1",
      requestedById: "user-1",
      status: "approved",
      createdAt: "2026-08-09T15:45:03.438Z",
      requestedBy: {
        id: "user-1",
        displayName: "test5",
        userType: "school_user",
      },
    };

    render(
      <JoinRequestsPanel
        canCreate={false}
        canReview={false}
        error={null}
        isLoading={false}
        joinRequests={[joinRequest]}
        labels={conversationRedesignLabels.en}
        locale="en"
        onCreateRequest={() => undefined}
        onReject={() => undefined}
        onReview={() => undefined}
        total={1}
        userDisplayNames={{}}
      />,
    );

    expect(screen.getByText("test5")).toBeInTheDocument();
  });
});
