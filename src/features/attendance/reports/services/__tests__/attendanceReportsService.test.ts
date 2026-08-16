import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchAbsenceRecords } from "@/features/attendance/absences/services/attendanceAbsencesService";
import { fetchExcuseRequests } from "@/features/attendance/excuses/services/attendanceExcusesService";
import { fetchIncidents } from "@/features/attendance/late-early/services/attendanceLateEarlyService";
import { fetchRoster, fetchSessions } from "@/features/attendance/roll-call/services/attendanceRollCallService";
import {
  fetchAttendanceReportSummary,
  fetchDerivedDailyAbsences,
} from "@/features/attendance/reports/services/attendanceReportsService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn().mockResolvedValue({ stages: [], grades: [], sections: [], classrooms: [] }),
}));

vi.mock("@/features/attendance/roll-call/services/attendanceRollCallService", () => ({
  fetchEntriesForSessions: vi.fn().mockResolvedValue([]),
  fetchRoster: vi.fn().mockResolvedValue([]),
  fetchSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/absences/services/attendanceAbsencesService", () => ({
  fetchAbsenceRecords: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/late-early/services/attendanceLateEarlyService", () => ({
  fetchIncidents: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/excuses/services/attendanceExcusesService", () => ({
  fetchExcuseRequests: vi.fn().mockResolvedValue([]),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedFetchStructureTree = vi.mocked(fetchStructureTree);
const mockedFetchAbsenceRecords = vi.mocked(fetchAbsenceRecords);
const mockedFetchExcuseRequests = vi.mocked(fetchExcuseRequests);
const mockedFetchIncidents = vi.mocked(fetchIncidents);
const mockedFetchRoster = vi.mocked(fetchRoster);
const mockedFetchSessions = vi.mocked(fetchSessions);

describe("attendanceReportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads backend aggregate report endpoints with backend query params", async () => {
    mockedFetchAbsenceRecords.mockImplementation(async (params) =>
      params.granularities.includes("DAILY")
        ? [
            {
              id: "daily-absence-1",
              yearId: "year-1",
              termId: "term-1",
              date: "2026-02-10",
              studentId: "student-1",
              studentNumber: "S-001",
              studentNameAr: "Student 1",
              studentNameEn: "Student 1",
              scopeType: "CLASSROOM",
              granularity: "DAILY",
              status: "ABSENT",
              updatedAt: "2026-02-10T08:00:00.000Z",
            },
          ]
        : [],
    );
    mockedApiGet
      .mockResolvedValueOnce({
        totalEntries: 10,
        presentCount: 8,
        absentCount: 1,
        lateCount: 1,
        earlyLeaveCount: 0,
        excusedCount: 0,
        attendanceRate: 0.8,
        affectedStudentsCount: 2,
      })
      .mockResolvedValueOnce({
        items: [
          {
            date: "2026-02-10",
            totalEntries: 10,
            presentCount: 8,
            absentCount: 1,
            lateCount: 1,
            earlyLeaveCount: 0,
            excusedCount: 0,
            attendanceRate: 0.8,
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            scopeId: "classroom-1",
            scopeNameAr: "Classroom 1",
            scopeNameEn: "Classroom 1",
            totalEntries: 10,
            attendanceRate: 0.8,
            incidentCount: 2,
          },
        ],
      });

    const report = await fetchAttendanceReportSummary({
      yearId: "year-1",
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
      attendanceStatus: "ALL",
      excuseStatus: "ALL",
      incidentType: "ALL",
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(1, "/attendance/reports/summary", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        classroomId: "classroom-1",
      },
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(2, "/attendance/reports/daily-trend", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        classroomId: "classroom-1",
      },
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(3, "/attendance/reports/scope-breakdown", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        groupBy: "classroom",
        classroomId: "classroom-1",
      },
    });
    expect(mockedApiGet).toHaveBeenCalledTimes(3);
    expect(report.absenceRecords).toEqual([
      expect.objectContaining({ id: "daily-absence-1", granularity: "DAILY" }),
    ]);
    expect(report.overview.cards.find((card) => card.key === "attendanceRate")?.value).toBe(80);
    expect(report.trend.points).toEqual([
      expect.objectContaining({ dateFrom: "2026-02-10", attendanceRate: 80 }),
    ]);
    expect(report.performance.classroom).toEqual([
      expect.objectContaining({ id: "classroom-1", attendanceRate: 80 }),
    ]);
  });

  it("loads derived daily absences through a separate report endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          date: "2026-02-10",
          studentId: "student-1",
          scopeType: "CLASSROOM",
          scopeKey: "classroom:classroom-1",
          scopeIds: { classroomId: "classroom-1" },
          policyId: "policy-1",
          missedPeriodCount: 3,
          requiredMissedPeriodsCount: 2,
          missedPeriodIds: ["period-1", "period-2", "period-3"],
          evidencePeriodCount: 4,
          sourcePeriodIds: ["period-1", "period-2", "period-3", "period-4"],
          derivedStatus: "ABSENT",
          source: "DERIVED_FROM_PERIODS",
          reportOnly: true,
        },
      ],
    });

    await expect(
      fetchDerivedDailyAbsences({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        attendanceStatus: "ALL",
        excuseStatus: "ALL",
        incidentType: "ALL",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        date: "2026-02-10",
        studentId: "student-1",
        derivedStatus: "ABSENT",
        reportOnly: true,
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/reports/derived-daily-absences", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        classroomId: "classroom-1",
      },
    });
  });

  it("uses report aggregates when auxiliary attendance permissions are forbidden", async () => {
    const forbidden = new ApiError("Forbidden", 403, "FORBIDDEN");
    mockedFetchStructureTree.mockRejectedValue(forbidden);
    mockedFetchSessions.mockRejectedValue(forbidden);
    mockedFetchRoster.mockRejectedValue(forbidden);
    mockedFetchAbsenceRecords.mockRejectedValue(forbidden);
    mockedFetchIncidents.mockRejectedValue(forbidden);
    mockedFetchExcuseRequests.mockRejectedValue(forbidden);
    mockedApiGet
      .mockResolvedValueOnce({
        totalEntries: 10,
        presentCount: 8,
        absentCount: 1,
        lateCount: 1,
        earlyLeaveCount: 0,
        excusedCount: 0,
        attendanceRate: 0.8,
        affectedStudentsCount: 2,
      })
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [] });

    const report = await fetchAttendanceReportSummary({
      yearId: "year-1",
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
      scopeType: "SCHOOL",
      scopeIds: {},
      attendanceStatus: "ALL",
      excuseStatus: "ALL",
      incidentType: "ALL",
    });

    expect(report.overview.cards.find((card) => card.key === "attendanceRate")?.value).toBe(80);
    expect(report.attendanceRows).toEqual([]);
    expect(report.absenceRecords).toEqual([]);
    expect(report.incidents).toEqual([]);
    expect(report.excuseRequests).toEqual([]);
  });
});
