import { describe, expect, it } from "vitest";
import type { CredentialBatch } from "../../api/credentialBatchDtos";
import {
  getCredentialBatchState,
  getCredentialExportErrorCode,
  getCredentialPasswordReasonCode,
  isCredentialBatchStatus,
  isCredentialBatchTerminal,
} from "../credentialBatchModel";

const batch: CredentialBatch = {
  id: "batch-1",
  audienceMode: "academic_year",
  credentialMode: "unique_generated",
  selectors: { academicYearId: "year-1" },
  status: "partial_failed",
  counters: { totalRows: 5, generatedRows: 3, skippedRows: 1, failedRows: 1 },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:01:00.000Z",
  startedAt: "2026-09-01T00:00:10.000Z",
  completedAt: "2026-09-01T00:01:00.000Z",
};

describe("credentialBatchModel", () => {
  it.each([
    ["pending", false],
    ["processing", false],
    ["completed", true],
    ["partial_failed", true],
    ["failed", true],
  ] as const)("classifies the lowercase %s status", (status, terminal) => {
    expect(isCredentialBatchStatus(status)).toBe(true);
    expect(isCredentialBatchTerminal(status)).toBe(terminal);
  });

  it("keeps authoritative counters and timestamps and enables valid exports", () => {
    expect(getCredentialBatchState(batch)).toEqual({
      status: "partial_failed",
      terminal: true,
      exportEligible: true,
      counters: batch.counters,
      timestamps: {
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
      },
    });
    expect(
      getCredentialBatchState({
        ...batch,
        status: "failed",
        counters: { ...batch.counters, generatedRows: 0 },
      }).exportEligible,
    ).toBe(false);
  });

  it.each([
    "password_required",
    "password_too_short",
    "password_missing_uppercase",
    "password_missing_lowercase",
    "password_missing_number",
    "password_missing_symbol",
    "password_common",
  ])("maps the known password reason %s", (reasonCode) => {
    expect(getCredentialPasswordReasonCode(reasonCode)).toBe(reasonCode);
  });

  it("uses the unknown fallback for future password reasons", () => {
    expect(getCredentialPasswordReasonCode("future_reason")).toBe("unknown");
    expect(getCredentialPasswordReasonCode(undefined)).toBe("unknown");
  });

  it.each([
    "students.credentials.export_not_ready",
    "students.credentials.export_empty",
    "students.credentials.export_too_large",
    "students.credentials.secret_artifact_unavailable",
    "students.credentials.secret_artifact_expired",
    "students.credentials.secret_artifact_invalid",
  ])("maps the explicit export error %s", (code) => {
    expect(getCredentialExportErrorCode(code)).toBe(code);
  });

  it("maps the placement provenance invariant and hides unsupported errors", () => {
    expect(
      getCredentialExportErrorCode(
        "students.credentials.execution_invariant_invalid",
        "export_placement_provenance_invalid",
      ),
    ).toBe(
      "students.credentials.execution_invariant_invalid.export_placement_provenance_invalid",
    );
    expect(getCredentialExportErrorCode("future.backend.code")).toBe("unknown");
  });
});
