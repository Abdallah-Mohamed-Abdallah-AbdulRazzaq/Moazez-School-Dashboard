"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Layers3, Search } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { StructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import {
  HOMEWORK_ALLOCATION_LEVELS, homeworkAllocationChoices, homeworkAllocationFilters,
  homeworkAllocationPaths, homeworkAllocationsMatchingPath, nextHomeworkAllocationFilters,
  type HomeworkAllocationLevel, type HomeworkAllocationOption,
} from "../utils/homeworkAllocationPicker";

interface HomeworkAllocationPickerProps {
  options: HomeworkAllocationOption[];
  structure: StructureTree;
  value: string;
  disabled: boolean;
  loading: boolean;
  onChange: (allocationId: string) => void;
}

export default function HomeworkAllocationPicker(props: HomeworkAllocationPickerProps) {
  const t = useTranslations("academics.homework.create");
  const locale = useLocale();
  const [mode, setMode] = useState<"quick" | "structure">("quick");
  const [filters, setFilters] = useState(homeworkAllocationFilters);
  const paths = homeworkAllocationPaths(props.options, props.structure);
  const selectedPath = paths.find(path => path.option.value === props.value);
  const matching = homeworkAllocationsMatchingPath(paths, filters);
  const structured = mode === "structure";

  function chooseMode() {
    if (props.disabled) return;
    if (!structured) setFilters(homeworkAllocationFilters(selectedPath));
    setMode(structured ? "quick" : "structure");
  }

  function chooseLevel(level: HomeworkAllocationLevel, id: string) {
    if (props.disabled) return;
    const next = nextHomeworkAllocationFilters(filters, level, id);
    setFilters(next);
    const allocations = homeworkAllocationsMatchingPath(paths, next);
    props.onChange(allocations.length === 1 ? allocations[0].value : "");
  }

  const modeToggle = <Button variant="ghost" size="sm" className="min-h-11 ms-auto" leftIcon={structured ? <Search size={16} /> : <Layers3 size={16} />} aria-expanded={structured} disabled={props.disabled} onClick={chooseMode}>{t(structured ? "picker.quickSearch" : "picker.browseStructure")}</Button>;

  return <div className={`min-w-0 space-y-3 ${structured ? "md:col-span-2" : ""}`}>
    {structured && <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-gray-700">{t("fields.teacherSubjectAllocation")}</h3>
      {modeToggle}
    </div>}
    {!structured ? <><Select
      label={t("fields.teacherSubjectAllocation")} required searchable value={props.value} onChange={props.onChange}
      options={props.options} placeholder={t("placeholders.teacherSubjectAllocation")} searchPlaceholder={t("placeholders.searchAllocation")}
      noOptionsText={t(props.loading ? "messages.loadingAllocations" : "messages.noAllocations")}
      noResultsText={t("messages.noAllocationResults")} disabled={props.disabled} helperText={t("helpers.teacherSubjectAllocation")}
    /><div className="flex justify-end">{modeToggle}</div></> : <div role="group" aria-label={t("picker.browseStructure")} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <p className="text-sm text-gray-600">{t("picker.help")}</p>
      {!paths.length && <p role="status" className="text-sm text-gray-600">{t("picker.noPaths")}</p>}
      {props.value && !selectedPath && <p role="status" className="text-sm text-amber-800">{t("picker.outsideStructure")}</p>}
      <div className="grid gap-4 md:grid-cols-2 [&>div]:min-w-0">
        {HOMEWORK_ALLOCATION_LEVELS.map((level, index) => <Select key={level}
          label={t(`picker.fields.${level}`)} placeholder={t(`picker.placeholders.${level}`)} required searchable
          value={filters[level]} onChange={id => chooseLevel(level, id)}
          options={homeworkAllocationChoices({ paths, filters, level, locale })}
          disabled={props.disabled || !paths.length || (index > 0 && !filters[HOMEWORK_ALLOCATION_LEVELS[index - 1]])}
          searchPlaceholder={t("picker.search")} noOptionsText={t("picker.noChoices")} noResultsText={t("messages.noAllocationResults")}
        />)}
        {matching.length > 1 && <Select label={t("picker.fields.teacher")} placeholder={t("picker.placeholders.teacher")} required searchable
          value={props.value} disabled={props.disabled} onChange={props.onChange}
          options={matching.map(option => ({ value: option.value, label: option.teacherLabel || t("targets.unknownTeacher") }))}
          helperText={t("picker.chooseTeacher")} searchPlaceholder={t("picker.search")} noResultsText={t("messages.noAllocationResults")}
        />}
      </div>
      {matching.length === 1 && <div role="status" className="rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm"><span className="text-gray-600">{t("picker.assignedTeacher")}: </span><span className="font-semibold text-gray-900">{matching[0].teacherLabel || t("targets.unknownTeacher")}</span></div>}
    </div>}
  </div>;
}
