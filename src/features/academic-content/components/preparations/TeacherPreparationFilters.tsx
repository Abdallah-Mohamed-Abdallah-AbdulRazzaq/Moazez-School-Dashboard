"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { TeacherPreparationFilters as PreparationFilters } from "../../model/teacherPreparations";
import type { TeacherPreparationFilterUpdate } from "../../model/teacherPreparations";
import {
  GRADE_FILTER_RESET,
  SECTION_FILTER_RESET,
  STAGE_FILTER_RESET,
} from "../../model/academicContentListFilters";
import { ACADEMIC_CONTENT_STATUSES } from "../../types/contracts";
import TagFilterInput from "../filters/TagFilterInput";

interface TeacherPreparationFiltersProps {
  filters: PreparationFilters;
  search: string;
  resultCount: number;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: TeacherPreparationFilterUpdate) => void;
  onClear: () => void;
}

interface FilterSelectConfig {
  label: string;
  value: string;
  options: SelectOption[];
  field: keyof TeacherPreparationFilterUpdate;
  resets?: TeacherPreparationFilterUpdate;
  disabled?: boolean;
}

const withAll = (options: SelectOption[], label: string) => [
  { value: "", label },
  ...options,
];

export default function TeacherPreparationFilters({
  filters,
  search,
  resultCount,
  browseOptions,
  onSearchChange,
  onFiltersChange,
  onClear,
}: TeacherPreparationFiltersProps) {
  const [showFilters, setShowFilters] = useState(true);
  const locale = useLocale();
  const t = useAcademicContentTranslations("teacher_preparations");
  const statusLabel = useAcademicContentTranslations("statuses");
  const { targetOptions, teachers } = browseOptions;
  const structure = targetOptions?.structure;
  const options = useMemo(() => {
    const name = (entity: { name: string; nameAr?: string; nameEn?: string }) =>
      (locale === "ar" ? entity.nameAr : entity.nameEn) ?? entity.name;
    const grades = (structure?.grades ?? []).filter(
      (grade) => !filters.stageId || grade.stageId === filters.stageId,
    );
    const gradeIds = new Set(
      filters.gradeId ? [filters.gradeId] : grades.map((grade) => grade.id),
    );
    const sections = (structure?.sections ?? []).filter((section) =>
      gradeIds.has(section.gradeId),
    );
    const sectionIds = new Set(
      filters.sectionId
        ? [filters.sectionId]
        : sections.map((section) => section.id),
    );
    const entityOptions = (
      entities: Array<{
        id: string;
        name: string;
        nameAr?: string;
        nameEn?: string;
      }>,
    ) => entities.map((entity) => ({ value: entity.id, label: name(entity) }));
    return {
      teachers: teachers.map((teacher) => ({
        value: teacher.userId,
        label: teacher.displayName.fullName,
      })),
      stages: entityOptions(structure?.stages ?? []),
      grades: entityOptions(grades),
      sections: entityOptions(sections),
      classrooms: entityOptions(
        (structure?.classrooms ?? []).filter((classroom) =>
          sectionIds.has(classroom.sectionId),
        ),
      ),
      subjects: entityOptions(targetOptions?.subjects ?? []),
      statuses: ACADEMIC_CONTENT_STATUSES.map((status) => ({
        value: status,
        label:
          status === "SUBMITTED" ? t("pending_approval") : statusLabel(status),
      })),
    };
  }, [
    filters.gradeId,
    filters.sectionId,
    filters.stageId,
    locale,
    statusLabel,
    structure,
    t,
    targetOptions?.subjects,
    teachers,
  ]);
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(
      filters.status ||
      filters.teacherUserId ||
      filters.stageId ||
      filters.gradeId ||
      filters.sectionId ||
      filters.classroomId ||
      filters.subjectId ||
      filters.tag,
    );
  const chips = [
    filters.status && {
      key: "status",
      label: options.statuses.find((option) => option.value === filters.status)
        ?.label,
      update: { status: "" },
    },
    filters.teacherUserId && {
      key: "teacher",
      label: options.teachers.find(
        (option) => option.value === filters.teacherUserId,
      )?.label,
      update: { teacherUserId: "" },
    },
    filters.stageId && {
      key: "stage",
      label: options.stages.find((option) => option.value === filters.stageId)
        ?.label,
      update: { stageId: "", ...STAGE_FILTER_RESET },
    },
    filters.gradeId && {
      key: "grade",
      label: options.grades.find((option) => option.value === filters.gradeId)
        ?.label,
      update: { gradeId: "", ...GRADE_FILTER_RESET },
    },
    filters.sectionId && {
      key: "section",
      label: options.sections.find(
        (option) => option.value === filters.sectionId,
      )?.label,
      update: { sectionId: "", ...SECTION_FILTER_RESET },
    },
    filters.classroomId && {
      key: "classroom",
      label: options.classrooms.find(
        (option) => option.value === filters.classroomId,
      )?.label,
      update: { classroomId: "" },
    },
    filters.subjectId && {
      key: "subject",
      label: options.subjects.find(
        (option) => option.value === filters.subjectId,
      )?.label,
      update: { subjectId: "" },
    },
    filters.tag && {
      key: "tag",
      label: `${t("filters.tag")}: ${filters.tag}`,
      update: { tag: "" },
    },
  ].filter(Boolean) as Array<{
    key: string;
    label?: string;
    update: TeacherPreparationFilterUpdate;
  }>;

  const renderSelect = ({
    label,
    value,
    options: selectOptions,
    field,
    resets = {},
    disabled = false,
  }: FilterSelectConfig) => (
    <Select
      label={label}
      triggerAriaLabel={label}
      value={value}
      options={selectOptions}
      disabled={disabled}
      onChange={(nextValue) =>
        onFiltersChange({ ...resets, [field]: nextValue })
      }
    />
  );

  return (
    <FilterPanel
      title={t("results", { count: resultCount })}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((current) => !current)}
      toggleTitle={t(showFilters ? "hide_filters" : "show_filters")}
      hasActiveFilters={hasActiveFilters}
      clearAction={
        <Button type="button" variant="ghost" onClick={onClear}>
          {t("clear_filters")}
        </Button>
      }
      searchSlot={
        <Input
          aria-label={t("search")}
          placeholder={t("search")}
          value={search}
          maxLength={120}
          leftIcon={<Search aria-hidden="true" className="size-4" />}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      }
      filtersSlot={
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {renderSelect({
              label: t("filters.teacher"),
              value: filters.teacherUserId,
              options: withAll(options.teachers, t("all_teachers")),
              field: "teacherUserId",
              disabled: browseOptions.isLoadingTeachers,
            })}
            {renderSelect({
              label: t("filters.stage"),
              value: filters.stageId,
              options: withAll(options.stages, t("all_stages")),
              field: "stageId",
              resets: STAGE_FILTER_RESET,
              disabled: browseOptions.isLoadingTargets,
            })}
            {renderSelect({
              label: t("filters.grade"),
              value: filters.gradeId,
              options: withAll(options.grades, t("all_grades")),
              field: "gradeId",
              resets: GRADE_FILTER_RESET,
              disabled: browseOptions.isLoadingTargets,
            })}
            {renderSelect({
              label: t("filters.section"),
              value: filters.sectionId,
              options: withAll(options.sections, t("all_sections")),
              field: "sectionId",
              resets: SECTION_FILTER_RESET,
              disabled: browseOptions.isLoadingTargets,
            })}
            {renderSelect({
              label: t("filters.classroom"),
              value: filters.classroomId,
              options: withAll(options.classrooms, t("all_classrooms")),
              field: "classroomId",
              disabled: browseOptions.isLoadingTargets,
            })}
            {renderSelect({
              label: t("filters.subject"),
              value: filters.subjectId,
              options: withAll(options.subjects, t("all_subjects")),
              field: "subjectId",
              disabled: browseOptions.isLoadingTargets,
            })}
            {renderSelect({
              label: t("filters.status"),
              value: filters.status,
              options: withAll(options.statuses, t("all_statuses")),
              field: "status",
            })}
            <TagFilterInput
              label={t("filters.tag")}
              value={filters.tag}
              onChange={(tag) => onFiltersChange({ tag })}
            />
          </div>
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Button
                  key={chip.key}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-full border-indigo-100 bg-indigo-50 text-indigo-800"
                  rightIcon={<X aria-hidden="true" className="size-3.5" />}
                  aria-label={t("remove_filter", {
                    label: chip.label ?? t("unavailable_name"),
                  })}
                  onClick={() => onFiltersChange(chip.update)}
                >
                  {chip.label ?? t("unavailable_name")}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      }
    />
  );
}
