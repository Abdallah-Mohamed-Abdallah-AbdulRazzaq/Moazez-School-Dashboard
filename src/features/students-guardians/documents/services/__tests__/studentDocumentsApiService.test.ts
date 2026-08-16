import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  createStudentDocument,
  deleteStudentDocument,
  importStudentDocumentsFromApplication,
} from "@/features/students-guardians/documents/services/studentDocumentsApiService";

describe("studentDocumentsApiService", () => {
  beforeEach(() => {
    apiMocks.apiDelete.mockReset();
    apiMocks.apiGet.mockReset();
    apiMocks.apiPatch.mockReset();
    apiMocks.apiPost.mockReset();
  });

  it("creates a student document link with an existing uploaded fileId", async () => {
    apiMocks.apiPost.mockResolvedValue({
      id: "document-1",
      studentId: "student-1",
      type: "Birth Certificate",
      status: "complete",
      fileId: "file-1",
    });

    await expect(
      createStudentDocument("student-1", {
        type: "Birth Certificate",
        status: "complete",
        fileId: "file-1",
        notes: "Readable copy",
      }),
    ).resolves.toMatchObject({
      id: "document-1",
      fileId: "file-1",
      status: "complete",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/documents",
      {
        type: "Birth Certificate",
        status: "complete",
        fileId: "file-1",
        notes: "Readable copy",
      },
    );
  });

  it("imports selected admissions documents for a student", async () => {
    apiMocks.apiPost.mockResolvedValue({
      studentId: "student-1",
      applicationId: "application-1",
      imported: [
        {
          applicationDocumentId: "application-document-1",
          studentDocument: {
            id: "document-1",
            studentId: "student-1",
            type: "Birth Certificate",
            name: "birth-certificate.pdf",
            status: "complete",
            fileId: "file-1",
          },
          source: {
            sourceApplicationId: "application-1",
            sourceApplicationDocumentId: "application-document-1",
            sourceApplicantRequestDocumentId: null,
          },
        },
      ],
      skipped: [],
      warnings: [],
    });
    const imported = await importStudentDocumentsFromApplication("student-1", {
      applicationId: "application-1",
      applicationDocumentIds: ["application-document-1"],
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/documents/import-from-application",
      {
        applicationId: "application-1",
        applicationDocumentIds: ["application-document-1"],
      },
    );
    expect(imported.imported[0].studentDocument.fileId).toBe("file-1");
  });

  it("deletes a student document link", async () => {
    apiMocks.apiDelete.mockResolvedValue({ ok: true });
    await expect(deleteStudentDocument("document-1")).resolves.toEqual({
      ok: true,
    });
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(
      "/students-guardians/documents/document-1",
    );
  });
});
