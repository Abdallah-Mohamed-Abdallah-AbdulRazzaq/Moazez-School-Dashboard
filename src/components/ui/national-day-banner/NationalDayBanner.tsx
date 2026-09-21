"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

export type NationalDayBannerLocale = "ar" | "en";

export interface NationalDayBannerProps {
  locale: NationalDayBannerLocale;
}

const bannerCopy = {
  ar: {
    closeLabel: "إغلاق بانر اليوم الوطني",
    eyebrow: "اليوم الوطني السعودي",
    title:
      "كل عام والمملكة العربية السعودية قيادةً وشعبًا بخيرٍ وعزّ وازدهار",
    description:
      "نحتفي بوطنٍ شامخ، وهويةٍ راسخة، ومستقبلٍ نصنعه معًا.",
  },
  en: {
    closeLabel: "Close Saudi National Day banner",
    eyebrow: "Saudi National Day",
    title: "Happy Saudi National Day",
    description:
      "Celebrating a proud nation, a lasting identity, and a future we build together.",
  },
} as const;

const DISMISSED_STORAGE_KEY = "moazez:national-day-banner:dismissed:v1";

function subscribeToDismissal(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getDismissalSnapshot() {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getDismissalServerSnapshot() {
  return false;
}

export function NationalDayBanner({ locale }: NationalDayBannerProps) {
  const copy = bannerCopy[locale];
  const [isDismissed, setIsDismissed] = useState(false);
  const isPersistentlyDismissed = useSyncExternalStore(
    subscribeToDismissal,
    getDismissalSnapshot,
    getDismissalServerSnapshot,
  );

  const dismissBanner = () => {
    setIsDismissed(true);

    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    } catch {
      // The current view still dismisses the banner if persistence fails.
    }
  };

  if (isDismissed || isPersistentlyDismissed) {
    return null;
  }

  return (
    <section
      aria-labelledby="national-day-banner-title"
      className="px-4 pb-4 pt-4 sm:px-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-300/20 bg-[linear-gradient(135deg,#071c21_0%,#045738_58%,#00894a_100%)] px-5 py-5 pe-16 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:pe-20 lg:min-h-36 lg:py-6">
        <div
          aria-hidden="true"
          className="absolute -start-14 -top-20 size-48 rounded-full border-[28px] border-white/5"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 end-1/3 size-44 rounded-full bg-emerald-300/10 blur-2xl"
        />

        <button
          type="button"
          onClick={dismissBanner}
          aria-label={copy.closeLabel}
          className="absolute end-3 top-3 z-20 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/15 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={2.25} />
        </button>

        <div className="relative z-10 flex items-center justify-between gap-8">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-emerald-50">
              {copy.eyebrow}
            </p>
            <h2
              id="national-day-banner-title"
              className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl"
            >
              {copy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
              {copy.description}
            </p>
          </div>

          <Image
            src="/images/national-day/national-day-motto.svg"
            alt=""
            width={675}
            height={119}
            className="hidden h-auto w-[320px] shrink-0 lg:block xl:w-[360px]"
          />
        </div>
      </div>
    </section>
  );
}

export default NationalDayBanner;
