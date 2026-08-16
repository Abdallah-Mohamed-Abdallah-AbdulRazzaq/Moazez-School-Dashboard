"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function AuthBrandPanel() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("auth.login");

  return (
    <aside
      className="relative flex min-h-full w-full items-center justify-center overflow-hidden px-8 py-10 text-[var(--background)]"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background:
          "linear-gradient(145deg, color-mix(in oklab, var(--primary-color) 84%, white) 0%, var(--primary-color) 56%, color-mix(in oklab, var(--hover-color) 78%, black) 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 18%, color-mix(in oklab, var(--accent-color) 18%, transparent), transparent 20%), radial-gradient(circle at 82% 14%, color-mix(in oklab, white 18%, transparent), transparent 14%), radial-gradient(circle at 72% 80%, color-mix(in oklab, var(--accent-color) 16%, transparent), transparent 18%), repeating-radial-gradient(circle at -10% 50%, color-mix(in oklab, var(--hover-color) 68%, transparent) 0 16px, transparent 16px 34px)",
        }}
      />

      <div className="relative z-10 w-full max-w-[27rem] rounded-[2rem] border border-white/12 bg-[color-mix(in_oklab,white_14%,transparent)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[2px]">
        <div className="space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </div>

          <div className={`space-y-4 ${isRTL ? "text-right" : "text-left"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
              {t("brand.badge")}
            </p>
            <h2 className="max-w-xs text-[2rem] font-bold leading-[1.15] tracking-[-0.03em] text-white">
              {t("brand.title")}
            </h2>
            <p className="max-w-sm text-sm leading-6 text-white/78">
              {t("brand.description")}
            </p>
          </div>

          <div className="relative mx-auto mt-4 flex w-full max-w-[18rem] justify-center">
            <div
              className={`absolute top-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)] text-xl font-bold text-[var(--primary-color)] shadow-[0_18px_26px_rgba(0,0,0,0.14)] ${
                isRTL ? "-left-6" : "-right-6"
              }`}
            >
              <Image
                src="/images/emoji/100-static.svg"
                alt={t("brand.badge")}
                width={32}
                height={32}
              />
            </div>

            <div
              className={`absolute bottom-8 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--background)] text-xl shadow-[0_18px_26px_rgba(0,0,0,0.14)] ${
                isRTL ? "-right-7" : "-left-7"
              }`}
              aria-hidden="true"
            >
              🤝
            </div>

            <div className="relative w-full px-6 pb-0 pt-6">
              <Image
                src="/images/Group 1000008621.svg"
                alt={t("brand.badge")}
                width={300}
                height={300}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
