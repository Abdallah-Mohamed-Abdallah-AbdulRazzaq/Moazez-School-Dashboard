"use client";

import { useLocale, useTranslations } from "next-intl";
import { Hash } from "lucide-react";
import type { Application } from "@/features/admissions/types/admissions";
import type { RegistrationStudentRequest } from "@/features/admissions/applications/api/registrationDtos";

interface DetailsTabProps {
  application: Application;
  studentDraft?: Partial<RegistrationStudentRequest> | null;
  gradeLabel?: string | null;
  academicYearLabel?: string | null;
  previousSchool?: string | null;
}

function formatApplicationDate(
  value: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OverviewField({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-2 break-words text-sm font-semibold text-gray-900 ${monospace ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function DetailsTab({ application }: DetailsTabProps) {
  const t = useTranslations("admissions.application360");
  const locale = useLocale();
  const notAvailable = t("overview.not_available");
  const sourceLabels: Record<string, string> = {
    in_app: t("overview.sources.in_app"),
    referral: t("overview.sources.referral"),
    walk_in: t("overview.sources.walk_in"),
    other: t("overview.sources.other"),
  };
  const statusLabels: Record<string, string> = {
    submitted: t("overview.statuses.submitted"),
    documents_pending: t("overview.statuses.documents_pending"),
    under_review: t("overview.statuses.under_review"),
    accepted: t("overview.statuses.accepted"),
    waitlisted: t("overview.statuses.waitlisted"),
    rejected: t("overview.statuses.rejected"),
  };
  const source = application.source
    ? sourceLabels[application.source] ?? application.source
    : notAvailable;
  const status = statusLabels[application.status] ?? application.status;

  return (
    <section
      aria-labelledby="application-overview-title"
      className="space-y-6"
    >
      <div className="flex items-start gap-3 border-b border-gray-200 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#036b80]/10 text-[#036b80]">
          <Hash className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="application-overview-title"
            className="text-xl font-bold text-gray-900"
          >
            {t("overview.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("overview.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OverviewField
          label={t("overview.application_id")}
          value={application.id}
          monospace
        />
        <OverviewField
          label={t("overview.student_name")}
          value={application.studentName || notAvailable}
        />
        <OverviewField
          label={t("overview.lead_id")}
          value={application.leadId || notAvailable}
          monospace
        />
        <OverviewField
          label={t("overview.requested_academic_year_id")}
          value={application.requestedAcademicYearId || notAvailable}
          monospace
        />
        <OverviewField
          label={t("overview.requested_grade_id")}
          value={application.requestedGradeId || notAvailable}
          monospace
        />
        <OverviewField label={t("overview.source")} value={source} />
        <OverviewField label={t("overview.status")} value={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewField
          label={t("overview.submitted_at")}
          value={formatApplicationDate(application.submittedAt, locale, notAvailable)}
        />
        <OverviewField
          label={t("overview.created_at")}
          value={formatApplicationDate(application.createdAt, locale, notAvailable)}
        />
        <OverviewField
          label={t("overview.updated_at")}
          value={formatApplicationDate(application.updatedAt, locale, notAvailable)}
        />
      </div>

    </section>
  );
}
