"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeTeacherPreparationDetail } from "../model/teacherPreparationDetail";
import type {
  AcademicContentPreparationDetail,
  ReplaceAcademicContentPreparationDetailRequest,
} from "../types/contracts";
import type { AcademicContentEditorSectionState } from "./useAcademicContentEditor";

type OrderedPreparationField =
  | "objectives"
  | "learningOutcomes"
  | "teachingStrategies"
  | "activities";

const ORDERED_FIELDS: readonly OrderedPreparationField[] = [
  "objectives",
  "learningOutcomes",
  "teachingStrategies",
  "activities",
];

interface UseTeacherPreparationDetailDraftInput {
  initial: AcademicContentPreparationDetail;
  contentVersion: string;
  sectionState: AcademicContentEditorSectionState;
  onDirty: () => void;
  onSave: (
    request: ReplaceAcademicContentPreparationDetailRequest,
  ) => Promise<boolean>;
}

export interface TeacherPreparationDetailDraftController {
  draft: AcademicContentPreparationDetail;
  validationError: "empty_items" | null;
  update: <Field extends keyof AcademicContentPreparationDetail>(
    field: Field,
    fieldValue: AcademicContentPreparationDetail[Field],
  ) => void;
  save: () => Promise<boolean>;
  resetValidation: () => void;
}

function hasEmptyOrderedEntry(detail: AcademicContentPreparationDetail): boolean {
  return ORDERED_FIELDS.some((field) =>
    detail[field].some((entry) => !entry.trim()),
  );
}

export function useTeacherPreparationDetailDraft({
  initial,
  contentVersion,
  sectionState,
  onDirty,
  onSave,
}: UseTeacherPreparationDetailDraftInput): TeacherPreparationDetailDraftController {
  const [draft, setDraft] = useState(initial);
  const [syncedVersion, setSyncedVersion] = useState(contentVersion);
  const [validationError, setValidationError] = useState<"empty_items" | null>(null);

  useEffect(() => {
    if (sectionState.dirty || syncedVersion === contentVersion) return;
    setDraft(initial);
    setSyncedVersion(contentVersion);
    setValidationError(null);
  }, [contentVersion, initial, sectionState.dirty, syncedVersion]);

  const update = useCallback(
    <Field extends keyof AcademicContentPreparationDetail>(
      field: Field,
      fieldValue: AcademicContentPreparationDetail[Field],
    ) => {
      setDraft((currentDraft) => ({ ...currentDraft, [field]: fieldValue }));
      setValidationError(null);
      onDirty();
    },
    [onDirty],
  );

  const save = useCallback(async () => {
    if (hasEmptyOrderedEntry(draft)) {
      setValidationError("empty_items");
      return false;
    }
    setValidationError(null);
    return onSave(normalizeTeacherPreparationDetail(draft));
  }, [draft, onSave]);

  const resetValidation = useCallback(() => setValidationError(null), []);

  return { draft, validationError, update, save, resetValidation };
}
