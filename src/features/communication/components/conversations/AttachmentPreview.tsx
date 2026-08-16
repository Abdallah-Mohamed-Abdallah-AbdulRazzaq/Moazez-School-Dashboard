"use client";

import { Download, FileText, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
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
  const url = attachmentUrl(attachment);
  const name = attachmentName(attachment);
  const size = formatSize(attachment.size || attachment.file?.size);

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-700">
      <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{name}</p>
        {size ? <p className="text-[11px] text-slate-500">{size}</p> : null}
      </div>
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
  );
}
