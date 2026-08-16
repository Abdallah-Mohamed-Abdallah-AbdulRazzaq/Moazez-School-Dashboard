import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import {
  fetchRoster,
  getOrCreateSession,
  saveSession,
  submitSession,
  unsubmitSession,
} from "../services/attendanceRollCallService";
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceSessionMode,
  RosterStudent,
  SessionWithEntries,
} from "../types";

export interface RollCallSelection {
  yearId?: string;
  termId?: string;
  date: string;
  scopeType: AttendanceScopeType;
  scopeIds: AttendanceScopeIds;
  mode?: AttendanceSessionMode;
  periodId?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  enabled: boolean;
}

export interface RollCallSessionWorkspace {
  roster: RosterStudent[];
  session: AttendanceSession | null;
  entries: AttendanceEntry[];
  originalEntries: AttendanceEntry[];
  isDirty: boolean;
  isPreviewLoading: boolean;
  isOpening: boolean;
  isSaving: boolean;
  loadError: Error | null;
  setEntries: Dispatch<SetStateAction<AttendanceEntry[]>>;
  retryPreview: () => void;
  openSession: () => Promise<void>;
  saveDraft: () => Promise<SessionWithEntries>;
  submitDraft: () => Promise<AttendanceSession>;
  unsubmit: () => Promise<AttendanceSession>;
  resetDraft: () => void;
}

export class RollCallSubmissionError extends Error {
  constructor(cause: unknown) {
    super("The attendance draft was saved, but submission failed.", { cause });
    this.name = "RollCallSubmissionError";
  }
}

function reconcileEntries(
  sessionId: string,
  roster: RosterStudent[],
  serverEntries: AttendanceEntry[],
): AttendanceEntry[] {
  const byStudentId = new Map(serverEntries.map((entry) => [entry.studentId, entry]));

  return roster.map((student) =>
    byStudentId.get(student.id) ?? {
      id: `${sessionId}:${student.id}`,
      sessionId,
      studentId: student.id,
      status: "UNMARKED",
      updatedAt: "",
    },
  );
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error("roll-call-preview-failed");
}

function hasRequiredSelection(
  selection: RollCallSelection,
): selection is RollCallSelection & {
  yearId: string;
  termId: string;
  mode: AttendanceSessionMode;
} {
  return Boolean(selection.enabled && selection.yearId && selection.termId && selection.mode);
}

function copyEntries(entries: AttendanceEntry[]): AttendanceEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

function buildRosterPreviewEntries(roster: RosterStudent[]): AttendanceEntry[] {
  return roster.flatMap((student) => {
    if (!student.currentStatus) {
      return [];
    }

    return [{
      id: student.entryId || `preview:${student.id}`,
      sessionId: "",
      studentId: student.id,
      status: student.currentStatus,
      minutesLate: student.lateMinutes ?? undefined,
      minutesEarlyLeave: student.earlyLeaveMinutes ?? undefined,
      excuseReason: student.excuseReason ?? undefined,
      note: student.note ?? undefined,
      updatedAt: "",
    }];
  });
}

export function useRollCallSessionWorkspace(
  selection: RollCallSelection,
): RollCallSessionWorkspace {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<AttendanceEntry[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const previewGeneration = useRef(0);
  const openGeneration = useRef(0);

  const previewSelection = useMemo<RollCallSelection>(
    () => ({
      yearId: selection.yearId,
      termId: selection.termId,
      date: selection.date,
      scopeType: selection.scopeType,
      scopeIds: {
        stageId: selection.scopeIds.stageId,
        gradeId: selection.scopeIds.gradeId,
        sectionId: selection.scopeIds.sectionId,
        classroomId: selection.scopeIds.classroomId,
      },
      mode: selection.mode,
      periodId: selection.periodId,
      enabled: selection.enabled,
    }),
    [
      selection.date,
      selection.enabled,
      selection.mode,
      selection.periodId,
      selection.scopeIds.classroomId,
      selection.scopeIds.gradeId,
      selection.scopeIds.sectionId,
      selection.scopeIds.stageId,
      selection.scopeType,
      selection.termId,
      selection.yearId,
    ],
  );

  useEffect(() => {
    const generation = ++previewGeneration.current;
    ++openGeneration.current;
    void Promise.resolve().then(() => {
      setIsOpening(false);
      setSession(null);
      setEntries([]);
      setOriginalEntries([]);
    });

    if (!hasRequiredSelection(previewSelection)) {
      void Promise.resolve().then(() => setRoster([]));
      void Promise.resolve().then(() => setLoadError(null));
      void Promise.resolve().then(() => setIsPreviewLoading(false));
      return;
    }

    void Promise.resolve().then(() => setIsPreviewLoading(true));
    void Promise.resolve().then(() => setLoadError(null));
    fetchRoster(previewSelection.scopeType, previewSelection.scopeIds, {
      yearId: previewSelection.yearId,
      termId: previewSelection.termId,
      date: previewSelection.date,
      mode: previewSelection.mode,
      periodKey: previewSelection.periodId,
    })
      .then((nextRoster) => {
        if (generation === previewGeneration.current) {
          const previewEntries = buildRosterPreviewEntries(nextRoster);
          setRoster(nextRoster);
          setEntries(previewEntries);
          setOriginalEntries(copyEntries(previewEntries));
        }
      })
      .catch((error: unknown) => {
        if (generation === previewGeneration.current) {
          setRoster([]);
          setLoadError(asError(error));
        }
      })
      .finally(() => {
        if (generation === previewGeneration.current) setIsPreviewLoading(false);
      });
  }, [previewSelection, retryToken]);

  const retryPreview = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  const openSession = useCallback(async () => {
    if (!hasRequiredSelection(selection)) {
      throw new Error("A complete roll-call selection is required.");
    }

    const generation = ++openGeneration.current;
    setIsOpening(true);
    try {
      const opened = await getOrCreateSession({
        yearId: selection.yearId,
        termId: selection.termId,
        date: selection.date,
        scopeType: selection.scopeType,
        scopeIds: selection.scopeIds,
        mode: selection.mode,
        periodId: selection.periodId,
        periodIndex: selection.periodIndex,
        periodNameAr: selection.periodNameAr,
        periodNameEn: selection.periodNameEn,
      });
      if (generation !== openGeneration.current) return;

      const reconciled = reconcileEntries(opened.session.id, roster, opened.entries);
      setSession(opened.session);
      setEntries(copyEntries(reconciled));
      setOriginalEntries(copyEntries(reconciled));
    } finally {
      if (generation === openGeneration.current) setIsOpening(false);
    }
  }, [roster, selection]);

  const persistDraft = useCallback(async (): Promise<SessionWithEntries> => {
    if (!session) throw new Error("Open a roll-call session before saving.");

    const sentEntries = copyEntries(entries);
    const saved = await saveSession(session, sentEntries);
    const responseEntries =
      saved.entries.length === 0 && roster.length > 0 ? sentEntries : saved.entries;
    const reconciled = reconcileEntries(saved.session.id, roster, responseEntries);
    const canonical = { session: saved.session, entries: reconciled };
    setSession(canonical.session);
    setEntries(copyEntries(canonical.entries));
    setOriginalEntries(copyEntries(canonical.entries));
    return canonical;
  }, [entries, roster, session]);

  const saveDraft = useCallback(async (): Promise<SessionWithEntries> => {
    setIsSaving(true);
    try {
      return await persistDraft();
    } finally {
      setIsSaving(false);
    }
  }, [persistDraft]);

  const submitDraft = useCallback(async (): Promise<AttendanceSession> => {
    setIsSaving(true);
    try {
      const saved = await persistDraft();
      let submitted: AttendanceSession;
      try {
        submitted = await submitSession(
          saved.session.id,
          saved.session.yearId,
          saved.session.termId,
        );
      } catch (error) {
        throw new RollCallSubmissionError(error);
      }
      setSession(submitted);
      return submitted;
    } finally {
      setIsSaving(false);
    }
  }, [persistDraft]);

  const unsubmit = useCallback(async (): Promise<AttendanceSession> => {
    if (!session) throw new Error("Open a roll-call session before unsubmitting.");

    setIsSaving(true);
    try {
      const draft = await unsubmitSession(session.yearId, session.termId, session.id);
      setSession(draft);
      return draft;
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  const resetDraft = useCallback(() => {
    setEntries(copyEntries(originalEntries));
  }, [originalEntries]);

  const isDirty = useMemo(
    () => JSON.stringify(entries) !== JSON.stringify(originalEntries),
    [entries, originalEntries],
  );

  return {
    roster,
    session,
    entries,
    originalEntries,
    isDirty,
    isPreviewLoading,
    isOpening,
    isSaving,
    loadError,
    setEntries,
    retryPreview,
    openSession,
    saveDraft,
    submitDraft,
    unsubmit,
    resetDraft,
  };
}
