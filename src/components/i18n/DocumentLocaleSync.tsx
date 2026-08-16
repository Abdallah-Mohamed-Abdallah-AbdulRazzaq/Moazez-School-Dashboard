"use client";

import { useEffect } from "react";

interface DocumentLocaleSyncProps {
  locale: "ar" | "en";
}

export default function DocumentLocaleSync({
  locale,
}: DocumentLocaleSyncProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
