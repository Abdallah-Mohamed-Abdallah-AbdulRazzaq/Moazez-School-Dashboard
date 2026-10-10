"use client";

import { useState } from "react";
import { Download, File as FileIcon } from "lucide-react";
import AttachmentListItem, { type AttachmentAction } from "@/components/ui/attachment-list-item/AttachmentListItem";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { MAX_ACADEMIC_CONTENT_PREVIEW_BYTES, subjectResourceAssetKind } from "../../model/subjectResourceDetail";
import type { AcademicContentAsset } from "../../types/contracts";
import { formatByteCount } from "../../model/academicContentPolicy";

const MODAL_PREVIEW_KINDS = new Set(["pdf", "image", "video", "audio"]);

export default function AcademicContentAssetAccess({
  asset,
  allowInlinePreview,
  isDownloading,
  onDownload,
  subtitle,
  disabled = false,
  extraActions = [],
}: {
  asset: AcademicContentAsset;
  allowInlinePreview: boolean;
  isDownloading: boolean;
  onDownload: (asset: AcademicContentAsset) => void;
  subtitle?: string;
  disabled?: boolean;
  extraActions?: AttachmentAction[];
}) {
  const t = useAcademicContentTranslations("files");
  const downloadT = useAcademicContentTranslations("downloads");
  const [previewOpen, setPreviewOpen] = useState(false);
  const tooLarge = Number(asset.sizeBytes) > MAX_ACADEMIC_CONTENT_PREVIEW_BYTES;
  const canPreview = allowInlinePreview && !tooLarge &&
    MODAL_PREVIEW_KINDS.has(subjectResourceAssetKind(asset));

  return (
    <div className="space-y-2">
      <AttachmentListItem
        icon={<FileIcon aria-hidden="true" className="size-5 text-primary" />}
        title={asset.originalName}
        subtitle={subtitle ?? `${asset.mimeType} · ${formatByteCount(asset.sizeBytes)}`}
        disabled={disabled}
        onClick={canPreview ? () => setPreviewOpen(true) : undefined}
        actionsLabel={t("actions", { name: asset.originalName })}
        actions={[
          {
            label: isDownloading ? downloadT("preparing_button") : t("download"),
            icon: <Download aria-hidden="true" className="size-4" />,
            disabled: isDownloading,
            onClick: () => onDownload(asset),
          },
          ...extraActions,
        ]}
      />
      {tooLarge ? <p className="text-xs text-gray-500">{t("large_file_preview")}</p> : null}
      {previewOpen ? (
        <FilePreviewModal isOpen onClose={() => setPreviewOpen(false)}
          attachment={{ id: asset.fileId, name: asset.originalName,
            size: Number(asset.sizeBytes), type: asset.mimeType }} />
      ) : null}
    </div>
  );
}
