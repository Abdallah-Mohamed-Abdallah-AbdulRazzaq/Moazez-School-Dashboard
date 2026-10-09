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
import {
  onlineSessionPresetRange,
  type OnlineSessionFilters as Filters,
  type OnlineSessionFilterUpdate,
  type OnlineSessionDatePreset,
} from "../../model/onlineSessions";
import { allowedAudiences } from "../../model/academicContentPolicy";
import {
  GRADE_FILTER_RESET,
  SECTION_FILTER_RESET,
  STAGE_FILTER_RESET,
} from "../../model/academicContentListFilters";
import {
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
} from "../../types/contracts";
import AcademicContentAppliedFilters from "../filters/AcademicContentAppliedFilters";
import TagFilterInput from "../filters/TagFilterInput";

interface Props {
  filters: Filters;
  search: string;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: OnlineSessionFilterUpdate) => void;
  onClear: () => void;
}

const withAll = (options: SelectOption[], label: string) => [
  { value: "", label },
  ...options,
];

export default function OnlineSessionFilters(props: Props) {
  const [showFilters, setShowFilters] = useState(true);
  const locale = useLocale();
  const t = useAcademicContentTranslations("online_sessions");
  const statusT = useAcademicContentTranslations("statuses");
  const audienceT = useAcademicContentTranslations("audiences");
  const platformT = useAcademicContentTranslations("platforms");
  const structure = props.browseOptions.targetOptions?.structure;
  const options = useMemo(() => {
    const name = (entity: { name: string; nameAr?: string; nameEn?: string }) =>
      (locale === "ar" ? entity.nameAr : entity.nameEn) ?? entity.name;
    const entities = (
      values: Array<{
        id: string;
        name: string;
        nameAr?: string;
        nameEn?: string;
      }>,
    ) => values.map((entity) => ({ value: entity.id, label: name(entity) }));
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
      platforms: ACADEMIC_ONLINE_SESSION_PLATFORMS.map((platform) => ({
        value: platform,
        label: platformT(platform),
      })),
      audiences: allowedAudiences("ONLINE_SESSION").map((audience) => ({
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
    locale,
    platformT,
    props.browseOptions.targetOptions?.subjects,
    props.browseOptions.teachers,
    props.filters.gradeId,
    props.filters.sectionId,
    props.filters.stageId,
    statusT,
    structure,
  ]);
  const definitions: Array<{
    field: keyof OnlineSessionFilterUpdate;
    label: string;
    all: string;
    value: string;
    options: SelectOption[];
    resets?: OnlineSessionFilterUpdate;
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
      field: "teacherUserId",
      label: t("filters.teacher"),
      all: t("all_teachers"),
      value: props.filters.teacherUserId,
      options: options.teachers,
    },
    {
      field: "platform",
      label: t("filters.platform"),
      all: t("all_platforms"),
      value: props.filters.platform,
      options: options.platforms,
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
  const applyPreset = (datePreset: OnlineSessionDatePreset) =>
    props.onFiltersChange({
      datePreset,
      ...onlineSessionPresetRange(datePreset),
    });
  const appliedFilters = definitions
    .filter(({ value }) => value)
    .map(({ field, label, value, options: values, resets }) => ({
      key: field,
      label: `${label}: ${values.find((option) => option.value === value)?.label ?? t("unavailable_name")}`,
      onRemove: () => props.onFiltersChange({ ...(resets ?? {}), [field]: "" }),
    }));
  if (props.filters.dateFrom || props.filters.dateTo)
    appliedFilters.push({
      key: "datePreset",
      label: t(`date_presets.${props.filters.datePreset || "custom"}`),
      onRemove: () =>
        props.onFiltersChange({ datePreset: "", dateFrom: "", dateTo: "" }),
    });
  if (props.filters.tag)
    appliedFilters.push({
      key: "tag",
      label: `${t("filters.tag")}: ${props.filters.tag}`,
      onRemove: () => props.onFiltersChange({ tag: "" }),
    });

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
          <div
            className="flex flex-wrap gap-2"
            aria-label={t("filters.quick_dates")}
          >
            {(["today", "tomorrow", "next7Days"] as const).map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={
                  props.filters.datePreset === preset ? "primary" : "secondary"
                }
                onClick={() => applyPreset(preset)}
              >
                {t(`date_presets.${preset}`)}
              </Button>
            ))}
          </div>
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
                        "platform",
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
            <Input
              type="date"
              label={t("filters.date_from")}
              value={props.filters.dateFrom}
              onChange={(event) =>
                props.onFiltersChange({
                  datePreset: "custom",
                  dateFrom: event.target.value,
                })
              }
            />
            <TagFilterInput
              label={t("filters.tag")}
              value={props.filters.tag}
              onChange={(tag) => props.onFiltersChange({ tag })}
            />
            <Input
              type="date"
              label={t("filters.date_to")}
              value={props.filters.dateTo}
              min={props.filters.dateFrom || undefined}
              onChange={(event) =>
                props.onFiltersChange({
                  datePreset: "custom",
                  dateTo: event.target.value,
                })
              }
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
