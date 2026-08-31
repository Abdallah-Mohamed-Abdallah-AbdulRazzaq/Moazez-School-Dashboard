"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleX,
  ListChecks,
  UserCheck,
} from "lucide-react";
import { useLocale } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { BulkRegistrationBatchDetail } from "../api/bulkRegistrationDtos";
import { getBulkRegistrationErrorCode } from "../model/bulkRegistrationModel";

export interface BulkRegistrationPlacementNames {
  academicYear: string;
  term: string | null;
  stage: string;
  grade: string;
  section: string;
  classroom: string;
}

interface BulkRegistrationBatchSummaryProps {
  batch: BulkRegistrationBatchDetail;
  placementNames: BulkRegistrationPlacementNames | null;
}

const copy = {
  en: {
    placement: "Academic placement",
    total: "Total rows",
    valid: "Valid rows",
    invalid: "Invalid rows",
    created: "Created rows",
    failed: "Failed rows",
    createdAt: "Created at",
    updatedAt: "Updated at",
    validatedAt: "Validated at",
    startedAt: "Started at",
    completedAt: "Completed at",
    validationErrors: "Validation errors",
    unknownError: "A row or file validation error requires attention.",
    headerInvalid: "The CSV headers do not match the required template.",
    csvMalformed: "The CSV file could not be read.",
    noRows: "The CSV file contains no student rows.",
  },
  ar: {
    placement: "التسكين الأكاديمي",
    total: "إجمالي الصفوف",
    valid: "الصفوف الصحيحة",
    invalid: "الصفوف غير الصحيحة",
    created: "الطلاب المنشؤون",
    failed: "الصفوف الفاشلة",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    validatedAt: "وقت اكتمال التحقق",
    startedAt: "وقت بدء التنفيذ",
    completedAt: "وقت الاكتمال",
    validationErrors: "أخطاء التحقق",
    unknownError: "يوجد خطأ في الملف أو أحد الصفوف يحتاج إلى المراجعة.",
    headerInvalid: "عناوين CSV لا تطابق القالب المطلوب.",
    csvMalformed: "تعذرت قراءة ملف CSV.",
    noRows: "لا يحتوي ملف CSV على صفوف طلاب.",
  },
} as const;

const statusLabels = {
  en: {
    UPLOADED: "Uploaded",
    VALIDATING: "Validating",
    VALIDATION_FAILED: "Validation failed",
    READY: "Ready",
    EXECUTING: "Executing",
    EXECUTION_PARTIAL_FAILED: "Partially completed",
    FAILED: "Failed",
    COMPLETED: "Completed",
  },
  ar: {
    UPLOADED: "تم الرفع",
    VALIDATING: "جارٍ التحقق",
    VALIDATION_FAILED: "فشل التحقق",
    READY: "جاهز",
    EXECUTING: "جارٍ التنفيذ",
    EXECUTION_PARTIAL_FAILED: "اكتمل جزئيًا",
    FAILED: "فشل",
    COMPLETED: "مكتمل",
  },
} as const;

function timestampLabel(
  timestamp: string,
  locale: "ar" | "en",
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function validationErrorMessage(
  errorCode: string,
  text: (typeof copy)["en"] | (typeof copy)["ar"],
): string {
  const safeCode = getBulkRegistrationErrorCode(errorCode);
  if (safeCode === "students.bulk_registration.header_invalid") {
    return text.headerInvalid;
  }
  if (safeCode === "students.bulk_registration.csv_malformed") {
    return text.csvMalformed;
  }
  if (safeCode === "students.bulk_registration.no_data_rows") {
    return text.noRows;
  }
  return text.unknownError;
}

export function bulkRegistrationPlacementLabel(
  batch: BulkRegistrationBatchDetail,
  placementNames: BulkRegistrationPlacementNames | null,
): string {
  if (!placementNames) {
    return `${batch.placement.academicYearId} · ${batch.placement.classroomId}`;
  }
  return [
    placementNames.academicYear,
    placementNames.term,
    placementNames.stage,
    placementNames.grade,
    placementNames.section,
    placementNames.classroom,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function BulkRegistrationBatchSummary({
  batch,
  placementNames,
}: BulkRegistrationBatchSummaryProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const timestamps = [
    [text.createdAt, batch.createdAt],
    [text.updatedAt, batch.updatedAt],
    [text.validatedAt, batch.validatedAt],
    [text.startedAt, batch.startedAt],
    [text.completedAt, batch.completedAt],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {text.placement}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {bulkRegistrationPlacementLabel(batch, placementNames)}
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary">
            {statusLabels[locale][batch.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KPICardV2 title={text.total} value={batch.counters.totalRows} icon={ListChecks} showChart={false} />
        <KPICardV2 title={text.valid} value={batch.counters.validRows} icon={CircleCheck} showChart={false} />
        <KPICardV2 title={text.invalid} value={batch.counters.invalidRows} icon={CircleAlert} showChart={false} />
        <KPICardV2 title={text.created} value={batch.counters.createdRows} icon={UserCheck} showChart={false} />
        <KPICardV2 title={text.failed} value={batch.counters.failedRows} icon={CircleX} showChart={false} />
      </div>

      {timestamps.length ? (
        <dl className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
          {timestamps.map(([label, timestamp]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {timestampLabel(timestamp, locale)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {batch.validationErrors.length ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-900">{text.validationErrors}</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-red-800">
            {batch.validationErrors.map((errorCode, index) => (
              <li key={`${errorCode}-${index}`}>
                {validationErrorMessage(errorCode, text)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
