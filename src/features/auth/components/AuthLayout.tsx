"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AuthLayoutProps {
  brandPanel: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ brandPanel, children }: AuthLayoutProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <main className="min-h-screen text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 flex justify-end sm:mb-5 lg:mb-6">
          <LanguageSwitcher />
        </div>

        {isRTL ? (
          <section
            className={`overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklab,var(--border-color)_80%,var(--primary-color))] bg-[var(--background)] shadow-[0_28px_60px_rgba(0,0,0,0.08)] lg:flex lg:min-h-[640px] lg:rounded-[2rem] ${isRTL ? "lg:flex-row-reverse" : "lg:flex-row"}`}
          >
            <div className="flex min-h-[calc(100vh-7.5rem)] flex-1 items-center justify-center bg-[var(--background)] px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[640px] lg:px-10 lg:py-12">
              <div className="w-full max-w-[22rem] sm:max-w-[24rem]">
                {children}
              </div>
            </div>

            <div className="hidden lg:flex lg:w-[51%]">{brandPanel}</div>
          </section>
        ) : (
          <section
            className={`overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklab,var(--border-color)_80%,var(--primary-color))] bg-[var(--background)] shadow-[0_28px_60px_rgba(0,0,0,0.08)] lg:flex lg:min-h-[640px] lg:rounded-[2rem] ${isRTL ? "lg:flex-row-reverse" : "lg:flex-row"}`}
          >
            <div className="hidden lg:flex lg:w-[51%]">{brandPanel}</div>

            <div className="flex min-h-[calc(100vh-7.5rem)] flex-1 items-center justify-center bg-[var(--background)] px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[640px] lg:px-10 lg:py-12">
              <div className="w-full max-w-[22rem] sm:max-w-[24rem]">
                {children}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
