"use client";

import { Award } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import AuthenticatedFileImage from "@/components/ui/authenticated-file-image/AuthenticatedFileImage";
import { usePermissions } from "@/hooks/usePermissions";
import type { HeroJourneyBadge } from "../types";
import { getHeroJourneyBadgeAssetPath } from "../utils/badgeAssetRegistry";

interface HeroJourneyBadgeThumbProps {
  badge?: HeroJourneyBadge | null;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export default function HeroJourneyBadgeThumb({
  badge,
  size = "sm",
  showLabel = false,
}: HeroJourneyBadgeThumbProps) {
  const locale = useLocale();
  const t = useTranslations("students_guardians.hero_journey");
  const { hasPermission, isPermissionsReady } = usePermissions();
  const slug = badge?.slug || "";
  const fallbackSrc = badge?.assetPath || getHeroJourneyBadgeAssetPath(slug);
  const canDownloadFiles =
    isPermissionsReady && hasPermission("files.downloads.view");

  const label =
    locale === "ar"
      ? badge?.nameAr || badge?.nameEn || t("badge")
      : badge?.nameEn || badge?.nameAr || t("badge");

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`inline-flex ${sizeClasses[size]} items-center justify-center overflow-hidden rounded-xl`}
      >
        {badge ? (
          <AuthenticatedFileImage
            fileId={badge.fileId}
            fallbackSrc={fallbackSrc}
            alt={label}
            canDownload={canDownloadFiles}
            unavailableLabel={t("badgeImageUnavailable")}
            retryLabel={t("retry")}
            className={`${sizeClasses[size]} h-full w-full`}
            cache
          />
        ) : (
          <Award className="h-4 w-4 text-teal-600" />
        )}
      </div>
      {showLabel ? (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      ) : null}
    </div>
  );
}
