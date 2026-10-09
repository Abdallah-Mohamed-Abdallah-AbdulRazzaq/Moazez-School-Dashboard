"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type {
  GuardianNoteFilters as Filters,
  GuardianNoteFilterUpdate,
} from "../../model/guardianNotes";
import {
  GRADE_FILTER_RESET,
  SECTION_FILTER_RESET,
  STAGE_FILTER_RESET,
} from "../../model/academicContentListFilters";
import {
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
} from "../../types/contracts";
import AcademicContentAppliedFilters from "../filters/AcademicContentAppliedFilters";
import TagFilterInput from "../filters/TagFilterInput";

interface GuardianNoteFiltersProps {
  filters: Filters;
  search: string;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: GuardianNoteFilterUpdate) => void;
  onClear: () => void;
}

const withAll = (options: SelectOption[], label: string): SelectOption[] => [
  { value: "", label },
  ...options,
];

export default function GuardianNoteFilters({
  filters,
  search,
  browseOptions,
  onSearchChange,
  onFiltersChange,
  onClear,
}: GuardianNoteFiltersProps) {
  const [showFilters, setShowFilters] = useState(true);
  const locale = useLocale();
  const t = useAcademicContentTranslations("guardian_notes");
  const statusT = useAcademicContentTranslations("statuses");
  const structure = browseOptions.targetOptions?.structure;
  const options = useMemo(() => {
    const localizedName = (entity: {
      name: string;
      nameAr?: string;
      nameEn?: string;
    }) => (locale === "ar" ? entity.nameAr : entity.nameEn) ?? entity.name;
    const entities = (
      values: Array<{
        id: string;
        name: string;
        nameAr?: string;
        nameEn?: string;
      }>,
    ) =>
      values.map((value) => ({ value: value.id, label: localizedName(value) }));
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
    return {
      stages: entities(structure?.stages ?? []),
      grades: entities(grades),
      sections: entities(sections),
      classrooms: entities(
        (structure?.classrooms ?? []).filter((classroom) =>
          sectionIds.has(classroom.sectionId),
        ),
      ),
      subjects: entities(browseOptions.targetOptions?.subjects ?? []),
      teachers: browseOptions.teachers.map((teacher) => ({
        value: teacher.userId,
        label: teacher.displayName.fullName,
      })),
      priorities: ACADEMIC_GUARDIAN_NOTE_PRIORITIES.map((priority) => ({
        value: priority,
        label: t(`priorities.${priority}`),
      })),
      statuses: ACADEMIC_CONTENT_STATUSES.map((status) => ({
        value: status,
        label: statusT(status),
      })),
    };
  }, [
    browseOptions.targetOptions?.subjects,
    browseOptions.teachers,
    filters.gradeId,
    filters.sectionId,
    filters.stageId,
    locale,
    statusT,
    structure,
    t,
  ]);
  const optionLabel = (values: SelectOption[], value: string) =>
    values.find((option) => option.value === value)?.label ??
    t("unavailable_name");
  const appliedFilters = [
    filters.stageId && {
      key: "stage",
      label: optionLabel(options.stages, filters.stageId),
      onRemove: () => onFiltersChange({ stageId: "", ...STAGE_FILTER_RESET }),
    },
    filters.gradeId && {
      key: "grade",
      label: optionLabel(options.grades, filters.gradeId),
      onRemove: () => onFiltersChange({ gradeId: "", ...GRADE_FILTER_RESET }),
    },
    filters.sectionId && {
      key: "section",
      label: optionLabel(options.sections, filters.sectionId),
      onRemove: () =>
        onFiltersChange({ sectionId: "", ...SECTION_FILTER_RESET }),
    },
    filters.classroomId && {
      key: "classroom",
      label: optionLabel(options.classrooms, filters.classroomId),
      onRemove: () => onFiltersChange({ classroomId: "" }),
    },
    filters.subjectId && {
      key: "subject",
      label: optionLabel(options.subjects, filters.subjectId),
      onRemove: () => onFiltersChange({ subjectId: "" }),
    },
    filters.teacherUserId && {
      key: "teacher",
      label: optionLabel(options.teachers, filters.teacherUserId),
      onRemove: () => onFiltersChange({ teacherUserId: "" }),
    },
    filters.priority && {
      key: "priority",
      label: optionLabel(options.priorities, filters.priority),
      onRemove: () => onFiltersChange({ priority: "" }),
    },
    filters.status && {
      key: "status",
      label: optionLabel(options.statuses, filters.status),
      onRemove: () => onFiltersChange({ status: "" }),
    },
    filters.tag && {
      key: "tag",
      label: `${t("filters.tag")}: ${filters.tag}`,
      onRemove: () => onFiltersChange({ tag: "" }),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }>;
  const hasActiveFilters = Boolean(search || appliedFilters.length);
  const select = (
    label: string,
    value: string,
    selectOptions: SelectOption[],
    field: keyof GuardianNoteFilterUpdate,
    resets: GuardianNoteFilterUpdate = {},
  ) => (
    <Select
      label={label}
      triggerAriaLabel={label}
      value={value}
      options={selectOptions}
      disabled={
        (browseOptions.isLoadingTargets &&
          field !== "priority" &&
          field !== "status" &&
          field !== "teacherUserId") ||
        (field === "teacherUserId" && browseOptions.isLoadingTeachers)
      }
      onChange={(nextValue) =>
        onFiltersChange({ ...resets, [field]: nextValue })
      }
    />
  );

  return (
    <FilterPanel
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
            {select(
              t("filters.stage"),
              filters.stageId,
              withAll(options.stages, t("all_stages")),
              "stageId",
              STAGE_FILTER_RESET,
            )}
            {select(
              t("filters.grade"),
              filters.gradeId,
              withAll(options.grades, t("all_grades")),
              "gradeId",
              GRADE_FILTER_RESET,
            )}
            {select(
              t("filters.section"),
              filters.sectionId,
              withAll(options.sections, t("all_sections")),
              "sectionId",
              SECTION_FILTER_RESET,
            )}
            {select(
              t("filters.classroom"),
              filters.classroomId,
              withAll(options.classrooms, t("all_classrooms")),
              "classroomId",
            )}
            {select(
              t("filters.subject"),
              filters.subjectId,
              withAll(options.subjects, t("all_subjects")),
              "subjectId",
            )}
            {select(
              t("filters.teacher"),
              filters.teacherUserId,
              withAll(options.teachers, t("all_teachers")),
              "teacherUserId",
            )}
            {select(
              t("filters.priority"),
              filters.priority,
              withAll(options.priorities, t("all_priorities")),
              "priority",
            )}
            <TagFilterInput
              label={t("filters.tag")}
              value={filters.tag}
              onChange={(tag) => onFiltersChange({ tag })}
            />
            {select(
              t("filters.status"),
              filters.status,
              withAll(options.statuses, t("all_statuses")),
              "status",
            )}
          </div>
          <AcademicContentAppliedFilters
            filters={appliedFilters}
            removeLabel={(label) => t("remove_filter", { label })}
          />
        </div>
      }
    />
  );
}
