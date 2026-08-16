"use client";

import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";

export default function StudentEnrollmentMissingState() {
  const t = useTranslations("students_guardians.profile.missing_enrollment");

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950"
    >
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-amber-800">{t("description")}</p>
        </div>
      </div>
    </div>
  );
}
