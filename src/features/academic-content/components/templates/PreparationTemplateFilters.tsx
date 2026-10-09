"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import type { AcademicContentBrowseOptionsState } from "../../hooks/useAcademicContentBrowseOptions";
import type { PreparationTemplateFilters } from "../../hooks/usePreparationTemplates";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import { localizedAcademicName } from "../../model/academicContentDisplay";

interface PreparationTemplateFiltersProps {
  filters: PreparationTemplateFilters;
  search: string;
  browseOptions: AcademicContentBrowseOptionsState;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    filters: Partial<
      Omit<PreparationTemplateFilters, "page" | "limit" | "search">
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

export default function PreparationTemplateFilters({
  filters,
  search,
  browseOptions,
  onSearchChange,
  onFiltersChange,
  onClear,
}: PreparationTemplateFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const locale = useLocale();
  const t = useAcademicContentTranslations("templates");
  const hasActiveFilters = useMemo(
    () => Boolean(search || filters.stageId || filters.subjectId),
    [filters.stageId, filters.subjectId, search],
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

  return (
    <FilterPanel
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("stage")}
            triggerAriaLabel={t("stage")}
            value={filters.stageId}
            options={withAllOption(
              (browseOptions.targetOptions?.structure.stages ?? []).map(
                toOption,
              ),
              t("all_stages"),
            )}
            disabled={browseOptions.isLoadingTargets}
            searchable
            error={
              browseOptions.targetOptionsUnavailable
                ? t("options_load_error")
                : undefined
            }
            onChange={(stageId) => onFiltersChange({ stageId })}
          />
          <Select
            label={t("subject")}
            triggerAriaLabel={t("subject")}
            value={filters.subjectId}
            options={withAllOption(
              (browseOptions.targetOptions?.subjects ?? []).map(toOption),
              t("all_subjects"),
            )}
            disabled={browseOptions.isLoadingTargets}
            searchable
            onChange={(subjectId) => onFiltersChange({ subjectId })}
          />
        </div>
      }
    />
  );
}
