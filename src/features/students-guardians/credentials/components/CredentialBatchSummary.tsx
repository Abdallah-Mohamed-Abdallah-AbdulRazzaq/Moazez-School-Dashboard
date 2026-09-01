"use client";

import { CircleAlert, CircleX, ListChecks, UserCheck } from "lucide-react";
import { useLocale } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { CredentialBatch } from "../api/credentialBatchDtos";

interface CredentialBatchSummaryProps {
  batch: CredentialBatch;
  exportAvailable: boolean;
}

const copy = {
  en: {
    audience: "Audience",
    mode: "Credential mode",
    total: "Eligible students",
    generated: "Generated rows",
    skipped: "Skipped rows",
    failed: "Failed rows",
    createdAt: "Created at",
    updatedAt: "Updated at",
    startedAt: "Started at",
    completedAt: "Completed at",
    export: "Credential export",
    exportAvailable: "Available for 24 hours",
    exportPending: "Available after generation",
    audiences: {
      import_batch: "Registration batch",
      selected_students: "Selected students",
      academic_year: "Academic year",
      stage: "Stage",
      grade: "Grade",
      section: "Section",
      classroom: "Classroom",
      missing_password: "Students missing passwords",
    },
    modes: {
      unique_generated: "Unique generated",
      shared_temporary: "Shared temporary",
      shared_admin_provided: "Administrator-provided shared",
    },
    statuses: {
      pending: "Pending",
      processing: "Processing",
      completed: "Completed",
      partial_failed: "Partially completed",
      failed: "Failed",
    },
  },
  ar: {
    audience: "النطاق",
    mode: "نوع بيانات الدخول",
    total: "الطلاب المؤهلون",
    generated: "البيانات المنشأة",
    skipped: "الصفوف المستبعدة",
    failed: "الصفوف الفاشلة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    startedAt: "وقت البدء",
    completedAt: "وقت الاكتمال",
    export: "تصدير بيانات الدخول",
    exportAvailable: "متاح لمدة 24 ساعة",
    exportPending: "متاح بعد الإنشاء",
    audiences: {
      import_batch: "دفعة تسجيل",
      selected_students: "طلاب محددون",
      academic_year: "العام الدراسي",
      stage: "المرحلة",
      grade: "الصف",
      section: "الشعبة",
      classroom: "الفصل",
      missing_password: "طلاب بدون كلمات مرور",
    },
    modes: {
      unique_generated: "كلمة فريدة مولدة",
      shared_temporary: "كلمة مؤقتة مشتركة",
      shared_admin_provided: "كلمة مشتركة يحددها المسؤول",
    },
    statuses: {
      pending: "قيد الانتظار",
      processing: "جارٍ التنفيذ",
      completed: "مكتمل",
      partial_failed: "اكتمل جزئيًا",
      failed: "فشل",
    },
  },
} as const;

function formatTimestamp(timestamp: string, locale: "ar" | "en"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default function CredentialBatchSummary({
  batch,
  exportAvailable,
}: CredentialBatchSummaryProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const timestamps = [
    [text.createdAt, batch.createdAt],
    [text.updatedAt, batch.updatedAt],
    [text.startedAt, batch.startedAt],
    [text.completedAt, batch.completedAt],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">{text.audience}</dt>
              <dd className="mt-1 text-gray-900">
                {text.audiences[batch.audienceMode]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">{text.mode}</dt>
              <dd className="mt-1 text-gray-900">
                {text.modes[batch.credentialMode]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">{text.export}</dt>
              <dd className="mt-1 text-gray-900">
                {exportAvailable ? text.exportAvailable : text.exportPending}
              </dd>
            </div>
          </dl>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary">
            {text.statuses[batch.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={text.total} value={batch.counters.totalRows} icon={ListChecks} showChart={false} />
        <KPICardV2 title={text.generated} value={batch.counters.generatedRows} icon={UserCheck} showChart={false} />
        <KPICardV2 title={text.skipped} value={batch.counters.skippedRows} icon={CircleAlert} showChart={false} />
        <KPICardV2 title={text.failed} value={batch.counters.failedRows} icon={CircleX} showChart={false} />
      </div>

      <dl className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {timestamps.map(([label, timestamp]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatTimestamp(timestamp, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
