"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { TeacherUiError } from "@/features/teachers/utils/teacherErrors";

export default function TeacherActionErrorAlert({ error }: { error: TeacherUiError | null }) {
  const locale = useLocale();
  const t = useTranslations("teachers");

  if (error?.allocationConflict) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {error.message}{" "}
        <Link className="font-semibold underline" href={`/${locale}/academics/teacher-allocation`}>
          {t("actions.manage_allocations")}
        </Link>
      </div>
    );
  }

  if (!error?.identityIntegrityConflict) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <p className="font-semibold">{t("errors.identity_inconsistent")}</p>
      <p className="mt-1">{t("errors.identity_inconsistent_guidance")}</p>
      {error.traceId ? (
        <p className="mt-2 text-xs text-red-700">
          {t("errors.trace_id")}: <code className="select-all font-mono">{error.traceId}</code>
        </p>
      ) : null}
    </div>
  );
}
