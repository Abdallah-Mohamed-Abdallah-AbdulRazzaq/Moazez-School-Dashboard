"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import Button, { ButtonProps } from "../button/Button";

export interface FileUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  disabled?: boolean;
  buttonLabel: string;
  buttonProps?: Partial<ButtonProps>;
  helperText?: string;
  onError?: (error: string) => void;
  formatSizeError?: (fileName: string, maxSizeMb: number) => string;
}

export default function FileUploadButton({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeBytes,
  disabled = false,
  buttonLabel,
  buttonProps = {},
  helperText,
  onError,
  formatSizeError,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const validFiles: File[] = [];

    for (const file of filesArray) {
      // Validate file size
      if (maxSizeBytes && file.size > maxSizeBytes) {
        const maxSizeMB = maxSizeBytes / (1024 * 1024);
        const errorMsg = formatSizeError
          ? formatSizeError(file.name, maxSizeMB)
          : `File "${file.name}" exceeds ${maxSizeMB.toFixed(0)}MB limit`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      setError("");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`inline-block ${isRTL ? "text-right" : "text-left"}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: "none" }}
        aria-label={buttonLabel}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        {...buttonProps}
      >
        {buttonLabel}
      </Button>
      {(helperText || error) && (
        <p
          className={`text-xs mt-1 ${
            error ? "text-red-600" : "text-gray-500"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
