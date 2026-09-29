"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAcademicContent,
  getAcademicContentReadiness,
  updateAcademicContent,
} from "../services/academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import type {
  AcademicContentDetail,
  AcademicContentReadinessResponse,
  UpdateAcademicContentRequest,
} from "../types/contracts";

export type AcademicContentEditorSection =
  | "metadata"
  | "targets"
  | "details"
  | "links"
  | "tags"
  | "files";

export interface AcademicContentEditorSectionState {
  dirty: boolean;
  saving: boolean;
  error: AcademicContentUiError | null;
}

type AcademicContentEditorSections = Record<
  AcademicContentEditorSection,
  AcademicContentEditorSectionState
>;

const SECTION_KEYS: readonly AcademicContentEditorSection[] = [
  "metadata",
  "targets",
  "details",
  "links",
  "tags",
  "files",
];

function initialSections(): AcademicContentEditorSections {
  return Object.fromEntries(
    SECTION_KEYS.map((section) => [
      section,
      { dirty: false, saving: false, error: null },
    ]),
  ) as AcademicContentEditorSections;
}

export function useAcademicContentEditor(contentId: string) {
  const requestIdRef = useRef(0);
  const activeContentIdRef = useRef(contentId);
  activeContentIdRef.current = contentId;
  const [content, setContent] = useState<AcademicContentDetail | null>(null);
  const [readiness, setReadiness] =
    useState<AcademicContentReadinessResponse | null>(null);
  const [sections, setSections] =
    useState<AcademicContentEditorSections>(initialSections);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AcademicContentUiError | null>(null);

  const refreshAggregate = useCallback(async () => {
    const loadedContent = await getAcademicContent(contentId);
    if (activeContentIdRef.current === contentId) setContent(loadedContent);
    return loadedContent;
  }, [contentId]);

  const refreshReadiness = useCallback(async () => {
    const loadedReadiness = await getAcademicContentReadiness(contentId);
    if (activeContentIdRef.current === contentId) setReadiness(loadedReadiness);
    return loadedReadiness;
  }, [contentId]);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);
    setContent(null);
    setReadiness(null);
    setSections(initialSections());

    try {
      const [loadedContent, loadedReadiness] = await Promise.all([
        getAcademicContent(contentId),
        getAcademicContentReadiness(contentId),
      ]);
      if (requestIdRef.current !== requestId) return;
      setContent(loadedContent);
      setReadiness(loadedReadiness);
    } catch (loadError) {
      if (requestIdRef.current !== requestId) return;
      setError(academicContentUiError(loadError));
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const setSectionState = useCallback(
    (
      section: AcademicContentEditorSection,
      update: Partial<AcademicContentEditorSectionState>,
    ) => {
      setSections((currentSections) => ({
        ...currentSections,
        [section]: { ...currentSections[section], ...update },
      }));
    },
    [],
  );

  const markSectionDirty = useCallback(
    (section: AcademicContentEditorSection, dirty = true) => {
      setSectionState(section, { dirty });
    },
    [setSectionState],
  );

  const saveMetadata = useCallback(
    async (request: UpdateAcademicContentRequest): Promise<boolean> => {
      if (content?.status === "ARCHIVED") return false;

      setSectionState("metadata", { saving: true, error: null });
      const metadataRequest: UpdateAcademicContentRequest = {
        title: request.title,
        description: request.description,
        audience: request.audience,
      };

      try {
        await updateAcademicContent(contentId, metadataRequest);
        await Promise.all([refreshAggregate(), refreshReadiness()]);
        if (activeContentIdRef.current !== contentId) return false;
        setSectionState("metadata", { dirty: false, saving: false, error: null });
        return true;
      } catch (saveError) {
        if (activeContentIdRef.current !== contentId) return false;
        setSectionState("metadata", {
          saving: false,
          error: academicContentUiError(saveError),
        });
        return false;
      }
    },
    [content?.status, contentId, refreshAggregate, refreshReadiness, setSectionState],
  );

  const hasUnsavedChanges = useMemo(
    () => SECTION_KEYS.some((section) => sections[section].dirty),
    [sections],
  );

  return {
    content,
    readiness,
    sections,
    isLoading,
    isReadOnly: content?.status === "ARCHIVED",
    hasUnsavedChanges,
    error,
    markSectionDirty,
    refreshAggregate,
    refreshReadiness,
    saveMetadata,
    reload: load,
  };
}
