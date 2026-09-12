import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConversationSidebar from "@/features/communication/conversations_redesign/components/sidebar";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";

const localeState = vi.hoisted(() => ({ value: "en" }));

vi.mock("next-intl", () => ({
  useLocale: () => localeState.value,
  useTranslations: () => (key: string) => key,
}));

function renderSidebar(
  lastMessage: ConversationListItemModel["lastMessage"],
) {
  const conversation = {
    id: "conversation-1",
    type: "group",
    status: "active",
    title: "Conversation",
    lastMessage,
  } as ConversationListItemModel;

  return render(
    <ConversationSidebar
      desktopWidth={360}
      conversations={[conversation]}
      filter="all"
      typeFilter=""
      search=""
      isLoading={false}
      isRefreshing={false}
      onSelect={vi.fn()}
      onFilterChange={vi.fn()}
      onTypeFilterChange={vi.fn()}
      onSearchChange={vi.fn()}
      onRefresh={vi.fn()}
      onCreateConversation={vi.fn()}
    />,
  );
}

describe("ConversationSidebar last-message previews", () => {
  beforeEach(() => {
    localeState.value = "en";
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    ["image", "Image"],
    ["video", "Video"],
    ["voice", "Voice note"],
    ["audio", "Voice note"],
    ["file", "Attachment"],
    ["location", "Attachment"],
  ])("shows a semantic preview for a %s message", (type, preview) => {
    renderSidebar({ id: "message-1", type, status: "sent" });

    expect(screen.getByText(preview)).toBeInTheDocument();
    expect(
      screen.queryByText(conversationRedesignLabels.en.noMessagesYet),
    ).not.toBeInTheDocument();
  });

  it("shows the Arabic image preview", () => {
    localeState.value = "ar";
    renderSidebar({ id: "message-1", type: "image", status: "sent" });

    expect(screen.getByText("صورة")).toBeInTheDocument();
  });

  it("keeps text and deleted previews authoritative", () => {
    const { rerender } = renderSidebar({
      id: "message-1",
      type: "text",
      body: "Hello",
      status: "sent",
    });
    expect(screen.getByText("Hello")).toBeInTheDocument();

    const deletedConversation = {
      id: "conversation-1",
      type: "group",
      status: "active",
      title: "Conversation",
      lastMessage: {
        id: "message-1",
        type: "image",
        status: "deleted",
      },
    } as ConversationListItemModel;
    rerender(
      <ConversationSidebar
        desktopWidth={360}
        conversations={[deletedConversation]}
        filter="all"
        typeFilter=""
        search=""
        isLoading={false}
        isRefreshing={false}
        onSelect={vi.fn()}
        onFilterChange={vi.fn()}
        onTypeFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onCreateConversation={vi.fn()}
      />,
    );

    expect(
      screen.getByText(conversationRedesignLabels.en.messageDeleted),
    ).toBeInTheDocument();
  });
});
