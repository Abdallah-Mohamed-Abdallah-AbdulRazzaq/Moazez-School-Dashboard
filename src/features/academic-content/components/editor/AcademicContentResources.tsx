"use client";

import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentDetail,
  AcademicContentLinkInput,
} from "../../types/contracts";
import type { AcademicContentFilePolicyState } from "../../hooks/useAcademicContentFilePolicy";
import FilesSection from "./FilesSection";
import LinksSection from "./LinksSection";

export interface AcademicContentResourcesProps {
  content: AcademicContentDetail;
  disabled: boolean;
  linksState: AcademicContentEditorSectionState;
  onLinksDirty: () => void;
  onSaveLinks: (links: AcademicContentLinkInput[]) => Promise<boolean>;
  onFilesChanged: () => Promise<unknown>;
  filePolicyState?: AcademicContentFilePolicyState;
  showRecipientAccessPolicy?: boolean;
}

export default function AcademicContentResources(
  props: AcademicContentResourcesProps,
) {
  return (
    <div className="space-y-4">
      <FilesSection
        contentId={props.content.id}
        assets={props.content.assets}
        disabled={props.disabled}
        onFilesChanged={props.onFilesChanged}
        policyState={props.filePolicyState}
        showRecipientAccessPolicy={props.showRecipientAccessPolicy}
      />
      <LinksSection
        key={JSON.stringify(props.content.links)}
        initial={props.content.links}
        disabled={props.disabled}
        sectionState={props.linksState}
        onDirty={props.onLinksDirty}
        onSave={props.onSaveLinks}
      />
    </div>
  );
}
