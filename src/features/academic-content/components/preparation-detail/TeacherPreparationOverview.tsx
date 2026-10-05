"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type {
  AcademicContentDetail,
  AcademicContentTagInput,
  UpdateAcademicContentRequest,
} from "../../types/contracts";
import BasicInformationSection from "../editor/BasicInformationSection";
import FilesSection from "../editor/FilesSection";
import TeacherPreparationKeyConcepts from "./TeacherPreparationKeyConcepts";

type PreparationContent = Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }>;

interface TeacherPreparationOverviewProps {
  content: PreparationContent;
  controller: TeacherPreparationDetailDraftController;
  disabled: boolean;
  metadataState: AcademicContentEditorSectionState;
  detailState: AcademicContentEditorSectionState;
  tagsState: AcademicContentEditorSectionState;
  onMetadataDirtyChange: (dirty: boolean) => void;
  onSaveMetadata: (request: UpdateAcademicContentRequest) => Promise<boolean>;
  onTagsDirty: () => void;
  onSaveTags: (tags: AcademicContentTagInput[]) => Promise<boolean>;
  onFilesChanged: () => Promise<unknown>;
}

export default function TeacherPreparationOverview({
  content,
  controller,
  disabled,
  metadataState,
  detailState,
  tagsState,
  onMetadataDirtyChange,
  onSaveMetadata,
  onTagsDirty,
  onSaveTags,
  onFilesChanged,
}: TeacherPreparationOverviewProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.overview");

  return (
    <div data-testid="preparation-overview" className="space-y-4">
      <BasicInformationSection
        content={content}
        disabled={disabled}
        sectionState={metadataState}
        onDirtyChange={onMetadataDirtyChange}
        onSave={onSaveMetadata}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Input
              label={t("topic")}
              aria-label={t("topic")}
              value={controller.draft.topic ?? ""}
              maxLength={500}
              disabled={disabled}
              onChange={(event) => controller.update("topic", event.target.value)}
            />
          </div>
          {!disabled ? (
            <Button
              type="button"
              loading={detailState.saving}
              disabled={!detailState.dirty}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void controller.save()}
            >
              {t("save_topic")}
            </Button>
          ) : null}
        </div>
        {detailState.error ? <p role="alert" className="mt-3 text-sm text-red-700">{detailState.error.message}</p> : null}

        <TeacherPreparationKeyConcepts
          tags={content.tags}
          disabled={disabled}
          sectionState={tagsState}
          onDirty={onTagsDirty}
          onSave={onSaveTags}
        />

        <div className="border-t border-gray-200">
          <FilesSection
            contentId={content.id}
            assets={content.assets}
            disabled={disabled}
            variant="embedded"
            title={t("attachments")}
            description={t("attachments_description")}
            onFilesChanged={onFilesChanged}
          />
        </div>
      </section>
    </div>
  );
}
