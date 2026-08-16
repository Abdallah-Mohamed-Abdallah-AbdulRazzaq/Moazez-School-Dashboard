import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { MessageComposer } from "@/features/communication/conversations_redesign/components/messages/MessageComposer";

const mockPolicy = {
  maxMessageLength: 20,
  maxAttachmentSizeMb: 5,
  allowedAttachmentMimeTypes: ["image/png", "application/pdf"],
};

const labels = conversationRedesignLabels.en;
const voiceUnavailableMessage =
  "Voice recording is not available in this browser.";

function renderComposer() {
  return render(
    <MessageComposer
      allowedAttachmentMimeTypes={mockPolicy.allowedAttachmentMimeTypes}
      attachmentSizeLimitMb={mockPolicy.maxAttachmentSizeMb}
      disabled={false}
      editingMessage={null}
      labels={labels}
      maxLength={mockPolicy.maxMessageLength}
      onCancelEdit={vi.fn()}
      onCancelReply={vi.fn()}
      onEditMessage={vi.fn().mockResolvedValue(undefined)}
      onSend={vi.fn().mockResolvedValue(undefined)}
      onSendVoice={vi.fn().mockResolvedValue(undefined)}
      onSendWithAttachment={vi.fn().mockResolvedValue(undefined)}
      onStopTyping={vi.fn()}
      onTyping={vi.fn()}
      replyTo={null}
    />,
  );
}

describe("MessageComposer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a visible error when voice recording is unavailable", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });
    vi.stubGlobal("MediaRecorder", undefined);

    renderComposer();

    fireEvent.click(screen.getByRole("button", { name: labels.voiceNote }));

    await waitFor(() => {
      expect(
        screen.getByText(voiceUnavailableMessage),
      ).toBeInTheDocument();
    });
  });

  it("clears the input immediately, focuses the input, and calls onSend asynchronously", async () => {
    const mockOnSend = vi.fn().mockResolvedValue(undefined);
    const mockOnStopTyping = vi.fn();
    
    render(
      <MessageComposer
        disabled={false}
        editingMessage={null}
        labels={labels}
        onCancelEdit={vi.fn()}
        onCancelReply={vi.fn()}
        onEditMessage={vi.fn().mockResolvedValue(undefined)}
        onSend={mockOnSend}
        onSendVoice={vi.fn().mockResolvedValue(undefined)}
        onSendWithAttachment={vi.fn().mockResolvedValue(undefined)}
        onStopTyping={mockOnStopTyping}
        onTyping={vi.fn()}
        replyTo={null}
      />,
    );

    const input = screen.getByPlaceholderText(labels.writeMessage);
    fireEvent.change(input, { target: { value: "Hello world" } });
    expect(input).toHaveValue("Hello world");

    // Click the submit button
    const sendBtn = screen.getByRole("button", { name: labels.send });
    fireEvent.click(sendBtn);

    // Input should clear immediately (synchronously)
    expect(input).toHaveValue("");

    // Input should be focused
    expect(document.activeElement).toBe(input);

    // onSend should have been called in the background
    expect(mockOnSend).toHaveBeenCalledWith("Hello world");
  });

  it("shows a character counter based on policy configuration", async () => {
    renderComposer();
    const input = screen.getByPlaceholderText(labels.writeMessage);
    
    // Counter should not render when empty
    expect(screen.queryByText(/0 \/ 20/)).not.toBeInTheDocument();

    // Counter should render when not empty
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(screen.getByText("5 / 20")).toBeInTheDocument();
  });

  it("disables send button when body exceeds maxMessageLength", async () => {
    renderComposer();
    const input = screen.getByPlaceholderText(labels.writeMessage);
    
    // Type 21 characters (limit is 20)
    fireEvent.change(input, { target: { value: "123456789012345678901" } });
    
    const sendBtn = screen.getByRole("button", { name: labels.send });
    expect(sendBtn).toBeDisabled();
  });

  it("shows an inline error and does not add attachment when file size is exceeded", async () => {
    const { container } = renderComposer();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // mockPolicy has maxAttachmentSizeMb: 5
    // Create an oversized file: 6 MB = 6 * 1024 * 1024 bytes
    const oversizedFile = new File(["x".repeat(6 * 1024 * 1024)], "oversized.png", {
      type: "image/png",
    });

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(screen.getByText(labels.errorFileUploadSizeExceeded)).toBeInTheDocument();
    // Verify file is not in preview
    expect(screen.queryByText("oversized.png")).not.toBeInTheDocument();
  });

  it("shows an inline error and does not add attachment when MIME type is not allowed", async () => {
    const { container } = renderComposer();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    // mockPolicy has allowedAttachmentMimeTypes: ["image/png", "application/pdf"]
    // Create an unsupported file: text/plain
    const unsupportedFile = new File(["content"], "readme.txt", {
      type: "text/plain",
    });

    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    expect(screen.getByText(labels.errorFileUploadMimeNotAllowed)).toBeInTheDocument();
    // Verify file is not in preview
    expect(screen.queryByText("readme.txt")).not.toBeInTheDocument();
  });

  it("keeps selected files available for retry when attachment sending fails", async () => {
    const onSendWithAttachment = vi
      .fn()
      .mockRejectedValue(new Error("Upload failed"));
    const { container } = render(
      <MessageComposer
        disabled={false}
        editingMessage={null}
        labels={labels}
        onCancelEdit={vi.fn()}
        onCancelReply={vi.fn()}
        onEditMessage={vi.fn().mockResolvedValue(undefined)}
        onSend={vi.fn().mockResolvedValue(undefined)}
        onSendVoice={vi.fn().mockResolvedValue(undefined)}
        onSendWithAttachment={onSendWithAttachment}
        onStopTyping={vi.fn()}
        onTyping={vi.fn()}
        replyTo={null}
      />,
    );
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["content"], "lesson.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: labels.send }));

    await waitFor(() => {
      expect(screen.getByText(labels.unableToUploadAttachment)).toBeInTheDocument();
    });
    expect(screen.getByText("lesson.pdf")).toBeInTheDocument();
  });
});
