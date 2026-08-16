import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { conversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import { AttachmentCard } from "@/features/communication/conversations_redesign/components/messages/AttachmentCard";
import type { MessageAttachment } from "@/features/communication/types/message.types";
import { clearAuthenticatedFileUrlCache } from "@/lib/files/authenticatedFileUrlCache";

const labels = conversationRedesignLabels.en;

// Mock apiClient
vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

beforeAll(() => {
  if (typeof URL !== "undefined") {
    URL.createObjectURL = () => "blob:mock-url";
    URL.revokeObjectURL = () => {};
  }

  if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = async function (this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    };
  }
});

afterEach(() => {
  clearAuthenticatedFileUrlCache();
});

describe("AttachmentCard Voice Waveform", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("displays error message if fetching audio file fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const attachment: MessageAttachment = {
      id: "attachment-1",
      fileId: "file-audio-1",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-1",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load audio")).toBeInTheDocument();
    });
  });

  it("uses real decoded peaks when Web Audio API is available", async () => {
    const mockChannelData = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
      mockChannelData[i] = i / 100;
    }

    const mockAudioBuffer = {
      length: 100,
      numberOfChannels: 1,
      sampleRate: 44100,
      duration: 1,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
    };

    const mockAudioContext = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => mockAudioContext),
    );

    const attachment: MessageAttachment = {
      id: "attachment-1",
      fileId: "file-audio-1",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-1",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "audio/webm" },
    });

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await waitFor(() => {
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    });
  });

  it("cycles speed rates when speed control is clicked", async () => {
    const mockChannelData = new Float32Array(100);
    const mockAudioBuffer = {
      length: 100,
      numberOfChannels: 1,
      sampleRate: 44100,
      duration: 10,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
    };
    const mockAudioContext = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => mockAudioContext),
    );

    const attachment: MessageAttachment = {
      id: "attachment-1",
      fileId: "file-audio-1",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-1",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "audio/webm" },
    });

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const speedButton = await screen.findByRole("button", { name: "1x" });
    expect(speedButton).toBeInTheDocument();

    fireEvent.click(speedButton);
    expect(screen.getByRole("button", { name: "1.5x" })).toBeInTheDocument();

    fireEvent.click(speedButton);
    expect(screen.getByRole("button", { name: "2x" })).toBeInTheDocument();

    fireEvent.click(speedButton);
    expect(screen.getByRole("button", { name: "1x" })).toBeInTheDocument();
  });

  it("seeks playback position when waveform is clicked", async () => {
    const mockChannelData = new Float32Array(100);
    const mockAudioBuffer = {
      length: 100,
      numberOfChannels: 1,
      sampleRate: 44100,
      duration: 100,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
    };
    const mockAudioContext = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => mockAudioContext),
    );

    const attachment: MessageAttachment = {
      id: "attachment-1",
      fileId: "file-audio-1",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-1",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "audio/webm" },
    });

    const { container } = render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const waveform = await screen.findByTestId("waveform-container");
    waveform.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 10,
      top: 10,
      width: 100,
      height: 30,
    });

    const audioElement = container.querySelector("audio");
    expect(audioElement).toBeInTheDocument();

    Object.defineProperty(audioElement, "duration", {
      configurable: true,
      value: 100,
    });

    fireEvent(audioElement!, new Event("loadedmetadata"));

    fireEvent.click(waveform, { clientX: 60 });

    expect(audioElement!.currentTime).toBe(50);
  });

  it("falls back to default peaks if decoding audio data fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mockAudioContext = {
      decodeAudioData: vi.fn().mockRejectedValue(new Error("Decode error")),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => mockAudioContext),
    );

    const attachment: MessageAttachment = {
      id: "attachment-fallback",
      fileId: "file-audio-fallback",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-fallback",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "audio/webm" },
    });

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const waveform = await screen.findByTestId("waveform-container");
    const bars = waveform.children;
    expect(bars.length).toBe(28);
    expect((bars[0] as HTMLElement).style.height).toBe("25%");
    expect((bars[1] as HTMLElement).style.height).toBe("40%");
    expect((bars[2] as HTMLElement).style.height).toBe("15%");
  });

  it("coordinates single-playback by pausing when another voice note starts playing", async () => {
    const mockChannelData = new Float32Array(100);
    const mockAudioBuffer = {
      length: 100,
      numberOfChannels: 1,
      sampleRate: 44100,
      duration: 10,
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
    };
    const mockAudioContext = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn().mockImplementation(() => mockAudioContext),
    );

    const attachment: MessageAttachment = {
      id: "attachment-coord",
      fileId: "file-audio-coord",
      mimeType: "audio/webm",
      name: "voice.webm",
      file: {
        id: "file-audio-coord",
        originalName: "voice.webm",
        mimeType: "audio/webm",
        sizeBytes: 1000,
        filename: "voice.webm",
        bucket: "moazez-dev",
        objectKey: "voice.webm",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "audio/webm" },
    });

    const { container } = render(
      <AttachmentCard
        attachment={attachment}
        canDelete={false}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await screen.findByTestId("waveform-container");
    const audioElement = container.querySelector("audio") as HTMLAudioElement;
    expect(audioElement).toBeInTheDocument();

    const playSpy = vi.spyOn(audioElement, "play").mockResolvedValue(undefined);
    const pauseSpy = vi.spyOn(audioElement, "pause").mockImplementation(() => {
      fireEvent(audioElement, new Event("pause"));
    });

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

    const playButton = screen.getByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    expect(playSpy).toHaveBeenCalled();

    fireEvent(audioElement, new Event("play"));
    expect(
      await screen.findByRole("button", { name: "Pause" }),
    ).toBeInTheDocument();

    window.dispatchEvent(
      new CustomEvent("voice-play", {
        detail: { fileId: "different-file-id" },
      }),
    );

    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});

describe("AttachmentCard Document Redesign", () => {
  it("renders document card with correct extension styling and badge colors", async () => {
    const attachment: MessageAttachment = {
      id: "doc-1",
      fileId: "file-doc-1",
      mimeType: "application/pdf",
      name: "report.pdf",
      file: {
        id: "file-doc-1",
        originalName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048000,
        filename: "report.pdf",
        bucket: "moazez-dev",
        objectKey: "report.pdf",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    // Assert file name is displayed
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    // Assert formatted size and type details are shown
    expect(screen.getByText(/2.0 MB • PDF/)).toBeInTheDocument();
    // Assert badge is colored red for PDF
    const badge = screen.getByText("PDF").parentElement;
    expect(badge).toHaveClass("bg-red-500");
  });
});

describe("AttachmentCard Image and Video Previews", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders image preview and loads Object URL securely", async () => {
    const attachment: MessageAttachment = {
      id: "img-1",
      fileId: "file-img-1",
      mimeType: "image/png",
      name: "avatar.png",
      file: {
        id: "file-img-1",
        originalName: "avatar.png",
        mimeType: "image/png",
        sizeBytes: 102400,
        filename: "avatar.png",
        bucket: "moazez-dev",
        objectKey: "avatar.png",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get)
      .mockReset()
      .mockResolvedValue({
        data: new Blob([new Uint8Array(100)]),
        headers: { "content-type": "image/png" },
      });

    const firstRender = render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const imageElement = await screen.findByRole("img", { name: "avatar.png" });
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute("src", "blob:mock-url");

    firstRender.unmount();
    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("img", { name: "avatar.png" })).toHaveAttribute(
      "src",
      "blob:mock-url",
    );
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("renders video preview with playback controls", async () => {
    const attachment: MessageAttachment = {
      id: "vid-1",
      fileId: "file-vid-1",
      mimeType: "video/mp4",
      name: "demo.mp4",
      file: {
        id: "file-vid-1",
        originalName: "demo.mp4",
        mimeType: "video/mp4",
        sizeBytes: 10240000,
        filename: "demo.mp4",
        bucket: "moazez-dev",
        objectKey: "demo.mp4",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const { apiClient } = await import("@/lib/api");
    vi.mocked(apiClient.get).mockResolvedValue({
      data: new Blob([new Uint8Array(100)]),
      headers: { "content-type": "video/mp4" },
    });

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const videoElement = await screen.findByTestId("video-element");
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute("controls");
  });

  it("shows confirmation dialog when delete is clicked and calls onDelete when confirmed", async () => {
    const attachment: MessageAttachment = {
      id: "doc-1",
      fileId: "file-doc-1",
      mimeType: "application/pdf",
      name: "report.pdf",
      file: {
        id: "file-doc-1",
        originalName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048000,
        filename: "report.pdf",
        bucket: "moazez-dev",
        objectKey: "report.pdf",
        schoolId: "school-1",
        createdAt: "2026-06-26T00:00:00Z",
        updatedAt: "2026-06-26T00:00:00Z",
      },
    };

    const onDeleteMock = vi.fn().mockResolvedValue(undefined);

    render(
      <AttachmentCard
        attachment={attachment}
        canDelete={true}
        isOwn={false}
        labels={labels}
        onDelete={onDeleteMock}
      />,
    );

    // Click delete button
    const deleteButton = screen.getByRole("button", {
      name: labels.deleteAttachmentConfirm,
    });
    fireEvent.click(deleteButton);

    // Verify confirmation modal is open by searching for description or title
    expect(
      screen.getByText(labels.deleteAttachmentConfirm),
    ).toBeInTheDocument();

    // Click confirm/Delete button inside the modal
    const confirmButton = screen.getByRole("button", {
      name: labels.deleteMessage,
    });
    fireEvent.click(confirmButton);

    // Verify onDelete is called
    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalled();
    });
  });
});
