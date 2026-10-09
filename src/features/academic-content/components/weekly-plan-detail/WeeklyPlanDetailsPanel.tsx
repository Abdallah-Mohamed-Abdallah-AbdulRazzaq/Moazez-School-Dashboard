"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { WeeklyPlanDetailDraftController } from "../../hooks/useWeeklyPlanDetailDraft";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentDetail,
  AcademicContentTagInput,
  UpdateAcademicContentRequest,
} from "../../types/contracts";
import BasicInformationSection from "../editor/BasicInformationSection";
import TagsSection from "../editor/TagsSection";

type WeeklyPlanContent = Extract<
  AcademicContentDetail,
  { type: "WEEKLY_PLAN" }
>;

interface WeeklyPlanDetailsPanelProps {
  content: WeeklyPlanContent;
  controller: WeeklyPlanDetailDraftController;
  disabled: boolean;
  termBounds?: { startDate: string; endDate: string };
  metadataState: AcademicContentEditorSectionState;
  detailState: AcademicContentEditorSectionState;
  tagsState: AcademicContentEditorSectionState;
  onMetadataDirtyChange: (dirty: boolean) => void;
  onSaveMetadata: (request: UpdateAcademicContentRequest) => Promise<boolean>;
  onTagsDirty: () => void;
  onSaveTags: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

export default function WeeklyPlanDetailsPanel(
  props: WeeklyPlanDetailsPanelProps,
) {
  const t = useAcademicContentTranslations("weekly_plan_detail.details");
  const validationMessage = props.controller.validationError
    ? t(`errors.${props.controller.validationError}`)
    : props.detailState.error?.message;

  return (
    <div className="space-y-4">
      <BasicInformationSection
        content={props.content}
        disabled={props.disabled}
        sectionState={props.metadataState}
        onDirtyChange={props.onMetadataDirtyChange}
        onSave={props.onSaveMetadata}
      />
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("week_settings")}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t("week_settings_description")}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label={t("week_start")}
            type="date"
            value={props.controller.draft.weekStartDate}
            min={props.termBounds?.startDate}
            max={props.termBounds?.endDate}
            disabled={props.disabled}
            onChange={(event) =>
              props.controller.update("weekStartDate", event.target.value)
            }
          />
          <Input
            label={t("week_end")}
            type="date"
            value={props.controller.draft.weekEndDate}
            min={props.termBounds?.startDate}
            max={props.termBounds?.endDate}
            disabled={props.disabled}
            onChange={(event) =>
              props.controller.update("weekEndDate", event.target.value)
            }
          />
        </div>
        {validationMessage ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {validationMessage}
          </p>
        ) : null}
        {!props.disabled ? (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              loading={props.detailState.saving}
              disabled={!props.detailState.dirty}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void props.controller.save()}
            >
              {t("save_week")}
            </Button>
          </div>
        ) : null}
      </section>
      <TagsSection
        key={JSON.stringify(props.content.tags)}
        initial={props.content.tags}
        disabled={props.disabled}
        sectionState={props.tagsState}
        onDirty={props.onTagsDirty}
        onSave={props.onSaveTags}
      />
    </div>
  );
}
