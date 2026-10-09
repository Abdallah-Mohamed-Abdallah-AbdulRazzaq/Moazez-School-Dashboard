"use client";

import BasicInformationSection from "../editor/BasicInformationSection";
import TagsSection from "../editor/TagsSection";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import { useAcademicContentTranslations } from "../../hooks/useAcademicContentTranslations";
import type {
  AcademicContentDetail,
  AcademicContentTagInput,
  UpdateAcademicContentRequest,
} from "../../types/contracts";

type Content = Extract<AcademicContentDetail, { type: "GENERAL_RESOURCE" }>;

interface Props {
  content: Content;
  academicYearName: string;
  termName: string;
  disabled: boolean;
  metadataState: AcademicContentEditorSectionState;
  tagsState: AcademicContentEditorSectionState;
  onMetadataDirtyChange: (dirty: boolean) => void;
  onSaveMetadata: (request: UpdateAcademicContentRequest) => Promise<boolean>;
  onTagsDirty: () => void;
  onSaveTags: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

function ContextValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export default function GeneralResourceOverview(props: Props) {
  const t = useAcademicContentTranslations("general_resource_detail.overview");
  const commonT = useAcademicContentTranslations();
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-3">
          <ContextValue
            label={t("content_type")}
            value={commonT("types.GENERAL_RESOURCE")}
          />
          <ContextValue
            label={t("academic_year")}
            value={props.academicYearName}
          />
          <ContextValue label={t("term")} value={props.termName} />
        </dl>
      </section>
      <BasicInformationSection
        content={props.content}
        disabled={props.disabled}
        sectionState={props.metadataState}
        onDirtyChange={props.onMetadataDirtyChange}
        onSave={props.onSaveMetadata}
      />
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
