"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";

type NotesField = "resourceNotes" | "assessmentNotes" | "teacherNotes";

interface TeacherPreparationNotesPanelProps {
  title: string;
  description: string;
  fieldLabel: string;
  saveLabel: string;
  field: NotesField;
  controller: TeacherPreparationDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  disabled: boolean;
}

export default function TeacherPreparationNotesPanel({
  title,
  description,
  fieldLabel,
  saveLabel,
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
        <TextArea
          label={fieldLabel}
          aria-label={fieldLabel}
          value={value}
          rows={8}
          maxLength={4000}
          disabled={disabled}
          helperText={`${value.length}/4000`}
          onChange={(event) => controller.update(field, event.target.value)}
        />
      </div>
      {sectionState.error ? <p role="alert" className="mt-4 text-sm text-red-700">{sectionState.error.message}</p> : null}
      {!disabled ? (
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            loading={sectionState.saving}
            disabled={!sectionState.dirty}
            leftIcon={<Save aria-hidden="true" className="size-4" />}
            onClick={() => void controller.save()}
          >
            {saveLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
