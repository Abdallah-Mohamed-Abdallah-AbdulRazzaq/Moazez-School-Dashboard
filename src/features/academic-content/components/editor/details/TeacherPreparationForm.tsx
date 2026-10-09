"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Input from "@/components/ui/input/Input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";
import { applyPreparationTemplate } from "../../../model/preparationTemplatePolicy";
import { localizedAcademicName } from "../../../model/academicContentDisplay";
import PreparationTemplatePicker from "../../templates/PreparationTemplatePicker";

interface TeacherPreparationFormProps {
  initial: AcademicContentPreparationDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  options?: AcademicContentDetailOptions;
  onDirty: () => void;
  onSave: (
    request: ReplaceAcademicContentPreparationDetailRequest,
  ) => Promise<boolean>;
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
  const t = useAcademicContentTranslations();
  const locale = useLocale();
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
      setValidationError(t("details.empty_items"));
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
      title={t("details.preparation_title")}
      description={t("details.preparation_description")}
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <PreparationTemplatePicker
        disabled={disabled}
        onApply={(template) => {
          setForm((current) => applyPreparationTemplate(current, template));
          setValidationError(null);
          onDirty();
        }}
      />
      <Input
        label={t("fields.topic")}
        aria-label={t("fields.topic")}
        value={form.topic ?? ""}
        maxLength={500}
        disabled={disabled}
        onChange={(event) => update("topic", event.target.value)}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <OrderedTextList
          label={t("fields.objectives")}
          values={form.objectives}
          disabled={disabled}
          onChange={(value) => update("objectives", value)}
        />
        <OrderedTextList
          label={t("fields.learning_outcomes")}
          values={form.learningOutcomes}
          disabled={disabled}
          onChange={(value) => update("learningOutcomes", value)}
        />
        <OrderedTextList
          label={t("fields.teaching_strategies")}
          values={form.teachingStrategies}
          disabled={disabled}
          onChange={(value) => update("teachingStrategies", value)}
        />
        <OrderedTextList
          label={t("fields.activities")}
          values={form.activities}
          disabled={disabled}
          onChange={(value) => update("activities", value)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RichTextEditor
          label={t("fields.resource_notes")}
          value={form.resourceNotes ?? ""}
          maxLength={4000}
          disabled={disabled}
          onChange={(value) => update("resourceNotes", value)}
        />
        <RichTextEditor
          label={t("fields.assessment_notes")}
          value={form.assessmentNotes ?? ""}
          maxLength={4000}
          disabled={disabled}
          onChange={(value) => update("assessmentNotes", value)}
        />
        <RichTextEditor
          label={t("fields.teacher_notes")}
          value={form.teacherNotes ?? ""}
          maxLength={4000}
          disabled={disabled}
          onChange={(value) => update("teacherNotes", value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OptionalReferenceSelect
          label={t("fields.curriculum")}
          value={form.curriculumId}
          options={options.curricula.map((curriculum) => ({
            value: curriculum.id,
            label: curriculum.title,
          }))}
          disabled={disabled}
          helperText={t("details.target_dependency_hint")}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              curriculumId: value,
              curriculumUnitId: null,
              curriculumLessonId: null,
              lessonPlanId: null,
              lessonPlanItemId: null,
            }));
            onDirty();
          }}
        />
        <OptionalReferenceSelect
          label={t("fields.curriculum_unit")}
          value={form.curriculumUnitId}
          options={(selectedCurriculum?.units ?? []).map((unit) => ({
            value: unit.id,
            label: unit.title,
          }))}
          disabled={disabled || !form.curriculumId}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              curriculumUnitId: value,
              curriculumLessonId: null,
            }));
            onDirty();
          }}
        />
        <OptionalReferenceSelect
          label={t("fields.curriculum_lesson")}
          value={form.curriculumLessonId}
          options={(selectedUnit?.lessons ?? []).map((lesson) => ({
            value: lesson.id,
            label: lesson.title,
          }))}
          disabled={disabled || !form.curriculumUnitId}
          onChange={(value) => update("curriculumLessonId", value)}
        />
        <OptionalReferenceSelect
          label={t("fields.lesson_plan")}
          value={form.lessonPlanId}
          options={availableLessonPlans.map((plan) => ({
            value: plan.id,
            label: plan.title,
          }))}
          disabled={disabled}
          helperText={t("details.target_dependency_hint")}
          onChange={(value) => {
            setForm((current) => ({
              ...current,
              lessonPlanId: value,
              lessonPlanItemId: null,
            }));
            onDirty();
          }}
        />
        <OptionalReferenceSelect
          label={t("fields.lesson_plan_item")}
          value={form.lessonPlanItemId}
          options={(selectedLessonPlan?.items ?? []).map((item) => ({
            value: item.id,
            label: item.title || item.lessonTitle,
          }))}
          disabled={disabled || !form.lessonPlanId}
          onChange={(value) => update("lessonPlanItemId", value)}
        />
        <OptionalReferenceSelect
          label={t("fields.timetable_entry")}
          value={form.timetableEntryId}
          options={options.timetableEntries.map((entry) => ({
            value: entry.id,
            label: `${localizedAcademicName(entry.classroom, locale)} · ${localizedAcademicName(entry.subject ?? undefined, locale) ?? t("common.unassigned")} · ${entry.period.label}`,
          }))}
          disabled={disabled}
          helperText={t("details.target_dependency_hint")}
          onChange={(value) => update("timetableEntryId", value)}
        />
      </div>
    </DetailFormShell>
  );
}
