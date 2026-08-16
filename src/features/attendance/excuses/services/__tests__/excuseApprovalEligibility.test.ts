import { describe, expect, it } from "vitest";
import type {
  AttendanceEntry,
  AttendanceSession,
} from "@/features/attendance/roll-call/types";
import { deriveExcuseApprovalEligibility } from "../excuseApprovalEligibility";
import type { ExcuseRequest } from "../../types";

const pendingAbsenceRequest: ExcuseRequest = {
  id: "excuse-1",
  yearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  studentNameAr: "Ali Dahshan",
  studentNameEn: "Ali Dahshan",
  type: "ABSENCE",
  dateFrom: "2026-07-19",
  dateTo: "2026-07-19",
  reasonAr: "Medical appointment",
  reasonEn: "Medical appointment",
  attachments: [],
  status: "PENDING",
  createdAt: "2026-07-19T14:28:44.962Z",
  updatedAt: "2026-07-19T14:28:44.962Z",
};

const submittedDailySession: AttendanceSession = {
  id: "session-1",
  yearId: "year-1",
  termId: "term-1",
  date: "2026-07-19",
  scopeType: "SCHOOL",
  mode: "DAILY",
  periodKey: "daily",
  status: "SUBMITTED",
  createdAt: "2026-07-19T14:06:08.093Z",
  updatedAt: "2026-07-19T18:42:15.330Z",
};

const alreadyExcusedEntry: AttendanceEntry = {
  id: "entry-1",
  sessionId: "session-1",
  studentId: "student-1",
  status: "EXCUSED",
  updatedAt: "2026-07-19T18:42:15.330Z",
};

describe("deriveExcuseApprovalEligibility", () => {
  it("marks a pending absence as already excused when its submitted entry is EXCUSED", () => {
    expect(
      deriveExcuseApprovalEligibility(
        pendingAbsenceRequest,
        [submittedDailySession],
        [alreadyExcusedEntry],
      ),
    ).toMatchObject({
      state: "ALREADY_EXCUSED",
      eligibleEntryCount: 0,
      alreadyExcusedEntryCount: 1,
    });
  });
});
