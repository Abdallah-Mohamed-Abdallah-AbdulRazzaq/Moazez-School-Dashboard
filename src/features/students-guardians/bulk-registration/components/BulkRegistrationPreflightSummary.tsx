"use client";

import { CheckCircle2, School, Users } from "lucide-react";
import { useLocale } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { BulkRegistrationPreflight } from "@/features/students-guardians/bulk-registration/api/bulkRegistrationDtos";
import { getBulkRegistrationErrorCode } from "@/features/students-guardians/bulk-registration/model/bulkRegistrationModel";

interface BulkRegistrationPreflightSummaryProps {
  preflight: BulkRegistrationPreflight | null;
}

const copy = {
  en: {
    title: "Preflight readiness",
    description: "Backend validation remains authoritative for this placement.",
    ready: "Placement is ready",
    rejected: "Placement needs attention",
    capacity: "Classroom capacity",
    seatLimit: "Seat limit",
    seatsUsed: "Seats used",
    seatsRemaining: "Seats remaining",
    notCapped: "Not capped",
    unknown: "We could not verify this placement. Please try again.",
    placementUnavailable: "The selected academic placement is not available.",
    selectedPlacement: "Selected placement",
  },
  ar: {
    title: "جاهزية التحقق المسبق",
    description: "يبقى تحقق الخادم هو المرجع النهائي لهذا التسكين.",
    ready: "التسكين جاهز",
    rejected: "التسكين يحتاج إلى مراجعة",
    capacity: "سعة الفصل",
    seatLimit: "حد المقاعد",
    seatsUsed: "المقاعد المستخدمة",
    seatsRemaining: "المقاعد المتبقية",
    notCapped: "غير محدد",
    unknown: "تعذر التحقق من التسكين. يرجى المحاولة مرة أخرى.",
    placementUnavailable: "التسكين الأكاديمي المحدد غير متاح.",
    selectedPlacement: "التسكين المحدد",
  },
} as const;

function errorMessage(
  errorCode: string,
  text: (typeof copy)["en"] | (typeof copy)["ar"],
): string {
  const safeCode = getBulkRegistrationErrorCode(errorCode);
  if (safeCode === "students.bulk_registration.execution_placement_invalid") {
    return text.placementUnavailable;
  }
  return text.unknown;
}

function localizedName(
  record: { nameAr: string; nameEn: string },
  locale: "ar" | "en",
): string {
  return locale === "ar" ? record.nameAr : record.nameEn;
}

export default function BulkRegistrationPreflightSummary({
  preflight,
}: BulkRegistrationPreflightSummaryProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  if (!preflight) return null;

  if (!preflight.valid || !preflight.placement || !preflight.studentSeat) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-5"
      >
        <h2 className="text-lg font-semibold text-red-900">{text.rejected}</h2>
        <p className="mt-1 text-sm text-red-700">{text.description}</p>
        <ul className="mt-4 list-disc space-y-1 ps-5 text-sm text-red-800">
          {(preflight.errors.length ? preflight.errors : ["unknown"]).map(
            (errorCode, index) => (
            <li key={`${errorCode}-${index}`}>
              {errorMessage(errorCode, text)}
            </li>
            ),
          )}
        </ul>
      </section>
    );
  }

  const { placement, studentSeat } = preflight;
  const hierarchy = [
    placement.academicYear,
    placement.term,
    placement.stage,
    placement.grade,
    placement.section,
    placement.classroom,
  ]
    .filter((record): record is NonNullable<typeof record> => Boolean(record))
    .map((record) => localizedName(record, locale))
    .join(" · ");

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
        <div>
          <h2 className="text-lg font-semibold text-emerald-900">
            {text.ready}
          </h2>
          <p className="mt-1 text-sm text-emerald-800">{text.description}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {text.selectedPlacement}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900">{hierarchy}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICardV2
          title={text.capacity}
          value={placement.classroom.capacity ?? text.notCapped}
          icon={School}
          showChart={false}
        />
        <KPICardV2
          title={text.seatLimit}
          value={studentSeat.limit ?? text.notCapped}
          icon={Users}
          showChart={false}
        />
        <KPICardV2
          title={text.seatsUsed}
          value={studentSeat.used}
          icon={Users}
          showChart={false}
        />
        <KPICardV2
          title={text.seatsRemaining}
          value={studentSeat.remaining ?? text.notCapped}
          icon={Users}
          showChart={false}
        />
      </div>
    </section>
  );
}
