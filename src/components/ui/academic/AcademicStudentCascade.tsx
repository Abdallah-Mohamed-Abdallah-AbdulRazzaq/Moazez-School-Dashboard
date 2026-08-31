"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";

export interface AcademicCascadeRecord {
  id?: string;
  value?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  full_name_ar?: string;
  full_name_en?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
  student_id?: string;
  enrollmentId?: string;
  enrollment_id?: string;
  code?: string;
  admissionNo?: string;
  admission_no?: string;
  searchText?: string;
  [key: string]: unknown;
}

export interface AcademicStudentCascadeValue {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
}

export interface AcademicStudentCascadeOptions {
  stages?: AcademicCascadeRecord[];
  grades?: AcademicCascadeRecord[];
  sections?: AcademicCascadeRecord[];
  classrooms?: AcademicCascadeRecord[];
  students?: AcademicCascadeRecord[];
}

export interface AcademicStudentCascadeLabels {
  stage?: string;
  grade?: string;
  section?: string;
  classroom?: string;
  student?: string;
  select?: string;
  search?: string;
  noOptions?: string;
}

interface FilteredAcademicStudentCascadeOptions
  extends AcademicStudentCascadeOptions {
  stages: AcademicCascadeRecord[];
  grades: AcademicCascadeRecord[];
  sections: AcademicCascadeRecord[];
  classrooms: AcademicCascadeRecord[];
  students: AcademicCascadeRecord[];
}

const defaultLabels: Record<"ar" | "en", Required<AcademicStudentCascadeLabels>> = {
  en: {
    stage: "Stage",
    grade: "Grade",
    section: "Section",
    classroom: "Classroom",
    student: "Student",
    select: "Select",
    search: "Search...",
    noOptions: "No options available",
  },
  ar: {
    stage: "المرحلة",
    grade: "الصف",
    section: "الشعبة",
    classroom: "الفصل",
    student: "الطالب",
    select: "اختر",
    search: "بحث...",
    noOptions: "لا توجد خيارات متاحة",
  },
};

const recordId = (record: AcademicCascadeRecord): string =>
  String(record.id || record.value || record.studentId || record.student_id || "");

const recordLabel = (
  record: AcademicCascadeRecord,
  locale: "ar" | "en",
): string => {
  const label =
    locale === "ar"
      ? record.nameAr || record.full_name_ar || record.name || record.nameEn
      : record.nameEn || record.full_name_en || record.name || record.nameAr;
  return label || recordId(record);
};

const toSelectOption = (
  record: AcademicCascadeRecord,
  locale: "ar" | "en",
): SelectOption | null => {
  const value = recordId(record);
  if (!value) return null;
  const searchableIdentifiers = [
    record.searchText,
    record.student_id,
    record.studentId,
    record.enrollmentId,
    record.enrollment_id,
    record.code,
    record.admissionNo,
    record.admission_no,
  ]
    .filter((item) => typeof item === "string" && item.trim())
    .join(" ");
  return {
    value,
    label: recordLabel(record, locale),
    searchText: `${recordLabel(record, "ar")} ${recordLabel(record, "en")} ${searchableIdentifiers}`,
  };
};

const compactOptions = (
  options: Array<SelectOption | null>,
): SelectOption[] => options.filter((option): option is SelectOption => Boolean(option));

export const filterAcademicStudentCascadeOptions = (
  value: AcademicStudentCascadeValue,
  options: AcademicStudentCascadeOptions,
): FilteredAcademicStudentCascadeOptions => ({
  stages: options.stages || [],
  grades: (options.grades || []).filter(
    (item) => !value.stageId || item.stageId === value.stageId,
  ),
  sections: (options.sections || []).filter(
    (item) => !value.gradeId || item.gradeId === value.gradeId,
  ),
  classrooms: (options.classrooms || []).filter(
    (item) => !value.sectionId || item.sectionId === value.sectionId,
  ),
  students: (options.students || []).filter(
    (item) =>
      (!value.stageId || item.stageId === value.stageId) &&
      (!value.gradeId || item.gradeId === value.gradeId) &&
      (!value.sectionId || item.sectionId === value.sectionId) &&
      (!value.classroomId || item.classroomId === value.classroomId),
  ),
});

export interface AcademicStudentCascadeProps {
  value?: AcademicStudentCascadeValue;
  onChange: (value: AcademicStudentCascadeValue) => void;
  options: AcademicStudentCascadeOptions;
  labels?: AcademicStudentCascadeLabels;
  locale?: "ar" | "en";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showStudent?: boolean;
}

export default function AcademicStudentCascade({
  value = {},
  onChange,
  options,
  labels,
  locale: localeProp,
  loading = false,
  disabled = false,
  className = "",
  showStudent = true,
}: AcademicStudentCascadeProps) {
  const contextLocale = useLocale();
  const locale = localeProp || (contextLocale === "ar" ? "ar" : "en");
  const copy = { ...defaultLabels[locale], ...labels };
  const filtered = useMemo(
    () => filterAcademicStudentCascadeOptions(value, options),
    [options, value],
  );

  const selectProps = {
    searchable: true,
    searchPlaceholder: copy.search,
    noOptionsText: copy.noOptions,
    disabled: disabled || loading,
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-5 ${className}`} dir={locale === "ar" ? "rtl" : "ltr"}>
      <Select
        {...selectProps}
        label={copy.stage}
        value={value.stageId || ""}
        options={compactOptions((options.stages || []).map((item) => toSelectOption(item, locale)))}
        disabled={selectProps.disabled}
        placeholder={`${copy.select} ${copy.stage}`}
        onChange={(stageId) =>
          onChange({ stageId, gradeId: undefined, sectionId: undefined, classroomId: undefined, studentId: undefined })
        }
      />
      <Select
        {...selectProps}
        label={copy.grade}
        value={value.gradeId || ""}
        disabled={selectProps.disabled || !value.stageId}
        options={compactOptions(filtered.grades.map((item) => toSelectOption(item, locale)))}
        placeholder={`${copy.select} ${copy.grade}`}
        onChange={(gradeId) =>
          onChange({ ...value, gradeId, sectionId: undefined, classroomId: undefined, studentId: undefined })
        }
      />
      <Select
        {...selectProps}
        label={copy.section}
        value={value.sectionId || ""}
        disabled={selectProps.disabled || !value.gradeId}
        options={compactOptions(filtered.sections.map((item) => toSelectOption(item, locale)))}
        placeholder={`${copy.select} ${copy.section}`}
        onChange={(sectionId) =>
          onChange({ ...value, sectionId, classroomId: undefined, studentId: undefined })
        }
      />
      <Select
        {...selectProps}
        label={copy.classroom}
        value={value.classroomId || ""}
        disabled={selectProps.disabled || !value.sectionId}
        options={compactOptions(filtered.classrooms.map((item) => toSelectOption(item, locale)))}
        placeholder={`${copy.select} ${copy.classroom}`}
        onChange={(classroomId) => onChange({ ...value, classroomId, studentId: undefined })}
      />
      {showStudent && (
        <Select
          {...selectProps}
          label={copy.student}
          value={value.studentId || ""}
          disabled={selectProps.disabled || !value.classroomId}
          options={compactOptions(filtered.students.map((item) => toSelectOption(item, locale)))}
          placeholder={`${copy.select} ${copy.student}`}
          onChange={(studentId) => onChange({ ...value, studentId })}
        />
      )}
    </div>
  );
}
