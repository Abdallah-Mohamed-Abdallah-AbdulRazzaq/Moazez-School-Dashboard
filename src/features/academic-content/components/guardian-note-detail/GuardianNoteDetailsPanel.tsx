"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Select from "@/components/ui/input/Select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import {
  emptyGuardianNoteDetail,
  isGuardianNoteBodyValid,
  normalizeGuardianNoteDetail,
} from "../../model/guardianNoteDetail";
import {
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  type AcademicContentDetail,
  type AcademicContentGuardianNoteDetail,
  type AcademicContentTagInput,
  type AcademicGuardianNotePriority,
  type UpdateAcademicContentRequest,
} from "../../types/contracts";
import BasicInformationSection from "../editor/BasicInformationSection";
import TagsSection from "../editor/TagsSection";

type GuardianNoteContent = Extract<
  AcademicContentDetail,
  { type: "GUARDIAN_WEEKLY_NOTE" }
>;

interface GuardianNoteDetailsPanelProps {
  content: GuardianNoteContent;
  disabled: boolean;
  metadataState: AcademicContentEditorSectionState;
  detailState: AcademicContentEditorSectionState;
  tagsState: AcademicContentEditorSectionState;
  onMetadataDirtyChange: (dirty: boolean) => void;
  onSaveMetadata: (request: UpdateAcademicContentRequest) => Promise<boolean>;
  onDetailDirty: () => void;
  onSaveDetail: (detail: AcademicContentGuardianNoteDetail) => Promise<boolean>;
  onTagsDirty: () => void;
  onSaveTags: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

export default function GuardianNoteDetailsPanel(
  props: GuardianNoteDetailsPanelProps,
) {
  const t = useAcademicContentTranslations("guardian_note_detail.details");
  const commonT = useAcademicContentTranslations();
  const [detail, setDetail] = useState(
    props.content.details ?? emptyGuardianNoteDetail(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const contentVersion = `${props.content.id}:${props.content.updatedAt}`;
  const [syncedContentVersion, setSyncedContentVersion] =
    useState(contentVersion);

  if (!props.detailState.dirty && syncedContentVersion !== contentVersion) {
    setSyncedContentVersion(contentVersion);
    setDetail(props.content.details ?? emptyGuardianNoteDetail());
    setValidationError(null);
  }

  const update = <K extends keyof AcademicContentGuardianNoteDetail>(
    field: K,
    value: AcademicContentGuardianNoteDetail[K],
  ) => {
    setDetail((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    props.onDetailDirty();
  };

  const save = async () => {
    if (!isGuardianNoteBodyValid(detail.body)) {
      setValidationError(t("body_required"));
      return;
    }
    setValidationError(null);
    await props.onSaveDetail(normalizeGuardianNoteDetail(detail));
  };

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t("description")}</p>
          </div>
          {props.detailState.dirty && !props.disabled ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              {commonT("metadata.unsaved")}
            </span>
          ) : null}
        </div>

        {validationError || props.detailState.error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {validationError ?? props.detailState.error?.message}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <RichTextEditor
            label={t("body")}
            value={detail.body}
            maxLength={10000}
            disabled={props.disabled}
            onChange={(value) => update("body", value)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label={t("priority")}
              triggerAriaLabel={t("priority")}
              value={detail.priority}
              options={ACADEMIC_GUARDIAN_NOTE_PRIORITIES.map((priority) => ({
                value: priority,
                label: commonT(`priorities.${priority}`),
              }))}
              disabled={props.disabled}
              onChange={(value) =>
                update("priority", value as AcademicGuardianNotePriority)
              }
            />
            <Checkbox
              label={t("acknowledgement")}
              description={t("acknowledgement_description")}
              checked={detail.requiresAcknowledgement}
              disabled={props.disabled}
              onChange={(event) =>
                update("requiresAcknowledgement", event.target.checked)
              }
            />
          </div>
        </div>

        {!props.disabled ? (
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              loading={props.detailState.saving}
              disabled={!props.detailState.dirty}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void save()}
            >
              {t("save")}
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
