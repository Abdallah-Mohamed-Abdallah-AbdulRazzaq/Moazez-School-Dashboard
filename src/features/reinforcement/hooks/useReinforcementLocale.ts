"use client";

import { useLocale } from "next-intl";

export function useReinforcementLocale() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const getLocalizedText = (arabic: string, english: string) =>
    isArabic ? arabic : english;

  return {
    locale,
    isArabic,
    getLocalizedText,
  };
}

