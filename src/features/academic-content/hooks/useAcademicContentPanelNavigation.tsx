"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import { useAcademicContentTranslations } from "./useAcademicContentTranslations";

export function useAcademicContentPanelNavigation<Panel extends string>(
  initialPanel: Panel,
  hasUnsavedChanges: boolean,
) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [pendingPanel, setPendingPanel] = useState<Panel | null>(null);
  const t = useAcademicContentTranslations("editor");

  const requestPanelChange = (nextPanel: Panel) => {
    if (nextPanel === activePanel) return;
    if (hasUnsavedChanges) setPendingPanel(nextPanel);
    else setActivePanel(nextPanel);
  };
  const confirmPanelChange = () => {
    if (pendingPanel === null) return;
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
