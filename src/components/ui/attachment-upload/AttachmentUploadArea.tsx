"use client";

import { FileText, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import AttachmentListItem from "@/components/ui/attachment-list-item/AttachmentListItem";
import DragDropUploadArea from "@/components/ui/drag-drop-upload/DragDropUploadArea";
import FilePreviewModal, {
  type PreviewAttachment,
} from "@/components/ui/file-preview-modal";
import { formatFileSize } from "@/utils/upload/validateFile";

export interface AttachmentUploadAreaLabels {
  title: string;
  addFiles: string;
  removeFile: string;
}

export interface AttachmentUploadAreaProps {
  files: File[];
  labels: AttachmentUploadAreaLabels;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
}

function restrictionsText(
  locale: string,
  maxSizeBytes?: number,
  allowedMimeTypes?: readonly string[],
) {
  const restrictions = [
    maxSizeBytes
      ? locale === "ar"
        ? `الحد الأقصى لحجم الملف: ${formatFileSize(maxSizeBytes)}.`
        : `Maximum file size: ${formatFileSize(maxSizeBytes)}.`
      : null,
    allowedMimeTypes?.length
      ? locale === "ar"
        ? `الأنواع المسموح بها: ${allowedMimeTypes.join(", ")}.`
        : `Allowed types: ${allowedMimeTypes.join(", ")}.`
      : null,
  ].filter(Boolean);

  return restrictions.join(" ") || undefined;
}

export default function AttachmentUploadArea({
  allowedMimeTypes,
  disabled = false,
  files,
  labels,
  maxSizeBytes,
  onFilesChange,
}: AttachmentUploadAreaProps) {
  const locale = useLocale();
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewAttachment | null>(null);
  const helperText = restrictionsText(locale, maxSizeBytes, allowedMimeTypes);

  useEffect(
    () => () => {
      if (previewAttachment?.isLocal && previewAttachment.url) {
        URL.revokeObjectURL(previewAttachment.url);
      }
    },
    [previewAttachment],
  );

  const addFiles = (newFiles: File[]) => {
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const openPreview = (file: File) => {
    setPreviewAttachment({
      id: `local-${file.name}-${file.size}-${file.lastModified}`,
      isLocal: true,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    });
  };

  return (
    <section className="space-y-3">
      <DragDropUploadArea
        accept={allowedMimeTypes?.join(",") || "*"}
        buttonLabel={labels.addFiles}
        disabled={disabled}
        helperText={helperText}
        maxSizeBytes={maxSizeBytes}
        multiple
        onFilesSelected={addFiles}
        title={labels.title}
      />
      {files.length > 0 ? (
        <ul>
          {files.map((file, index) => (
            <AttachmentListItem
              key={`${file.name}-${file.size}-${index}`}
              disabled={disabled}
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              onClick={() => openPreview(file)}
              subtitle={formatFileSize(file.size)}
              title={file.name}
              actions={[
                {
                  label: labels.removeFile,
                  icon: <X className="h-4 w-4" aria-hidden="true" />,
                  color: "error",
                  onClick: () => removeFile(index),
                },
              ]}
            />
          ))}
        </ul>
      ) : null}
      <FilePreviewModal
        attachment={previewAttachment}
        isOpen={previewAttachment !== null}
        onClose={() => setPreviewAttachment(null)}
      />
    </section>
  );
}
