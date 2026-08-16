import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AttendanceEntry,
  AttendanceSession,
  RosterStudent,
  SessionWithEntries,
} from "../../types";
import {
  fetchRoster,
  getOrCreateSession,
  saveSession,
  submitSession,
  unsubmitSession,
} from "../../services/attendanceRollCallService";
import {
  RollCallSubmissionError,
  useRollCallSessionWorkspace,
  type RollCallSelection,
} from "../useRollCallSessionWorkspace";

vi.mock("../../services/attendanceRollCallService", () => ({
  fetchRoster: vi.fn(),
  getOrCreateSession: vi.fn(),
  saveSession: vi.fn(),
  submitSession: vi.fn(),
  unsubmitSession: vi.fn(),
}));

const mockedFetchRoster = vi.mocked(fetchRoster);
const mockedGetOrCreateSession = vi.mocked(getOrCreateSession);
const mockedSaveSession = vi.mocked(saveSession);
const mockedSubmitSession = vi.mocked(submitSession);
const mockedUnsubmitSession = vi.mocked(unsubmitSession);

const selection: RollCallSelection = {
  yearId: "year-1",
  termId: "term-1",
  date: "2026-02-10",
  scopeType: "CLASSROOM",
  scopeIds: { classroomId: "classroom-1" },
  mode: "PERIOD",
  periodId: "period-1",
  periodIndex: 1,
  periodNameAr: "Period 1 AR",
  periodNameEn: "Period 1",
  enabled: true,
};

const student: RosterStudent = {
  id: "student-1",
  nameAr: "Student 1 AR",
  nameEn: "Student 1",
  studentNumber: "S-1",
};

const session: AttendanceSession = {
  id: "session-1",
  yearId: "year-1",
  termId: "term-1",
  date: "2026-02-10",
  scopeType: "CLASSROOM",
  scopeIds: { classroomId: "classroom-1" },
  mode: "PERIOD",
  periodId: "period-1",
  periodIndex: 1,
  periodNameAr: "Period 1 AR",
  periodNameEn: "Period 1",
  status: "DRAFT",
  createdAt: "2026-02-10T08:00:00.000Z",
  updatedAt: "2026-02-10T08:00:00.000Z",
};

const presentEntry: AttendanceEntry = {
  id: "entry-1",
  sessionId: "session-1",
  studentId: "student-1",
  status: "PRESENT",
  updatedAt: "2026-02-10T09:00:00.000Z",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function renderOpenedWorkspace(opened: SessionWithEntries = { session, entries: [] }) {
  mockedFetchRoster.mockResolvedValue([student]);
  mockedGetOrCreateSession.mockResolvedValue(opened);
  const rendered = renderHook(() => useRollCallSessionWorkspace(selection));
  await waitFor(() => expect(rendered.result.current.roster).toEqual([student]));
  await act(async () => rendered.result.current.openSession());
  return rendered;
}

describe("useRollCallSessionWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("previews a valid selection and opens a session only on demand", async () => {
    mockedFetchRoster.mockResolvedValue([student]);
    mockedGetOrCreateSession.mockResolvedValue({ session, entries: [] });

    const { result } = renderHook(() => useRollCallSessionWorkspace(selection));

    await waitFor(() => expect(result.current.roster).toEqual([student]));
    expect(mockedFetchRoster).toHaveBeenCalledWith("CLASSROOM", selection.scopeIds, {
      yearId: "year-1",
      termId: "term-1",
      date: "2026-02-10",
      mode: "PERIOD",
      periodKey: "period-1",
    });
    expect(mockedGetOrCreateSession).not.toHaveBeenCalled();

    await act(async () => result.current.openSession());

    expect(mockedGetOrCreateSession).toHaveBeenCalledWith({
      yearId: "year-1",
      termId: "term-1",
      date: "2026-02-10",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
      mode: "PERIOD",
      periodId: "period-1",
      periodIndex: 1,
      periodNameAr: "Period 1 AR",
      periodNameEn: "Period 1",
    });
    expect(result.current.entries).toEqual([
      {
        id: "session-1:student-1",
        sessionId: "session-1",
        studentId: "student-1",
        status: "UNMARKED",
        updatedAt: "",
      },
    ]);
    expect(result.current.originalEntries).toEqual(result.current.entries);
    expect(result.current.isDirty).toBe(false);
  });

  it("exposes existing attendance state in the non-mutating roster preview", async () => {
    mockedFetchRoster.mockResolvedValue([
      {
        ...student,
        currentStatus: "LATE",
        entryId: "entry-1",
        lateMinutes: 12,
        earlyLeaveMinutes: null,
        excuseReason: null,
        note: "Traffic delay",
      },
    ]);

    const { result } = renderHook(() => useRollCallSessionWorkspace(selection));

    await waitFor(() => expect(result.current.entries).toEqual([
      expect.objectContaining({
        id: "entry-1",
        sessionId: "",
        studentId: "student-1",
        status: "LATE",
        minutesLate: 12,
        note: "Traffic delay",
      }),
    ]));
    expect(result.current.session).toBeNull();
    expect(mockedGetOrCreateSession).not.toHaveBeenCalled();
  });

  it("ignores stale roster preview responses", async () => {
    const older = deferred<RosterStudent[]>();
    const newer = deferred<RosterStudent[]>();
    const newStudent = { ...student, id: "student-2", studentNumber: "S-2" };
    mockedFetchRoster.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

    const { result, rerender } = renderHook(
      ({ currentSelection }) => useRollCallSessionWorkspace(currentSelection),
      { initialProps: { currentSelection: selection } },
    );
    rerender({ currentSelection: { ...selection, date: "2026-02-11" } });

    await act(async () => newer.resolve([newStudent]));
    await waitFor(() => expect(result.current.roster).toEqual([newStudent]));
    await act(async () => older.resolve([student]));

    expect(result.current.roster).toEqual([newStudent]);
  });

  it("ignores a session resolution invalidated by a newer selection", async () => {
    const olderOpen = deferred<SessionWithEntries>();
    mockedFetchRoster.mockResolvedValue([student]);
    mockedGetOrCreateSession.mockReturnValue(olderOpen.promise);
    const { result, rerender } = renderHook(
      ({ currentSelection }) => useRollCallSessionWorkspace(currentSelection),
      { initialProps: { currentSelection: selection } },
    );
    await waitFor(() => expect(result.current.roster).toEqual([student]));

    let openPromise!: Promise<void>;
    act(() => {
      openPromise = result.current.openSession();
    });
    expect(result.current.isOpening).toBe(true);

    rerender({ currentSelection: { ...selection, date: "2026-02-11" } });
    await act(async () => {
      olderOpen.resolve({ session, entries: [presentEntry] });
      await openPromise;
    });

    expect(result.current.session).toBeNull();
    expect(result.current.entries).toEqual([]);
    expect(result.current.isOpening).toBe(false);
  });

  it("keeps the newer session when overlapping opens resolve out of order", async () => {
    const olderOpen = deferred<SessionWithEntries>();
    const newerOpen = deferred<SessionWithEntries>();
    const newerSession = { ...session, id: "session-2" };
    mockedFetchRoster.mockResolvedValue([student]);
    mockedGetOrCreateSession
      .mockReturnValueOnce(olderOpen.promise)
      .mockReturnValueOnce(newerOpen.promise);
    const { result } = renderHook(() => useRollCallSessionWorkspace(selection));
    await waitFor(() => expect(result.current.roster).toEqual([student]));

    let olderPromise!: Promise<void>;
    let newerPromise!: Promise<void>;
    act(() => {
      olderPromise = result.current.openSession();
      newerPromise = result.current.openSession();
    });
    expect(result.current.isOpening).toBe(true);

    await act(async () => {
      newerOpen.resolve({ session: newerSession, entries: [] });
      await newerPromise;
    });
    expect(result.current.session).toEqual(newerSession);
    expect(result.current.isOpening).toBe(false);

    await act(async () => {
      olderOpen.resolve({ session, entries: [presentEntry] });
      await olderPromise;
    });
    expect(result.current.session).toEqual(newerSession);
    expect(result.current.entries[0]?.sessionId).toBe("session-2");
  });

  it("reports opening state for the full session resolution request", async () => {
    const pendingOpen = deferred<SessionWithEntries>();
    mockedFetchRoster.mockResolvedValue([student]);
    mockedGetOrCreateSession.mockReturnValue(pendingOpen.promise);
    const { result } = renderHook(() => useRollCallSessionWorkspace(selection));
    await waitFor(() => expect(result.current.roster).toEqual([student]));

    let openPromise!: Promise<void>;
    act(() => {
      openPromise = result.current.openSession();
    });
    expect(result.current.isOpening).toBe(true);

    await act(async () => {
      pendingOpen.resolve({ session, entries: [] });
      await openPromise;
    });
    expect(result.current.isOpening).toBe(false);
  });

  it("adopts the canonical save response as entries and baseline", async () => {
    const { result } = await renderOpenedWorkspace();
    const savedSession = { ...session, updatedAt: "2026-02-10T09:00:00.000Z" };
    mockedSaveSession.mockResolvedValue({ session: savedSession, entries: [presentEntry] });

    await act(async () => result.current.saveDraft());

    expect(result.current.session).toEqual(savedSession);
    expect(result.current.entries).toEqual([presentEntry]);
    expect(result.current.originalEntries).toEqual([presentEntry]);
    expect(result.current.isDirty).toBe(false);
  });

  it("reports saving state for the full save request", async () => {
    const { result } = await renderOpenedWorkspace();
    const pendingSave = deferred<SessionWithEntries>();
    mockedSaveSession.mockReturnValue(pendingSave.promise);

    let savePromise!: Promise<SessionWithEntries>;
    act(() => {
      savePromise = result.current.saveDraft();
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      pendingSave.resolve({ session, entries: [presentEntry] });
      await savePromise;
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("retains sent entries when a compatibility save response unexpectedly omits entries", async () => {
    const { result } = await renderOpenedWorkspace();
    act(() => result.current.setEntries([presentEntry]));
    mockedSaveSession.mockResolvedValue({ session, entries: [] });

    const saved = await act(async () => result.current.saveDraft());

    expect(mockedSaveSession).toHaveBeenCalledWith(session, [presentEntry]);
    expect(saved.entries).toEqual([presentEntry]);
    expect(result.current.entries).toEqual([presentEntry]);
    expect(result.current.originalEntries).toEqual([presentEntry]);
    expect(result.current.isDirty).toBe(false);
  });

  it("does not submit when saving fails", async () => {
    const { result } = await renderOpenedWorkspace();
    mockedSaveSession.mockRejectedValue(new Error("save failed"));
    let caught: unknown;

    await act(async () => {
      try {
        await result.current.submitDraft();
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toEqual(new Error("save failed"));
    expect(mockedSubmitSession).not.toHaveBeenCalled();
  });

  it("keeps a clean saved draft when submission fails", async () => {
    const { result } = await renderOpenedWorkspace();
    const savedSession = { ...session, updatedAt: "2026-02-10T09:00:00.000Z" };
    mockedSaveSession.mockResolvedValue({ session: savedSession, entries: [presentEntry] });
    mockedSubmitSession.mockRejectedValue(new Error("submit failed"));
    let caught: unknown;

    await act(async () => {
      try {
        await result.current.submitDraft();
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBeInstanceOf(RollCallSubmissionError);
    expect((caught as Error).cause).toEqual(new Error("submit failed"));
    expect(mockedSubmitSession).toHaveBeenCalledWith("session-1", "year-1", "term-1");
    expect(mockedSaveSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockedSubmitSession.mock.invocationCallOrder[0],
    );
    expect(result.current.session).toEqual(savedSession);
    expect(result.current.entries).toEqual([presentEntry]);
    expect(result.current.originalEntries).toEqual([presentEntry]);
    expect(result.current.isDirty).toBe(false);
  });

  it("keeps saving state active across save and submit requests", async () => {
    const { result } = await renderOpenedWorkspace();
    const pendingSave = deferred<SessionWithEntries>();
    const pendingSubmit = deferred<AttendanceSession>();
    const submittedSession = { ...session, status: "SUBMITTED" as const };
    mockedSaveSession.mockReturnValue(pendingSave.promise);
    mockedSubmitSession.mockReturnValue(pendingSubmit.promise);

    let submitPromise!: Promise<AttendanceSession>;
    act(() => {
      submitPromise = result.current.submitDraft();
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      pendingSave.resolve({ session, entries: [presentEntry] });
      await Promise.resolve();
    });
    expect(mockedSubmitSession).toHaveBeenCalledOnce();
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      pendingSubmit.resolve(submittedSession);
      await submitPromise;
    });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.session).toEqual(submittedSession);
  });

  it("adopts unsubmitted session state without changing entries", async () => {
    const submittedSession = { ...session, status: "SUBMITTED" as const };
    const { result } = await renderOpenedWorkspace({ session: submittedSession, entries: [presentEntry] });
    const draftSession = { ...submittedSession, status: "DRAFT" as const };
    mockedUnsubmitSession.mockResolvedValue(draftSession);

    await act(async () => result.current.unsubmit());

    expect(mockedUnsubmitSession).toHaveBeenCalledWith("year-1", "term-1", "session-1");
    expect(result.current.session).toEqual(draftSession);
    expect(result.current.entries).toEqual([presentEntry]);
  });

  it("reports saving state for the full unsubmit request", async () => {
    const submittedSession = { ...session, status: "SUBMITTED" as const };
    const { result } = await renderOpenedWorkspace({ session: submittedSession, entries: [presentEntry] });
    const pendingUnsubmit = deferred<AttendanceSession>();
    const draftSession = { ...submittedSession, status: "DRAFT" as const };
    mockedUnsubmitSession.mockReturnValue(pendingUnsubmit.promise);

    let unsubmitPromise!: Promise<AttendanceSession>;
    act(() => {
      unsubmitPromise = result.current.unsubmit();
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      pendingUnsubmit.resolve(draftSession);
      await unsubmitPromise;
    });
    expect(result.current.isSaving).toBe(false);
  });

  it("resets edited entries to the saved baseline", async () => {
    const { result } = await renderOpenedWorkspace({ session, entries: [presentEntry] });
    act(() => result.current.setEntries([{ ...presentEntry, status: "ABSENT" }]));
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.resetDraft());

    expect(result.current.entries).toEqual([presentEntry]);
    expect(result.current.isDirty).toBe(false);
  });
});
