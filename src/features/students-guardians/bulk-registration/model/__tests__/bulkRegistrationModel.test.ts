import { describe, expect, it } from "vitest";
import type { BulkRegistrationBatchDetail } from "../../api/bulkRegistrationDtos";
import {
  getBulkRegistrationBatchState,
  getBulkRegistrationDefaultRowStatus,
  getBulkRegistrationErrorCode,
  isBulkRegistrationBatchStatus,
  isBulkRegistrationRowStatus,
  isBulkRegistrationTerminalStatus,
  shouldPauseBulkRegistrationPolling,
} from "../bulkRegistrationModel";

describe("bulkRegistrationModel", () => {
  it.each([
    ["UPLOADED", false, false, undefined],
    ["VALIDATING", false, false, undefined],
    ["VALIDATION_FAILED", true, false, "INVALID"],
    ["READY", false, true, undefined],
    ["EXECUTING", false, false, undefined],
    ["EXECUTION_PARTIAL_FAILED", true, false, "FAILED"],
    ["FAILED", true, false, undefined],
    ["COMPLETED", true, false, undefined],
  ] as const)(
    "classifies %s polling and row-filter behavior",
    (status, terminal, pausesPolling, defaultRowStatus) => {
      expect(isBulkRegistrationBatchStatus(status)).toBe(true);
      expect(isBulkRegistrationTerminalStatus(status)).toBe(terminal);
      expect(shouldPauseBulkRegistrationPolling(status)).toBe(pausesPolling);
      expect(getBulkRegistrationDefaultRowStatus(status)).toBe(defaultRowStatus);
    },
  );

  it.each([
    "PENDING",
    "VALID",
    "INVALID",
    "PROCESSING",
    "CREATED",
    "FAILED",
  ])("recognizes the %s row status", (status) => {
    expect(isBulkRegistrationRowStatus(status)).toBe(true);
  });

  it("maps authoritative counters and nullable timestamps into batch state", () => {
    const batch: BulkRegistrationBatchDetail = {
      id: "batch-1",
      sourceImportJobId: "job-1",
      status: "VALIDATION_FAILED",
      templateVersion: 1,
      placement: {
        academicYearId: "year-1",
        termId: null,
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
      },
      counters: {
        totalRows: 3,
        validRows: 1,
        invalidRows: 2,
        createdRows: 0,
        failedRows: 0,
      },
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:01:00.000Z",
      validatedAt: null,
      startedAt: null,
      completedAt: null,
      validationErrors: ["students.bulk_registration.header_invalid"],
    };

    expect(getBulkRegistrationBatchState(batch)).toMatchObject({
      defaultRowStatus: "INVALID",
      terminal: true,
      pausesPolling: false,
      validationErrorCodes: ["students.bulk_registration.header_invalid"],
      counters: {
        totalRows: 3,
        validRows: 1,
        invalidRows: 2,
        createdRows: 0,
        failedRows: 0,
      },
      timestamps: {
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:01:00.000Z",
        validatedAt: null,
        startedAt: null,
        completedAt: null,
      },
    });
  });

  it("uses the unknown fallback for absent or unsupported error codes", () => {
    expect(getBulkRegistrationErrorCode("students.bulk_registration.header_invalid")).toBe(
      "students.bulk_registration.header_invalid",
    );
    expect(getBulkRegistrationErrorCode("future.backend.code")).toBe("unknown");
    expect(getBulkRegistrationErrorCode(undefined)).toBe("unknown");
  });
});
