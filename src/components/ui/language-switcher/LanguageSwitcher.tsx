"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const LOCALES = ["en", "ar"] as const;

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = LOCALES.includes(segments[0] as "ar" | "en")
    ? segments[0]
    : "en";

  const nextLocale = currentLocale === "en" ? "ar" : "en";

  function setLocale(locale: string) {
    const newSegments = [...segments];

    if (LOCALES.includes(newSegments[0] as "ar" | "en")) {
      newSegments[0] = locale;
    } else {
      newSegments.unshift(locale);
    }

    const nextPath = "/" + newSegments.join("/");
    const queryString = searchParams.toString();

    router.replace(queryString ? `${nextPath}?${queryString}` : nextPath, {
      scroll: false,
    });
  }

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="hidden md:flex items-center gap-2 px-3 py-2 h-[50px] hover:bg-gray-100 transition-colors border-2 rounded-lg border-neutral-200"
    >
      <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
        <Image
          src={
            currentLocale === "en"
              ? "/images/country_icons/ar/ar.jpg"
              : "/images/country_icons/en/us.svg"
          }
          alt={nextLocale.toUpperCase()}
          width={24}
          height={24}
        />
      </div>

      <span className="text-sm font-bold text-primary-600">
        {nextLocale.toUpperCase()}
      </span>
    </button>
  );
}
