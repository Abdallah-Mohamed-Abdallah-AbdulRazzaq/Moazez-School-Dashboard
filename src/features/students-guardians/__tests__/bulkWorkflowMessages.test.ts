import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

const registrationBatchStatuses = [
  "UPLOADED",
  "VALIDATING",
  "VALIDATION_FAILED",
  "READY",
  "EXECUTING",
  "EXECUTION_PARTIAL_FAILED",
  "FAILED",
  "COMPLETED",
];
const registrationRowStatuses = [
  "PENDING",
  "VALID",
  "INVALID",
  "PROCESSING",
  "CREATED",
  "FAILED",
];
const credentialStatuses = [
  "pending",
  "processing",
  "completed",
  "partial_failed",
  "failed",
];
const passwordReasons = [
  "password_required",
  "password_too_short",
  "password_missing_uppercase",
  "password_missing_lowercase",
  "password_missing_number",
  "password_missing_symbol",
  "password_common",
];
const exportErrors = [
  "export_not_ready",
  "export_empty",
  "export_too_large",
  "secret_artifact_unavailable",
  "secret_artifact_expired",
  "secret_artifact_invalid",
  "export_placement_provenance_invalid",
];

describe("bulk workflow message catalogs", () => {
  it.each(["bulk_registration", "credentials"] as const)(
    "keeps recursive English/Arabic parity for %s",
    (tree) => {
      expect(en.students_guardians[tree]).toBeDefined();
      expect(ar.students_guardians[tree]).toBeDefined();
      expect(leafPaths(ar.students_guardians[tree]).sort()).toEqual(
        leafPaths(en.students_guardians[tree]).sort(),
      );
    },
  );

  it.each(registrationBatchStatuses)("localizes registration batch status %s", (status) => {
    expect(en.students_guardians.bulk_registration.statuses.batch[status]).toBeTruthy();
    expect(ar.students_guardians.bulk_registration.statuses.batch[status]).toBeTruthy();
  });

  it.each(registrationRowStatuses)("localizes registration row status %s", (status) => {
    expect(en.students_guardians.bulk_registration.statuses.row[status]).toBeTruthy();
    expect(ar.students_guardians.bulk_registration.statuses.row[status]).toBeTruthy();
  });

  it.each(credentialStatuses)("localizes credential status %s", (status) => {
    expect(en.students_guardians.credentials.statuses[status]).toBeTruthy();
    expect(ar.students_guardians.credentials.statuses[status]).toBeTruthy();
  });

  it.each(passwordReasons)("localizes password reason %s", (reason) => {
    expect(en.students_guardians.credentials.password_reasons[reason]).toBeTruthy();
    expect(ar.students_guardians.credentials.password_reasons[reason]).toBeTruthy();
  });

  it.each(exportErrors)("localizes export error %s", (error) => {
    expect(en.students_guardians.credentials.export_errors[error]).toBeTruthy();
    expect(ar.students_guardians.credentials.export_errors[error]).toBeTruthy();
  });
});
