"use client";

import { useLocale, useTranslations } from "next-intl";
import type { TeacherDirectoryDetail } from "@/features/teachers/types/index";

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

function DetailField({ label, text }: { label: string; text: string | number | null }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 text-sm text-gray-900">{text ?? "—"}</dd></div>;
}

export default function TeacherDetailSections({ teacher }: { teacher: TeacherDirectoryDetail }) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DetailCard title={t("details.identity")}>
        <DetailField label={t("fields.login_email")} text={teacher.loginEmail} />
        <DetailField label={t("fields.username")} text={teacher.username} />
        <DetailField label={t("fields.contact_email")} text={teacher.contactEmail} />
        <DetailField label={t("fields.phone")} text={teacher.phone} />
        <DetailField label={t("details.full_name_ar")} text={[teacher.firstNameAr, teacher.lastNameAr].filter(Boolean).join(" ") || null} />
        <DetailField label={t("details.full_name_en")} text={[teacher.firstNameEn, teacher.lastNameEn].filter(Boolean).join(" ") || null} />
        <DetailField label={t("fields.gender")} text={teacher.gender ? t(`gender.${teacher.gender.toLowerCase()}`) : null} />
      </DetailCard>
      <DetailCard title={t("details.employment")}>
        <DetailField label={t("fields.department")} text={teacher.department} />
        <DetailField label={t("fields.specialization")} text={teacher.specialization} />
        <DetailField label={t("fields.employment_type")} text={teacher.employmentType ? t(`employment_types.${teacher.employmentType.toLowerCase()}`) : null} />
        <DetailField label={t("fields.experience_years")} text={teacher.experienceYears} />
        <DetailField label={t("fields.hire_date")} text={teacher.hireDate ? formatDate(teacher.hireDate) : null} />
        <DetailField label={t("details.membership_ended_at")} text={teacher.membershipEndedAt ? formatDate(teacher.membershipEndedAt) : null} />
      </DetailCard>
      <DetailCard title={t("details.schedule")}>
        <DetailField label={t("details.working_days")} text={teacher.workingDays.length ? teacher.workingDays.map((day) => t(`work_days.${day.toLowerCase()}`)).join(", ") : null} />
        <DetailField label={t("details.working_hours")} text={teacher.workStartTime && teacher.workEndTime ? `${teacher.workStartTime.slice(0, 5)} – ${teacher.workEndTime.slice(0, 5)}` : null} />
      </DetailCard>
      <DetailCard title={t("details.notes")}>
        <DetailField label={t("fields.notes_ar")} text={teacher.notesAr} />
        <DetailField label={t("fields.notes_en")} text={teacher.notesEn} />
      </DetailCard>
      <DetailCard title={t("details.metadata")}>
        <DetailField label={t("details.created_at")} text={formatDate(teacher.createdAt)} />
        <DetailField label={t("details.updated_at")} text={formatDate(teacher.updatedAt)} />
      </DetailCard>
    </div>
  );
}
