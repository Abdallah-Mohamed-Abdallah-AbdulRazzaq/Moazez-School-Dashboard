"use client";

import type { MessageAttachment } from "@/features/communication/types/message.types";
import AttachmentPreview from "./AttachmentPreview";

export interface MessageAttachmentsLabels {
  download: string;
  removeAttachment: string;
}

export interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  labels: MessageAttachmentsLabels;
  canRemove?: boolean;
  onRemove?: (attachmentId: string) => Promise<void> | void;
}

export default function MessageAttachments({
  attachments,
  canRemove,
  labels,
  onRemove,
}: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.id}
          attachment={attachment}
          labels={labels}
          canRemove={canRemove}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
