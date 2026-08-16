import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import {
  fetchEntriesForSessions,
  fetchRoster,
  fetchSessions,
  getOrCreateSession,
  saveSession,
  submitSession,
  unsubmitSession,
  upsertEntry,
} from "@/features/attendance/roll-call/services/attendanceRollCallService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

describe("attendanceRollCallService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads roster from the backend roll-call roster endpoint with backend scope ids", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "student-1",
          displayName: "Sara Ali",
          nameEn: "Sara Ali",
          nameAr: "سارة علي",
          admissionNo: "S-001",
          enrollmentId: "enrollment-1",
          stage: { id: "stage-1" },
          grade: { id: "grade-1" },
          section: { id: "section-1" },
          classroom: { id: "classroom-1" },
          currentStatus: "LATE",
          entryId: "entry-1",
          lateMinutes: 12,
          earlyLeaveMinutes: null,
          excuseReason: null,
          note: "Traffic delay",
        },
      ],
    });

    await expect(
      fetchRoster("CLASSROOM", { classroomId: "classroom-1" }, {
        yearId: "year-1",
        termId: "term-1",
        date: "2026-02-10",
        mode: "DAILY",
      }),
    ).resolves.toEqual([
      {
        id: "student-1",
        nameAr: "سارة علي",
        nameEn: "Sara Ali",
        studentNumber: "S-001",
        photoUrl: undefined,
        enrollmentId: "enrollment-1",
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
        currentStatus: "LATE",
        entryId: "entry-1",
        lateMinutes: 12,
        earlyLeaveMinutes: null,
        excuseReason: null,
        note: "Traffic delay",
      },
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/roll-call/roster", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        date: "2026-02-10",
        mode: "DAILY",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
        scopeId: "classroom-1",
      },
    });
  });

  it("resolves sessions through the backend without creating local ids", async () => {
    mockedApiPost.mockResolvedValueOnce({
      session: {
        id: "session-1",
        academicYearId: "year-1",
        termId: "term-1",
        date: "2026-02-10",
        scopeType: "CLASSROOM",
        scopeKey: "classroom-1",
        mode: "PERIOD",
        periodId: "period-1",
        periodLabelAr: "الحصة الثانية",
        periodLabelEn: "Period 2",
        status: "draft",
        createdAt: "2026-02-10T07:00:00.000Z",
        updatedAt: "2026-02-10T07:00:00.000Z",
      },
      entries: [],
    });

    await expect(
      getOrCreateSession({
        yearId: "year-1",
        termId: "term-1",
        date: "2026-02-10",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        mode: "PERIOD",
        periodId: "period-1",
        periodIndex: 2,
        periodNameAr: "اسم قديم",
        periodNameEn: "Legacy name",
      }),
    ).resolves.toEqual({
      session: expect.objectContaining({
        id: "session-1",
        yearId: "year-1",
        termId: "term-1",
        status: "DRAFT",
        periodIndex: 2,
        periodNameAr: "الحصة الثانية",
        periodNameEn: "Period 2",
      }),
      entries: [],
    });

    expect(mockedApiPost).toHaveBeenCalledWith("/attendance/roll-call/session/resolve", {
      academicYearId: "year-1",
      termId: "term-1",
      date: "2026-02-10",
      scopeType: "CLASSROOM",
      classroomId: "classroom-1",
      scopeId: "classroom-1",
      mode: "PERIOD",
      periodKey: "period-1",
      periodId: "period-1",
      periodLabelAr: "اسم قديم",
      periodLabelEn: "Legacy name",
    });
  });

  it("saves, submits, reopens, and corrects entries through core attendance endpoints", async () => {
    const session = {
      id: "session-1",
      yearId: "year-1",
      termId: "term-1",
      date: "2026-02-10",
      scopeType: "CLASSROOM" as const,
      scopeIds: { classroomId: "classroom-1" },
      mode: "DAILY" as const,
      status: "DRAFT" as const,
      createdAt: "2026-02-10T07:00:00.000Z",
      updatedAt: "2026-02-10T07:00:00.000Z",
    };
    const entry = {
      id: "entry-1",
      sessionId: "session-1",
      studentId: "student-1",
      status: "LATE" as const,
      minutesLate: 10,
      note: "Arrived after roll call",
      updatedAt: "2026-02-10T07:05:00.000Z",
    };

    mockedApiPut.mockResolvedValueOnce({ session, entries: [entry] });
    mockedApiPost
      .mockResolvedValueOnce({ ...session, status: "submitted" })
      .mockResolvedValueOnce({ ...session, status: "draft" })
      .mockResolvedValueOnce({ ...entry, status: "LATE" });
    mockedApiPut.mockResolvedValueOnce({ ...entry, status: "EXCUSED" });

    await saveSession(session, [entry]);
    await submitSession("session-1", "year-1", "term-1");
    await unsubmitSession("year-1", "term-1", "session-1");
    await upsertEntry("year-1", "term-1", "session-1", "student-1", {
      status: "EXCUSED",
      excuseReason: "Medical appointment",
    });
    await upsertEntry("year-1", "term-1", "session-1", "student-1", {
      status: "LATE",
      minutesLate: 10,
      note: "Corrected after review",
      correctionReason: "Corrected after review",
    } as Parameters<typeof upsertEntry>[4] & { correctionReason: string });

    expect(mockedApiPut).toHaveBeenNthCalledWith(
      1,
      "/attendance/roll-call/sessions/session-1/entries",
      {
        entries: [
          {
            studentId: "student-1",
            status: "LATE",
            lateMinutes: 10,
            note: "Arrived after roll call",
          },
        ],
      },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/attendance/roll-call/sessions/session-1/submit",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/attendance/roll-call/sessions/session-1/unsubmit",
    );
    expect(mockedApiPut).toHaveBeenNthCalledWith(
      2,
      "/attendance/roll-call/sessions/session-1/entries/student-1",
      {
        status: "EXCUSED",
        excuseReason: "Medical appointment",
      },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/attendance/roll-call/sessions/session-1/entries/student-1/correct",
      {
        status: "LATE",
        lateMinutes: 10,
        note: "Corrected after review",
        correctionReason: "Corrected after review",
      },
    );
  });

  it("lists sessions and loads entries by session detail without local stores", async () => {
    mockedApiGet
      .mockResolvedValueOnce({
        items: [
          {
            id: "session-1",
            academicYearId: "year-1",
            termId: "term-1",
            date: "2026-02-10",
            scopeType: "CLASSROOM",
            scopeKey: "classroom-1",
            mode: "daily",
            status: "submitted",
            createdAt: "",
            updatedAt: "",
          },
        ],
      })
      .mockResolvedValueOnce({
        session: { id: "session-1", academicYearId: "year-1", termId: "term-1" },
        entries: [{ id: "entry-1", sessionId: "session-1", studentId: "student-1", status: "ABSENT" }],
      });

    await fetchSessions("year-1", "term-1", "2026-02-01", "2026-02-28");
    await expect(fetchEntriesForSessions("year-1", "term-1", ["session-1"])).resolves.toEqual([
      expect.objectContaining({ id: "entry-1", status: "ABSENT" }),
    ]);

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/attendance/roll-call/sessions",
      {
        params: {
          academicYearId: "year-1",
          termId: "term-1",
          dateFrom: "2026-02-01",
          dateTo: "2026-02-28",
        },
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/attendance/roll-call/sessions/session-1",
    );
  });
});
