"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { heroJourneyTabs } from "../config/heroJourneyTabs";

interface HeroJourneyPageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  bannerImageSrc?: string;
}

export default function HeroJourneyPageHeader({
  title,
  description,
  actions,
  bannerImageSrc = "/assets/hero-journey/banner-map.svg",
}: HeroJourneyPageHeaderProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("heroJourney");

  return (
    <div>
      <div
        className="relative min-h-[180px] rounded-2xl bg-slate-900 bg-cover bg-center bg-no-repeat pb-12 sm:min-h-[220px]"
        style={{
          backgroundImage: `linear-gradient(${locale === "ar" ? "-90deg" : "90deg"}, rgba(15, 23, 42,0.5) 0%, rgba(15, 23, 42, 0.38) 42%, rgba(15, 23, 42, 0.1) 100%), url('${bannerImageSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_18%),radial-gradient(circle_at_88%_22%,rgba(255,255,255,0.35),transparent_9%)]" />
        <div className="relative flex min-h-[160px] items-end px-4 py-5 sm:min-h-[190px] sm:px-7 sm:py-6">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-100 sm:text-[15px]">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="relative z-10 -mt-9 rounded-2xl border border-primary/10 bg-white/95 px-4 py-4 shadow-lg backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {heroJourneyTabs.map((tab) => {
                const href = `/${locale}${tab.href}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={tab.key}
                    href={href}
                    className={`cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {t(tab.key)}
                  </Link>
                );
              })}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
