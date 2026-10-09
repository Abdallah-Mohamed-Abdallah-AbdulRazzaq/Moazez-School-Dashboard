"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";
import type { AcademicContentReviewQueueFilters } from "../../hooks/useAcademicContentReviewQueue";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { localizedAcademicName } from "../../model/academicContentDisplay";

interface ReviewQueueFiltersProps {
  filters: AcademicContentReviewQueueFilters;
  search: string;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    filters: Partial<
      Omit<AcademicContentReviewQueueFilters, "page" | "limit" | "search">
    >,
  ) => void;
  onClear: () => void;
}

function withAllOption(
  options: SelectOption[],
  allLabel: string,
): SelectOption[] {
  return [{ value: "", label: allLabel }, ...options];
}

export default function ReviewQueueFilters({
  filters,
  search,
  browseOptions,
  onSearchChange,
  onFiltersChange,
  onClear,
}: ReviewQueueFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const locale = useLocale();
  const t = useAcademicContentTranslations("review");
  const { targetOptions, teachers } = browseOptions;
  const hasActiveFilters = useMemo(
    () =>
      Boolean(search) ||
      Object.entries(filters).some(
        ([key, value]) =>
          !["page", "limit", "search"].includes(key) && Boolean(value),
      ),
    [filters, search],
  );

  const toOption = (item: {
    id: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
  }): SelectOption => ({
    value: item.id,
    label: localizedAcademicName(item, locale) ?? t("name_unavailable"),
  });
  const grades =
    targetOptions?.structure.grades.filter(
      (grade) => !filters.stageId || grade.stageId === filters.stageId,
    ) ?? [];
  const sections =
    targetOptions?.structure.sections.filter(
      (section) => !filters.gradeId || section.gradeId === filters.gradeId,
    ) ?? [];
  const classrooms =
    targetOptions?.structure.classrooms.filter(
      (classroom) =>
        !filters.sectionId || classroom.sectionId === filters.sectionId,
    ) ?? [];
  const optionsLoadFailed = browseOptions.targetOptionsUnavailable;

  return (
    <FilterPanel
      title={t("title")}
      subtitle={t("subtitle")}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((visible) => !visible)}
      toggleAriaLabel={t(showFilters ? "hide_filters" : "show_filters")}
      hasActiveFilters={hasActiveFilters}
      searchSlot={
        <Input
          label={t("search")}
          value={search}
          maxLength={120}
          leftIcon={<Search aria-hidden="true" className="size-4" />}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      }
      clearAction={
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X aria-hidden="true" className="size-4" />}
          onClick={onClear}
        >
          {t("clear_filters")}
        </Button>
      }
      filtersSlot={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            label={t("filters.stage")}
            triggerAriaLabel={t("filters.stage")}
            value={filters.stageId}
            options={withAllOption(
              (targetOptions?.structure.stages ?? []).map(toOption),
              t("all_stages"),
            )}
            disabled={browseOptions.isLoadingTargets}
            error={optionsLoadFailed ? t("options_load_error") : undefined}
            searchable
            onChange={(stageId) =>
              onFiltersChange({
                stageId,
                gradeId: "",
                sectionId: "",
                classroomId: "",
              })
            }
          />
          <Select
            label={t("filters.grade")}
            triggerAriaLabel={t("filters.grade")}
            value={filters.gradeId}
            options={withAllOption(grades.map(toOption), t("all_grades"))}
            disabled={browseOptions.isLoadingTargets || !filters.stageId}
            searchable
            onChange={(gradeId) =>
              onFiltersChange({ gradeId, sectionId: "", classroomId: "" })
            }
          />
          <Select
            label={t("filters.section")}
            triggerAriaLabel={t("filters.section")}
            value={filters.sectionId}
            options={withAllOption(sections.map(toOption), t("all_sections"))}
            disabled={browseOptions.isLoadingTargets || !filters.gradeId}
            searchable
            onChange={(sectionId) =>
              onFiltersChange({ sectionId, classroomId: "" })
            }
          />
          <Select
            label={t("filters.classroom")}
            triggerAriaLabel={t("filters.classroom")}
            value={filters.classroomId}
            options={withAllOption(
              classrooms.map(toOption),
              t("all_classrooms"),
            )}
            disabled={browseOptions.isLoadingTargets || !filters.sectionId}
            searchable
            onChange={(classroomId) => onFiltersChange({ classroomId })}
          />
          <Select
            label={t("filters.subject")}
            triggerAriaLabel={t("filters.subject")}
            value={filters.subjectId}
            options={withAllOption(
              (targetOptions?.subjects ?? []).map(toOption),
              t("all_subjects"),
            )}
            disabled={browseOptions.isLoadingTargets}
            searchable
            onChange={(subjectId) => onFiltersChange({ subjectId })}
          />
          <Select
            label={t("filters.teacher")}
            triggerAriaLabel={t("filters.teacher")}
            value={filters.teacherUserId}
            options={withAllOption(
              teachers.map((teacher) => ({
                value: teacher.userId,
                label: teacher.displayName.fullName,
              })),
              t("all_teachers"),
            )}
            disabled={browseOptions.isLoadingTeachers}
            searchable
            error={
              browseOptions.teachersUnavailable
                ? t("teachers_load_error")
                : undefined
            }
            onChange={(teacherUserId) => onFiltersChange({ teacherUserId })}
          />
        </div>
      }
    />
  );
}
