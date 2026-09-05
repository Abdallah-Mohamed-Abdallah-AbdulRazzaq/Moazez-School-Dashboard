"use client";

import { Download, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import FilePreviewModal, {
  type PreviewAttachment,
} from "@/components/ui/file-preview-modal";
import type { MessageAttachment } from "@/features/communication/types/message.types";

export interface AttachmentPreviewLabels {
  download: string;
  removeAttachment: string;
}

export interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  labels: AttachmentPreviewLabels;
  canRemove?: boolean;
  onRemove?: (attachmentId: string) => Promise<void> | void;
}

function attachmentName(attachment: MessageAttachment) {
  return (
    attachment.name ||
    attachment.file?.originalName ||
    attachment.file?.filename ||
    attachment.fileId ||
    attachment.id
  );
}

function attachmentUrl(attachment: MessageAttachment) {
  return attachment.url || attachment.file?.url || "";
}

function formatSize(size?: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentPreview({
  attachment,
  canRemove,
  labels,
  onRemove,
}: AttachmentPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const url = attachmentUrl(attachment);
  const name = attachmentName(attachment);
  const size = formatSize(attachment.size || attachment.file?.size);
  const previewAttachment: PreviewAttachment | null = isPreviewOpen
    ? {
        id: attachment.fileId || attachment.file?.id || attachment.id,
        name,
        size: attachment.size || attachment.file?.size || 0,
        type: attachment.mimeType || attachment.file?.mimeType || "",
        ...(url ? { url } : {}),
      }
    : null;

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-700">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          onClick={() => setIsPreviewOpen(true)}
          aria-label={name}
        >
          <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{name}</p>
            {size ? <p className="text-[11px] text-slate-500">{size}</p> : null}
          </div>
        </button>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary-700"
            title={labels.download}
            aria-label={labels.download}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
        {canRemove && onRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 px-0 text-red-600 hover:bg-red-50"
            title={labels.removeAttachment}
            aria-label={labels.removeAttachment}
            onClick={() => void onRemove(attachment.id)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <FilePreviewModal
        attachment={previewAttachment}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
