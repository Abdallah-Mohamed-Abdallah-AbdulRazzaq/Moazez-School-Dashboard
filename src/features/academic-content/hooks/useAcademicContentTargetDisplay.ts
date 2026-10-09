"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveTeacherPreparationTargets } from "../model/teacherPreparationDetail";
import {
  loadAcademicTargetOptions,
  type AcademicTargetOptions,
} from "../services/academicContentSelectors";
import type { AcademicContentDetail } from "../types/contracts";

type TargetDisplayContent = Pick<
  AcademicContentDetail,
  "academicYearId" | "termId" | "targets"
>;

export function useAcademicContentTargetDisplay(
  content: TargetDisplayContent,
  locale: string,
  unavailableMessage: string,
) {
  const contextKey = `${content.academicYearId}:${content.termId}`;
  const [loadState, setLoadState] = useState<{
    contextKey: string;
    options: AcademicTargetOptions | null;
    error: string | null;
  }>({ contextKey: "", options: null, error: null });
  const options =
    loadState.contextKey === contextKey ? loadState.options : null;
  const error = loadState.contextKey === contextKey ? loadState.error : null;

  useEffect(() => {
    let active = true;
    void loadAcademicTargetOptions({
      academicYearId: content.academicYearId,
      termId: content.termId,
    })
      .then((loadedOptions) => {
        if (active) {
          setLoadState({ contextKey, options: loadedOptions, error: null });
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setLoadState({
          contextKey,
          options: null,
          error:
            loadError instanceof Error
              ? loadError.message
              : unavailableMessage,
        });
      });
    return () => {
      active = false;
    };
  }, [content.academicYearId, content.termId, contextKey, unavailableMessage]);

  const targets = useMemo(
    () =>
      options
        ? resolveTeacherPreparationTargets(
            content.targets,
            options,
            [],
            locale,
          )
        : content.targets.map(({ id }) => ({
            targetId: id,
            scope: null,
            subject: null,
            assignedTeacher: null,
          })),
    [content.targets, locale, options],
  );

  return { targets, error };
}
