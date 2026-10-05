"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";
import OrderedTextList from "../editor/details/OrderedTextList";

type OrderedField = "objectives" | "learningOutcomes" | "teachingStrategies" | "activities";

interface TeacherPreparationOrderedListPanelProps {
  title: string;
  description: string;
  itemLabel: string;
  saveLabel: string;
  emptyItemError: string;
  field: OrderedField;
  controller: TeacherPreparationDetailDraftController;
  sectionState: AcademicContentEditorSectionState;
  disabled: boolean;
}

export default function TeacherPreparationOrderedListPanel({
  title,
  description,
  itemLabel,
  saveLabel,
  emptyItemError,
  field,
  controller,
  sectionState,
  disabled,
}: TeacherPreparationOrderedListPanelProps) {
  const values: string[] = controller.draft[field];
  const errorMessage = controller.validationError === "empty_items"
    ? emptyItemError
    : sectionState.error?.message;

  const updateValues = (nextValues: string[]) => {
    controller.update(field, nextValues);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {errorMessage ? <p role="alert" className="mt-4 text-sm text-red-700">{errorMessage}</p> : null}
      <div className="mt-5">
        <OrderedTextList
          label={itemLabel}
          values={values}
          disabled={disabled}
          onChange={updateValues}
        />
      </div>
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
