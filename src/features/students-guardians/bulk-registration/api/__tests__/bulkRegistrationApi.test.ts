import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiClient: { post: vi.fn() },
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
  confirmBulkRegistration,
  createBulkRegistration,
  downloadBulkRegistrationTemplate,
  getBulkRegistrationBatch,
  listBulkRegistrationRows,
  preflightBulkRegistration,
} from "../bulkRegistrationApi";

const placement = {
  academicYearId: "year-1",
  classroomId: "classroom-1",
  enrollmentDate: "2026-09-01",
  termId: "term-1",
};

describe("bulkRegistrationApi", () => {
  beforeEach(() => {
    apiMocks.apiClient.post
      .mockReset()
      .mockResolvedValue({ data: { id: "batch-1" } });
    apiMocks.apiGet.mockReset().mockResolvedValue({ id: "batch-1" });
    apiMocks.apiPost.mockReset().mockResolvedValue({ id: "batch-1" });
    downloadMocks.downloadBackendAttachment.mockReset();
  });

  it("posts only placement fields for preflight", async () => {
    const preflight = await preflightBulkRegistration({
      ...placement,
      ignoredRuntimeProperty: "must not reach the backend",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/preflight",
      {
        academicYearId: "year-1",
        termId: "term-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
      },
    );
    expect(preflight).toEqual({ id: "batch-1" });
  });

  it("omits an optional term from preflight placement", async () => {
    await preflightBulkRegistration({
      academicYearId: "year-1",
      classroomId: "classroom-1",
      enrollmentDate: "2026-09-01",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/preflight",
      {
        academicYearId: "year-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
      },
    );
  });

  it("downloads the canonical backend template", async () => {
    await downloadBulkRegistrationTemplate();

    expect(downloadMocks.downloadBackendAttachment).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/template",
      "student-bulk-registration-v1.csv",
    );
  });

  it("posts one file and the placement fields as multipart data", async () => {
    const file = new File(["header\n"], "students.csv", { type: "text/csv" });
    const batch = await createBulkRegistration(placement, file);

    expect(apiMocks.apiClient.post).toHaveBeenCalledTimes(1);
    const [path, body, config] = apiMocks.apiClient.post.mock.calls[0];
    expect(path).toBe("/students-guardians/bulk-registrations");
    expect(body).toBeInstanceOf(FormData);
    expect(Array.from((body as FormData).entries())).toEqual([
      ["file", file],
      ["academicYearId", "year-1"],
      ["termId", "term-1"],
      ["classroomId", "classroom-1"],
      ["enrollmentDate", "2026-09-01"],
    ]);
    expect(config).toBeUndefined();
    expect(batch).toEqual({ id: "batch-1" });
  });

  it("omits an absent term from multipart data", async () => {
    const file = new File(["header\n"], "students.csv", { type: "text/csv" });

    await createBulkRegistration(
      {
        academicYearId: "year-1",
        classroomId: "classroom-1",
        enrollmentDate: "2026-09-01",
      },
      file,
    );

    const [, body] = apiMocks.apiClient.post.mock.calls[0];
    expect(Array.from((body as FormData).entries())).toEqual([
      ["file", file],
      ["academicYearId", "year-1"],
      ["classroomId", "classroom-1"],
      ["enrollmentDate", "2026-09-01"],
    ]);
  });

  it("gets a batch with the caller cancellation signal", async () => {
    const controller = new AbortController();
    const batch = await getBulkRegistrationBatch("batch-1", controller.signal);

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/batch-1",
      { signal: controller.signal },
    );
    expect(batch).toEqual({ id: "batch-1" });
  });

  it("gets paginated rows with an optional status and cancellation signal", async () => {
    const controller = new AbortController();
    const rows = await listBulkRegistrationRows(
      "batch-1",
      { page: 2, limit: 50, status: "INVALID" },
      controller.signal,
    );

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/batch-1/rows?page=2&limit=50&status=INVALID",
      { signal: controller.signal },
    );
    expect(rows).toEqual({ id: "batch-1" });
  });

  it("gets paginated rows without serializing an absent status", async () => {
    await listBulkRegistrationRows("batch-1", { page: 1, limit: 200 });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/batch-1/rows?page=1&limit=200",
      undefined,
    );
  });

  it("posts a confirmation for the batch", async () => {
    const batch = await confirmBulkRegistration("batch-1");

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/bulk-registrations/batch-1/confirm",
    );
    expect(batch).toEqual({ id: "batch-1" });
  });
});
