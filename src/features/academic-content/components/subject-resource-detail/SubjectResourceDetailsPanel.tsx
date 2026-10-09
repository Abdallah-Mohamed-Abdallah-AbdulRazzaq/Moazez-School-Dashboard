"use client";

import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentDetail,
  AcademicContentTagInput,
  ReplaceAcademicContentSubjectResourceDetailRequest,
  UpdateAcademicContentRequest,
} from "../../types/contracts";
import type { AcademicContentDetailOptions } from "../../services/academicContentDetailOptions";
import { emptySubjectResourceDetail } from "../../model/subjectResourceDetail";
import BasicInformationSection from "../editor/BasicInformationSection";
import SubjectResourceForm from "../editor/details/SubjectResourceForm";
import TagsSection from "../editor/TagsSection";

type SubjectResourceContent = Extract<
  AcademicContentDetail,
  { type: "SUBJECT_RESOURCE" }
>;

interface SubjectResourceDetailsPanelProps {
  content: SubjectResourceContent;
  disabled: boolean;
  options: AcademicContentDetailOptions;
  metadataState: AcademicContentEditorSectionState;
  detailState: AcademicContentEditorSectionState;
  tagsState: AcademicContentEditorSectionState;
  onMetadataDirtyChange: (dirty: boolean) => void;
  onSaveMetadata: (request: UpdateAcademicContentRequest) => Promise<boolean>;
  onDetailDirty: () => void;
  onSaveDetail: (
    request: ReplaceAcademicContentSubjectResourceDetailRequest,
  ) => Promise<boolean>;
  onTagsDirty: () => void;
  onSaveTags: (tags: AcademicContentTagInput[]) => Promise<boolean>;
}

export default function SubjectResourceDetailsPanel(
  props: SubjectResourceDetailsPanelProps,
) {
  return (
    <div className="space-y-4">
      <BasicInformationSection
        content={props.content}
        disabled={props.disabled}
        sectionState={props.metadataState}
        onDirtyChange={props.onMetadataDirtyChange}
        onSave={props.onSaveMetadata}
      />
      <SubjectResourceForm
        initial={props.content.details ?? emptySubjectResourceDetail()}
        disabled={props.disabled}
        sectionState={props.detailState}
        options={props.options}
        onDirty={props.onDetailDirty}
        onSave={props.onSaveDetail}
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
