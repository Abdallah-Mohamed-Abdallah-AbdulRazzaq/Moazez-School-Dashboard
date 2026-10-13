"use client";

import { useLocale, useTranslations } from "next-intl";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { Teacher } from "../services/teacherAllocationService";

interface TeacherSelectProps {
  teachers: Teacher[];
  value: string | null;
  selectedTeacherName?: string;
  onChange: (teacherId: string | null) => void;
  disabled?: boolean;
  teacherLoads?: Map<string, number>;
  placeholder?: string;
  size?: "small" | "medium";
}

export default function TeacherSelect({
  teachers,
  value,
  selectedTeacherName,
  onChange,
  disabled = false,
  teacherLoads,
  placeholder,
  size = "small",
}: TeacherSelectProps) {
  const t = useTranslations("academics.teacherAllocation.matrix");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const options: SelectOption[] = teachers
    .filter((teacher) => teacher.isActive || teacher.id === value)
    .map((teacher) => ({
      value: teacher.id,
      label:
        locale === "ar"
          ? teacher.nameAr || teacher.nameEn
          : teacher.nameEn || teacher.nameAr,
      searchText: [teacher.nameAr, teacher.nameEn, teacher.email].join(" "),
      disabled: !teacher.isActive,
      trailingContent: teacherLoads ? (
        <span
          className={
            teacher.maxWeeklyLoad &&
            (teacherLoads.get(teacher.id) ?? 0) > teacher.maxWeeklyLoad
              ? "text-amber-700"
              : "text-gray-500"
          }
        >
          {t("currentLoad", { periods: teacherLoads.get(teacher.id) ?? 0 })}
          {teacher.maxWeeklyLoad ? " / " + teacher.maxWeeklyLoad : ""}
        </span>
      ) : undefined,
    }));
  if (value && !options.some((option) => option.value === value)) {
    options.unshift({
      value,
      label: selectedTeacherName || t("assignedTeacherUnavailable"),
      disabled: true,
    });
  }
  return (
    <Select
      value={value ?? ""}
      onChange={(teacherId) => onChange(teacherId || null)}
      disabled={disabled}
      selectSize={size === "small" ? "sm" : "md"}
      variant="outlined"
      className="min-w-[200px]"
      placeholder={placeholder || t("selectTeacher")}
      triggerAriaLabel={placeholder || t("selectTeacher")}
      searchable
      searchPlaceholder={t("searchTeacher")}
      noResultsText={tCommon("noResults")}
      options={[
        {
          value: "",
          label: t("noTeacher"),
          triggerLabel: placeholder || t("selectTeacher"),
        },
        ...options,
      ]}
    />
  );
}
