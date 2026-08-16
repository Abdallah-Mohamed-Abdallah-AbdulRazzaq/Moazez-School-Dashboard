import { useTranslations } from "next-intl";
import {
  APP_DOWNLOAD_CONFIG,
  type AppDownloadAudience,
} from "@/features/app-download/utils/appDownloadAudience";

export function MobileAppStoreLinks({
  audience,
}: {
  audience: AppDownloadAudience;
}) {
  const t = useTranslations("app_download");
  const appConfig = APP_DOWNLOAD_CONFIG[audience];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <StoreBadge
        href={appConfig.androidUrl}
        label={t("android")}
        badgeAlt="Google Play"
        badgeSrc="/store-badges/google-play.svg"
      />
      <StoreBadge
        href={appConfig.iosUrl}
        label={t("ios")}
        badgeAlt="App Store"
        badgeSrc="/store-badges/app-store.svg"
      />
    </div>
  );
}

function StoreBadge({
  href,
  label,
  badgeAlt,
  badgeSrc,
}: {
  href: string | null;
  label: string;
  badgeAlt: string;
  badgeSrc: string;
}) {
  const badge = (
    // eslint-disable-next-line @next/next/no-img-element -- Store badges are supplied SVG assets that do not benefit from image optimization.
    <img src={badgeSrc} alt={badgeAlt} className="h-9 w-auto" />
  );
  const className =
    "inline-flex overflow-hidden rounded-md transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

  if (!href) {
    return (
      <button
        type="button"
        disabled
        aria-label={label}
        className={`${className} cursor-not-allowed opacity-50`}
      >
        {badge}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
    >
      {badge}
    </a>
  );
}
