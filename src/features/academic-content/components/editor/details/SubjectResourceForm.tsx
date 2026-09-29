"use client";

import { useState } from "react";
import Select from "@/components/ui/input/Select";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import {
  ACADEMIC_SUBJECT_RESOURCE_CATEGORIES,
  type AcademicContentSubjectResourceDetail,
  type AcademicSubjectResourceCategory,
  type ReplaceAcademicContentSubjectResourceDetailRequest,
} from "../../../types/contracts";
import {
  EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS,
  type AcademicContentDetailOptions,
} from "../../../services/academicContentDetailOptions";
import { OptionalReferenceSelect } from "./AcademicReferenceFields";
import DetailFormShell from "./DetailFormShell";

interface SubjectResourceFormProps {
  initial: AcademicContentSubjectResourceDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  options?: AcademicContentDetailOptions;
  onDirty: () => void;
  onSave: (request: ReplaceAcademicContentSubjectResourceDetailRequest) => Promise<boolean>;
}

export default function SubjectResourceForm({ initial, disabled, sectionState, options = EMPTY_ACADEMIC_CONTENT_DETAIL_OPTIONS, onDirty, onSave }: SubjectResourceFormProps) {
  const [form, setForm] = useState(initial);
  const selectedCurriculum = options.curricula.find((item) => item.id === form.curriculumId);
  const selectedUnit = selectedCurriculum?.units.find((item) => item.id === form.curriculumUnitId);
  const update = <K extends keyof AcademicContentSubjectResourceDetail>(field: K, value: AcademicContentSubjectResourceDetail[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    onDirty();
  };
  return (
    <DetailFormShell title="Subject resource" description="The resource category is separate from any attached file type." disabled={disabled} sectionState={sectionState} validationError={null} onSave={() => void onSave({ ...form })}>
      <Select label="Resource category" triggerAriaLabel="Resource category" value={form.resourceCategory} options={ACADEMIC_SUBJECT_RESOURCE_CATEGORIES.map((category) => ({ value: category, label: category }))} required disabled={disabled} onChange={(value) => update("resourceCategory", value as AcademicSubjectResourceCategory)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <OptionalReferenceSelect label="Curriculum" value={form.curriculumId} options={options.curricula.map((item) => ({ value: item.id, label: item.title }))} disabled={disabled} onChange={(value) => {
          setForm((current) => ({ ...current, curriculumId: value, curriculumUnitId: null, curriculumLessonId: null }));
          onDirty();
        }} />
        <OptionalReferenceSelect label="Curriculum unit" value={form.curriculumUnitId} options={(selectedCurriculum?.units ?? []).map((item) => ({ value: item.id, label: item.title }))} disabled={disabled || !form.curriculumId} onChange={(value) => {
          setForm((current) => ({ ...current, curriculumUnitId: value, curriculumLessonId: null }));
          onDirty();
        }} />
        <OptionalReferenceSelect label="Curriculum lesson" value={form.curriculumLessonId} options={(selectedUnit?.lessons ?? []).map((item) => ({ value: item.id, label: item.title }))} disabled={disabled || !form.curriculumUnitId} onChange={(value) => update("curriculumLessonId", value)} />
      </div>
    </DetailFormShell>
  );
}
