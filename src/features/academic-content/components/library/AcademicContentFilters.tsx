"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import AcademicContentAppliedFilters, {
  type AppliedAcademicContentFilter,
} from "../filters/AcademicContentAppliedFilters";
import type { AcademicContentLibraryFilters } from "../../hooks/useAcademicContentLibrary";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  localizedAcademicName,
  teacherDisplayName,
} from "../../model/academicContentDisplay";
import {
  ACADEMIC_CONTENT_AUDIENCES,
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_CONTENT_TYPES,
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  ACADEMIC_ONLINE_SESSION_PLATFORMS,
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
} from "../../types/contracts";

type FilterUpdate = Partial<
  Omit<AcademicContentLibraryFilters, "page" | "limit" | "search">
>;

interface AcademicContentFiltersProps {
  filters: AcademicContentLibraryFilters;
  search: string;
  resultCount: number;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: FilterUpdate) => void;
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
  resultCount,
  browseOptions,
  onSearchChange,
  onFiltersChange,
  onClear,
}: AcademicContentFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const locale = useLocale();
  const t = useAcademicContentTranslations();
  const { targetOptions, teachers } = browseOptions;
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
    sessionPlatform: localizedOptions(
      ACADEMIC_ONLINE_SESSION_PLATFORMS,
      "platforms",
    ),
    guardianPriority: localizedOptions(
      ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
      "priorities",
    ),
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

  const namedOptions = useMemo(() => {
    const structure = targetOptions?.structure;
    const stages = structure?.stages ?? [];
    const grades = (structure?.grades ?? []).filter(
      (grade) => !filters.stageId || grade.stageId === filters.stageId,
    );
    const sections = (structure?.sections ?? []).filter(
      (section) => !filters.gradeId || section.gradeId === filters.gradeId,
    );
    const classrooms = (structure?.classrooms ?? []).filter(
      (classroom) =>
        !filters.sectionId || classroom.sectionId === filters.sectionId,
    );
    const toOption = (entity: {
      id: string;
      name: string;
      nameAr?: string;
      nameEn?: string;
    }) => ({
      value: entity.id,
      label:
        localizedAcademicName(entity, locale) ?? t("common.unavailable_name"),
    });

    return {
      stages: stages.map(toOption),
      grades: grades.map(toOption),
      sections: sections.map(toOption),
      classrooms: classrooms.map(toOption),
      subjects: (targetOptions?.subjects ?? []).map(toOption),
      teachers: teachers.map((teacher) => ({
        value: teacher.userId,
        label: teacher.displayName.fullName,
      })),
    };
  }, [
    filters.gradeId,
    filters.sectionId,
    filters.stageId,
    locale,
    t,
    targetOptions,
    teachers,
  ]);

  const entityLabel = (
    entities: Array<{
      id: string;
      name: string;
      nameAr?: string;
      nameEn?: string;
    }>,
    id: string,
  ) =>
    localizedAcademicName(
      entities.find((entity) => entity.id === id),
      locale,
    ) ?? t("common.unavailable_name");

  const appliedFilters: AppliedAcademicContentFilter[] = [];
  const addAppliedFilter = (key: string, label: string, update: FilterUpdate) =>
    appliedFilters.push({
      key,
      label,
      onRemove: () => onFiltersChange(update),
    });
  const structure = targetOptions?.structure;

  if (filters.type)
    addAppliedFilter(
      "type",
      `${t("library.filters.type")}: ${t(`types.${filters.type}`)}`,
      { type: "" },
    );
  if (filters.status)
    addAppliedFilter(
      "status",
      `${t("library.filters.status")}: ${t(`statuses.${filters.status}`)}`,
      {
        status: "",
      },
    );
  if (filters.audience)
    addAppliedFilter(
      "audience",
      `${t("library.filters.audience")}: ${t(`audiences.${filters.audience}`)}`,
      { audience: "" },
    );
  if (filters.stageId)
    addAppliedFilter(
      "stage",
      `${t("library.filters.stage")}: ${entityLabel(structure?.stages ?? [], filters.stageId)}`,
      { stageId: "", gradeId: "", sectionId: "", classroomId: "" },
    );
  if (filters.gradeId)
    addAppliedFilter(
      "grade",
      `${t("library.filters.grade")}: ${entityLabel(structure?.grades ?? [], filters.gradeId)}`,
      { gradeId: "", sectionId: "", classroomId: "" },
    );
  if (filters.sectionId)
    addAppliedFilter(
      "section",
      `${t("library.filters.section")}: ${entityLabel(structure?.sections ?? [], filters.sectionId)}`,
      { sectionId: "", classroomId: "" },
    );
  if (filters.classroomId)
    addAppliedFilter(
      "classroom",
      `${t("library.filters.classroom")}: ${entityLabel(
        structure?.classrooms ?? [],
        filters.classroomId,
      )}`,
      { classroomId: "" },
    );
  if (filters.subjectId)
    addAppliedFilter(
      "subject",
      `${t("library.filters.subject")}: ${entityLabel(
        targetOptions?.subjects ?? [],
        filters.subjectId,
      )}`,
      { subjectId: "" },
    );
  if (filters.teacherUserId)
    addAppliedFilter(
      "teacher",
      `${t("library.filters.teacher")}: ${
        teacherDisplayName(filters.teacherUserId, teachers) ??
        t("common.unavailable_name")
      }`,
      { teacherUserId: "" },
    );

  const inputFilter = (
    key: keyof FilterUpdate,
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
    key: keyof FilterUpdate,
    label: string,
    options: SelectOption[],
    onChange?: (value: string) => void,
    disabled = false,
    searchable = false,
  ) => (
    <Select
      label={label}
      triggerAriaLabel={label}
      value={String(filters[key])}
      options={options}
      disabled={disabled}
      searchable={searchable}
      onChange={
        onChange ?? ((filterValue) => onFiltersChange({ [key]: filterValue }))
      }
    />
  );

  const optionsWarning =
    browseOptions.targetOptionsUnavailable || browseOptions.teachersUnavailable;

  return (
    <FilterPanel
      title={t("library.title")}
      subtitle={t("library.subtitle")}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((isVisible) => !isVisible)}
      toggleAriaLabel={t(
        showFilters ? "library.hide_filters" : "library.show_filters",
      )}
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
      bodySlot={
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {selectFilter(
              "type",
              t("library.filters.type"),
              selectOptions(filterOptions.type, t("library.all_types")),
            )}
            {selectFilter(
              "status",
              t("library.filters.status"),
              selectOptions(filterOptions.status, t("library.all_statuses")),
            )}
            {selectFilter(
              "audience",
              t("library.filters.audience"),
              selectOptions(filterOptions.audience, t("library.all_audiences")),
            )}
          </div>
          {optionsWarning ? (
            <p role="status" className="text-sm text-amber-700">
              {t("library.options_warning")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AcademicContentAppliedFilters
              filters={appliedFilters}
              removeLabel={(label) => t("library.remove_filter", { label })}
            />
            <p aria-live="polite" className="text-sm font-medium text-gray-600">
              {t("library.results", { count: resultCount })}
            </p>
          </div>
        </div>
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
          {selectFilter(
            "stageId",
            t("library.filters.stage"),
            selectOptions(namedOptions.stages, t("library.all_stages")),
            (stageId) =>
              onFiltersChange({
                stageId,
                gradeId: "",
                sectionId: "",
                classroomId: "",
              }),
            browseOptions.isLoadingTargets,
            true,
          )}
          {selectFilter(
            "gradeId",
            t("library.filters.grade"),
            selectOptions(namedOptions.grades, t("library.all_grades")),
            (gradeId) =>
              onFiltersChange({ gradeId, sectionId: "", classroomId: "" }),
            browseOptions.isLoadingTargets || !filters.stageId,
            true,
          )}
          {selectFilter(
            "sectionId",
            t("library.filters.section"),
            selectOptions(namedOptions.sections, t("library.all_sections")),
            (sectionId) => onFiltersChange({ sectionId, classroomId: "" }),
            browseOptions.isLoadingTargets || !filters.gradeId,
            true,
          )}
          {selectFilter(
            "classroomId",
            t("library.filters.classroom"),
            selectOptions(namedOptions.classrooms, t("library.all_classrooms")),
            undefined,
            browseOptions.isLoadingTargets || !filters.sectionId,
            true,
          )}
          {selectFilter(
            "subjectId",
            t("library.filters.subject"),
            selectOptions(namedOptions.subjects, t("library.all_subjects")),
            undefined,
            browseOptions.isLoadingTargets,
            true,
          )}
          {selectFilter(
            "teacherUserId",
            t("library.filters.teacher"),
            selectOptions(namedOptions.teachers, t("library.all_teachers")),
            undefined,
            browseOptions.isLoadingTeachers,
            true,
          )}
          {selectFilter(
            "resourceCategory",
            t("library.filters.resource_category"),
            selectOptions(
              filterOptions.resourceCategory,
              t("library.all_categories"),
            ),
          )}
          {inputFilter(
            "weeklyDateFrom",
            t("library.filters.week_from"),
            "date",
          )}
          {inputFilter("weeklyDateTo", t("library.filters.week_to"), "date")}
          <Input
            label={t("library.filters.session_from")}
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtFrom)}
            onChange={(event) =>
              onFiltersChange({
                sessionStartAtFrom: utcInstant(event.target.value),
              })
            }
          />
          <Input
            label={t("library.filters.session_to")}
            type="datetime-local"
            value={localDateTime(filters.sessionStartAtTo)}
            onChange={(event) =>
              onFiltersChange({
                sessionStartAtTo: utcInstant(event.target.value),
              })
            }
          />
          {selectFilter(
            "sessionPlatform",
            t("library.filters.session_platform"),
            selectOptions(
              filterOptions.sessionPlatform,
              t("library.all_platforms"),
            ),
          )}
          {selectFilter(
            "guardianPriority",
            t("library.filters.guardian_priority"),
            selectOptions(
              filterOptions.guardianPriority,
              t("library.all_priorities"),
            ),
          )}
          {inputFilter("tag", t("library.filters.tag"), "text", 80)}
        </div>
      }
    />
  );
}
