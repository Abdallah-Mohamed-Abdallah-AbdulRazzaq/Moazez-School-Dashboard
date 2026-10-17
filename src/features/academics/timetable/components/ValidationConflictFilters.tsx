"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import type { TimetableConflictDisplay } from "../services/timetableConflictNormalization";

export interface ConflictFilters {
  search: string;
  type: string;
  day: string;
}
export const emptyConflictFilters: ConflictFilters = {
  search: "",
  type: "all",
  day: "all",
};
export type ValidationResource = { id: string; nameAr: string; nameEn: string };
export interface ConflictResources {
  teachers: ValidationResource[];
  classrooms: ValidationResource[];
  rooms: ValidationResource[];
}

export function conflictMatchesFilters(
  conflict: Pick<
    TimetableConflictDisplay,
    "type" | "dayOfWeek" | "resourceId" | "message" | "periodLabel"
  >,
  filters: ConflictFilters,
  resources: ConflictResources,
  locale: string,
) {
  if (filters.type !== "all" && conflict.type !== filters.type) return false;
  if (filters.day !== "all" && String(conflict.dayOfWeek) !== filters.day)
    return false;
  const resource = (
    conflict.type === "CLASSROOM"
      ? resources.classrooms
      : conflict.type === "ROOM"
        ? resources.rooms
        : resources.teachers
  ).find((candidate) => candidate.id === conflict.resourceId);
  const searchable = [
    resource?.nameAr,
    resource?.nameEn,
    conflict.message,
    conflict.periodLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase(locale);
  return searchable.includes(filters.search.trim().toLocaleLowerCase(locale));
}

export default function ValidationConflictFilters({
  filters,
  onChange,
  count,
  locale,
}: {
  filters: ConflictFilters;
  onChange: (filters: ConflictFilters) => void;
  count: number;
  locale: string;
}) {
  const t = useTranslations("academics.timetable.validationEnhancements");
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <Input
        ref={searchRef}
        type="search"
        value={filters.search}
        aria-label={t("searchConflicts")}
        placeholder={t("searchConflicts")}
        onChange={(event) =>
          onChange({ ...filters, search: event.target.value })
        }
      />
      <fieldset className="min-w-0">
        <legend className="mb-1 text-xs font-medium text-slate-600">
          {t("conflictType")}
        </legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: "all", label: t("allTypes") },
            ...["TEACHER", "CLASSROOM", "ROOM", "DUPLICATE", "UNKNOWN"].map(
              (type) => ({ value: type, label: t(`types.${type}`) }),
            ),
          ].map((option) => (
            <Button
              key={option.value}
              variant={filters.type === option.value ? "primary" : "secondary"}
              size="sm"
              className="min-h-11 shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
              aria-pressed={filters.type === option.value}
              onClick={() => onChange({ ...filters, type: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0">
        <legend className="mb-1 text-xs font-medium text-slate-600">
          {t("conflictDay")}
        </legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: "all", label: t("allDays") },
            ...Array.from({ length: 7 }, (_, day) => ({
              value: String(day),
              label: new Intl.DateTimeFormat(locale, {
                weekday: "long",
                timeZone: "UTC",
              }).format(new Date(Date.UTC(2026, 0, 4 + day))),
            })),
          ].map((option) => (
            <Button
              key={option.value}
              variant={filters.day === option.value ? "primary" : "secondary"}
              size="sm"
              className="min-h-11 shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
              aria-pressed={filters.day === option.value}
              onClick={() => onChange({ ...filters, day: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p aria-live="polite" className="text-slate-600">
          {t("matchingGroups", { count })}
        </p>
        {(filters.search ||
          filters.type !== "all" ||
          filters.day !== "all") && (
          <Button
            variant="ghost"
            className="min-h-11 focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              onChange(emptyConflictFilters);
              searchRef.current?.focus();
            }}
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}
