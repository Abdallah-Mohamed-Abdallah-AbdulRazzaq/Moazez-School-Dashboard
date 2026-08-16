import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch } from "@/lib/api";
import {
  fetchAbsenceSummary,
  fetchAbsenceRecords,
  updateEarlyLeaveMinutes,
  updateExcuse,
} from "@/features/attendance/absences/services/attendanceAbsencesService";
import type { AbsenceRecord } from "@/features/attendance/absences/types";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);

describe("attendanceAbsencesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads dashboard incidents from the backend absences endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "incident-1",
          academicYearId: "year-1",
          termId: "term-1",
          date: "2026-02-10",
          studentId: "student-1",
          studentNameEn: "Sara Ali",
          studentNameAr: "سارة علي",
          studentNumber: "S-001",
          scopeType: "CLASSROOM",
          scopeKey: "classroom-1",
          status: "ABSENT",
          mode: "DAILY",
          periodId: null,
          periodKey: "daily",
          sourceSessionId: "session-1",
          updatedAt: "2026-02-10T07:30:00.000Z",
        },
      ],
    });

    await expect(
      fetchAbsenceRecords({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        status: "ALL",
        granularities: ["DAILY"],
        onlyUnexcused: false,
        search: "sara",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "incident-1",
        yearId: "year-1",
        termId: "term-1",
        status: "ABSENT",
        granularity: "DAILY",
        periodKey: "daily",
        scopeIds: { classroomId: "classroom-1" },
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/absences", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
      },
    });
  });

  it("loads absence summary from the backend summary endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      totalIncidents: 6,
      absentCount: 2,
      lateCount: 2,
      earlyLeaveCount: 1,
      excusedCount: 1,
      affectedStudentsCount: 4,
    });

    await expect(
      fetchAbsenceSummary({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "SCHOOL",
        scopeIds: {},
        status: "ALL",
        granularities: ["PERIOD"],
        onlyUnexcused: false,
        search: "",
      }),
    ).resolves.toEqual({
      totalIncidents: 6,
      absentCount: 2,
      lateCount: 2,
      earlyLeaveCount: 1,
      excusedCount: 1,
      affectedStudentsCount: 4,
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/absences/summary", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
      },
    });
  });

  it("does not invent the status that an excused incident had before correction", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "incident-2",
          academicYearId: "year-1",
          termId: "term-1",
          date: "2026-02-10",
          studentId: "student-1",
          studentNameEn: "Sara Ali",
          scopeType: "CLASSROOM",
          status: "EXCUSED",
          lateMinutes: 20,
          mode: "PERIOD",
          submittedAt: "2026-02-10T08:00:00.000Z",
          updatedAt: "2026-02-10T08:10:00.000Z",
        },
      ],
    });

    const [record] = await fetchAbsenceRecords({
      yearId: "year-1",
      termId: "term-1",
      scopeType: "SCHOOL",
      status: "ALL",
      granularities: ["PERIOD"],
      onlyUnexcused: false,
      search: "",
    });

    expect(record.excusedFromStatus).toBeUndefined();
  });

  it("uses backend correction endpoints for excuse and early leave updates", async () => {
    const record: AbsenceRecord = {
      id: "incident-1",
      yearId: "year-1",
      termId: "term-1",
      date: "2026-02-10",
      studentId: "student-1",
      studentNumber: "S-001",
      studentNameAr: "سارة علي",
      studentNameEn: "Sara Ali",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
      granularity: "PERIOD",
      status: "ABSENT",
      sourceSessionId: "session-1",
      updatedAt: "2026-02-10T07:30:00.000Z",
    };

    mockedApiPatch.mockResolvedValue({});

    await updateExcuse(record, "Medical appointment");
    await updateEarlyLeaveMinutes(record, 20, "Corrected departure time");

    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      1,
      "/attendance/absences/incident-1/excuse",
      {
        correctionReason: "Medical appointment",
        excuseReason: "Medical appointment",
        note: "Medical appointment",
      },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      2,
      "/attendance/absences/incident-1/early-leave",
      {
        earlyLeaveMinutes: 20,
        correctionReason: "Corrected departure time",
        note: "Corrected departure time",
      },
    );
  });
});
