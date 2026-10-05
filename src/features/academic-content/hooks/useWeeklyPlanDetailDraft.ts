"use client";

import { useCallback, useState } from "react";
import {
  normalizeWeeklyPlanDetail,
  validateWeeklyPlanDetail,
  type WeeklyPlanTermBounds,
  type WeeklyPlanValidationError,
} from "../model/weeklyPlanDetail";
import type {
  AcademicContentWeeklyPlanDetail,
  ReplaceAcademicContentWeeklyPlanDetailRequest,
} from "../types/contracts";
import type { AcademicContentEditorSectionState } from "./useAcademicContentEditor";

interface UseWeeklyPlanDetailDraftInput {
  initial: AcademicContentWeeklyPlanDetail;
  contentVersion: string;
  sectionState: AcademicContentEditorSectionState;
  termBounds?: WeeklyPlanTermBounds;
  onDirty: () => void;
  onSave: (request: ReplaceAcademicContentWeeklyPlanDetailRequest) => Promise<boolean>;
}

export interface WeeklyPlanDetailDraftController {
  draft: AcademicContentWeeklyPlanDetail;
  validationError: WeeklyPlanValidationError | null;
  update: <Field extends keyof AcademicContentWeeklyPlanDetail>(
    field: Field,
    fieldValue: AcademicContentWeeklyPlanDetail[Field],
  ) => void;
  save: () => Promise<boolean>;
  resetValidation: () => void;
}

export function useWeeklyPlanDetailDraft({
  initial,
  contentVersion,
  sectionState,
  termBounds,
  onDirty,
  onSave,
}: UseWeeklyPlanDetailDraftInput): WeeklyPlanDetailDraftController {
  const [draft, setDraft] = useState(initial);
  const [syncedVersion, setSyncedVersion] = useState(contentVersion);
  const [validationError, setValidationError] =
    useState<WeeklyPlanValidationError | null>(null);

  if (!sectionState.dirty && syncedVersion !== contentVersion) {
    setDraft(initial);
    setSyncedVersion(contentVersion);
    setValidationError(null);
  }

  const update = useCallback(
    <Field extends keyof AcademicContentWeeklyPlanDetail>(
      field: Field,
      fieldValue: AcademicContentWeeklyPlanDetail[Field],
    ) => {
      setDraft((currentDraft) => ({ ...currentDraft, [field]: fieldValue }));
      setValidationError(null);
      onDirty();
    },
    [onDirty],
  );

  const save = useCallback(async () => {
    const nextValidationError = validateWeeklyPlanDetail(draft, termBounds);
    setValidationError(nextValidationError);
    if (nextValidationError) return false;
    return onSave(normalizeWeeklyPlanDetail(draft));
  }, [draft, onSave, termBounds]);

  const resetValidation = useCallback(() => setValidationError(null), []);

  return { draft, validationError, update, save, resetValidation };
}
