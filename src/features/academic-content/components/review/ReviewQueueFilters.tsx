"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { AcademicContentReviewQueueFilters } from "../../hooks/useAcademicContentReviewQueue";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";

interface ReviewQueueFiltersProps {
  filters: AcademicContentReviewQueueFilters;
  search: string;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    filters: Partial<
      Omit<AcademicContentReviewQueueFilters, "page" | "limit" | "search">
    >,
  ) => void;
  onClear: () => void;
}

function selectOptions(
  items: Array<{ id: string; name: string }>,
  allLabel: string,
): SelectOption[] {
  return [
    { value: "", label: allLabel },
    ...items.map((item) => ({ value: item.id, label: item.name })),
  ];
}

export default function ReviewQueueFilters({
  filters,
  search,
  onSearchChange,
  onFiltersChange,
  onClear,
}: ReviewQueueFiltersProps) {
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<AcademicTargetOptions | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [optionsLoadFailed, setOptionsLoadFailed] = useState(false);
  const [teacherLoadFailed, setTeacherLoadFailed] = useState(false);
  const t = useAcademicContentTranslations("review");
  const hasActiveFilters = useMemo(
    () =>
      Boolean(search) ||
      Object.entries(filters).some(
        ([key, value]) =>
          !["page", "limit", "search"].includes(key) && Boolean(value),
      ),
    [filters, search],
  );

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let isCurrent = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setOptions(null);
      setOptionsLoadFailed(false);
    });
    void loadAcademicTargetOptions({ academicYearId, termId })
      .then((loadedOptions) => {
        if (isCurrent) setOptions(loadedOptions);
      })
      .catch(() => {
        if (isCurrent) setOptionsLoadFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [academicYearId, termId]);

  useEffect(() => {
    let isCurrent = true;
    void teacherApi
      .list({ employmentStatus: "ACTIVE", page: 1, limit: 100 })
      .then((response) => {
        if (!isCurrent) return;
        setTeacherOptions(
          response.items.map((teacher) => ({
            value: teacher.userId,
            label: teacher.displayName.fullName,
          })),
        );
      })
      .catch(() => {
        if (isCurrent) setTeacherLoadFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const grades =
    options?.structure.grades.filter(
      (grade) => !filters.stageId || grade.stageId === filters.stageId,
    ) ?? [];
  const sections =
    options?.structure.sections.filter(
      (section) => !filters.gradeId || section.gradeId === filters.gradeId,
    ) ?? [];
  const classrooms =
    options?.structure.classrooms.filter(
      (classroom) =>
        !filters.sectionId || classroom.sectionId === filters.sectionId,
    ) ?? [];

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
            options={selectOptions(options?.structure.stages ?? [], t("all_stages"))}
            error={optionsLoadFailed ? t("options_load_error") : undefined}
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
            options={selectOptions(grades, t("all_grades"))}
            disabled={!options}
            onChange={(gradeId) =>
              onFiltersChange({ gradeId, sectionId: "", classroomId: "" })
            }
          />
          <Select
            label={t("filters.section")}
            triggerAriaLabel={t("filters.section")}
            value={filters.sectionId}
            options={selectOptions(sections, t("all_sections"))}
            disabled={!options}
            onChange={(sectionId) =>
              onFiltersChange({ sectionId, classroomId: "" })
            }
          />
          <Select
            label={t("filters.classroom")}
            triggerAriaLabel={t("filters.classroom")}
            value={filters.classroomId}
            options={selectOptions(classrooms, t("all_classrooms"))}
            disabled={!options}
            onChange={(classroomId) => onFiltersChange({ classroomId })}
          />
          <Select
            label={t("filters.subject")}
            triggerAriaLabel={t("filters.subject")}
            value={filters.subjectId}
            options={selectOptions(options?.subjects ?? [], t("all_subjects"))}
            disabled={!options}
            searchable
            onChange={(subjectId) => onFiltersChange({ subjectId })}
          />
          <Select
            label={t("filters.teacher")}
            triggerAriaLabel={t("filters.teacher")}
            value={filters.teacherUserId}
            options={[
              { value: "", label: t("all_teachers") },
              ...teacherOptions,
            ]}
            searchable
            error={teacherLoadFailed ? t("teachers_load_error") : undefined}
            onChange={(teacherUserId) => onFiltersChange({ teacherUserId })}
          />
        </div>
      }
    />
  );
}
