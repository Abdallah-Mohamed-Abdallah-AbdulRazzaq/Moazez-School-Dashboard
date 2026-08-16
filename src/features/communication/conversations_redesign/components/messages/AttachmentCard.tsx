import { type MouseEvent, useEffect, useRef, useState } from "react";
import { FileText, Play, Pause, Trash2 } from "lucide-react";
import { formatFileSize } from "@/features/communication/conversations_redesign/utils/formatters";
import type { ConversationRedesignLabels } from "@/features/communication/conversations_redesign/labels";
import type { MessageAttachment } from "@/features/communication/types/message.types";
import {
  getCachedAuthenticatedFile,
  loadAuthenticatedFileUrl,
} from "@/lib/files/authenticatedFileUrlCache";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";

type LegacyFileMetadata = NonNullable<MessageAttachment["file"]> & {
  displayName?: string;
  sizeBytes?: string;
  mimetype?: string;
};

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function AttachmentCard({
  attachment,
  canDelete,
  isOwn,
  labels,
  onDelete,
}: {
  attachment: MessageAttachment;
  canDelete: boolean;
  isOwn: boolean;
  labels: ConversationRedesignLabels;
  onDelete: () => Promise<unknown>;
}) {
  const file = attachment.file;
  const legacyFile = file as LegacyFileMetadata | undefined;
  const name =
    attachment.name ||
    file?.originalName ||
    file?.filename ||
    legacyFile?.displayName ||
    attachment.url?.split("/").pop() ||
    labels.attachment;
  const size = formatFileSize(
    attachment.size || file?.size || legacyFile?.sizeBytes,
  );
  const fileId = attachment.fileId || file?.id;
  const href =
    attachment.url ||
    file?.url ||
    (fileId
      ? `${process.env.NEXT_PUBLIC_API_URL || "https://api.moazez.sa/api/v1"}/files/${fileId}/download`
      : undefined);
  const mimeType =
    attachment.mimeType || file?.mimeType || legacyFile?.mimetype;
  const isImage = Boolean(
    mimeType?.startsWith("image/") ||
    name.toLowerCase().endsWith(".png") ||
    name.toLowerCase().endsWith(".jpg") ||
    name.toLowerCase().endsWith(".jpeg") ||
    name.toLowerCase().endsWith(".gif") ||
    name.toLowerCase().endsWith(".webp") ||
    name.toLowerCase().endsWith(".svg"),
  );

  const isAudio = Boolean(
    mimeType?.startsWith("audio/") ||
    (name.toLowerCase().endsWith(".webm") && !mimeType?.startsWith("video/")) ||
    name.toLowerCase().endsWith(".mp3") ||
    name.toLowerCase().endsWith(".wav") ||
    name.toLowerCase().endsWith(".m4a") ||
    (name.toLowerCase().endsWith(".ogg") && !mimeType?.startsWith("video/")) ||
    name.toLowerCase().endsWith(".aac"),
  );

  const isVideo = Boolean(
    !isAudio &&
    (mimeType?.startsWith("video/") ||
      name.toLowerCase().endsWith(".mp4") ||
      name.toLowerCase().endsWith(".mov") ||
      name.toLowerCase().endsWith(".webm") ||
      name.toLowerCase().endsWith(".ogg")),
  );

  const isMedia = isAudio || isImage || isVideo;
  const cachedMedia = fileId ? getCachedAuthenticatedFile(fileId) : undefined;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Media states
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    cachedMedia?.url ?? null,
  );
  const [loading, setLoading] = useState(
    isMedia && Boolean(fileId) && !cachedMedia,
  );
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [peaks, setPeaks] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isMedia || !fileId) return;

    let active = true;
    const mediaFileId = fileId;

    async function loadMedia() {
      if (!active) return;
      if (!getCachedAuthenticatedFile(mediaFileId)) {
        setLoading(true);
      }
      setError(false);
      try {
        const cachedFile = await loadAuthenticatedFileUrl(mediaFileId);
        const blob = cachedFile.blob;

        if (!active) return;
        setMediaUrl(cachedFile.url);

        if (isAudio) {
          // Web Audio API Peak analysis
          const AudioContextClass =
            window.AudioContext ||
            (window as WindowWithWebkitAudioContext).webkitAudioContext;
          if (typeof AudioContextClass !== "undefined") {
            const arrayBuffer = await blob.arrayBuffer();

            if (!active) return;
            const audioCtx = new AudioContextClass();
            try {
              const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
              if (!active) return;
              const channelData = audioBuffer.getChannelData(0);
              const barCount = 28;
              const chunkSize = Math.floor(channelData.length / barCount);
              const calculatedPeaks: number[] = [];

              for (let i = 0; i < barCount; i++) {
                const start = i * chunkSize;
                const end = start + chunkSize;
                let max = 0;
                for (let j = start; j < end; j++) {
                  const val = Math.abs(channelData[j]);
                  if (val > max) max = val;
                }
                const heightPercent = Math.round(15 + max * 85);
                calculatedPeaks.push(heightPercent);
              }
              if (!active) return;
              setPeaks(calculatedPeaks);
            } catch (decodeErr) {
              console.error(
                "decodeAudioData failed, using fallback peaks:",
                decodeErr,
              );
              if (!active) return;
              setPeaks([
                25, 40, 15, 60, 80, 45, 30, 70, 90, 50, 20, 35, 65, 85, 40, 30,
                55, 75, 45, 25, 60, 80, 50, 30, 45, 65, 20, 15,
              ]);
            } finally {
              await audioCtx.close();
            }
          } else {
            if (!active) return;
            setPeaks([
              25, 40, 15, 60, 80, 45, 30, 70, 90, 50, 20, 35, 65, 85, 40, 30,
              55, 75, 45, 25, 60, 80, 50, 30, 45, 65, 20, 15,
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load media attachment:", err);
        if (!active) return;
        setError(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      active = false;
    };
  }, [fileId, isMedia, isAudio]);

  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.fileId !== fileId && audioRef.current) {
        audioRef.current.pause();
      }
    };

    window.addEventListener("voice-play", handleOtherPlay);
    return () => {
      window.removeEventListener("voice-play", handleOtherPlay);
    };
  }, [fileId]);

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleSpeed = () => {
    let nextSpeed: 1 | 1.5 | 2 = 1;
    if (playbackSpeed === 1) nextSpeed = 1.5;
    else if (playbackSpeed === 1.5) nextSpeed = 2;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleWaveformClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      window.dispatchEvent(
        new CustomEvent("voice-play", { detail: { fileId } }),
      );
      void audioRef.current.play();
    }
  };

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDelete = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      // ConversationDetail owns the user-facing mutation error.
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDialogElement = (
    <ConfirmDialog
      isOpen={isConfirmOpen}
      onClose={() => setIsConfirmOpen(false)}
      onConfirm={executeDelete}
      title={labels.deleteMessage || "Delete"}
      description={labels.deleteAttachmentConfirm}
      confirmLabel={labels.deleteMessage || "Delete"}
      cancelLabel={labels.cancel}
      loading={isDeleting}
      severity="danger"
    />
  );

  const handleDownload = async () => {
    if (!fileId) return;
    try {
      const cachedFile = await loadAuthenticatedFileUrl(fileId);
      const link = document.createElement("a");
      link.href = cachedFile.url;
      link.download = name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback: open the URL directly (might work for public files)
      if (href) window.open(href, "_blank");
    }
  };

  if (isImage && fileId) {
    if (loading) {
      return (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl w-[240px] sm:w-[280px] h-[200px] animate-pulse">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col gap-1 items-center justify-center bg-rose-50/50 border border-rose-100 rounded-2xl w-[240px] sm:w-[280px] h-[160px] text-rose-600 text-xs">
          <span>Failed to load image</span>
        </div>
      );
    }
    return (
      <>
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50/50 max-w-[240px] sm:max-w-[280px] max-h-[240px] sm:max-h-[280px] flex items-center justify-center group cursor-pointer"
          onClick={() => window.open(mediaUrl || href, "_blank")}
        >
          {/* Attachment URLs may be authenticated blob URLs and cannot be optimized by next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl || href}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt={name}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleDownload();
              }}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-90"
              aria-label="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4.5 w-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(e);
                }}
                className="h-9 w-9 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 active:scale-90"
                aria-label={labels.deleteAttachmentConfirm}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
        {confirmDialogElement}
      </>
    );
  }

  if (isVideo && fileId) {
    if (loading) {
      return (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl w-[240px] sm:w-[280px] h-[200px] animate-pulse">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col gap-1 items-center justify-center bg-rose-50/50 border border-rose-100 rounded-2xl w-[240px] sm:w-[280px] h-[160px] text-rose-600 text-xs">
          <span>Failed to load video</span>
        </div>
      );
    }
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-50/50 max-w-[240px] sm:max-w-[280px] max-h-[240px] sm:max-h-[280px] flex items-center justify-center group">
          <video
            data-testid="video-element"
            src={mediaUrl || href}
            controls
            className="w-full h-full object-cover rounded-2xl"
          />
          {canDelete && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(e);
                }}
                className="h-8 w-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md active:scale-90"
                aria-label={labels.deleteAttachmentConfirm}
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>
        {confirmDialogElement}
      </>
    );
  }

  if (isAudio && fileId) {
    const progress = duration > 0 ? currentTime / duration : 0;
    return (
      <>
        <div
          className={`flex flex-col gap-2 rounded-2xl p-3 mb-2 w-full max-w-[280px] sm:max-w-[320px] ${
            isOwn
              ? "bg-primary-700/40 text-white"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {/* Header Row: Play/Pause button + Waveform */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Circle */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={loading || error}
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                isOwn ? "bg-white text-primary" : "bg-primary text-white"
              }`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4.5 w-4.5 fill-current" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Waveform Visualization */}
            {loading ? (
              <div className="flex items-center gap-1.5 h-6 flex-1 px-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
              </div>
            ) : error ? (
              <span className="text-[11px] text-rose-500 font-medium flex-1">
                Failed to load audio
              </span>
            ) : (
              <div
                data-testid="waveform-container"
                onClick={handleWaveformClick}
                className="flex items-end gap-[2px] h-7 flex-1 cursor-pointer select-none group/wave relative"
              >
                {peaks.map((heightPercent, index) => {
                  const isPlayed = index / peaks.length <= progress;
                  return (
                    <div
                      key={index}
                      style={{ height: `${heightPercent}%` }}
                      className={`w-[3px] rounded-full transition-colors duration-100 ${
                        isPlayed
                          ? isOwn
                            ? "bg-white"
                            : "bg-primary"
                          : isOwn
                            ? "bg-white/30"
                            : "bg-slate-300"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Delete button (if allowed) */}
            {canDelete ? (
              <button
                type="button"
                onClick={(event) => void handleDelete(event)}
                disabled={isDeleting}
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
                  isOwn
                    ? "text-white/70 hover:bg-white/10"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
                aria-label={labels.deleteAttachmentConfirm}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Footer Row: Time info + Speed controller */}
          <div className="flex items-center justify-between text-[11px] font-medium px-1">
            <span className="opacity-80">
              {formatAudioTime(currentTime)} / {formatAudioTime(duration || 0)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSpeed}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition active:scale-95 ${
                  isOwn
                    ? "border-white/30 hover:bg-white/10 text-white"
                    : "border-slate-300 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>

          {/* Hidden HTML5 Audio element */}
          {mediaUrl && (
            <audio
              ref={audioRef}
              src={mediaUrl}
              onPlay={onPlay}
              onPause={onPause}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              className="hidden"
            />
          )}
        </div>
        {confirmDialogElement}
      </>
    );
  }
  // Extension badge background color helper
  const getBadgeConfig = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const nameUpper = ext.toUpperCase();
    if (ext === "pdf") {
      return { bg: "bg-red-500", text: "PDF" };
    }
    if (["doc", "docx", "txt", "rtf"].includes(ext)) {
      return { bg: "bg-blue-500", text: nameUpper };
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return { bg: "bg-emerald-500", text: nameUpper };
    }
    if (["ppt", "pptx"].includes(ext)) {
      return { bg: "bg-amber-600", text: nameUpper };
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      return { bg: "bg-orange-500", text: nameUpper };
    }
    if (
      ["png", "jpg", "jpeg", "gif", "webp", "svg", "mp4", "mov"].includes(ext)
    ) {
      return { bg: "bg-indigo-500", text: nameUpper };
    }
    return { bg: "bg-slate-500", text: nameUpper || "FILE" };
  };

  const badgeConfig = getBadgeConfig(name);
  const extLabel = badgeConfig.text;
  const docDetails = `${size}${extLabel ? ` • ${extLabel}` : ""}`;

  return (
    <>
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border w-full max-w-[280px] sm:max-w-[320px] mb-1.5 transition-all shadow-sm ${
          isOwn
            ? "bg-white/10 border-white/10 text-white"
            : "bg-white border-slate-100 text-slate-800"
        }`}
      >
        <div
          className={`h-10 w-9 rounded shrink-0 flex flex-col items-center justify-between py-1 relative select-none shadow-sm ${badgeConfig.bg}`}
        >
          <FileText className="h-4 w-4 text-white mt-0.5" />
          <span className="text-[8px] uppercase font-extrabold tracking-wider text-white mt-auto leading-none mb-0.5">
            {extLabel}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <span className="block truncate text-[13px] font-semibold">
            {name}
          </span>
          {size ? (
            <span
              className={`block text-[10.5px] font-medium mt-0.5 ${
                isOwn ? "text-white/70" : "text-slate-500"
              }`}
            >
              {docDetails}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {fileId ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleDownload();
              }}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition active:scale-90 ${
                isOwn
                  ? "text-white/80 hover:bg-white/10"
                  : "text-primary hover:bg-slate-100"
              }`}
              aria-label="Download"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={(event) => void handleDelete(event)}
              disabled={isDeleting}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition active:scale-90 ${
                isOwn
                  ? "text-white/75 hover:bg-white/10"
                  : "text-rose-600 hover:bg-rose-50"
              }`}
              aria-label={labels.deleteAttachmentConfirm}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {confirmDialogElement}
    </>
  );
}
