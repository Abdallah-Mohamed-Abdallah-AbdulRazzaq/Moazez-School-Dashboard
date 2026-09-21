"use client";

import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { NationalDayValuesGrid } from "@/components/ui";

export function AuthBrandPanel() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("auth.login");

  return (
    <aside
      className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-[#062b28] px-10 py-12 text-white"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 16% 18%, rgba(0, 196, 113, 0.34), transparent 24%), radial-gradient(circle at 84% 14%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 76% 84%, rgba(0, 167, 96, 0.3), transparent 24%), linear-gradient(145deg, #0a674b 0%, #07503f 45%, #041f22 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(-45deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ffffff 75%), linear-gradient(-45deg, transparent 75%, #ffffff 75%)",
          backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-[31rem]">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t("nationalDay.badge")}</span>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className={`space-y-5 ${isRTL ? "text-right" : "text-left"}`}>
          <Image
            src="/images/national-day/national-day-motto.png"
            alt={t("nationalDay.logoAlt")}
            width={601}
            height={107}
            priority
            className="me-auto block h-auto w-full max-w-[30rem]"
          />

          <div className="h-px w-20 bg-[#00bf6f]" aria-hidden="true" />

          <h2 className="max-w-md text-[2.35rem] font-bold leading-[1.22] tracking-[-0.035em] text-white xl:text-[2.7rem]">
            {t("nationalDay.title")}
          </h2>
          <p className="max-w-md text-[0.95rem] leading-7 text-white/78">
            {t("nationalDay.description")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3" aria-hidden="true">
          {["#00bf6f", "#ffffff", "#00a15d"].map((color, index) => (
            <div
              key={color}
              className="h-1 rounded-full"
              style={{ backgroundColor: color, opacity: 1 - index * 0.2 }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-white/65">
          <ShieldCheck className="h-4 w-4 text-[#24d18a]" aria-hidden="true" />
          <span>{t("brand.badge")}</span>
        </div>

        <NationalDayValuesGrid />
      </div>
    </aside>
  );
}
