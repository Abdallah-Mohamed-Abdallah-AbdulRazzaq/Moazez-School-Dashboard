"use client";

import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

export default function GeneralResourceNotice() {
  const t = useAcademicContentTranslations("details");
  return (
    <section id="details" aria-labelledby="details-heading" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 id="details-heading" className="text-lg font-semibold text-gray-900">{t("general_title")}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t("general_description")}
      </p>
    </section>
  );
}
