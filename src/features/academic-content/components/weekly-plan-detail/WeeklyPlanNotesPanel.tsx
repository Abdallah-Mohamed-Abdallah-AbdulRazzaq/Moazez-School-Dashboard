"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { WeeklyPlanDetailDraftController } from "../../hooks/useWeeklyPlanDetailDraft";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";

interface WeeklyPlanNotesPanelProps {
  title: string;
  description: string;
  fieldLabel: string;
  saveLabel: string;
  controller: WeeklyPlanDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  disabled: boolean;
}

export default function WeeklyPlanNotesPanel(props: WeeklyPlanNotesPanelProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{props.title}</h2>
      <p className="mt-1 text-sm text-gray-500">{props.description}</p>
      <div className="mt-5">
        <RichTextEditor
          label={props.fieldLabel}
          value={props.controller.draft.notes ?? ""}
          maxLength={4000}
          disabled={props.disabled}
          onChange={(markdown) => props.controller.update("notes", markdown)}
        />
      </div>
      {props.sectionState.error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {props.sectionState.error.message}
        </p>
      ) : null}
      {!props.disabled ? (
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            loading={props.sectionState.saving}
            disabled={!props.sectionState.dirty}
            leftIcon={<Save aria-hidden="true" className="size-4" />}
            onClick={() => void props.controller.save()}
          >
            {props.saveLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
