import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { MessageBubble } from "@/features/communication/conversations_redesign/components/messages/MessageBubble";
import { createMessage } from "../utils/test-data-generators";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

describe("MessageBubble Delete Confirmation", () => {
  const labels = conversationRedesignLabels.en;

  const mockProps = {
    allowReactions: true,
    attachments: [],
    currentUserId: "user-1",
    currentUserName: "Test User",
    isFirstInGroup: true,
    isOwn: true,
    isUploadingAttachment: false,
    labels: labels,
    locale: "en",
    onAddReaction: vi.fn().mockResolvedValue(undefined),
    onAttachFile: vi.fn().mockResolvedValue(undefined),
    onDeleteAttachment: vi.fn().mockResolvedValue(undefined),
    onDeleteMessage: vi.fn().mockResolvedValue(undefined),
    onStartEdit: vi.fn(),
    onInfo: vi.fn(),
    onRemoveReaction: vi.fn().mockResolvedValue(undefined),
    onReply: vi.fn(),
    onReport: vi.fn(),
    allMessages: [],
    reactions: [],
    userDisplayNames: {},
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows confirmation dialog when delete is triggered and calls onDeleteMessage when confirmed", async () => {
    const message = createMessage({
      id: "msg-1",
      body: "Delete me!",
      senderId: "user-1",
      status: "sent",
    });

    const onDeleteMessageMock = vi.fn().mockResolvedValue(undefined);

    render(
      <MessageBubble
        {...mockProps}
        message={message}
        onDeleteMessage={onDeleteMessageMock}
      />
    );

    // Assert message body is displayed
    expect(screen.getByText("Delete me!")).toBeInTheDocument();

    // Trigger delete context action. In MessageBubble, context menu handleDelete is called.
    // We can click the delete button in the mobile context action overlay or desktop context menu.
    // Looking at line 504: text is labels.deleteMessage ("Delete").
    //    // Click chevron button to open context menu
    const buttons = screen.getAllByRole("button");
    const chevronBtn = buttons[0];
    fireEvent.click(chevronBtn);

    // Now the delete option should be visible in the DOM
    const deleteOption = screen.getByRole("button", { name: labels.deleteMessage });
    fireEvent.click(deleteOption);

    // Verify confirmation modal is open
    expect(screen.getByText(labels.deleteMessageConfirm)).toBeInTheDocument();

    // Click confirm/Delete button inside the modal
    const confirmButtons = screen.getAllByRole("button", { name: labels.deleteMessage });
    const modalConfirmBtn = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmBtn);

    // Verify onDeleteMessage is called
    await waitFor(() => {
      expect(onDeleteMessageMock).toHaveBeenCalled();
    });
  });

  it("renders localized placeholder when normalized message status is 'deleted'", () => {
    const message = createMessage({
      id: "msg-deleted",
      body: "Original message content",
      senderId: "user-1",
      status: "deleted",
    });
    render(
      <MessageBubble
        {...mockProps}
        message={message}
      />
    );
    expect(screen.getByText(labels.errorMessageDeleted)).toBeInTheDocument();
    expect(screen.queryByText("Original message content")).not.toBeInTheDocument();
  });

  it("suppresses message content controls and receipts after deletion", () => {
    const message = createMessage({
      id: "msg-deleted-content",
      body: "Sensitive content",
      senderId: "user-1",
      status: "deleted",
      readCount: 2,
    });

    render(
      <MessageBubble
        {...mockProps}
        attachments={[
          {
            id: "attachment-1",
            messageId: message.id,
            fileId: "file-1",
            name: "sensitive.pdf",
          },
        ]}
        message={message}
      />,
    );

    const placeholder = screen.getByText(labels.errorMessageDeleted);
    expect(placeholder.closest("div")).toHaveClass("border-dashed");
    expect(screen.queryByText("sensitive.pdf")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(labels.readStatus)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: labels.deleteMessage }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["pending", 0, labels.sending],
    ["failed", 0, labels.failed],
    ["sent", 0, labels.sent],
    ["sent", 1, labels.readStatus],
  ] as const)(
    "labels %s delivery with read count %i as %s",
    (deliveryStatus, readCount, expectedLabel) => {
      const message = {
        ...createMessage({
          id: `msg-${deliveryStatus}-${readCount}`,
          senderId: "user-1",
          status: "sent",
          readCount,
        }),
        deliveryStatus,
      };

      render(<MessageBubble {...mockProps} message={message} />);

      expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument();
    },
  );

  it("renders localized placeholder when normalized message status is 'DELETED' (case insensitivity)", () => {
    const message = createMessage({
      id: "msg-deleted-upper",
      body: "Original message content",
      senderId: "user-1",
      status: "DELETED",
    });
    render(
      <MessageBubble
        {...mockProps}
        message={message}
      />
    );
    expect(screen.getByText(labels.errorMessageDeleted)).toBeInTheDocument();
  });

  it("renders localized placeholder when normalized message status is 'hidden'", () => {
    const message = createMessage({
      id: "msg-hidden",
      body: "Original message content",
      senderId: "user-1",
      status: "hidden",
    });
    render(
      <MessageBubble
        {...mockProps}
        message={message}
      />
    );
    expect(screen.getByText(labels.errorMessageHidden)).toBeInTheDocument();
    expect(screen.queryByText("Original message content")).not.toBeInTheDocument();
  });

  it("calls onReply with the message when the message bubble container is double-clicked and message is not deleted", () => {
    const message = createMessage({
      id: "msg-reply",
      body: "Reply to this message!",
      senderId: "user-1",
      status: "sent",
    });

    const onReplyMock = vi.fn();

    render(
      <MessageBubble
        {...mockProps}
        message={message}
        onReply={onReplyMock}
      />
    );

    const messageText = screen.getByText("Reply to this message!");
    const bubbleContainer = messageText.closest("div");
    expect(bubbleContainer).toBeInTheDocument();

    fireEvent.doubleClick(bubbleContainer!);

    expect(onReplyMock).toHaveBeenCalledWith(message);
  });

  it("calls onReply with the message when swiped right on touch", () => {
    const message = createMessage({
      id: "msg-swipe-reply",
      body: "Swipe to reply",
      senderId: "user-1",
      status: "sent",
    });

    const onReplyMock = vi.fn();

    render(
      <MessageBubble
        {...mockProps}
        message={message}
        onReply={onReplyMock}
      />
    );

    const messageArticle = screen
      .getByText("Swipe to reply")
      .closest("article");
    expect(messageArticle).toBeInTheDocument();

    fireEvent.touchStart(messageArticle!, {
      touches: [{ clientX: 10, clientY: 40 }],
    });
    fireEvent.touchMove(messageArticle!, {
      touches: [{ clientX: 92, clientY: 44 }],
    });
    fireEvent.touchEnd(messageArticle!, {
      changedTouches: [{ clientX: 92, clientY: 44 }],
    });

    expect(onReplyMock).toHaveBeenCalledWith(message);
  });

  it("does not call onReply when the message bubble container is double-clicked and message is deleted", () => {
    const message = createMessage({
      id: "msg-reply-deleted",
      body: "Reply to this message!",
      senderId: "user-1",
      status: "deleted",
    });

    const onReplyMock = vi.fn();

    render(
      <MessageBubble
        {...mockProps}
        message={message}
        onReply={onReplyMock}
      />
    );

    const placeholderText = screen.getByText(labels.errorMessageDeleted);
    const bubbleContainer = placeholderText.closest("div");
    expect(bubbleContainer).toBeInTheDocument();

    fireEvent.doubleClick(bubbleContainer!);

    expect(onReplyMock).not.toHaveBeenCalled();
  });

  it("renders lightweight formatting and turns URLs into safe links", () => {
    const message = createMessage({
      id: "msg-formatted",
      body: "Please check *bold* _italic_ ~done~ ```code``` https://example.com/path",
      senderId: "user-1",
      status: "sent",
    });
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<MessageBubble {...mockProps} message={message} />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("done").tagName).toBe("S");
    expect(screen.getByText("code").tagName).toBe("CODE");

    const link = screen.getByRole("link", {
      name: "https://example.com/path",
    });
    expect(link).toHaveAttribute("href", "https://example.com/path");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("collapses very long redesigned messages and expands them inline", () => {
    const longBody = `${"Long message content ".repeat(50)}Final sentence after expansion.`;
    const message = createMessage({
      id: "msg-long",
      body: longBody,
      senderId: "user-1",
      status: "sent",
    });

    render(<MessageBubble {...mockProps} message={message} />);

    expect(screen.queryByText(/Final sentence after expansion/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.readMore }));

    expect(screen.getByText(/Final sentence after expansion/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.showLess }));

    expect(screen.queryByText(/Final sentence after expansion/)).not.toBeInTheDocument();
  });

  it("shows a URL preview card while keeping the original URL in the message text", async () => {
    const message = createMessage({
      id: "msg-link-preview",
      body: "Please read https://example.com/article",
      senderId: "user-1",
      status: "sent",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Article title",
        description: "Article description",
        image: "https://example.com/card.png",
        domain: "example.com",
        url: "https://example.com/article",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MessageBubble {...mockProps} message={message} />);

    expect(
      screen.getByRole("link", { name: "https://example.com/article" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Article title")).toBeInTheDocument();
    expect(screen.getByText("Article description")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Article title" })).toHaveAttribute(
      "src",
      "https://example.com/card.png",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/link-preview?url=https%3A%2F%2Fexample.com%2Farticle",
      { cache: "force-cache" },
    );
  });
});
