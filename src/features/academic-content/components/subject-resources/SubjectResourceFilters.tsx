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
  SubjectResourceFilters as Filters,
  SubjectResourceFilterUpdate,
} from "../../model/subjectResources";
import { allowedAudiences } from "../../model/academicContentPolicy";
import {
  GRADE_FILTER_RESET,
  SECTION_FILTER_RESET,
  STAGE_FILTER_RESET,
} from "../../model/academicContentListFilters";
import {
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
} from "../../types/contracts";
import AcademicContentAppliedFilters from "../filters/AcademicContentAppliedFilters";
import TagFilterInput from "../filters/TagFilterInput";

interface Props {
  filters: Filters;
  search: string;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: SubjectResourceFilterUpdate) => void;
  onClear: () => void;
}

const withAll = (options: SelectOption[], label: string) => [
  { value: "", label },
  ...options,
];

export default function SubjectResourceFilters(props: Props) {
  const [showFilters, setShowFilters] = useState(true);
  const locale = useLocale();
  const t = useAcademicContentTranslations("subject_resources");
  const statusT = useAcademicContentTranslations("statuses");
  const audienceT = useAcademicContentTranslations("audiences");
  const categoryT = useAcademicContentTranslations("resource_categories");
  const structure = props.browseOptions.targetOptions?.structure;
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
      values.map((entity) => ({
        value: entity.id,
        label: localizedName(entity),
      }));
    const grades = (structure?.grades ?? []).filter(
      (grade) =>
        !props.filters.stageId || grade.stageId === props.filters.stageId,
    );
    const gradeIds = new Set(
      props.filters.gradeId
        ? [props.filters.gradeId]
        : grades.map((grade) => grade.id),
    );
    const sections = (structure?.sections ?? []).filter((section) =>
      gradeIds.has(section.gradeId),
    );
    const sectionIds = new Set(
      props.filters.sectionId
        ? [props.filters.sectionId]
        : sections.map((section) => section.id),
    );
    return {
      stages: entities(structure?.stages ?? []),
      grades: entities(grades),
      sections: entities(sections),
      classrooms: entities(
        (structure?.classrooms ?? []).filter((room) =>
          sectionIds.has(room.sectionId),
        ),
      ),
      subjects: entities(props.browseOptions.targetOptions?.subjects ?? []),
      teachers: props.browseOptions.teachers.map((teacher) => ({
        value: teacher.userId,
        label: teacher.displayName.fullName,
      })),
      categories: ACADEMIC_SUBJECT_RESOURCE_CATEGORIES.map((category) => ({
        value: category,
        label: categoryT(category),
      })),
      audiences: allowedAudiences("SUBJECT_RESOURCE").map((audience) => ({
        value: audience,
        label: audienceT(audience),
      })),
      statuses: ACADEMIC_CONTENT_STATUSES.map((status) => ({
        value: status,
        label: statusT(status),
      })),
    };
  }, [
    audienceT,
    categoryT,
    locale,
    props.browseOptions.targetOptions?.subjects,
    props.browseOptions.teachers,
    props.filters.gradeId,
    props.filters.sectionId,
    props.filters.stageId,
    statusT,
    structure,
  ]);

  const definitions: Array<{
    field: keyof SubjectResourceFilterUpdate;
    label: string;
    all: string;
    value: string;
    options: SelectOption[];
    resets?: SubjectResourceFilterUpdate;
  }> = [
    {
      field: "stageId",
      label: t("filters.stage"),
      all: t("all_stages"),
      value: props.filters.stageId,
      options: options.stages,
      resets: STAGE_FILTER_RESET,
    },
    {
      field: "gradeId",
      label: t("filters.grade"),
      all: t("all_grades"),
      value: props.filters.gradeId,
      options: options.grades,
      resets: GRADE_FILTER_RESET,
    },
    {
      field: "sectionId",
      label: t("filters.section"),
      all: t("all_sections"),
      value: props.filters.sectionId,
      options: options.sections,
      resets: SECTION_FILTER_RESET,
    },
    {
      field: "classroomId",
      label: t("filters.classroom"),
      all: t("all_classrooms"),
      value: props.filters.classroomId,
      options: options.classrooms,
    },
    {
      field: "subjectId",
      label: t("filters.subject"),
      all: t("all_subjects"),
      value: props.filters.subjectId,
      options: options.subjects,
    },
    {
      field: "resourceCategory",
      label: t("filters.category"),
      all: t("all_categories"),
      value: props.filters.resourceCategory,
      options: options.categories,
    },
    {
      field: "teacherUserId",
      label: t("filters.teacher"),
      all: t("all_teachers"),
      value: props.filters.teacherUserId,
      options: options.teachers,
    },
    {
      field: "audience",
      label: t("filters.audience"),
      all: t("all_audiences"),
      value: props.filters.audience,
      options: options.audiences,
    },
    {
      field: "status",
      label: t("filters.status"),
      all: t("all_statuses"),
      value: props.filters.status,
      options: options.statuses,
    },
  ];
  const appliedFilters = definitions
    .filter(({ value }) => value)
    .map(({ field, label, value, options, resets }) => ({
      key: field,
      label: `${label}: ${options.find((option) => option.value === value)?.label ?? t("unavailable_name")}`,
      onRemove: () => props.onFiltersChange({ ...(resets ?? {}), [field]: "" }),
    }));
  if (props.filters.tag) {
    appliedFilters.push({
      key: "tag",
      label: `${t("filters.tag")}: ${props.filters.tag}`,
      onRemove: () => props.onFiltersChange({ tag: "" }),
    });
  }

  return (
    <FilterPanel
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((current) => !current)}
      toggleTitle={t(showFilters ? "hide_filters" : "show_filters")}
      hasActiveFilters={Boolean(props.search || appliedFilters.length)}
      clearAction={
        <Button type="button" variant="ghost" onClick={props.onClear}>
          {t("clear_filters")}
        </Button>
      }
      searchSlot={
        <Input
          aria-label={t("search")}
          placeholder={t("search")}
          value={props.search}
          maxLength={120}
          leftIcon={<Search aria-hidden="true" className="size-4" />}
          onChange={(event) => props.onSearchChange(event.target.value)}
        />
      }
      filtersSlot={
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {definitions.map(
              ({ field, label, all, value, options: fieldOptions, resets }) => (
                <Select
                  key={field}
                  label={label}
                  triggerAriaLabel={label}
                  value={value}
                  options={withAll(fieldOptions, all)}
                  disabled={
                    (props.browseOptions.isLoadingTargets &&
                      ![
                        "resourceCategory",
                        "audience",
                        "status",
                        "teacherUserId",
                      ].includes(field)) ||
                    (field === "teacherUserId" &&
                      props.browseOptions.isLoadingTeachers)
                  }
                  onChange={(nextValue) =>
                    props.onFiltersChange({
                      ...(resets ?? {}),
                      [field]: nextValue,
                    })
                  }
                />
              ),
            )}
            <TagFilterInput
              label={t("filters.tag")}
              value={props.filters.tag}
              onChange={(tag) => props.onFiltersChange({ tag })}
            />
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
