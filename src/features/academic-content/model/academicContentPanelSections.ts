import type { AcademicContentEditorSection } from "../hooks/useAcademicContentEditor";
import type { AcademicContentDetail } from "../types/contracts";

const PANEL_SECTIONS: Record<string, readonly AcademicContentEditorSection[]> = {
  metadata: ["metadata"],
  details: ["details"],
  overview: ["metadata", "tags"],
  targets: ["targets"],
  links: ["links"],
  tags: ["tags"],
  files: ["files"],
  resources: ["links"],
  objectives: ["details"],
  topics: ["details"],
  homework: ["details"],
  assessments: ["details"],
  notes: ["details"],
  learningOutcomes: ["details"],
  teachingStrategies: ["details"],
  activities: ["details"],
  assessment: ["details"],
  teacherNotes: ["details"],
  references: ["details"],
};

export function academicContentPanelSections(
  panel: string,
  contentType: AcademicContentDetail["type"],
  initialPanel: string,
): readonly AcademicContentEditorSection[] {
  if (panel === "details" && initialPanel !== "metadata") {
    return ["metadata", "details", "tags"];
  }
  if (contentType === "TEACHER_PREPARATION") {
    if (panel === "overview") return ["metadata", "details", "tags"];
    if (panel === "resources") return ["details", "links"];
  }
  return PANEL_SECTIONS[panel] ?? [];
}
