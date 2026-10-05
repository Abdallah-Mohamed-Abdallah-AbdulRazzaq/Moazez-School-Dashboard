"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import type { WeeklyPlanDetailDraftController } from "../../hooks/useWeeklyPlanDetailDraft";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import OrderedTextList from "../editor/details/OrderedTextList";

interface WeeklyPlanOrderedListPanelProps {
  title: string;
  description: string;
  saveLabel: string;
  field: "objectives" | "topics";
  controller: WeeklyPlanDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  disabled: boolean;
  emptyItemError: string;
}

export default function WeeklyPlanOrderedListPanel(
  props: WeeklyPlanOrderedListPanelProps,
) {
  const error =
    props.controller.validationError === "empty_items"
      ? props.emptyItemError
      : props.sectionState.error?.message;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{props.title}</h2>
      <p className="mt-1 text-sm text-gray-500">{props.description}</p>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5">
        <OrderedTextList
          label={props.title}
          values={props.controller.draft[props.field]}
          disabled={props.disabled}
          onChange={(rows) => props.controller.update(props.field, rows)}
        />
      </div>
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
