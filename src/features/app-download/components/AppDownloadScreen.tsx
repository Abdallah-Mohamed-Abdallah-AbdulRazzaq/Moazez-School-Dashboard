"use client";

import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import {
  APP_DOWNLOAD_CONFIG,
  type AppDownloadAudience,
} from "@/features/app-download/utils/appDownloadAudience";

const audienceIcons = {
  student: GraduationCap,
  teacher: BookOpen,
  parent: HeartHandshake,
  dismissalStaff: ShieldCheck,
};

export function AppDownloadScreen({
  audience,
}: {
  audience: AppDownloadAudience;
}) {
  const t = useTranslations("app_download");
  const locale = useLocale();
  const { logout } = useAuth();
  const config = APP_DOWNLOAD_CONFIG[audience];
  const AudienceIcon = audienceIcons[audience];
  const appName = t(config.translationKey);

  return (
    <main
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="app-download-background grid min-h-screen place-items-center px-4 py-8"
    >
      <section
        aria-labelledby="app-download-title"
        className="app-download-card w-full max-w-lg rounded-3xl p-8 text-center sm:p-12"
      >
        <div className="app-download-icon mx-auto grid size-20 place-items-center rounded-3xl text-white shadow-lg">
          <AudienceIcon aria-hidden="true" className="size-10" />
        </div>
        <p className="mt-7 text-sm font-semibold text-primary">
          {t("eyebrow")}
        </p>
        <h1
          id="app-download-title"
          className="mt-2 text-3xl font-bold tracking-tight text-slate-900"
        >
          {t("title", { appName })}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {t("description", { appName })}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <StoreLink
            href={config.androidUrl}
            label={t("android")}
            badgeAlt="Google Play"
            badgeSrc="/store-badges/google-play.svg"
            platform="google-play"
          />
          <StoreLink
            href={config.iosUrl}
            label={t("ios")}
            badgeAlt="App Store"
            badgeSrc="/store-badges/app-store.svg"
            platform="app-store"
          />
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {t("logout")}
        </button>
      </section>
    </main>
  );
}

function StoreLink({
  href,
  label,
  badgeAlt,
  badgeSrc,
  platform,
}: {
  href: string | null;
  label: string;
  badgeAlt: string;
  badgeSrc: string;
  platform: "google-play" | "app-store";
}) {
  const className = `app-download-store-link app-download-store-link--${platform} w-fit inline-flex overflow-hidden rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`;
  // eslint-disable-next-line @next/next/no-img-element -- Render supplied SVG store badges directly without image optimization.
  const badge = <img src={badgeSrc} alt={badgeAlt} width={120} height={40} />;

  if (!href) {
    return (
      <button
        type="button"
        disabled
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
