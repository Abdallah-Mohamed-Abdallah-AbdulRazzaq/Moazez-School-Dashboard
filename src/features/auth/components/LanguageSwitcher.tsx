"use client";

import { Languages } from "lucide-react";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SUPPORTED_LOCALES = ["en", "ar"] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function getLocalizedPath(pathname: string, locale: SupportedLocale) {
  const segments = pathname.split("/").filter(Boolean);

  if (SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }

  return `/${segments.join("/")}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("auth.login.languageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: SupportedLocale) {
    if (nextLocale === locale) {
      return;
    }

    const nextPath = getLocalizedPath(pathname, nextLocale);
    const queryString = searchParams.toString();
    const href = queryString ? `${nextPath}?${queryString}` : nextPath;

    startTransition(() => {
      if (typeof document.startViewTransition === "function") {
        document.startViewTransition(() => {
          router.push(href);
        });
        return;
      }

      router.push(href);
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--border-color)_84%,var(--primary-color))] bg-[color-mix(in_oklab,var(--background)_94%,var(--primary-color))] p-1 shadow-[0_8px_18px_rgba(0,0,0,0.04)] backdrop-blur-sm"
      role="group"
      aria-label={t("ariaLabel")}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--primary-color)] sm:h-9 sm:w-9">
        <Languages className="h-4 w-4" aria-hidden="true" />
      </span>

      {SUPPORTED_LOCALES.map((item) => {
        const isActive = item === locale;

        return (
          <button
            key={item}
            type="button"
            onClick={() => handleLocaleChange(item)}
            disabled={isPending}
            aria-pressed={isActive}
            aria-busy={isPending && !isActive}
            className="min-w-11 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-wait disabled:opacity-80 sm:px-4"
            style={{
              backgroundColor: isActive ? "var(--primary-color)" : "transparent",
              color: isActive ? "var(--background)" : "var(--foreground)",
              boxShadow: isActive
                ? "0 10px 20px color-mix(in oklab, var(--primary-color) 28%, transparent)"
                : "none",
            }}
          >
            {item === "en" ? t("english") : t("arabic")}
          </button>
        );
      })}
    </div>
  );
}
