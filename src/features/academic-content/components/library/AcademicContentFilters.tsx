"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { AcademicContentLibraryFilters } from "../../hooks/useAcademicContentLibrary";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_CONTENT_TYPES,
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
} from "../../types/contracts";

interface AcademicContentFiltersProps {
  filters: AcademicContentLibraryFilters;
  search: string;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    filters: Partial<Omit<AcademicContentLibraryFilters, "page" | "limit" | "search">>,
  ) => void;
  onClear: () => void;
}

function selectOptions(options: readonly SelectOption[], allLabel: string) {
  return [{ value: "", label: allLabel }, ...options];
}

function localDateTime(instant: string): string {
  if (!instant) return "";
  const date = new Date(instant);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function utcInstant(localValue: string): string {
  return localValue ? new Date(localValue).toISOString() : "";
}

export default function AcademicContentFilters({
  filters,
  search,
  onSearchChange,
  onFiltersChange,
  onClear,
}: AcademicContentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState<SelectOption[]>([]);
  const [teacherLoadFailed, setTeacherLoadFailed] = useState(false);
  const t = useAcademicContentTranslations();
  const localizedOptions = (values: readonly string[], namespace: string) =>
    values.map((value) => ({ value, label: t(`${namespace}.${value}`) }));
  const filterOptions = {
    type: localizedOptions(ACADEMIC_CONTENT_TYPES, "types"),
    status: localizedOptions(ACADEMIC_CONTENT_STATUSES, "statuses"),
    audience: localizedOptions(ACADEMIC_CONTENT_AUDIENCES, "audiences"),
    resourceCategory: localizedOptions(
      ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
      "resource_categories",
    ),
    sessionPlatform: localizedOptions(ACADEMIC_ONLINE_SESSION_PLATFORMS, "platforms"),
    guardianPriority: localizedOptions(ACADEMIC_GUARDIAN_NOTE_PRIORITIES, "priorities"),
  };
  const hasActiveFilters = useMemo(
    () =>
      Boolean(search) ||
      Object.entries(filters).some(
        ([key, filterValue]) =>
          !["page", "limit", "search"].includes(key) && Boolean(filterValue),
      ),
    [filters, search],
  );

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

  const inputFilter = (
    key: keyof Omit<AcademicContentLibraryFilters, "page" | "limit" | "search">,
    label: string,
    type = "text",
    maximumLength?: number,
  ) => (
    <Input
      label={label}
      type={type}
      maxLength={maximumLength}
      value={String(filters[key])}
      onChange={(event) => onFiltersChange({ [key]: event.target.value })}
    />
  );

  const selectFilter = (
    key: keyof Omit<AcademicContentLibraryFilters, "page" | "limit" | "search">,
    label: string,
    options: SelectOption[],
  ) => (
    <Select
      label={label}
      triggerAriaLabel={label}
      value={String(filters[key])}
      options={options}
      onChange={(filterValue) => onFiltersChange({ [key]: filterValue })}
    />
  );

  return (
    <FilterPanel
      title={t("library.title")}
      subtitle={t("library.subtitle")}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((isVisible) => !isVisible)}
      toggleAriaLabel={t(showFilters ? "library.hide_filters" : "library.show_filters")}
      hasActiveFilters={hasActiveFilters}
      searchSlot={
        <Input
          label={t("library.search")}
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
          {t("library.clear_filters")}
        </Button>
      }
      filtersSlot={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {selectFilter("type", t("library.filters.type"), selectOptions(filterOptions.type, t("library.all_types")))}
          {selectFilter("status", t("library.filters.status"), selectOptions(filterOptions.status, t("library.all_statuses")))}
          {selectFilter("audience", t("library.filters.audience"), selectOptions(filterOptions.audience, t("library.all_audiences")))}
          {inputFilter("stageId", t("library.filters.stage"))}
          {inputFilter("gradeId", t("library.filters.grade"))}
          {inputFilter("sectionId", t("library.filters.section"))}
          {inputFilter("classroomId", t("library.filters.classroom"))}
          {inputFilter("subjectId", t("library.filters.subject"))}
          <Select
            label={t("library.filters.teacher")}
            triggerAriaLabel={t("library.filters.teacher")}
            value={filters.teacherUserId}
            options={selectOptions(teacherOptions, t("library.all_teachers"))}
            searchable
            error={teacherLoadFailed ? t("library.teachers_load_error") : undefined}
            onChange={(teacherUserId) => onFiltersChange({ teacherUserId })}
          />
          {selectFilter(
            "resourceCategory",
            t("library.filters.resource_category"),
            selectOptions(filterOptions.resourceCategory, t("library.all_categories")),
          )}
          {inputFilter("weeklyDateFrom", t("library.filters.week_from"), "date")}
          {inputFilter("weeklyDateTo", t("library.filters.week_to"), "date")}
          <Input
            label={t("library.filters.session_from")}
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtFrom)}
            onChange={(event) =>
              onFiltersChange({ sessionStartAtFrom: utcInstant(event.target.value) })
            }
          />
          <Input
            label={t("library.filters.session_to")}
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtTo)}
            onChange={(event) =>
              onFiltersChange({ sessionStartAtTo: utcInstant(event.target.value) })
            }
          />
          {selectFilter(
            "sessionPlatform",
            t("library.filters.session_platform"),
            selectOptions(filterOptions.sessionPlatform, t("library.all_platforms")),
          )}
          {selectFilter(
            "guardianPriority",
            t("library.filters.guardian_priority"),
            selectOptions(filterOptions.guardianPriority, t("library.all_priorities")),
          )}
          {inputFilter("tag", t("library.filters.tag"), "text", 80)}
        </div>
      }
    />
  );
}
