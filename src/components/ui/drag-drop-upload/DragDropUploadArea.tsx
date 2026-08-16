"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  validateFileForArea,
  formatFileSize,
  type UploadArea,
} from "@/utils/upload/validateFile";

export interface DragDropUploadAreaProps {
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSizeBytes?: number;
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  helperText?: string;
  buttonLabel?: string;
  showButton?: boolean;
  uploadArea?: UploadArea; // NEW: for centralized validation
}

export default function DragDropUploadArea({
  title,
  subtitle,
  disabled = false,
  multiple = true,
  accept = "*",
  maxSizeBytes,
  onFilesSelected,
  isUploading = false,
  helperText,
  buttonLabel,
  showButton = true,
  uploadArea,
}: DragDropUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const t = useTranslations("upload");

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (!file) return { valid: false };

    // Use centralized validation if uploadArea is specified
    if (uploadArea) {
      const result = validateFileForArea(file, uploadArea);
      if (!result.ok) {
        let errorMsg = "";
        switch (result.reason) {
          case "blocked":
            errorMsg = t("fileBlocked");
            break;
          case "size":
            errorMsg = t("maxSizeExceeded", {
              size: formatFileSize(maxSizeBytes || 20 * 1024 * 1024),
            });
            break;
          case "type":
            errorMsg = t("invalidTypeStudy");
            break;
          default:
            errorMsg = locale === "ar" ? "نوع الملف غير مدعوم" : "Unsupported file type";
        }
        return { valid: false, error: errorMsg };
      }
      return { valid: true };
    }

    // Fallback to basic validation
    if (maxSizeBytes && file.size > maxSizeBytes) {
      const sizeErrorMsg = locale === "ar" ? "حجم الملف كبير جدًا" : "File is too large";
      return { valid: false, error: sizeErrorMsg };
    }

    // Check file type if accept is specified
    if (accept && accept !== "*") {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      const fileType = file.type;

      const isAccepted = acceptedTypes.some((acceptedType) => {
        if (acceptedType.startsWith(".")) {
          return fileExtension === acceptedType.toLowerCase();
        }
        if (acceptedType.endsWith("/*")) {
          const category = acceptedType.split("/")[0];
          return fileType.startsWith(category + "/");
        }
        return fileType === acceptedType;
      });

      if (!isAccepted) {
        const typeErrorMsg = locale === "ar" ? "نوع الملف غير مدعوم" : "Unsupported file type";
        return { valid: false, error: typeErrorMsg };
      }
    }

    return { valid: true };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    let firstError = "";

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (!firstError) {
        firstError = validation.error || "";
      }
    }

    if (firstError) {
      setValidationError(firstError);
      setTimeout(() => setValidationError(""), 5000);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled || isUploading ? -1 : 0}
        role="button"
        aria-label={title || "Upload area"}
        aria-disabled={disabled || isUploading}
        className={`
          relative rounded-lg border-2 border-dashed p-8
          transition-all duration-200 ease-in-out
          ${
            disabled || isUploading
              ? "cursor-not-allowed opacity-50 bg-gray-50"
              : "cursor-pointer hover:border-primary hover:bg-primary-50"
          }
          ${
            isDragging && !disabled && !isUploading
              ? "border-primary bg-primary-100 scale-[1.02]"
              : "border-gray-300"
          }
          ${validationError ? "border-red-500" : ""}
        `}
        style={{
          borderColor: isDragging && !disabled && !isUploading
            ? "var(--color-primary, #006D82)"
            : validationError
            ? "#ef4444"
            : "var(--color-neutral-color, #AFADB2)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {/* Icon */}
          <div
            className={`rounded-full p-4 ${
              isDragging && !disabled && !isUploading
                ? "bg-primary-200"
                : "bg-gray-100"
            }`}
            style={{
              backgroundColor: isDragging && !disabled && !isUploading
                ? "var(--color-primary-200, #e0f2f5)"
                : "var(--color-gray-100, #f3f4f6)",
            }}
          >
            {isUploading ? (
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "var(--color-primary, #006D82)" }}
              />
            ) : (
              <Upload
                className="w-8 h-8"
                style={{ color: "var(--color-primary, #006D82)" }}
              />
            )}
          </div>

          {/* Title */}
          {title && (
            <div className="text-lg font-semibold text-gray-900">{title}</div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <div className="text-sm text-gray-600">{subtitle}</div>
          )}

          {/* Button */}
          {showButton && buttonLabel && !isUploading && (
            <button
              type="button"
              disabled={disabled}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${
                  disabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-hover"
                }
              `}
              style={{
                backgroundColor: disabled
                  ? undefined
                  : "var(--color-primary, #006D82)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {buttonLabel}
            </button>
          )}

          {/* Helper text */}
          {helperText && !validationError && (
            <div className="text-xs text-gray-500">{helperText}</div>
          )}

          {/* Error text */}
          {validationError && (
            <div className="text-xs text-red-600 font-medium">
              {validationError}
            </div>
          )}

          {/* Uploading text */}
          {isUploading && (
            <div className="text-sm text-gray-600 font-medium">
              {locale === "ar" ? "جاري الرفع..." : "Uploading..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
