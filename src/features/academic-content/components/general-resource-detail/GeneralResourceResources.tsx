"use client";

import AcademicContentResources from "../editor/AcademicContentResources";
import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type { AcademicContentFilePolicyState } from "../../hooks/useAcademicContentFilePolicy";
import type {
  AcademicContentDetail,
  AcademicContentLinkInput,
} from "../../types/contracts";

interface Props {
  content: Extract<AcademicContentDetail, { type: "GENERAL_RESOURCE" }>;
  disabled: boolean;
  linksState: AcademicContentEditorSectionState;
  filePolicyState: AcademicContentFilePolicyState;
  onLinksDirty: () => void;
  onSaveLinks: (links: AcademicContentLinkInput[]) => Promise<boolean>;
  onFilesChanged: () => Promise<unknown>;
}

export default function GeneralResourceResources(props: Props) {
  return (
    <AcademicContentResources
      {...props}
      filePolicyState={props.filePolicyState}
      showRecipientAccessPolicy
    />
  );
}
