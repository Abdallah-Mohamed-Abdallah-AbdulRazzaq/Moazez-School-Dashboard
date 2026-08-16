import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MessageBubble from "@/features/communication/components/conversations/MessageBubble";
import MessageComposer from "@/features/communication/components/conversations/MessageComposer";
import type { ConversationMessage } from "@/features/communication/hooks/useConversationMessages";

const bubbleLabels = {
  edit: "Edit",
  delete: "Delete",
  save: "Save",
  cancel: "Cancel",
  deleted: "Message deleted",
  pending: "Pending",
  failed: "Failed",
  edited: "Edited",
  like: "Like",
  love: "Love",
  laugh: "Laugh",
  wow: "Wow",
  sad: "Sad",
  angry: "Angry",
  thumbsUp: "Thumbs up",
  thumbsDown: "Thumbs down",
  removeReaction: "Remove",
  attachFile: "Attach",
  fileTooLarge: "File too large",
  uploadFailed: "Upload failed",
  download: "Open attachment",
  removeAttachment: "Remove attachment",
};

describe("conversation message text behavior", () => {
  it("allows long unbroken message text to wrap inside the bubble", () => {
    const body = "https://example.com/" + "a".repeat(120);
    const message: ConversationMessage = {
      id: "message-1",
      body,
      senderId: "user-1",
      createdAt: "2026-07-08T08:00:00.000Z",
    };

    render(
      <MessageBubble
        message={message}
        isOwn={false}
        labels={bubbleLabels}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(body)).toHaveClass(
      "whitespace-pre-wrap",
      "break-words",
      "[overflow-wrap:anywhere]",
    );
  });

  it("auto-grows the composer textarea up to the chat input max height", () => {
    const onTyping = vi.fn();

    render(
      <MessageComposer
        placeholder="Write a message..."
        sendLabel="Send"
        onTyping={onTyping}
        onStopTyping={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText("Write a message...");
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 96,
    });

    fireEvent.change(textarea, {
      target: { value: "Line one\nLine two\nLine three\nLine four" },
    });

    expect(textarea).toHaveStyle({ height: "96px", maxHeight: "140px" });
    expect(textarea).toHaveClass("overflow-y-auto", "resize-none");
    expect(onTyping).toHaveBeenCalled();
  });
});
