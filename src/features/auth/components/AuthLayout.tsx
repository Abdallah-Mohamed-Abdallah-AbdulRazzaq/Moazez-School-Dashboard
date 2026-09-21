"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { NationalDayVideoBackground } from "@/components/ui";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AuthLayoutProps {
  brandPanel: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ brandPanel, children }: AuthLayoutProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[var(--foreground)]">
      <NationalDayVideoBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[90rem] flex-col justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-3 flex justify-end sm:mb-4">
          <LanguageSwitcher />
        </div>

        <section
          className={`overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white lg:flex lg:min-h-[680px] lg:rounded-[2.25rem] ${
            isRTL ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          <div className="hidden lg:flex lg:w-[52%]">{brandPanel}</div>

          <div className="flex min-h-[calc(100vh-6.75rem)] flex-1 items-center justify-center bg-white px-5 py-8 sm:px-10 sm:py-10 lg:min-h-[680px] lg:px-12 lg:py-12 xl:px-16">
            <div className="w-full max-w-[25rem]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
