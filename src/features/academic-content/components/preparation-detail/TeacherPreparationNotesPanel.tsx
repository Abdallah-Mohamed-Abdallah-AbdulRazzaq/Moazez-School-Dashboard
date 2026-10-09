"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";

type NotesField = "resourceNotes" | "assessmentNotes" | "teacherNotes";

interface TeacherPreparationNotesPanelProps {
  title: string;
  description: string;
  fieldLabel: string;
  field: NotesField;
  controller: TeacherPreparationDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  disabled: boolean;
}

export default function TeacherPreparationNotesPanel({
  title,
  description,
  fieldLabel,
  field,
  controller,
  sectionState,
  disabled,
}: TeacherPreparationNotesPanelProps) {
  const value = controller.draft[field] ?? "";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <div className="mt-5">
        <RichTextEditor
          label={fieldLabel}
          value={value}
          maxLength={4000}
          disabled={disabled}
          onChange={(nextValue) => controller.update(field, nextValue)}
        />
      </div>
      {sectionState.error ? <p role="alert" className="mt-4 text-sm text-red-700">{sectionState.error.message}</p> : null}
    </section>
  );
}
