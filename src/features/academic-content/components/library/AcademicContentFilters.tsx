"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { teacherApi } from "@/features/teachers/services/teacherApi";
import type { AcademicContentLibraryFilters } from "../../hooks/useAcademicContentLibrary";
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

const option = (enumValue: string): SelectOption => ({
  value: enumValue,
  label: enumValue
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" "),
});

const FILTER_OPTIONS = {
  type: ACADEMIC_CONTENT_TYPES.map(option),
  status: ACADEMIC_CONTENT_STATUSES.map(option),
  audience: ACADEMIC_CONTENT_AUDIENCES.map(option),
  resourceCategory: ACADEMIC_SUBJECT_RESOURCE_CATEGORIES.map(option),
  sessionPlatform: ACADEMIC_ONLINE_SESSION_PLATFORMS.map(option),
  guardianPriority: ACADEMIC_GUARDIAN_NOTE_PRIORITIES.map(option),
} as const;

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
      title="Content library"
      subtitle="Search and filter the selected academic year and term."
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((isVisible) => !isVisible)}
      toggleAriaLabel={showFilters ? "Hide filters" : "Show filters"}
      hasActiveFilters={hasActiveFilters}
      searchSlot={
        <Input
          label="Search content"
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
          Clear filters
        </Button>
      }
      filtersSlot={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {selectFilter("type", "Content type", selectOptions(FILTER_OPTIONS.type, "All types"))}
          {selectFilter("status", "Status", selectOptions(FILTER_OPTIONS.status, "All statuses"))}
          {selectFilter("audience", "Audience", selectOptions(FILTER_OPTIONS.audience, "All audiences"))}
          {inputFilter("stageId", "Stage ID")}
          {inputFilter("gradeId", "Grade ID")}
          {inputFilter("sectionId", "Section ID")}
          {inputFilter("classroomId", "Classroom ID")}
          {inputFilter("subjectId", "Subject ID")}
          <Select
            label="Teacher"
            triggerAriaLabel="Teacher"
            value={filters.teacherUserId}
            options={selectOptions(teacherOptions, "All teachers")}
            searchable
            error={teacherLoadFailed ? "Teachers could not be loaded" : undefined}
            onChange={(teacherUserId) => onFiltersChange({ teacherUserId })}
          />
          {selectFilter(
            "resourceCategory",
            "Resource category",
            selectOptions(FILTER_OPTIONS.resourceCategory, "All categories"),
          )}
          {inputFilter("weeklyDateFrom", "Week from", "date")}
          {inputFilter("weeklyDateTo", "Week to", "date")}
          <Input
            label="Session from"
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtFrom)}
            onChange={(event) =>
              onFiltersChange({ sessionStartAtFrom: utcInstant(event.target.value) })
            }
          />
          <Input
            label="Session to"
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtTo)}
            onChange={(event) =>
              onFiltersChange({ sessionStartAtTo: utcInstant(event.target.value) })
            }
          />
          {selectFilter(
            "sessionPlatform",
            "Session platform",
            selectOptions(FILTER_OPTIONS.sessionPlatform, "All platforms"),
          )}
          {selectFilter(
            "guardianPriority",
            "Guardian priority",
            selectOptions(FILTER_OPTIONS.guardianPriority, "All priorities"),
          )}
          {inputFilter("tag", "Tag", "text", 80)}
        </div>
      }
    />
  );
}
