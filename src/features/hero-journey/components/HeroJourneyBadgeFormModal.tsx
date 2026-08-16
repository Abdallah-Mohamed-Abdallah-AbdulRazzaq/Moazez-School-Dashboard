"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Modal } from "@/components/ui";
import TextArea from "@/components/ui/input/TextArea";
import { uploadFile } from "@/features/academics/curriculum/services/filesService";
import type { HeroJourneyBadge } from "../types";
import type { HeroJourneyBadgePayload } from "../services/heroJourneyService";

const HERO_BADGE_FILE_ACCEPT = ".svg,.png,.jpg,.jpeg,.webp";
const HERO_BADGE_MAX_FILE_SIZE = 10 * 1024 * 1024;
const HERO_BADGE_ALLOWED_MIME_TYPES = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const HERO_BADGE_ALLOWED_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

interface HeroJourneyBadgeFormModalProps {
  isOpen: boolean;
  badge: HeroJourneyBadge | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: HeroJourneyBadgePayload) => Promise<void> | void;
}

export default function HeroJourneyBadgeFormModal({
  isOpen,
  badge,
  loading = false,
  onClose,
  onSubmit,
}: HeroJourneyBadgeFormModalProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("heroJourney.badgeForm");
  const [slug, setSlug] = useState(badge?.slug || "");
  const [nameEn, setNameEn] = useState(badge?.nameEn || "");
  const [nameAr, setNameAr] = useState(badge?.nameAr || "");
  const [descriptionEn, setDescriptionEn] = useState(badge?.descriptionEn || "");
  const [descriptionAr, setDescriptionAr] = useState(badge?.descriptionAr || "");
  const [assetPath, setAssetPath] = useState(badge?.assetPath || "");
  const [fileId] = useState(badge?.fileId || "");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [sortOrder, setSortOrder] = useState(
    typeof badge?.sortOrder === "number" ? String(badge.sortOrder) : "",
  );
  const [isActive, setIsActive] = useState(badge?.isActive ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBusy = loading || isUploading;

  const validateAssetFile = (file: File) => {
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = HERO_BADGE_ALLOWED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension),
    );
    const hasAllowedMimeType =
      !file.type || HERO_BADGE_ALLOWED_MIME_TYPES.has(file.type);

    if (!hasAllowedExtension || !hasAllowedMimeType) {
      return t("errors.invalidFileType");
    }

    if (file.size > HERO_BADGE_MAX_FILE_SIZE) {
      return t("errors.fileTooLarge");
    }

    return null;
  };

  const handleAssetFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    const validationError = validateAssetFile(file);
    if (validationError) {
      setError(validationError);
      setAssetFile(null);
      return;
    }

    setError(null);
    setAssetFile(file);
  };

  const handleSubmit = async () => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      setError(t("errors.slugRequired"));
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setError(t("errors.slugInvalid"));
      return;
    }

    if (
      sortOrder.trim().length > 0 &&
      !Number.isInteger(Number(sortOrder))
    ) {
      setError(t("errors.sortOrderInvalid"));
      return;
    }

    setError(null);
    setIsUploading(Boolean(assetFile));

    try {
      const uploadedFileId = assetFile
        ? (await uploadFile(assetFile)).id
        : fileId.trim() || undefined;

      await onSubmit({
        slug: normalizedSlug,
        nameEn: nameEn.trim() || undefined,
        nameAr: nameAr.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        descriptionAr: descriptionAr.trim() || undefined,
        assetPath: assetPath.trim() || undefined,
        fileId: uploadedFileId,
        sortOrder: sortOrder ? Number(sortOrder) : undefined,
        isActive,
      });
    } catch {
      setError(t("errors.saveFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={badge ? t("editTitle") : t("createTitle")}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={isBusy} disabled={isBusy}>
            {badge ? tCommon("save", { defaultMessage: "Save" }) : t("createTitle")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("labels.slug")}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder={t("placeholders.slug")}
            required
          />
          <Input
            label={t("labels.sortOrder")}
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
            step="1"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("labels.nameEn")}
            value={nameEn}
            onChange={(event) => setNameEn(event.target.value)}
          />
          <Input
            label={t("labels.nameAr")}
            value={nameAr}
            onChange={(event) => setNameAr(event.target.value)}
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextArea
            label={t("labels.descriptionEn")}
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
          />
          <TextArea
            label={t("labels.descriptionAr")}
            value={descriptionAr}
            onChange={(event) => setDescriptionAr(event.target.value)}
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t("labels.assetPath")}
            value={assetPath}
            onChange={(event) => setAssetPath(event.target.value)}
            placeholder={t("placeholders.assetPath")}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("labels.assetFile")}
            </label>
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type="file"
                accept={HERO_BADGE_FILE_ACCEPT}
                onChange={handleAssetFileChange}
                disabled={isBusy}
                className="block w-full cursor-pointer text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-2 text-xs text-gray-500">
                {t("helper.fileUpload")}
              </p>
              {assetFile ? (
                <p className="mt-2 text-xs font-medium text-gray-700">
                  {t("selectedFile", { fileName: assetFile.name })}
                </p>
              ) : fileId ? (
                <p className="mt-2 text-xs text-gray-500">
                  {t("currentFileId", { fileId })}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition-colors hover:border-primary/30">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span>
            <span className="block font-medium text-gray-900">
              {t("labels.activeTitle")}
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              {t("helper.activeDescription")}
            </span>
          </span>
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
