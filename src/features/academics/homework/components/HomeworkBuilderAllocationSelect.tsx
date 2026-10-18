"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { fetchTeacherAllocations, fetchTeachers } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import type { HomeworkAssignmentUiModel } from "../services/homeworkApi.types";
import { buildAllocationOptions } from "../utils/homeworkAllocationOptions";
import type { HomeworkAllocationOption } from "../utils/homeworkAllocationPicker";

interface HomeworkBuilderAllocationSelectProps {
  homework: HomeworkAssignmentUiModel;
  value: string;
  disabled: boolean;
  onChange: (option: HomeworkAllocationOption) => void;
}

export default function HomeworkBuilderAllocationSelect({ homework, value, disabled, onChange }: HomeworkBuilderAllocationSelectProps) {
  const locale = useLocale();
  const t = useTranslations("academics.homework.create");
  const tBuilder = useTranslations("academics.homework.builder");
  const [options, setOptions] = useState<HomeworkAllocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const { academicYearId, termId } = homework;

  useEffect(() => {
    if (disabled || !academicYearId || !termId) return;
    let active = true;
    async function loadOptions() {
      setLoading(true);
      setFailed(false);
      try {
        const [structure, subjects, teachers, allocations] = await Promise.all([
          fetchStructureTree(academicYearId!, termId!), fetchSubjects(),
          fetchTeachers(), fetchTeacherAllocations(termId!),
        ]);
        if (active) setOptions(buildAllocationOptions({ structure, subjects, teachers, allocations, locale }));
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOptions();
    return () => { active = false; };
  }, [academicYearId, termId, disabled, locale, retry]);

  const currentOption = {
    value: homework.teacherSubjectAllocationId || "",
    label: [homework.teacherName, homework.subjectName, homework.classroomName].filter(Boolean).join(" - ") || homework.teacherSubjectAllocationId || "",
    disabled: true,
  };
  const displayedOptions = options.some(option => option.value === currentOption.value)
    ? options : [currentOption, ...options];

  return <div className="space-y-3 border-b border-gray-200 pb-5">
    <Select
      label={t("fields.teacherSubjectAllocation")} required searchable
      value={value} options={displayedOptions}
      disabled={disabled || loading || failed || options.length === 0 || !academicYearId || !termId}
      onChange={allocationId => {
        const option = options.find(candidate => candidate.value === allocationId);
        if (option) onChange(option);
      }}
      placeholder={t("placeholders.teacherSubjectAllocation")}
      searchPlaceholder={t("placeholders.searchAllocation")}
      noOptionsText={t("messages.noAllocations")}
      noResultsText={t("messages.noAllocationResults")}
      helperText={tBuilder("allocationChangeHelp")}
    />
    {!disabled && !loading && !failed && options.length === 0 && <p role="status" className="text-sm text-gray-600">{t("messages.noAllocations")}</p>}
    {failed ? <div role="alert" className="text-sm text-red-700">
      <p>{t("errors.allocationsLoadFailed")}</p>
      <Button variant="secondary" size="sm" disabled={disabled} onClick={() => setRetry(current => current + 1)}>{t("actions.retry")}</Button>
    </div> : loading && !disabled && <p role="status" className="text-sm text-gray-600">{t("messages.loadingAllocations")}</p>}
  </div>;
}
