"use client";

import type { AcademicContentEditorSectionState } from "../../hooks/useAcademicContentEditor";
import type {
  AcademicContentDetail,
  AcademicContentLinkInput,
} from "../../types/contracts";
import FilesSection from "../editor/FilesSection";
import LinksSection from "../editor/LinksSection";

type WeeklyPlanContent = Extract<
  AcademicContentDetail,
  { type: "WEEKLY_PLAN" }
>;

interface WeeklyPlanResourcesProps {
  content: WeeklyPlanContent;
  disabled: boolean;
  linksState: AcademicContentEditorSectionState;
  onLinksDirty: () => void;
  onSaveLinks: (links: AcademicContentLinkInput[]) => Promise<boolean>;
  onFilesChanged: () => Promise<unknown>;
}

export default function WeeklyPlanResources(props: WeeklyPlanResourcesProps) {
  return (
    <div className="space-y-4">
      <FilesSection
        contentId={props.content.id}
        assets={props.content.assets}
        disabled={props.disabled}
        onFilesChanged={props.onFilesChanged}
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
