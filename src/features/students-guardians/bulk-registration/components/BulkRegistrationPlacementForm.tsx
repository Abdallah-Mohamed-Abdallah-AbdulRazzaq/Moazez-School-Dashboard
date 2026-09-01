"use client";

import { useLocale } from "next-intl";
import AcademicStudentCascade, {
  type AcademicStudentCascadeOptions,
  type AcademicStudentCascadeValue,
} from "@/components/ui/academic/AcademicStudentCascade";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/input/DatePicker";
import Select from "@/components/ui/input/Select";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

export interface BulkRegistrationPlacementState {
  academicYearId: string;
  termId: string;
  academic: AcademicStudentCascadeValue;
  enrollmentDate: Date | null;
}

interface BulkRegistrationPlacementFormProps {
  placement: BulkRegistrationPlacementState;
  academicYears: AcademicYear[];
  terms: Term[];
  academicOptions: AcademicStudentCascadeOptions;
  loadingOptions: boolean;
  checkingPlacement: boolean;
  onChange: (placement: BulkRegistrationPlacementState) => void;
  onCheckPlacement: () => void;
}

const copy = {
  en: {
    title: "Academic placement",
    description:
      "Choose the destination classroom and enrollment date before checking availability.",
    academicYear: "Academic year",
    term: "Term (optional)",
    selectYear: "Select academic year",
    selectTerm: "Select term",
    enrollmentDate: "Enrollment date",
    check: "Check placement",
  },
  ar: {
    title: "التسكين الأكاديمي",
    description: "اختر الفصل المستهدف وتاريخ القيد قبل التحقق من الإتاحة.",
    academicYear: "العام الدراسي",
    term: "الفصل الدراسي (اختياري)",
    selectYear: "اختر العام الدراسي",
    selectTerm: "اختر الفصل الدراسي",
    enrollmentDate: "تاريخ القيد",
    check: "تحقق من التسكين",
  },
} as const;

function localizedName(
  record: { name: string; nameAr?: string; nameEn?: string },
  locale: "ar" | "en",
): string {
  return locale === "ar"
    ? record.nameAr || record.name || record.nameEn || ""
    : record.nameEn || record.name || record.nameAr || "";
}

function validDate(date: Date | null): date is Date {
  return Boolean(date && !Number.isNaN(date.getTime()));
}

export default function BulkRegistrationPlacementForm({
  placement,
  academicYears,
  terms,
  academicOptions,
  loadingOptions,
  checkingPlacement,
  onChange,
  onCheckPlacement,
}: BulkRegistrationPlacementFormProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const canCheck = Boolean(
    placement.academicYearId &&
      placement.academic.classroomId &&
      validDate(placement.enrollmentDate),
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">{text.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{text.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={text.academicYear}
          required
          value={placement.academicYearId}
          placeholder={text.selectYear}
          options={academicYears.map((year) => ({
            value: year.id,
            label: localizedName(year, locale),
          }))}
          onChange={(academicYearId) =>
            onChange({
              academicYearId,
              termId: "",
              academic: {},
              enrollmentDate: placement.enrollmentDate,
            })
          }
        />
        <Select
          label={text.term}
          value={placement.termId}
          disabled={!placement.academicYearId}
          placeholder={text.selectTerm}
          options={terms.map((term) => ({
            value: term.id,
            label: localizedName(term, locale),
          }))}
          onChange={(termId) =>
            onChange({ ...placement, termId, academic: {} })
          }
        />
      </div>

      <AcademicStudentCascade
        className="mt-4 xl:grid-cols-4"
        value={placement.academic}
        options={academicOptions}
        loading={loadingOptions}
        showStudent={false}
        onChange={(academic) => onChange({ ...placement, academic })}
      />

      <div className="mt-4 max-w-md">
        <DatePicker
          label={text.enrollmentDate}
          required
          value={placement.enrollmentDate}
          onChange={(enrollmentDate) =>
            onChange({ ...placement, enrollmentDate })
          }
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          loading={checkingPlacement}
          disabled={!canCheck}
          onClick={onCheckPlacement}
        >
          {text.check}
        </Button>
      </div>
    </section>
  );
}
