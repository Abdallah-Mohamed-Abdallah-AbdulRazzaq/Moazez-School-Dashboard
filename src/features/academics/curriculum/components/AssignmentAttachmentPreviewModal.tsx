"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import { formatFileSize } from "@/utils/upload/validateFile";
import type { AssignmentAttachment } from "@/features/academics/curriculum/services/curriculumService";
import { downloadFile } from "@/features/academics/curriculum/services/filesService";

interface AssignmentAttachmentPreviewModalProps {
  attachment: AssignmentAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

function attachmentName(attachment: AssignmentAttachment) {
  return attachment.fileName || attachment.title;
}

export default function AssignmentAttachmentPreviewModal({
  attachment,
  isOpen,
  onClose,
}: AssignmentAttachmentPreviewModalProps) {
  const tUpload = useTranslations("upload");
  const tCommon = useTranslations("common");
  const [previewState, setPreviewState] = useState<{
    key: string | null;
    url: string | null;
    mimeType?: string;
    error: boolean;
  }>({ key: null, url: null, error: false });
  const previewKey = isOpen && attachment
    ? `${attachment.id}:${attachment.fileId ?? attachment.url}`
    : null;
  const previewUrl = previewState.key === previewKey ? previewState.url : null;
  const previewMimeType = previewState.key === previewKey
    ? previewState.mimeType || attachment?.mimeType
    : attachment?.mimeType;
  const previewError = previewState.key === previewKey && previewState.error;
  const needsAuthenticatedPreview = Boolean(
    isOpen && attachment?.type === "FILE" && attachment.fileId,
  );
  const isLoadingPreview = needsAuthenticatedPreview && !previewUrl && !previewError;

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!isOpen || !attachment || attachment.type !== "FILE" || !attachment.fileId) {
      return undefined;
    }

    void downloadFile(attachment.fileId)
      .then(({ blob }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewState({
          key: previewKey,
          url: objectUrl,
          mimeType: blob.type || attachment.mimeType,
          error: false,
        });
      })
      .catch(() => {
        if (active) setPreviewState({ key: previewKey, url: null, error: true });
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment, isOpen, previewKey]);

  const handleOpen = () => {
    const url = previewUrl || (attachment?.type === "LINK" ? attachment.url : undefined);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderContent = () => {
    if (!attachment) return null;

    if (isLoadingPreview) {
      return (
        <div className="flex h-48 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-600">
          {tCommon("loading")}
        </div>
      );
    }

    const contentUrl = previewUrl || (attachment.type === "LINK" ? attachment.url : null);

    if (!contentUrl || previewError) {
      return (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">{tUpload("previewUnavailable")}</p>
          <p className="text-sm text-gray-600">{tUpload("previewUnavailableDescription")}</p>
          <div className="space-y-1 text-sm text-gray-600">
            <div>{tUpload("fileType")}: {previewMimeType || "-"}</div>
            <div>{tUpload("fileSize")}: {formatFileSize(attachment.size ?? 0)}</div>
          </div>
        </div>
      );
    }

    if (previewMimeType === "application/pdf") {
      return (
        <div className="h-[70vh] overflow-hidden rounded-xl border border-gray-200">
          <iframe src={contentUrl} title={attachmentName(attachment)} className="h-full w-full border-0" />
        </div>
      );
    }

    if (previewMimeType?.startsWith("image/")) {
      return (
        <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- Blob object URLs cannot be optimized by next/image. */}
          <img src={contentUrl} alt={attachmentName(attachment)} title={attachmentName(attachment)} className="max-h-full max-w-full object-contain" />
        </div>
      );
    }

    return (
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-900">{tUpload("previewUnavailable")}</p>
        <p className="text-sm text-gray-600">{tUpload("openInNewTab")}</p>
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={attachment ? attachmentName(attachment) : tUpload("previewAttachment")}
      size="xl"
      footer={(previewUrl || attachment?.type === "LINK") ? (
        <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={handleOpen}>
          {tCommon("open")}
        </Button>
      ) : undefined}
    >
      {renderContent()}
    </Modal>
  );
}
