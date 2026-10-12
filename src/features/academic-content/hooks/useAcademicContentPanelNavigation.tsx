"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useAcademicContentTranslations } from "./useAcademicContentTranslations";
import { academicContentPanelSections } from "../model/academicContentPanelSections";
import type { AcademicContentDetail } from "../types/contracts";
import type { useAcademicContentEditor } from "./useAcademicContentEditor";

type PanelEditor = Pick<
  ReturnType<typeof useAcademicContentEditor>,
  "sections" | "markSectionDirty"
> & { content: Pick<AcademicContentDetail, "type"> };

export function useAcademicContentPanelNavigation<Panel extends string>(
  initialPanel: Panel,
  editor: PanelEditor,
  discardDetailDraft?: () => void,
) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [pendingPanel, setPendingPanel] = useState<Panel | null>(null);
  const t = useAcademicContentTranslations("editor");
  const panelSections = academicContentPanelSections(
    activePanel,
    editor.content.type,
    initialPanel,
  );
  const dirtySections = panelSections.filter(
    (section) => editor.sections[section].dirty,
  );

  const requestPanelChange = (nextPanel: Panel) => {
    if (nextPanel === activePanel) return;
    if (dirtySections.length > 0) setPendingPanel(nextPanel);
    else setActivePanel(nextPanel);
  };
  const confirmPanelChange = () => {
    if (pendingPanel === null) return;
    if (dirtySections.includes("details")) discardDetailDraft?.();
    dirtySections.forEach((section) => editor.markSectionDirty(section, false));
    setActivePanel(pendingPanel);
    setPendingPanel(null);
  };

  const navigationDialog = (
    <ConfirmDialog
      isOpen={pendingPanel !== null}
      onClose={() => setPendingPanel(null)}
      onConfirm={confirmPanelChange}
      title={t("leave_tab_title")}
      description={t("leave_tab_description")}
      confirmLabel={t("leave_tab_confirm")}
      cancelLabel={t("leave_tab_cancel")}
      severity="warning"
    />
  );

  return { activePanel, requestPanelChange, navigationDialog };
}
