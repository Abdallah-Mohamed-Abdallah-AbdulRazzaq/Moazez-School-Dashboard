"use client";

import { useLocale } from "next-intl";
import AcademicStudentCascade, {
  type AcademicStudentCascadeOptions,
  type AcademicStudentCascadeValue,
} from "@/components/ui/academic/AcademicStudentCascade";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type { CredentialAudienceMode } from "../api/credentialBatchDtos";
import type { CredentialAudienceDraft } from "../model/credentialAudience";
import SelectedStudentsPicker, {
  type SelectedCredentialStudent,
} from "./SelectedStudentsPicker";

interface AcademicYearOption {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
}

interface CredentialAudienceFormProps {
  draft: CredentialAudienceDraft;
  selectedStudents: SelectedCredentialStudent[];
  academicYears: AcademicYearOption[];
  academicOptions: AcademicStudentCascadeOptions;
  onChange: (draft: CredentialAudienceDraft) => void;
  onSelectedStudentsChange: (students: SelectedCredentialStudent[]) => void;
  loadingAcademicYears?: boolean;
  loadingOptions?: boolean;
  disabled?: boolean;
}

const copy = {
  en: {
    audience: "Audience",
    registrationBatch: "Registration batch",
    selectedStudents: "Selected students",
    academicYearMode: "Academic year",
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    missingPassword: "Students missing passwords",
    registrationBatchId: "Registration batch ID",
    registrationBatchHint: "Paste the UUID from a completed bulk registration.",
    academicYear: "Academic year",
    selectYear: "Select academic year",
  },
  ar: {
    audience: "النطاق",
    registrationBatch: "دفعة تسجيل",
    selectedStudents: "طلاب محددون",
    academicYearMode: "العام الدراسي",
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    missingPassword: "طلاب بدون كلمات مرور",
    registrationBatchId: "معرف دفعة التسجيل",
    registrationBatchHint: "الصق UUID من دفعة تسجيل جماعي مكتملة.",
    academicYear: "العام الدراسي",
    selectYear: "اختر العام الدراسي",
  },
} as const;

type AcademicAudienceMode =
  | "academic_year"
  | "stage"
  | "grade"
  | "section"
  | "classroom";
type CascadeAudienceMode = Exclude<AcademicAudienceMode, "academic_year">;

function isAcademicAudienceMode(
  mode: CredentialAudienceMode,
): mode is AcademicAudienceMode {
  return ["academic_year", "stage", "grade", "section", "classroom"].includes(
    mode,
  );
}

function isCascadeAudienceMode(
  mode: CredentialAudienceMode,
): mode is CascadeAudienceMode {
  return ["stage", "grade", "section", "classroom"].includes(mode);
}

function localizedYearName(
  year: AcademicYearOption,
  locale: "ar" | "en",
): string {
  return locale === "ar"
    ? year.nameAr || year.name || year.nameEn || year.id
    : year.nameEn || year.name || year.nameAr || year.id;
}

export default function CredentialAudienceForm({
  draft,
  selectedStudents,
  academicYears,
  academicOptions,
  onChange,
  onSelectedStudentsChange,
  loadingAcademicYears = false,
  loadingOptions = false,
  disabled = false,
}: CredentialAudienceFormProps) {
  const locale = useLocale() === "ar" ? "ar" : "en";
  const text = copy[locale];
  const audienceOptions = [
    { value: "import_batch", label: text.registrationBatch },
    { value: "selected_students", label: text.selectedStudents },
    { value: "academic_year", label: text.academicYearMode },
    { value: "stage", label: text.stage },
    { value: "grade", label: text.grade },
    { value: "section", label: text.section },
    { value: "classroom", label: text.classroom },
    { value: "missing_password", label: text.missingPassword },
  ];

  const changeMode = (audienceMode: string) => {
    onSelectedStudentsChange([]);
    onChange({ audienceMode: audienceMode as CredentialAudienceMode });
  };

  const updateAcademicSelection = (academic: AcademicStudentCascadeValue) => {
    onChange({
      audienceMode: draft.audienceMode,
      academicYearId: draft.academicYearId,
      ...academic,
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <Select
        label={text.audience}
        required
        value={draft.audienceMode}
        options={audienceOptions}
        disabled={disabled}
        onChange={changeMode}
      />

      {draft.audienceMode === "import_batch" && (
        <Input
          label={text.registrationBatchId}
          required
          value={draft.sourceRegistrationBatchId ?? ""}
          helperText={text.registrationBatchHint}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              audienceMode: "import_batch",
              sourceRegistrationBatchId: event.target.value,
            })
          }
        />
      )}

      {draft.audienceMode === "selected_students" && (
        <SelectedStudentsPicker
          selected={selectedStudents}
          disabled={disabled}
          onChange={(students) => {
            onSelectedStudentsChange(students);
            onChange({
              audienceMode: "selected_students",
              studentIds: students.map((student) => student.id),
            });
          }}
        />
      )}

      {isAcademicAudienceMode(draft.audienceMode) && (
        <>
          <Select
            label={text.academicYear}
            required
            value={draft.academicYearId ?? ""}
            options={academicYears.map((year) => ({
              value: year.id,
              label: localizedYearName(year, locale),
            }))}
            placeholder={text.selectYear}
            disabled={disabled || loadingAcademicYears}
            onChange={(academicYearId) =>
              onChange({ audienceMode: draft.audienceMode, academicYearId })
            }
          />

          {isCascadeAudienceMode(draft.audienceMode) && (
            <AcademicStudentCascade
              value={draft}
              options={academicOptions}
              loading={loadingOptions}
              disabled={disabled || !draft.academicYearId}
              showStudent={false}
              lastVisibleLevel={draft.audienceMode}
              onChange={updateAcademicSelection}
            />
          )}
        </>
      )}
    </section>
  );
}
