"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/button/Button";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import AttachmentPreview from "@/features/communication/components/conversations/AttachmentPreview";
import { AttachmentCard } from "@/features/communication/conversations_redesign/components/messages/AttachmentCard";
import { labelsForLocale } from "@/features/communication/conversations_redesign/labels";
import type { MessageAttachment } from "@/features/communication/types/message.types";
import { loadAuthenticatedFileUrl } from "@/lib/files/authenticatedFileUrlCache";

export default function NotificationAttachment({ attachment }: { attachment: MessageAttachment }) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const fileId = attachment.fileId ?? attachment.file?.id;
  const directUrl = attachment.url ?? attachment.file?.url;
  const name = attachment.name ?? attachment.file?.originalName ?? attachment.file?.filename ?? fileId ?? attachment.id;
  const declaredMimeType = attachment.mimeType ?? attachment.file?.mimeType ?? "";
  const [loadedFile, setLoadedFile] = useState<{ url: string; mimeType: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    let active = true;
    void loadAuthenticatedFileUrl(fileId).then(
      (file) => { if (active) setLoadedFile(file); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [fileId]);

  const url = fileId ? loadedFile?.url : directUrl;
  const mimeType = loadedFile?.mimeType || declaredMimeType;
  const labels = {
    download: isArabic ? "تنزيل" : "Download",
    removeAttachment: isArabic ? "إزالة المرفق" : "Remove attachment",
  };

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-start">
      {failed || (!fileId && !directUrl) ? (
        <p role="alert" className="text-sm text-rose-600">{isArabic ? "تعذر تحميل المرفق." : "Unable to load attachment."}</p>
      ) : !url ? (
        <p role="status" className="text-sm text-slate-500">{isArabic ? "جار تحميل المرفق..." : "Loading attachment..."}</p>
      ) : mimeType.startsWith("video/") ? (
        <video controls preload="metadata" src={url} aria-label={name} className="max-h-72 w-full rounded-lg bg-slate-950" />
      ) : mimeType.startsWith("audio/") ? (
        fileId ? (
          <div dir="ltr" className={`flex ${isArabic ? "justify-end" : "justify-start"}`}>
            <AttachmentCard attachment={{ ...attachment, mimeType }} canDelete={false} isOwn={false} labels={labelsForLocale(locale)} onDelete={async () => undefined} />
          </div>
        )
          : <audio controls preload="metadata" src={url} aria-label={name} className="w-full" />
      ) : mimeType.startsWith("image/") ? (
        <Button variant="ghost" className="w-full overflow-hidden p-0" aria-label={name} onClick={() => setPreviewOpen(true)}>
          {/* Authenticated blob URLs cannot be optimized by next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name} className="max-h-60 max-w-full rounded-lg object-contain" />
        </Button>
      ) : null}
      <AttachmentPreview attachment={{ ...attachment, url: "", file: attachment.file ? { ...attachment.file, url: "" } : undefined }} labels={labels} />
      {url ? <a href={url} download={name} className="inline-flex rounded-lg px-2 py-1 text-sm font-medium text-primary-700 hover:bg-primary-50">{labels.download}</a> : null}
      {previewOpen ? <FilePreviewModal isOpen attachment={{ id: fileId ?? attachment.id, name, size: attachment.size ?? attachment.file?.size ?? 0, type: mimeType, url, isLocal: !fileId }} onClose={() => setPreviewOpen(false)} /> : null}
    </div>
  );
}
