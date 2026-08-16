"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  APP_DOWNLOAD_CONFIG,
  MOBILE_APP_AUDIENCES,
} from "@/features/app-download/utils/appDownloadAudience";
import { MobileAppStoreLinks } from "./MobileAppStoreLinks";

export function MobileAppsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslations();

  useEffect(() => {
    if (!isOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("mobile_apps.menu_button")}
        aria-expanded={isOpen}
        aria-controls="mobile-apps-menu"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 sm:h-[50px] sm:w-[50px]"
      >
        <Smartphone className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/30 sm:hidden"
          />
          <section
            id="mobile-apps-menu"
            role="dialog"
            aria-label={t("mobile_apps.title")}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl border border-gray-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))] sm:max-h-[calc(100dvh-6rem)] sm:rounded-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:rounded-t-xl">
              <h2 className="text-base font-semibold text-gray-900">
                {t("mobile_apps.title")}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("mobile_apps.close")}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {MOBILE_APP_AUDIENCES.map((audience) => (
                <article
                  key={audience}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex flex-col items-center justify-center"
                >
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t(
                      `app_download.${APP_DOWNLOAD_CONFIG[audience].translationKey}`,
                    )}
                  </h3>
                  <div className="mt-2">
                    <MobileAppStoreLinks audience={audience} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
