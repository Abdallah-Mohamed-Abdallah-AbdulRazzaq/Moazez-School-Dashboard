"use client";

import { Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import Button from "@/components/ui/button/Button";

export interface AttachmentUploaderLabels {
  attachFile: string;
  fileTooLarge: string;
  uploadFailed: string;
}

export interface AttachmentUploaderProps {
  labels: AttachmentUploaderLabels;
  disabled?: boolean;
  isUploading?: boolean;
  maxAttachmentSizeMb?: number;
  onUpload: (file: File) => Promise<void> | void;
}

export default function AttachmentUploader({
  disabled,
  isUploading,
  labels,
  maxAttachmentSizeMb,
  onUpload,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);

    if (maxAttachmentSizeMb && file.size > maxAttachmentSizeMb * 1024 * 1024) {
      setError(labels.fileTooLarge.replace("{size}", String(maxAttachmentSizeMb)));
      return;
    }

    try {
      await onUpload(file);
      if (inputRef.current) inputRef.current.value = "";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : labels.uploadFailed);
    }
  };

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[11px]"
        disabled={disabled || isUploading}
        loading={isUploading}
        leftIcon={<Paperclip className="h-3 w-3" aria-hidden="true" />}
        onClick={() => inputRef.current?.click()}
      >
        {labels.attachFile}
      </Button>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
