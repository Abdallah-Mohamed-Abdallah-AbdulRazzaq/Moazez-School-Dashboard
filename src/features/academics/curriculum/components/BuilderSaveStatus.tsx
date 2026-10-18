"use client";

import { useTranslations } from "next-intl";

interface BuilderSaveStatusProps {
  isSettingsDirty: boolean;
  isQuestionDirty: boolean;
  isSettingsSaving: boolean;
  isQuestionSaving: boolean;
}

export default function BuilderSaveStatus({ isSettingsDirty, isQuestionDirty, isSettingsSaving, isQuestionSaving }: BuilderSaveStatusProps) {
  const t = useTranslations("academics.curriculum.assignmentBuilder");
  const statuses = [
    { scope: "settings", saving: isSettingsSaving, dirty: isSettingsDirty },
    { scope: "question", saving: isQuestionSaving, dirty: isQuestionDirty },
  ];

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {statuses.map(({ scope, saving, dirty }) => (
        <span key={scope} className={saving ? "text-primary" : dirty ? "text-amber-800" : "text-gray-600"}>
          {t(`${scope}${saving ? "Saving" : dirty ? "Unsaved" : "Saved"}`)}
        </span>
      ))}
    </div>
  );
}
