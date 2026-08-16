"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { isApiError } from "@/lib/api-error";
import { loadAuthenticatedFileUrl } from "@/lib/files/authenticatedFileUrlCache";
import { formatFileSize } from "@/utils/upload/validateFile";

export type PreviewAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

interface FilePreviewModalProps {
  attachment: PreviewAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreviewModal({ attachment, isOpen, onClose }: FilePreviewModalProps) {
  const t = useTranslations("common.filePreview");
  const tCommon = useTranslations("common");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const [failedAttachmentId, setFailedAttachmentId] = useState<string | null>(null);
  const [deniedAttachmentId, setDeniedAttachmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment?.id) {
      void Promise.resolve().then(() => {
        setPreviewUrl(null);
        setPreviewMimeType(null);
        setPreviewAttachmentId(null);
        setFailedAttachmentId(null);
        setDeniedAttachmentId(null);
      });
      return;
    }
    let active = true;
    void loadAuthenticatedFileUrl(attachment.id)
      .then((file) => {
        if (!active) return;
        setPreviewUrl(file.url);
        setPreviewMimeType(file.mimeType || attachment.type || null);
        setPreviewAttachmentId(attachment.id);
      })
      .catch((error) => {
        if (!active) return;
        setFailedAttachmentId(attachment.id);
        setDeniedAttachmentId(
          isApiError(error) && error.status === 403 ? attachment.id : null,
        );
      });
    return () => {
      active = false;
    };
  }, [attachment?.id, attachment?.type]);

  const accessDenied = deniedAttachmentId === attachment?.id;
  const contentUrl = accessDenied ? null : previewUrl || attachment?.url;
  const mimeType = previewMimeType || attachment?.type || "";
  const loading = Boolean(isOpen && attachment?.id && previewAttachmentId !== attachment.id && failedAttachmentId !== attachment.id);
  const openPreview = () => contentUrl && window.open(contentUrl, "_blank", "noopener,noreferrer");

  const unavailable = attachment ? (
    <div className="space-y-3 rounded-xl p-4" style={{ backgroundColor: "var(--background-secondary, var(--color-neutral-50))" }}>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{accessDenied ? t("accessDenied") : t("unavailable")}</p>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{accessDenied ? t("accessDeniedDescription") : t("unavailableDescription")}</p>
      <div className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        <div>{t("fileType")}: {attachment.type || "-"}</div>
        <div>{t("fileSize")}: {formatFileSize(attachment.size)}</div>
      </div>
    </div>
  ) : null;

  const renderContent = () => {
    if (!attachment) return null;
    if (loading) return <div className="flex min-h-48 items-center justify-center gap-2" style={{ color: "var(--text-secondary)" }}><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /><span>{t("loading")}</span></div>;
    if (!contentUrl) return unavailable;
    if (mimeType === "application/pdf") return <div className="h-[70vh] overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-color)" }}><iframe src={contentUrl} title={attachment.name} className="h-full w-full border-0" /></div>;
    if (mimeType.startsWith("image/")) return <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}>
      {/* Blob URLs from authenticated downloads cannot be optimized by next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={contentUrl} alt={attachment.name} className="max-h-full max-w-full object-contain" />
    </div>;
    if (mimeType.startsWith("video/")) return <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-xl bg-black" style={{ border: "1px solid var(--border-color)" }}><video controls className="max-h-full max-w-full" aria-label={attachment.name}><source src={contentUrl} type={mimeType} />{t("videoUnsupported")}</video></div>;
    return <div className="space-y-4 rounded-xl p-4" style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background)" }}><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("unavailable")}</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("openInNewTab")}</p><Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={openPreview}>{tCommon("open")}</Button></div>;
  };

  return <Modal isOpen={isOpen} onClose={onClose} title={attachment?.name || t("title")} size="xl" footer={contentUrl ? <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={openPreview}>{tCommon("open")}</Button> : undefined}>{renderContent()}</Modal>;
}
