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
      setValidationError("Note body is required.");
      return;
    }
    setValidationError(null);
    await onSave({ ...form, body: form.body.trim() });
  };

  return (
    <DetailFormShell
      title="Guardian weekly note"
      description="Acknowledgement is configuration only; this editor does not acknowledge on behalf of guardians."
      disabled={disabled}
      sectionState={sectionState}
      validationError={validationError}
      onSave={() => void save()}
    >
      <TextArea label="Note body" aria-label="Note body" value={form.body} maxLength={10000} rows={8} required disabled={disabled} onChange={(event) => update("body", event.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Priority"
          triggerAriaLabel="Priority"
          value={form.priority}
          options={ACADEMIC_GUARDIAN_NOTE_PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
          disabled={disabled}
          onChange={(value) => update("priority", value as AcademicGuardianNotePriority)}
        />
        <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700">
          <input type="checkbox" checked={form.requiresAcknowledgement} disabled={disabled} onChange={(event) => update("requiresAcknowledgement", event.target.checked)} />
          Require guardian acknowledgement
        </label>
      </div>
    </DetailFormShell>
  );
}
