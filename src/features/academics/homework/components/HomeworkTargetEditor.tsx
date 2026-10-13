"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import { fetchEnrollments } from "@/features/students-guardians/enrollments/services/enrollmentsApiService";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import type {
  HomeworkAssignmentUiModel,
  HomeworkTargetUiModel,
} from "../services/homeworkApi.types";

interface StudentOption {
  id: string;
  name: string;
  number: string;
}

export interface HomeworkTargetDraft {
  targetMode: string;
  studentIds: string[];
}

interface HomeworkTargetEditorProps {
  homework: HomeworkAssignmentUiModel;
  targets: HomeworkTargetUiModel[];
  value: HomeworkTargetDraft;
  onChange: (value: HomeworkTargetDraft) => void;
  disabled: boolean;
}

async function loadEligibleStudents(homework: HomeworkAssignmentUiModel, locale: string): Promise<StudentOption[]> {
  const [enrollments, students] = await Promise.all([
    fetchEnrollments({ academicYearId: homework.academicYearId, status: "active" }),
    fetchAllStudents(),
  ]);
  const eligibleIds = new Set(enrollments
    .filter((item) => item.status === "active" && item.classroomId === homework.classroomId)
    .map((item) => item.studentId));
  return students.filter((student) => eligibleIds.has(student.id)).map((student) => ({
    id: student.id,
    name: (locale === "ar"
      ? student.full_name_ar || student.full_name_en
      : student.full_name_en || student.full_name_ar) || student.name || student.id,
    number: student.student_id || student.id,
  }));
}

export default function HomeworkTargetEditor({
  homework, targets, value, onChange, disabled,
}: HomeworkTargetEditorProps) {
  const t = useTranslations("academics.homework.create");
  const locale = useLocale();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (disabled || value.targetMode !== "selected_students") return;
    let active = true;
    async function load() {
      setLoading(true);
      setFailed(false);
      try {
        const eligible = await loadEligibleStudents(homework, locale);
        if (active) setStudents(eligible);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [disabled, homework, locale, retry, value.targetMode]);

  // Preserve existing targets even when an enrollment is no longer eligible.
  const options = [...students, ...targets
    .filter((target) => !students.some((student) => student.id === target.studentId))
    .map((target) => ({ id: target.studentId, name: target.studentName, number: target.studentId }))];
  const filtered = options.filter((student) =>
    `${student.name} ${student.number}`.toLowerCase().includes(search.trim().toLowerCase()));
  const toggle = (id: string) => onChange({
    ...value,
    studentIds: value.studentIds.includes(id)
      ? value.studentIds.filter((studentId) => studentId !== id)
      : [...value.studentIds, id],
  });

  return (
    <fieldset disabled={disabled} className="space-y-3 border-b border-gray-200 pb-5">
      <Select
        label={t("fields.targetMode")}
        value={value.targetMode}
        disabled={disabled}
        onChange={(targetMode) => onChange({ ...value, targetMode })}
        options={[
          { value: "classroom", label: t("targetModes.classroom") },
          { value: "selected_students", label: t("targetModes.selectedStudents") },
        ]}
      />
      {value.targetMode === "selected_students" && <>
        <Input
          aria-label={t("targets.searchStudents")}
          placeholder={t("targets.searchStudents")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled || loading || failed}
        />
        {failed ? <div role="alert" className="text-sm text-red-700">
          <p>{t("errors.studentsLoadFailed")}</p>
          <Button variant="secondary" size="sm" onClick={() => setRetry((current) => current + 1)}>
            {t("actions.retry")}
          </Button>
        </div> : loading && !disabled ? <p role="status">{t("targets.loading")}</p> : <>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm"
              disabled={disabled || options.length === 0 || options.length > 500}
              onClick={() => onChange({ ...value, studentIds: options.map((student) => student.id) })}
            >{t("targets.selectAll")}</Button>
            <Button
              variant="secondary" size="sm"
              disabled={disabled || value.studentIds.length === 0}
              onClick={() => onChange({ ...value, studentIds: [] })}
            >{t("targets.clear")}</Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filtered.map((student) => <Checkbox
              key={student.id}
              label={student.name}
              description={student.number}
              checked={value.studentIds.includes(student.id)}
              disabled={disabled || (!value.studentIds.includes(student.id) && value.studentIds.length >= 500)}
              onChange={() => toggle(student.id)}
            />)}
            {filtered.length === 0 && <p className="text-sm text-gray-500">
              {t(options.length === 0 ? "targets.noStudents" : "targets.noStudentResults")}
            </p>}
          </div>
        </>}
        <p className="text-xs text-gray-500">{t("targets.selectedCount", { count: value.studentIds.length })}</p>
      </>}
    </fieldset>
  );
}
