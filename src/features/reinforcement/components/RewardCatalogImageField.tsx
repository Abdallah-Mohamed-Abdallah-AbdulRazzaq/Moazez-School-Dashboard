"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AuthenticatedFileImage from "@/components/ui/authenticated-file-image/AuthenticatedFileImage";
import Button from "@/components/ui/button/Button";
import FileUploadButton from "@/components/ui/file-upload/FileUploadButton";
import type { RewardCatalogImageFile } from "@/features/reinforcement/types";
import { uploadFile } from "@/services/filesService";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

interface RewardCatalogImageFieldProps {
  value?: string | null;
  existingFile?: RewardCatalogImageFile | null;
  canUpload: boolean;
  canDownload: boolean;
  disabled?: boolean;
  onChange: (fileId: string | null) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export default function RewardCatalogImageField({
  value,
  existingFile,
  canUpload,
  canDownload,
  disabled = false,
  onChange,
  onUploadingChange,
}: RewardCatalogImageFieldProps) {
  const t = useTranslations("reinforcement");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(existingFile?.originalName || "");

  useEffect(() => {
    if (!value) {
      void Promise.resolve().then(() => setFileName(""));
    } else if (existingFile?.id === value) {
      void Promise.resolve().then(() => setFileName(existingFile.originalName));
    }
      void Promise.resolve().then(() => setError(null));
  }, [existingFile, value]);

  const setUploadState = (next: boolean) => {
    setUploading(next);
    onUploadingChange(next);
  };

  const handleFilesSelected = async ([file]: File[]) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setError(t("rewardsModule.catalog.form.imageTypeInvalid"));
      return;
    }

    setUploadState(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file);
      setFileName(uploaded.originalName);
      onChange(uploaded.id);
    } catch {
      setError(t("rewardsModule.catalog.form.imageUploadFailed"));
    } finally {
      setUploadState(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-900">
        {t("rewardsModule.catalog.form.image")}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <AuthenticatedFileImage
          fileId={value}
          alt={t("rewardsModule.catalog.form.image")}
          canDownload={canDownload}
          unavailableLabel={t("rewardsModule.catalog.form.imageUnavailable")}
          retryLabel={t("rewardsModule.catalog.form.retryImage")}
          className="h-24 w-24"
        />
        <div className="min-w-0 flex-1 space-y-2">
          {fileName ? (
            <p className="truncate text-sm text-gray-700">{fileName}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {canUpload ? (
              <FileUploadButton
                buttonLabel={t(
                  value
                    ? "rewardsModule.catalog.form.replaceImage"
                    : "rewardsModule.catalog.form.uploadImage",
                )}
                accept="image/jpeg,image/png"
                maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
                disabled={disabled || uploading}
                onFilesSelected={(files) => void handleFilesSelected(files)}
                formatSizeError={() =>
                  t("rewardsModule.catalog.form.imageTooLarge")
                }
                buttonProps={{ variant: "secondary", size: "sm" }}
              />
            ) : null}
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => {
                  setFileName("");
                  setError(null);
                  onChange(null);
                }}
              >
                {t("rewardsModule.catalog.form.removeImage")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            {t("rewardsModule.catalog.form.imageHelp")}
          </p>
          {uploading ? (
            <p className="text-sm text-primary">
              {t("rewardsModule.catalog.form.uploadingImage")}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
