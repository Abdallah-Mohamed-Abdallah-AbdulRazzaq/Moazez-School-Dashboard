import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ConversationTabs from "@/features/communication/conversations_redesign/components/ConversationTabs";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("ConversationTabs", () => {
  it("exposes tab semantics and supports arrow-key navigation", () => {
    const onTabChange = vi.fn();
    render(
      <ConversationTabs
        activeTab="messages"
        hasPendingJoinRequests={false}
        labels={conversationRedesignLabels.en}
        onTabChange={onTabChange}
      />,
    );

    const messagesTab = screen.getByRole("tab", { name: "Messages" });
    expect(messagesTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tablist")).toBeInTheDocument();

    fireEvent.keyDown(messagesTab, { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledWith("participants");
  });

  it("renders only available tabs and navigates across the visible set", () => {
    const onTabChange = vi.fn();
    render(
      <ConversationTabs
        activeTab="messages"
        availableTabs={["messages", "joinRequests"]}
        hasPendingJoinRequests={false}
        labels={conversationRedesignLabels.en}
        onTabChange={onTabChange}
      />,
    );

    const messagesTab = screen.getByRole("tab", { name: "Messages" });

    fireEvent.keyDown(messagesTab, { key: "ArrowRight" });
    expect(onTabChange).toHaveBeenCalledWith("joinRequests");
  });

  it("does not expose invitations in chat navigation", () => {
    render(
      <ConversationTabs
        activeTab="messages"
        hasPendingJoinRequests={false}
        labels={conversationRedesignLabels.en}
        onTabChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("tab", { name: "Invites" }),
    ).not.toBeInTheDocument();
  });

  it("marks the join requests tab when a request is pending review", () => {
    render(
      <ConversationTabs
        activeTab="messages"
        hasPendingJoinRequests
        labels={conversationRedesignLabels.en}
        onTabChange={vi.fn()}
      />,
    );

    const joinRequestsTab = screen.getByRole("tab", {
      name: "Join Requests — Pending join requests",
    });

    expect(joinRequestsTab.querySelector('[aria-hidden="true"]')).toHaveClass(
      "bg-red-500",
    );
  });
});
