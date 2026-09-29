"use client";

import { useState } from "react";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import type {
  AcademicContentPreparationDetail,
  ReplaceAcademicContentPreparationDetailRequest,
} from "../../../types/contracts";
import {
  EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import { OptionalReferenceSelect } from "./AcademicReferenceFields";
import DetailFormShell, { normalizeOrderedText } from "./DetailFormShell";
import OrderedTextList from "./OrderedTextList";

interface TeacherPreparationFormProps {
  initial: AcademicContentPreparationDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  options?: AcademicContentDetailOptions;
  onDirty: () => void;
  onSave: (request: ReplaceAcademicContentPreparationDetailRequest) => Promise<boolean>;
}

export default function TeacherPreparationForm({
  initial,
  disabled,
  sectionState,
  options = EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  onDirty,
  onSave,
}: TeacherPreparationFormProps) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const selectedCurriculum = options.curricula.find(
    (curriculum) => curriculum.id === form.curriculumId,
  );
  const selectedUnit = selectedCurriculum?.units.find(
    (unit) => unit.id === form.curriculumUnitId,
  );
  const availableLessonPlans = options.lessonPlans.filter(
    (plan) => !form.curriculumId || plan.curriculumId === form.curriculumId,
  );
  const selectedLessonPlan = availableLessonPlans.find(
    (plan) => plan.id === form.lessonPlanId,
  );

  const update = <K extends keyof AcademicContentPreparationDetail>(
    field: K,
    value: AcademicContentPreparationDetail[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    onDirty();
  };

  const save = async () => {
    const lists = [
      form.objectives,
      form.learningOutcomes,
      form.teachingStrategies,
      form.activities,
    ];
    if (lists.some((values) => values.some((value) => !value.trim()))) {
      setValidationError("Remove or complete empty list items before saving.");
      return;
    }
    setValidationError(null);
    await onSave({
      topic: form.topic?.trim() || null,
      objectives: normalizeOrderedText(form.objectives),
      learningOutcomes: normalizeOrderedText(form.learningOutcomes),
      teachingStrategies: normalizeOrderedText(form.teachingStrategies),
      activities: normalizeOrderedText(form.activities),
      resourceNotes: form.resourceNotes?.trim() || null,
      assessmentNotes: form.assessmentNotes?.trim() || null,
      teacherNotes: form.teacherNotes?.trim() || null,
      curriculumId: form.curriculumId || null,
      curriculumUnitId: form.curriculumUnitId || null,
      curriculumLessonId: form.curriculumLessonId || null,
      lessonPlanId: form.lessonPlanId || null,
      lessonPlanItemId: form.lessonPlanItemId || null,
      timetableEntryId: form.timetableEntryId || null,
    });
  };

  return (
    <DetailFormShell
      title="Teacher preparation"
      description="Capture the instructional plan and optional academic references."
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <Input
        label="Topic"
        aria-label="Topic"
        value={form.topic ?? ""}
        maxLength={500}
        disabled={disabled}
        onChange={(event) => update("topic", event.target.value)}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <OrderedTextList label="Objectives" values={form.objectives} disabled={disabled} onChange={(value) => update("objectives", value)} />
        <OrderedTextList label="Learning outcomes" values={form.learningOutcomes} disabled={disabled} onChange={(value) => update("learningOutcomes", value)} />
        <OrderedTextList label="Teaching strategies" values={form.teachingStrategies} disabled={disabled} onChange={(value) => update("teachingStrategies", value)} />
        <OrderedTextList label="Activities" values={form.activities} disabled={disabled} onChange={(value) => update("activities", value)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <TextArea label="Resource notes" aria-label="Resource notes" value={form.resourceNotes ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("resourceNotes", event.target.value)} />
        <TextArea label="Assessment notes" aria-label="Assessment notes" value={form.assessmentNotes ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("assessmentNotes", event.target.value)} />
        <TextArea label="Teacher notes" aria-label="Teacher notes" value={form.teacherNotes ?? ""} maxLength={4000} disabled={disabled} onChange={(event) => update("teacherNotes", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OptionalReferenceSelect label="Curriculum" value={form.curriculumId} options={options.curricula.map((curriculum) => ({ value: curriculum.id, label: curriculum.title }))} disabled={disabled} onChange={(value) => {
          setForm((current) => ({ ...current, curriculumId: value, curriculumUnitId: null, curriculumLessonId: null, lessonPlanId: null, lessonPlanItemId: null }));
          onDirty();
        }} />
        <OptionalReferenceSelect label="Curriculum unit" value={form.curriculumUnitId} options={(selectedCurriculum?.units ?? []).map((unit) => ({ value: unit.id, label: unit.title }))} disabled={disabled || !form.curriculumId} onChange={(value) => {
          setForm((current) => ({ ...current, curriculumUnitId: value, curriculumLessonId: null }));
          onDirty();
        }} />
        <OptionalReferenceSelect label="Curriculum lesson" value={form.curriculumLessonId} options={(selectedUnit?.lessons ?? []).map((lesson) => ({ value: lesson.id, label: lesson.title }))} disabled={disabled || !form.curriculumUnitId} onChange={(value) => update("curriculumLessonId", value)} />
        <OptionalReferenceSelect label="Lesson plan" value={form.lessonPlanId} options={availableLessonPlans.map((plan) => ({ value: plan.id, label: plan.title }))} disabled={disabled} onChange={(value) => {
          setForm((current) => ({ ...current, lessonPlanId: value, lessonPlanItemId: null }));
          onDirty();
        }} />
        <OptionalReferenceSelect label="Lesson plan item" value={form.lessonPlanItemId} options={(selectedLessonPlan?.items ?? []).map((item) => ({ value: item.id, label: item.title || item.lessonTitle }))} disabled={disabled || !form.lessonPlanId} onChange={(value) => update("lessonPlanItemId", value)} />
        <OptionalReferenceSelect label="Timetable entry" value={form.timetableEntryId} options={options.timetableEntries.map((entry) => ({ value: entry.id, label: `${entry.classroom.nameEn} · ${entry.subject?.nameEn ?? "Unassigned"} · ${entry.period.label}` }))} disabled={disabled} onChange={(value) => update("timetableEntryId", value)} />
      </div>
    </DetailFormShell>
  );
}
