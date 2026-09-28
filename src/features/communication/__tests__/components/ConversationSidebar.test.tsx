import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ConversationSidebar from "@/features/communication/conversations_redesign/components/sidebar";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { ConversationListItemModel } from "@/features/communication/hooks/useConversations";

const localeState = vi.hoisted(() => ({ value: "en" }));

vi.mock("next-intl", () => ({
  useLocale: () => localeState.value,
  useTranslations: () => (key: string) => key,
}));

function renderSidebarWithProps(
  overrides: Partial<ComponentProps<typeof ConversationSidebar>> = {},
) {
  const conversation = {
    id: "conversation-1",
    type: "group",
    status: "active",
    title: "Conversation",
    lastMessage: null,
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
      page={1}
      totalPages={1}
      onPageChange={vi.fn()}
      onSelect={vi.fn()}
      onFilterChange={vi.fn()}
      onTypeFilterChange={vi.fn()}
      onSearchChange={vi.fn()}
      onRefresh={vi.fn()}
      onCreateConversation={vi.fn()}
      {...overrides}
    />,
  );
}

function renderSidebar(lastMessage: ConversationListItemModel["lastMessage"]) {
  const conversation = {
    id: "conversation-1",
    type: "group",
    status: "active",
    title: "Conversation",
    lastMessage,
  } as ConversationListItemModel;

  return renderSidebarWithProps({ conversations: [conversation] });
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

  it("shows the voice label instead of backend metadata for an audio message", () => {
    const voiceMetadata = JSON.stringify({
      kind: "voice_metadata",
      durationMs: 6600,
      waveform: ["0.24", "0.52", "0.57"],
    });

    renderSidebar({
      id: "message-voice-metadata",
      type: "audio",
      body: voiceMetadata,
      status: "sent",
    });

    expect(screen.getByText("Voice note")).toBeInTheDocument();
    expect(screen.queryByText(voiceMetadata)).not.toBeInTheDocument();
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
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
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

describe("ConversationSidebar pagination", () => {
  beforeEach(() => {
    localeState.value = "en";
  });

  afterEach(() => {
    cleanup();
  });

  it("requests a page without using scroll as a loading trigger", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const view = renderSidebarWithProps({
      page: 1,
      totalPages: 3,
      onPageChange,
    });
    const list = view.getByTestId("conversation-list");
    list.scrollTop = 240;

    fireEvent.scroll(list);
    expect(onPageChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("restores the list position after a page change commits", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const view = renderSidebarWithProps({
      page: 1,
      totalPages: 2,
      onPageChange,
    });
    const list = view.getByTestId("conversation-list");
    list.scrollTop = 240;

    await user.click(screen.getByRole("button", { name: "Next" }));
    view.rerender(
      <ConversationSidebar
        desktopWidth={360}
        conversations={[
          {
            id: "conversation-2",
            type: "group",
            status: "active",
            title: "Second page",
          } as ConversationListItemModel,
        ]}
        filter="all"
        typeFilter=""
        search=""
        isLoading={false}
        isRefreshing={false}
        page={2}
        totalPages={2}
        onPageChange={onPageChange}
        onSelect={vi.fn()}
        onFilterChange={vi.fn()}
        onTypeFilterChange={vi.fn()}
        onSearchChange={vi.fn()}
        onRefresh={vi.fn()}
        onCreateConversation={vi.fn()}
      />,
    );

    expect(view.getByTestId("conversation-list").scrollTop).toBe(240);
  });

  it("resets list scroll for search and filter changes", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onFilterChange = vi.fn();
    const view = renderSidebarWithProps({ onSearchChange, onFilterChange });
    const list = view.getByTestId("conversation-list");
    list.scrollTop = 180;

    await user.type(
      screen.getByPlaceholderText("Search conversations..."),
      "a",
    );
    expect(list.scrollTop).toBe(0);
    expect(onSearchChange).toHaveBeenCalledWith("a");

    list.scrollTop = 120;
    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(list.scrollTop).toBe(0);
    expect(onFilterChange).toHaveBeenCalledWith("active");
  });

  it("renders current-page conversations in backend response order", () => {
    renderSidebarWithProps({
      conversations: [
        {
          id: "conversation-unpinned",
          type: "group",
          status: "active",
          title: "Unpinned first",
          isPinned: false,
        } as ConversationListItemModel,
        {
          id: "conversation-pinned",
          type: "group",
          status: "active",
          title: "Pinned second",
          isPinned: true,
        } as ConversationListItemModel,
      ],
    });

    expect(
      screen.getAllByTestId("conversation-title").map((row) => row.textContent),
    ).toEqual(["Unpinned first", "Pinned second"]);
  });
});
