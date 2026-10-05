"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { TeacherPreparationDetailDraftController } from "../../hooks/useTeacherPreparationDetailDraft";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type { AcademicContentDetail, AcademicContentLinkInput } from "../../types/contracts";
import FilesSection from "../editor/FilesSection";
import LinksSection from "../editor/LinksSection";

type PreparationContent = Extract<AcademicContentDetail, { type: "TEACHER_PREPARATION" }>;

interface TeacherPreparationResourcesProps {
  content: PreparationContent;
  controller: TeacherPreparationDetailDraftController;
  disabled: boolean;
  detailState: AcademicContentEditorSectionState;
  linksState: AcademicContentEditorSectionState;
  onLinksDirty: () => void;
  onSaveLinks: (links: AcademicContentLinkInput[]) => Promise<boolean>;
  onFilesChanged: () => Promise<unknown>;
}

export default function TeacherPreparationResources({
  content,
  controller,
  disabled,
  detailState,
  linksState,
  onLinksDirty,
  onSaveLinks,
  onFilesChanged,
}: TeacherPreparationResourcesProps) {
  const t = useAcademicContentTranslations("teacher_preparation_detail.resources");

  return (
    <div data-testid="preparation-resources" className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("notes")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("notes_description")}</p>
        <div className="mt-4">
          <TextArea
            label={t("notes_field")}
            aria-label={t("notes_field")}
            value={controller.draft.resourceNotes ?? ""}
            maxLength={4000}
            rows={6}
            disabled={disabled}
            helperText={`${controller.draft.resourceNotes?.length ?? 0}/4000`}
            onChange={(event) => controller.update("resourceNotes", event.target.value)}
          />
        </div>
        {detailState.error ? <p role="alert" className="mt-3 text-sm text-red-700">{detailState.error.message}</p> : null}
        {!disabled ? (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              loading={detailState.saving}
              disabled={!detailState.dirty}
              leftIcon={<Save aria-hidden="true" className="size-4" />}
              onClick={() => void controller.save()}
            >
              {t("save_notes")}
            </Button>
          </div>
        ) : null}
      </section>

      <FilesSection
        contentId={content.id}
        assets={content.assets}
        disabled={disabled}
        title={t("attachments")}
        description={t("attachments_description")}
        onFilesChanged={onFilesChanged}
      />

      <LinksSection
        key={JSON.stringify(content.links)}
        initial={content.links}
        disabled={disabled}
        sectionState={linksState}
        onDirty={onLinksDirty}
        onSave={onSaveLinks}
      />
    </div>
  );
}
