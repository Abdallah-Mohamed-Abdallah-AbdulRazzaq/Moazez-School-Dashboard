"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { WeeklyPlanDetailDraftController } from "../../hooks/useWeeklyPlanDetailDraft";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { WeeklyPlanDetailOptions } from "../../services/weeklyPlanDetailOptions";
import { ReferenceChecklist } from "../editor/details/AcademicReferenceFields";

interface WeeklyPlanReferenceNotesPanelProps {
  kind: "homework" | "assessments";
  title: string;
  description: string;
  notesLabel: string;
  referencesLabel: string;
  saveLabel: string;
  controller: WeeklyPlanDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  options: WeeklyPlanDetailOptions;
  disabled: boolean;
}

export default function WeeklyPlanReferenceNotesPanel(
  props: WeeklyPlanReferenceNotesPanelProps,
) {
  const isHomework = props.kind === "homework";
  const notesField = isHomework ? "expectedHomework" : "upcomingAssessments";
  const referencesField = isHomework
    ? "homeworkAssignmentIds"
    : "gradeAssessmentIds";
  const options = isHomework
    ? props.options.homeworkAssignments.map(({ id, title }) => ({
        value: id,
        label: title,
      }))
    : props.options.assessments.map(({ id, title }) => ({
        value: id,
        label: title,
      }));
  const loadError = isHomework
    ? props.options.errors.homeworkAssignments
    : props.options.errors.assessments;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{props.title}</h2>
      <p className="mt-1 text-sm text-gray-500">{props.description}</p>
      {loadError ? (
        <p role="alert" className="mt-4 text-sm text-amber-700">
          {loadError.message}
        </p>
      ) : null}
      <div className="mt-5 space-y-5">
        <RichTextEditor
          label={props.notesLabel}
          value={props.controller.draft[notesField] ?? ""}
          maxLength={4000}
          disabled={props.disabled}
          onChange={(markdown) => props.controller.update(notesField, markdown)}
        />
        <ReferenceChecklist
          label={props.referencesLabel}
          values={props.controller.draft[referencesField]}
          options={options}
          disabled={props.disabled}
          onChange={(ids) => props.controller.update(referencesField, ids)}
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
