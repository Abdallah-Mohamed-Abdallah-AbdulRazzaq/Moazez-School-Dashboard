"use client";

import { useState } from "react";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import type {
  AcademicContentWeeklyPlanDetail,
  ReplaceAcademicContentWeeklyPlanDetailRequest,
} from "../../../types/contracts";
import {
  EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import { ReferenceChecklist } from "./AcademicReferenceFields";
import DetailFormShell, { normalizeOrderedText } from "./DetailFormShell";
import OrderedTextList from "./OrderedTextList";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

interface WeeklyPlanFormProps {
  initial: AcademicContentWeeklyPlanDetail;
  termStartDate?: string;
  termEndDate?: string;
  options?: AcademicContentDetailOptions;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (request: ReplaceAcademicContentWeeklyPlanDetailRequest) => Promise<boolean>;
}

export default function WeeklyPlanForm({
  initial,
  termStartDate,
  termEndDate,
  options = EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  disabled,
  sectionState,
  onDirty,
  onSave,
}: WeeklyPlanFormProps) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useAcademicContentTranslations();
  const update = <K extends keyof AcademicContentWeeklyPlanDetail>(
    field: K,
    value: AcademicContentWeeklyPlanDetail[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    onDirty();
  };

  const save = async () => {
    if (!form.weekStartDate || !form.weekEndDate || form.weekStartDate > form.weekEndDate) {
      setValidationError(t("details.date_order"));
      return;
    }
    if (
      (termStartDate && form.weekStartDate < termStartDate) ||
      (termEndDate && form.weekEndDate > termEndDate)
    ) {
      setValidationError(t("details.term_bounds"));
      return;
    }
    if ([...form.objectives, ...form.topics].some((value) => !value.trim())) {
      setValidationError(t("details.empty_items"));
      return;
    }
    setValidationError(null);
    await onSave({
      weekStartDate: form.weekStartDate,
      weekEndDate: form.weekEndDate,
      objectives: normalizeOrderedText(form.objectives),
      topics: normalizeOrderedText(form.topics),
      expectedHomework: form.expectedHomework?.trim() || null,
      upcomingAssessments: form.upcomingAssessments?.trim() || null,
      notes: form.notes?.trim() || null,
      homeworkAssignmentIds: [...new Set(form.homeworkAssignmentIds)],
      gradeAssessmentIds: [...new Set(form.gradeAssessmentIds)],
    });
  };

  return (
    <DetailFormShell
      title={t("details.weekly_title")}
      description={t("details.weekly_description")}
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("fields.week_start")} aria-label={t("fields.week_start")} type="date" value={form.weekStartDate} min={termStartDate} max={termEndDate} required disabled={disabled} onChange={(event) => update("weekStartDate", event.target.value)} />
        <Input label={t("fields.week_end")} aria-label={t("fields.week_end")} type="date" value={form.weekEndDate} min={termStartDate} max={termEndDate} required disabled={disabled} onChange={(event) => update("weekEndDate", event.target.value)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <OrderedTextList label={t("fields.objectives")} values={form.objectives} disabled={disabled} onChange={(value) => update("objectives", value)} />
        <OrderedTextList label={t("fields.topics")} values={form.topics} disabled={disabled} onChange={(value) => update("topics", value)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <TextArea label={t("fields.expected_homework")} aria-label={t("fields.expected_homework")} value={form.expectedHomework ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("expectedHomework", event.target.value)} />
        <TextArea label={t("fields.upcoming_assessments")} aria-label={t("fields.upcoming_assessments")} value={form.upcomingAssessments ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("upcomingAssessments", event.target.value)} />
        <TextArea label={t("fields.notes")} aria-label={t("fields.notes")} value={form.notes ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("notes", event.target.value)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReferenceChecklist label={t("fields.homework_assignments")} values={form.homeworkAssignmentIds} options={options.homeworkAssignments.map((homework) => ({ value: homework.id, label: homework.title }))} disabled={disabled} onChange={(value) => update("homeworkAssignmentIds", value)} />
        <ReferenceChecklist label={t("fields.grade_assessments")} values={form.gradeAssessmentIds} options={options.assessments.map((assessment) => ({ value: assessment.id, label: assessment.title }))} disabled={disabled} onChange={(value) => update("gradeAssessmentIds", value)} />
      </div>
    </DetailFormShell>
  );
}
