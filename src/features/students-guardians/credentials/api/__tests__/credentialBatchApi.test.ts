import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));
const downloadMocks = vi.hoisted(() => ({ downloadBackendAttachment: vi.fn() }));

vi.mock("@/lib/api", () => apiMocks);
vi.mock(
  "@/features/students-guardians/shared/utils/downloadBackendAttachment",
  () => downloadMocks,
);

import {
  createCredentialBatch,
  downloadCredentialBatch,
  getCredentialBatch,
  previewCredentialAudience,
} from "../credentialBatchApi";

const selectedAudience = {
  audienceMode: "selected_students" as const,
  studentIds: ["00000000-0000-4000-8000-000000000001"],
};

describe("credentialBatchApi", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({ id: "batch-1" });
    apiMocks.apiPost.mockReset().mockResolvedValue({ id: "batch-1" });
    downloadMocks.downloadBackendAttachment.mockReset();
  });

  it("posts the exact audience payload to the preview endpoint", async () => {
    const response = {
      totalMatched: 2,
      eligible: 1,
      skipped: 1,
      skippedReasons: { password_already_present: 1 },
      sample: [
        {
          studentId: "student-1",
          userId: "user-1",
          fullName: "Student One",
          username: "student.one",
          loginEmail: "student.one@example.test",
          hasPassword: false,
          mustChangePassword: false,
          credentialVersion: 0,
        },
      ],
    };
    apiMocks.apiPost.mockResolvedValueOnce(response);

    const preview = await previewCredentialAudience(selectedAudience);

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/credential-batches/preview",
      selectedAudience,
    );
    expect(preview).toEqual(response);
  });

  it("creates generated credentials without serializing a shared password", async () => {
    await createCredentialBatch({
      audience: selectedAudience,
      credentialMode: "unique_generated",
      sharedPassword: "must-not-leak",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/credential-batches",
      {
        ...selectedAudience,
        credentialMode: "unique_generated",
      },
    );
  });

  it("preserves every character of an administrator-provided password", async () => {
    await createCredentialBatch({
      audience: { audienceMode: "missing_password" },
      credentialMode: "shared_admin_provided",
      sharedPassword: "  F2Admin!Pass123  ",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/credential-batches",
      {
        audienceMode: "missing_password",
        credentialMode: "shared_admin_provided",
        sharedPassword: "  F2Admin!Pass123  ",
      },
    );
  });

  it("gets a batch with the caller cancellation signal", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      id: "batch-1",
      status: "partial_failed",
      counters: {
        totalRows: 2,
        generatedRows: 1,
        skippedRows: 0,
        failedRows: 1,
      },
    });
    const controller = new AbortController();
    const batch = await getCredentialBatch("batch-1", controller.signal);

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/credential-batches/batch-1",
      { signal: controller.signal },
    );
    expect(batch).toMatchObject({
      id: "batch-1",
      status: "partial_failed",
      counters: { generatedRows: 1, failedRows: 1 },
    });
  });

  it("downloads the direct export with the canonical fallback filename", async () => {
    await downloadCredentialBatch("batch-1");

    expect(downloadMocks.downloadBackendAttachment).toHaveBeenCalledWith(
      "/students-guardians/credential-batches/batch-1/export",
      "student-credentials-batch-1.csv",
    );
  });
});
