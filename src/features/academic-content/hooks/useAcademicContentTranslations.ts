"use client";

import { useTranslations } from "next-intl";
export function useAcademicContentTranslations(namespace?: string) {
  return useTranslations(
    namespace ? `academic_content.${namespace}` : "academic_content",
  );
}
