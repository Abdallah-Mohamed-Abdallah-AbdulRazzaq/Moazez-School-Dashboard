import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Edit3,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";

import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";

import { EmojiPickerButton } from "./EmojiPickerButton";

const AUDIO_MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
] as const;

function supportedAudioMimeType(): string | undefined {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return undefined;
  }

  return AUDIO_MIME_TYPE_CANDIDATES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}

function audioExtension(mimeType: string) {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("mpeg")) return "mp3";
  return "ogg";
}

export function MessageComposer({
  allowAttachments = true,
  allowVoice = true,
  allowedAttachmentMimeTypes,
  attachmentSizeLimitMb,
  disabled,
  editingMessage,
  labels,
  maxLength,
  onCancelEdit,
  onCancelReply,
  onEditMessage,
  onSend,
  onSendVoice,
  onSendWithAttachment,
  onStopTyping,
  onTyping,
  replyTo,
}: {
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowedAttachmentMimeTypes?: string[];
  attachmentSizeLimitMb?: number;
  disabled: boolean;
  editingMessage: { id: string; body: string } | null;
  labels: ConversationRedesignLabels;
  maxLength?: number;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onEditMessage: (messageId: string, body: string) => Promise<unknown>;
  onSend: (body: string) => Promise<unknown>;
  onSendVoice: (file: File) => Promise<unknown>;
  onSendWithAttachment: (files: File[], caption: string) => Promise<unknown>;
  onStopTyping: () => void;
  onTyping: () => void;
  replyTo: { id: string; senderName: string; body: string } | null;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const maxMessageLength = maxLength ?? 4000;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When editingMessage changes, populate the composer with the message body
  const prevEditIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editingMessage && editingMessage.id !== prevEditIdRef.current) {
      setBody(editingMessage.body);
      prevEditIdRef.current = editingMessage.id;
    }
    if (!editingMessage) {
      prevEditIdRef.current = null;
    }
  }, [editingMessage]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || disabled) return;

    // Edit mode — save the edited message (keep this synchronous/blocking)
    if (editingMessage) {
      const trimmed = body.trim();
      if (!trimmed || trimmed === editingMessage.body.trim()) {
        onCancelEdit();
        return;
      }
      setIsSubmitting(true);
      try {
        await onEditMessage(editingMessage.id, trimmed);
        setBody("");
        setFileError(null);
        onCancelEdit();
      } finally {
        setIsSubmitting(false);
        textareaRef.current?.focus();
      }
      return;
    }

    if (allowAttachments && pendingFiles.length > 0) {
      const filesToSend = [...pendingFiles];
      const captionToSend = body.trim();
      setFileError(null);
      setIsSubmitting(true);
      try {
        await onSendWithAttachment(filesToSend, captionToSend);
        setBody("");
        setPendingFiles([]);
        onStopTyping();
      } catch {
        setFileError(labels.unableToUploadAttachment);
      } finally {
        setIsSubmitting(false);
        textareaRef.current?.focus();
      }
      return;
    }

    // Normal text-only send (non-blocking)
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    setFileError(null);
    onStopTyping();
    textareaRef.current?.focus();
    void onSend(trimmed).catch(() => {});
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = event.target.files;
    if (!allowAttachments || !files || files.length === 0 || disabled) return;

    const maxAttachmentSizeMb = attachmentSizeLimitMb ?? 10;
    const allowedMimes = allowedAttachmentMimeTypes;

    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (file.size > maxAttachmentSizeMb * 1024 * 1024) {
        setFileError(labels.errorFileUploadSizeExceeded || "File size exceeds allowed limit.");
        event.target.value = "";
        return;
      }

      if (allowedMimes && allowedMimes.length > 0) {
        const isMimeAllowed = allowedMimes.some((pattern) => {
          if (pattern.endsWith("/*")) {
            const prefix = pattern.slice(0, -2);
            return file.type.startsWith(prefix + "/");
          }
          return pattern === file.type;
        });

        if (!isMimeAllowed) {
          setFileError(labels.errorFileUploadMimeNotAllowed || "File type is not allowed.");
          event.target.value = "";
          return;
        }
      }

      validFiles.push(file);
    }

    event.target.value = "";
    setPendingFiles((prev) => [...prev, ...validFiles]);
  };

  const startRecording = async () => {
    setRecordingError(null);

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingError(labels.voiceRecordingUnavailable);
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = supportedAudioMimeType();
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const activeStream = stream;
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        activeStream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("[VoiceRecording] Failed to start recording:", err);
      stream?.getTracks().forEach((track) => track.stop());
      setRecordingError(labels.voiceRecordingUnavailable);
    }
  };

  const stopAndSendRecording = async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    // Stop recording and wait for data
    const audioBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (audioBlob.size === 0) return;

    const extension = audioExtension(mediaRecorder.mimeType);
    const audioFile = new File(
      [audioBlob],
      `voice-note-${Date.now()}.${extension}`,
      { type: mediaRecorder.mimeType },
    );

    setIsSubmitting(true);
    try {
      await onSendVoice(audioFile);
    } catch {
      setRecordingError(labels.unableToSendMessage);
    } finally {
      setIsSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const cancelRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canSend =
    (pendingFiles.length > 0 || Boolean(body.trim()) || Boolean(editingMessage)) &&
    body.length <= maxMessageLength;
  const showMicButton =
    allowVoice &&
    !body.trim() &&
    pendingFiles.length === 0 &&
    !isRecording &&
    !editingMessage;

  // Recording UI
  if (isRecording) {
    return (
      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4">
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-700"
            aria-label={labels.cancel}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-xs text-red-600">{labels.recording}</span>
          </div>
          <button
            type="button"
            onClick={() => void stopAndSendRecording()}
            disabled={isSubmitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-hover disabled:opacity-60"
            aria-label={labels.send}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="shrink-0 border-t border-slate-200 bg-white p-4"
    >
      {/* Editing banner */}
      {editingMessage ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-s-4 border-s-amber-500 border border-slate-200 bg-amber-50 px-3 py-2">
          <Edit3 className="h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-amber-700">
              {labels.editMessage}
            </p>
            <p className="truncate text-xs text-slate-600">
              {editingMessage.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              setBody("");
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label={labels.cancel}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      ) : null}

      {/* Reply preview bar */}
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-s-4 border-s-primary border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-primary">
              {replyTo.senderName}
            </p>
            <p className="truncate text-xs text-slate-600">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label={labels.cancel}
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
      ) : null}

      {/* File preview bar */}
      {pendingFiles.length > 0 ? (
        <div className="mb-2 space-y-1">
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {file.size < 1024 * 1024
                  ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                  : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
              </span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                }
                className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:cursor-wait disabled:opacity-50"
                aria-label={labels.cancel}
              >
                <span className="text-sm leading-none">&times;</span>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {recordingError ? (
        <p role="alert" className="mb-2 text-xs font-medium text-red-600">
          {recordingError}
        </p>
      ) : null}

      {fileError ? (
        <p role="alert" className="mb-2 text-xs font-medium text-red-600">
          {fileError}
        </p>
      ) : null}

      <div className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all duration-200">
        {allowAttachments ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={labels.attachFile}
              disabled={disabled || isSubmitting}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleFileSelect(event)}
            />
          </>
        ) : null}
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onBlur={onStopTyping}
            onChange={(event) => {
              setBody(event.target.value);
              onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  void handleSubmit(event as unknown as FormEvent);
                }
              }
            }}
            placeholder={
              pendingFiles.length > 0 ? labels.addCaption : labels.writeMessage
            }
            disabled={disabled || isSubmitting}
            rows={1}
            className="max-h-32 min-h-[48px] w-full resize-none border-0 bg-transparent px-0 pt-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            style={{ height: "auto", overflow: "hidden" }}
            ref={(el) => {
              textareaRef.current = el;
              if (el) {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                el.style.overflow = el.scrollHeight > 128 ? "auto" : "hidden";
              }
            }}
          />
          <div className="flex justify-end pb-1">
            {body.length > 0 && (
              <p className={`text-[10px] leading-none ${body.length > maxMessageLength ? "font-bold text-red-600" : "text-slate-500"}`}>
                {body.length} / {maxMessageLength}
              </p>
            )}
          </div>
        </div>
        <EmojiPickerButton
          disabled={disabled || isSubmitting}
          labels={labels}
          onSelect={(emoji) => setBody((prev) => prev + emoji)}
        />
        {showMicButton ? (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={disabled || isSubmitting}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={labels.voiceNote}
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || isSubmitting || !canSend}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-slate-200 text-slate-500 transition-colors enabled:bg-primary enabled:text-white enabled:hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={labels.send}
          >
            {isSubmitting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </form>
  );
}
