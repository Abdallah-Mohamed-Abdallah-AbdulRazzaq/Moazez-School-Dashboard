"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import FilterPanel from "@/components/ui/filter-panel/FilterPanel";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type { PreparationTemplateFilters } from "../../hooks/usePreparationTemplates";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../../services/academicContentSelectors";

interface PreparationTemplateFiltersProps {
  filters: PreparationTemplateFilters;
  search: string;
  onSearchChange: (search: string) => void;
  onFiltersChange: (
    filters: Partial<
      Omit<PreparationTemplateFilters, "page" | "limit" | "search">
    >,
  ) => void;
  onClear: () => void;
}

function optionsFor(
  items: Array<{ id: string; name: string }>,
  allLabel: string,
): SelectOption[] {
  return [
    { value: "", label: allLabel },
    ...items.map((item) => ({ value: item.id, label: item.name })),
  ];
}

export default function PreparationTemplateFilters({
  filters,
  search,
  onSearchChange,
  onFiltersChange,
  onClear,
}: PreparationTemplateFiltersProps) {
  const { academicYearId, termId } = useAcademicYearTermLayoutContext();
  const [showFilters, setShowFilters] = useState(false);
  const [options, setOptions] = useState<AcademicTargetOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const t = useAcademicContentTranslations("templates");
  const hasActiveFilters = useMemo(
    () => Boolean(search || filters.stageId || filters.subjectId),
    [filters.stageId, filters.subjectId, search],
  );

  useEffect(() => {
    if (!academicYearId || !termId) return;
    let isCurrent = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setOptions(null);
      setLoadFailed(false);
    });
    void loadAcademicTargetOptions({ academicYearId, termId })
      .then((loadedOptions) => {
        if (isCurrent) setOptions(loadedOptions);
      })
      .catch(() => {
        if (isCurrent) setLoadFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [academicYearId, termId]);

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("stage")}
            triggerAriaLabel={t("stage")}
            value={filters.stageId}
            options={optionsFor(options?.structure.stages ?? [], t("all_stages"))}
            error={loadFailed ? t("options_load_error") : undefined}
            onChange={(stageId) => onFiltersChange({ stageId })}
          />
          <Select
            label={t("subject")}
            triggerAriaLabel={t("subject")}
            value={filters.subjectId}
            options={optionsFor(options?.subjects ?? [], t("all_subjects"))}
            disabled={!options}
            searchable
            onChange={(subjectId) => onFiltersChange({ subjectId })}
          />
        </div>
      }
    />
  );
}
