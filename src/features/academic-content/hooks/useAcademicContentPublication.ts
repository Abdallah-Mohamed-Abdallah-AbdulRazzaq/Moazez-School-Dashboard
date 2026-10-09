import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  publicationDraftFingerprint,
  publicationRequestFromDraft,
  type PublicationDraft,
} from "../model/academicContentPublicationPolicy";
import {
  cancelAcademicContentPublication,
  createAcademicContentPublication,
  getAcademicContentAudiencePreview,
  getAcademicContentPublication,
  getAcademicContentPublicationReadiness,
  listAcademicContentPublications,
  startAcademicContentPublicationRevision,
  unscheduleAcademicContentPublication,
} from "../services/academicContentApi";
import {
  academicContentUiError,
  type AcademicContentUiError,
} from "../services/academicContentErrors";
import type {
  AcademicContentAudiencePreviewResponse,
  AcademicContentPublication,
  AcademicContentPublicationHistoryResponse,
  AcademicContentPublicationReadinessResponse,
  AcademicContentPublicationRevisionStartResponse,
} from "../types/contracts";

const HISTORY_LIMIT = 20;
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_READS = 15;
const DUE_TIMER_SLICE_MS = 60_000;

interface PublicationErrors {
  readiness: AcademicContentUiError | null;
  audiencePreview: AcademicContentUiError | null;
  history: AcademicContentUiError | null;
  mutation: AcademicContentUiError | null;
  detail: AcademicContentUiError | null;
}

interface PublicationAttempt {
  fingerprint: string;
  clientRequestId: string;
}

export interface AcademicContentPublicationState {
  readiness: AcademicContentPublicationReadinessResponse | null;
  audiencePreview: AcademicContentAudiencePreviewResponse | null;
  history: AcademicContentPublicationHistoryResponse | null;
  trackedPublication: AcademicContentPublication | null;
  detail: AcademicContentPublication | null;
  errors: PublicationErrors;
  isLoading: boolean;
  isMutating: boolean;
  isDetailLoading: boolean;
  pollTimedOut: boolean;
  historyPage: number;
  reload: () => Promise<void>;
  setHistoryPage: (page: number) => void;
  create: (
    draft: PublicationDraft,
  ) => Promise<AcademicContentPublication | null>;
  loadDetail: (
    publicationId: string,
  ) => Promise<AcademicContentPublication | null>;
  clearDetail: () => void;
  unschedule: (
    publicationId: string,
  ) => Promise<AcademicContentPublication | null>;
  cancel: (
    publicationId: string,
  ) => Promise<AcademicContentPublication | null>;
  startRevision: (
    publicationId: string,
  ) => Promise<AcademicContentPublicationRevisionStartResponse | null>;
}

function emptyErrors(): PublicationErrors {
  return {
    readiness: null,
    audiencePreview: null,
    history: null,
    mutation: null,
    detail: null,
  };
}

function activeScheduledPublication(
  history: AcademicContentPublicationHistoryResponse,
): AcademicContentPublication | undefined {
  return history.items.find((item) => item.status === "SCHEDULED");
}

export function useAcademicContentPublication(
  contentId: string,
  onContentChanged: () => Promise<unknown> | unknown,
): AcademicContentPublicationState {
  const [readiness, setReadiness] =
    useState<AcademicContentPublicationReadinessResponse | null>(null);
  const [audiencePreview, setAudiencePreview] =
    useState<AcademicContentAudiencePreviewResponse | null>(null);
  const [history, setHistory] =
    useState<AcademicContentPublicationHistoryResponse | null>(null);
  const [trackedPublication, setTrackedPublication] =
    useState<AcademicContentPublication | null>(null);
  const [detail, setDetail] = useState<AcademicContentPublication | null>(null);
  const [errors, setErrors] = useState<PublicationErrors>(emptyErrors);
  const [isReadinessLoading, setIsReadinessLoading] = useState(true);
  const [isAudiencePreviewLoading, setIsAudiencePreviewLoading] =
    useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [historyPage, setHistoryPageState] = useState(1);
  const activeContentIdRef = useRef(contentId);
  const attemptRef = useRef<PublicationAttempt | null>(null);
  const onContentChangedRef = useRef(onContentChanged);

  activeContentIdRef.current = contentId;
  onContentChangedRef.current = onContentChanged;

  const updateError = useCallback(
    (key: keyof PublicationErrors, error: AcademicContentUiError | null) => {
      setErrors((current) => ({ ...current, [key]: error }));
    },
    [],
  );

  const loadReadiness = useCallback(async () => {
    setIsReadinessLoading(true);
    updateError("readiness", null);
    try {
      const response = await getAcademicContentPublicationReadiness(contentId);
      if (activeContentIdRef.current === contentId) setReadiness(response);
    } catch (error) {
      if (activeContentIdRef.current === contentId) {
        setReadiness(null);
        updateError("readiness", academicContentUiError(error));
      }
    } finally {
      if (activeContentIdRef.current === contentId) {
        setIsReadinessLoading(false);
      }
    }
  }, [contentId, updateError]);

  const loadAudiencePreview = useCallback(async () => {
    setIsAudiencePreviewLoading(true);
    updateError("audiencePreview", null);
    try {
      const response = await getAcademicContentAudiencePreview(contentId);
      if (activeContentIdRef.current === contentId) setAudiencePreview(response);
    } catch (error) {
      if (activeContentIdRef.current === contentId) {
        setAudiencePreview(null);
        updateError("audiencePreview", academicContentUiError(error));
      }
    } finally {
      if (activeContentIdRef.current === contentId) {
        setIsAudiencePreviewLoading(false);
      }
    }
  }, [contentId, updateError]);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    updateError("history", null);
    try {
      const response = await listAcademicContentPublications(contentId, {
        page: historyPage,
        limit: HISTORY_LIMIT,
      });
      if (activeContentIdRef.current !== contentId) return;
      setHistory(response);
      const scheduled = activeScheduledPublication(response);
      if (scheduled) setTrackedPublication(scheduled);
    } catch (error) {
      if (activeContentIdRef.current === contentId) {
        setHistory(null);
        updateError("history", academicContentUiError(error));
      }
    } finally {
      if (activeContentIdRef.current === contentId) {
        setIsHistoryLoading(false);
      }
    }
  }, [contentId, historyPage, updateError]);

  const reload = useCallback(async () => {
    await Promise.all([loadReadiness(), loadAudiencePreview(), loadHistory()]);
  }, [loadAudiencePreview, loadHistory, loadReadiness]);

  useEffect(() => {
    attemptRef.current = null;
    setReadiness(null);
    setAudiencePreview(null);
    setHistory(null);
    setTrackedPublication(null);
    setDetail(null);
    setErrors(emptyErrors());
    setPollTimedOut(false);
    setHistoryPageState(1);
  }, [contentId]);

  useEffect(() => {
    void loadReadiness();
  }, [loadReadiness]);

  useEffect(() => {
    void loadAudiencePreview();
  }, [loadAudiencePreview]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const refreshAfterMutation = useCallback(async () => {
    await reload();
    try {
      await Promise.resolve(onContentChangedRef.current());
    } catch (error) {
      updateError("mutation", academicContentUiError(error));
    }
  }, [reload, updateError]);

  const create = useCallback(
    async (draft: PublicationDraft) => {
      const fingerprint = publicationDraftFingerprint(draft);
      if (attemptRef.current?.fingerprint !== fingerprint) {
        attemptRef.current = {
          fingerprint,
          clientRequestId: crypto.randomUUID(),
        };
      }

      setIsMutating(true);
      setPollTimedOut(false);
      updateError("mutation", null);
      try {
        const response = await createAcademicContentPublication(
          contentId,
          publicationRequestFromDraft(
            draft,
            attemptRef.current.clientRequestId,
          ),
        );
        if (activeContentIdRef.current !== contentId) return null;
        attemptRef.current = null;
        setTrackedPublication(response);
        await refreshAfterMutation();
        return response;
      } catch (error) {
        if (activeContentIdRef.current === contentId) {
          updateError("mutation", academicContentUiError(error));
        }
        return null;
      } finally {
        if (activeContentIdRef.current === contentId) setIsMutating(false);
      }
    },
    [contentId, refreshAfterMutation, updateError],
  );

  const loadDetail = useCallback(
    async (publicationId: string) => {
      setIsDetailLoading(true);
      updateError("detail", null);
      try {
        const response = await getAcademicContentPublication(
          contentId,
          publicationId,
        );
        if (activeContentIdRef.current !== contentId) return null;
        setDetail(response);
        return response;
      } catch (error) {
        if (activeContentIdRef.current === contentId) {
          updateError("detail", academicContentUiError(error));
        }
        return null;
      } finally {
        if (activeContentIdRef.current === contentId) {
          setIsDetailLoading(false);
        }
      }
    },
    [contentId, updateError],
  );

  const clearDetail = useCallback(() => {
    setDetail(null);
    updateError("detail", null);
  }, [updateError]);

  const mutatePublication = useCallback(
    async (
      publicationId: string,
      mutation: (
        nextContentId: string,
        nextPublicationId: string,
      ) => Promise<AcademicContentPublication>,
    ) => {
      setIsMutating(true);
      updateError("mutation", null);
      try {
        const response = await mutation(contentId, publicationId);
        if (activeContentIdRef.current !== contentId) return null;
        setTrackedPublication(response);
        setDetail(response);
        await refreshAfterMutation();
        return response;
      } catch (error) {
        if (activeContentIdRef.current === contentId) {
          updateError("mutation", academicContentUiError(error));
        }
        return null;
      } finally {
        if (activeContentIdRef.current === contentId) setIsMutating(false);
      }
    },
    [contentId, refreshAfterMutation, updateError],
  );

  const unschedule = useCallback(
    (publicationId: string) =>
      mutatePublication(publicationId, unscheduleAcademicContentPublication),
    [mutatePublication],
  );

  const cancel = useCallback(
    (publicationId: string) =>
      mutatePublication(publicationId, cancelAcademicContentPublication),
    [mutatePublication],
  );

  const startRevision = useCallback(
    async (publicationId: string) => {
      setIsMutating(true);
      updateError("mutation", null);
      try {
        const response = await startAcademicContentPublicationRevision(
          contentId,
          publicationId,
        );
        if (activeContentIdRef.current !== contentId) return null;
        setTrackedPublication(null);
        setDetail(null);
        await refreshAfterMutation();
        return response;
      } catch (error) {
        if (activeContentIdRef.current === contentId) {
          updateError("mutation", academicContentUiError(error));
        }
        return null;
      } finally {
        if (activeContentIdRef.current === contentId) setIsMutating(false);
      }
    },
    [contentId, refreshAfterMutation, updateError],
  );

  const trackedPublicationId = trackedPublication?.publicationId;
  const trackedPublicationStatus = trackedPublication?.status;
  const trackedPublishAt = trackedPublication?.publishAt;

  useEffect(() => {
    if (
      !trackedPublicationId ||
      !trackedPublishAt ||
      trackedPublicationStatus !== "SCHEDULED"
    ) {
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let reads = 0;

    const schedulePoll = (delay: number, callback: () => void) => {
      timer = setTimeout(callback, delay);
    };

    const poll = async () => {
      if (stopped) return;
      reads += 1;
      try {
        const response = await getAcademicContentPublication(
          contentId,
          trackedPublicationId,
        );
        if (stopped || activeContentIdRef.current !== contentId) return;
        setTrackedPublication(response);
        updateError("detail", null);

        if (response.status !== "SCHEDULED") {
          setPollTimedOut(false);
          await refreshAfterMutation();
          return;
        }
      } catch (error) {
        if (stopped || activeContentIdRef.current !== contentId) return;
        updateError("detail", academicContentUiError(error));
      }

      if (reads >= MAX_POLL_READS) {
        setPollTimedOut(true);
        return;
      }
      schedulePoll(POLL_INTERVAL_MS, () => void poll());
    };

    const waitUntilDue = () => {
      if (stopped) return;
      const remaining = new Date(trackedPublishAt).getTime() - Date.now();
      if (remaining <= 0) {
        void poll();
        return;
      }
      schedulePoll(Math.min(remaining, DUE_TIMER_SLICE_MS), waitUntilDue);
    };

    setPollTimedOut(false);
    waitUntilDue();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    contentId,
    refreshAfterMutation,
    trackedPublicationId,
    trackedPublicationStatus,
    trackedPublishAt,
    updateError,
  ]);

  const setHistoryPage = useCallback((page: number) => {
    setHistoryPageState(Math.max(1, page));
  }, []);

  return useMemo(
    () => ({
      readiness,
      audiencePreview,
      history,
      trackedPublication,
      detail,
      errors,
      isLoading:
        isReadinessLoading || isAudiencePreviewLoading || isHistoryLoading,
      isMutating,
      isDetailLoading,
      pollTimedOut,
      historyPage,
      reload,
      setHistoryPage,
      create,
      loadDetail,
      clearDetail,
      unschedule,
      cancel,
      startRevision,
    }),
    [
      audiencePreview,
      cancel,
      clearDetail,
      create,
      detail,
      errors,
      history,
      historyPage,
      isAudiencePreviewLoading,
      isDetailLoading,
      isHistoryLoading,
      isMutating,
      isReadinessLoading,
      loadDetail,
      pollTimedOut,
      readiness,
      reload,
      setHistoryPage,
      startRevision,
      trackedPublication,
      unschedule,
    ],
  );
}
