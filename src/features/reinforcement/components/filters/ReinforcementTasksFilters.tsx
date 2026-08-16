"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDebounce } from "use-debounce";
import { FilterPanel } from "@/components/ui";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import type {
  ReinforcementAssignmentScope,
  ReinforcementScopeOption,
  ReinforcementTaskFilters,
} from "../../types/reinforcement";

export interface SelectOption {
  value: string;
  label: string;
}

interface ReinforcementTasksFiltersProps {
  filters: ReinforcementTaskFilters;
  onChange: (next: ReinforcementTaskFilters) => void;
  scopeTargets: Record<
    ReinforcementAssignmentScope,
    ReinforcementScopeOption[]
  >;
}

export default function ReinforcementTasksFilters({
  filters,
  onChange,
  scopeTargets,
}: ReinforcementTasksFiltersProps) {
  const t = useTranslations("reinforcement");
  const locale = useLocale();
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchValue] = useDebounce(searchValue, 250);
  const isSearchDirtyRef = useRef(false);
  const hasManuallyClosedFiltersRef = useRef(false);
  const latestFiltersRef = useRef(filters);
  const latestOnChangeRef = useRef(onChange);

  useEffect(() => {
    latestFiltersRef.current = filters;
    latestOnChangeRef.current = onChange;
  }, [filters, onChange]);

  useEffect(() => {
    if (isSearchDirtyRef.current) {
      return;
    }

    const nextSearchValue = filters.search || "";
    if (searchValue === nextSearchValue) {
      return;
    }

    queueMicrotask(() => {
      setSearchValue(nextSearchValue);
    });
  }, [filters.search, searchValue]);

  const hasAdvancedFilters = useMemo(
    () =>
      Boolean(
        (filters.assignmentScope && filters.assignmentScope !== "all") ||
        filters.targetId ||
        (filters.source && filters.source !== "all") ||
        (filters.status && filters.status !== "all") ||
        (filters.rewardType && filters.rewardType !== "all") ||
        filters.dueDate,
      ),
    [
      filters.assignmentScope,
      filters.dueDate,
      filters.rewardType,
      filters.source,
      filters.status,
      filters.targetId,
    ],
  );

  useEffect(() => {
    if (!hasAdvancedFilters) {
      hasManuallyClosedFiltersRef.current = false;
      return;
    }

    if (showFilters || hasManuallyClosedFiltersRef.current) {
      return;
    }

    queueMicrotask(() => {
      setShowFilters(true);
    });
  }, [hasAdvancedFilters, showFilters]);

  const scopeOptions: SelectOption[] = [
    { value: "all", label: t("filters.allAssignmentLevels") },
    { value: "school", label: t("assignmentScope.school") },
    { value: "stage", label: t("assignmentScope.stage") },
    { value: "grade", label: t("assignmentScope.grade") },
    { value: "section", label: t("assignmentScope.section") },
    { value: "classroom", label: t("assignmentScope.classroom") },
    { value: "student", label: t("assignmentScope.student") },
  ];

  const targetOptions = (
    filters.assignmentScope && filters.assignmentScope !== "all"
      ? scopeTargets[filters.assignmentScope] || []
      : Object.values(scopeTargets).flat()
  ).map((option) => ({
    value: option.value,
    label:
      filters.assignmentScope && filters.assignmentScope !== "all"
        ? locale === "ar"
          ? option.nameAr
          : option.nameEn
        : `${t(`assignmentScope.${option.scopeType}`)} - ${locale === "ar" ? option.nameAr : option.nameEn}`,
  }));

  useEffect(() => {
    const nextSearch = debouncedSearchValue || undefined;
    if ((latestFiltersRef.current.search || undefined) === nextSearch) {
      isSearchDirtyRef.current = false;
      return;
    }

    latestOnChangeRef.current({
      ...latestFiltersRef.current,
      search: nextSearch,
    });
  }, [debouncedSearchValue]);

  useEffect(() => {
    if ((filters.search || "") === debouncedSearchValue) {
      isSearchDirtyRef.current = false;
    }
  }, [debouncedSearchValue, filters.search]);

  return (
    <FilterPanel
      title={t("filters.title")}
      subtitle={t("filters.subtitle")}
      searchSlot={
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchValue}
            onChange={(event) => {
              isSearchDirtyRef.current = true;
              setSearchValue(event.target.value);
            }}
            className="pl-10"
            placeholder={t("filters.searchPlaceholder")}
          />
        </div>
      }
      filtersSlot={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Select
            value={filters.assignmentScope || "all"}
            options={scopeOptions}
            onChange={(value) =>
              onChange({
                ...filters,
                assignmentScope:
                  value as ReinforcementTaskFilters["assignmentScope"],
                targetId: undefined,
              })
            }
            selectSize="sm"
          />

          <Select
            value={filters.targetId || ""}
            options={[
              { value: "", label: t("filters.allTargets") },
              ...targetOptions,
            ]}
            onChange={(value) =>
              onChange({ ...filters, targetId: value || undefined })
            }
            searchable
            searchPlaceholder={t("filters.searchPlaceholder")}
            selectSize="sm"
          />

          <Select
            value={filters.source || "all"}
            options={[
              { value: "all", label: t("filters.allSources") },
              { value: "teacher", label: t("source.teacher") },
              { value: "parent", label: t("source.parent") },
              { value: "system", label: t("source.system") },
            ]}
            onChange={(value) =>
              onChange({
                ...filters,
                source: value as ReinforcementTaskFilters["source"],
              })
            }
            selectSize="sm"
          />

          <Select
            value={filters.status || "all"}
            options={[
              { value: "all", label: t("filters.allStatuses") },
              { value: "cancelled", label: t("status.cancelled") },
              { value: "in_progress", label: t("status.in_progress") },
              { value: "under_review", label: t("status.under_review") },
              { value: "completed", label: t("status.completed") },
              { value: "not_completed", label: t("status.not_completed") },
            ]}
            onChange={(value) =>
              onChange({
                ...filters,
                status: value as ReinforcementTaskFilters["status"],
              })
            }
            selectSize="sm"
          />

          <Select
            value={filters.rewardType || "all"}
            options={[
              { value: "all", label: t("filters.allRewardTypes") },
              { value: "moral", label: t("rewardType.moral") },
              { value: "financial", label: t("rewardType.financial") },
              { value: "xp", label: t("rewardType.xp") },
              { value: "badge", label: t("rewardType.badge") },
            ]}
            onChange={(value) =>
              onChange({
                ...filters,
                rewardType: value as ReinforcementTaskFilters["rewardType"],
              })
            }
            selectSize="sm"
          />

          <DatePicker
            value={filters.dueDate ? new Date(filters.dueDate) : null}
            onChange={(value) =>
              onChange({
                ...filters,
                dueDate: value ? value.toISOString().split("T")[0] : undefined,
              })
            }
          />
        </div>
      }
      showFilters={showFilters}
      onToggleFilters={() =>
        setShowFilters((current) => {
          const next = !current;
          hasManuallyClosedFiltersRef.current = !next && hasAdvancedFilters;
          return next;
        })
      }
      clearAction={
        <button
          type="button"
          onClick={() =>
            onChange({
              ...filters,
              assignmentScope: "all",
              targetId: undefined,
              source: "all",
              status: "all",
              rewardType: "all",
              dueDate: undefined,
            })
          }
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          {t("filters.clearFilters")}
        </button>
      }
      hasActiveFilters={hasAdvancedFilters}
      toggleTitle={
        showFilters ? t("filters.hideFilters") : t("filters.showFilters")
      }
      toggleAriaLabel={
        showFilters ? t("filters.hideFilters") : t("filters.showFilters")
      }
    />
  );
}
