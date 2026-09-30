"use client";

import { useState } from "react";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import type { AcademicContentEditorSectionState } from "../../../hooks/useAcademicContentEditor";
import {
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  type AcademicContentGuardianNoteDetail,
  type AcademicGuardianNotePriority,
} from "../../../types/contracts";
import DetailFormShell from "./DetailFormShell";
import { useAcademicContentTranslations } from "../../../hooks/useAcademicContentTranslations";

interface GuardianWeeklyNoteFormProps {
  initial: AcademicContentGuardianNoteDetail;
  disabled: boolean;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (request: AcademicContentGuardianNoteDetail) => Promise<boolean>;
}

export default function GuardianWeeklyNoteForm({
  initial,
  disabled,
  sectionState,
  onDirty,
  onSave,
}: GuardianWeeklyNoteFormProps) {
  const [form, setForm] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useAcademicContentTranslations();
  const update = <K extends keyof AcademicContentGuardianNoteDetail>(
    field: K,
    value: AcademicContentGuardianNoteDetail[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
    onDirty();
  };
  const save = async () => {
    if (!form.body.trim()) {
      setValidationError(t("details.body_required"));
      return;
    }
    setValidationError(null);
    await onSave({ ...form, body: form.body.trim() });
  };

  return (
    <DetailFormShell
      title={t("details.guardian_title")}
      description={t("details.guardian_description")}
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <TextArea label={t("fields.note_body")} aria-label={t("fields.note_body")} value={form.body} maxLength={10000} rows={8} required disabled={disabled} onChange={(event) => update("body", event.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t("fields.priority")}
          triggerAriaLabel={t("fields.priority")}
          value={form.priority}
          options={ACADEMIC_GUARDIAN_NOTE_PRIORITIES.map((priority) => ({ value: priority, label: t(`priorities.${priority}`) }))}
          disabled={disabled}
          onChange={(value) => update("priority", value as AcademicGuardianNotePriority)}
        />
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <input type="checkbox" checked={form.requiresAcknowledgement} disabled={disabled} onChange={(event) => update("requiresAcknowledgement", event.target.checked)} />
          {t("fields.require_guardian_acknowledgement")}
        </label>
      </div>
    </DetailFormShell>
  );
}
