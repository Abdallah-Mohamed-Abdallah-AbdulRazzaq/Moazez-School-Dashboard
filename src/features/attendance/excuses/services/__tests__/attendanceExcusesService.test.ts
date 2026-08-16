import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  approveExcuseRequest,
  createExcuseRequest,
  deleteExcuseRequest,
  fetchExcuseRequests,
  fetchExcuseRequestDetails,
  rejectExcuseRequest,
  updateExcuseRequest,
  ExcuseAttachmentLinkError,
} from "@/features/attendance/excuses/services/attendanceExcusesService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/features/attendance/policies/services/attendancePolicyService", () => ({
  fetchPolicies: vi.fn().mockResolvedValue([]),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("attendanceExcusesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists formal excuse requests from the backend endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "excuse-1",
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-1",
          studentNameEn: "Sara Ali",
          studentNameAr: "سارة علي",
          type: "ABSENCE",
          status: "PENDING",
          date: "2026-02-10",
          reason: "Medical appointment",
          attachments: [],
          createdAt: "2026-02-09T10:00:00.000Z",
          updatedAt: "2026-02-09T10:00:00.000Z",
        },
      ],
    });

    await expect(
      fetchExcuseRequests({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        status: "PENDING",
        type: "ABSENCE",
        search: "sara",
        hasAttachment: "NO",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "excuse-1",
        yearId: "year-1",
        termId: "term-1",
        reasonEn: "Medical appointment",
        dateFrom: "2026-02-10",
        dateTo: "2026-02-10",
        scopeType: "SCHOOL",
        scopeIds: {},
        hasScopeContext: true,
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/excuse-requests", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        status: "PENDING",
        type: "ABSENCE",
        search: "sara",
      },
    });
  });

  it("uses backend formal excuse mutation and review endpoints", async () => {
    mockedApiPost
      .mockResolvedValueOnce({ id: "excuse-1", status: "PENDING" })
      .mockResolvedValueOnce({ id: "excuse-1", status: "APPROVED" })
      .mockResolvedValueOnce({ id: "excuse-2", status: "REJECTED" });
    mockedApiPatch.mockResolvedValueOnce({ id: "excuse-1", status: "PENDING" });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "سارة علي",
      studentNameEn: "Sara Ali",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
      attachments: [],
    });
    await updateExcuseRequest("excuse-1", { reasonEn: "Updated reason" });
    await approveExcuseRequest("excuse-1", "Approved");
    await rejectExcuseRequest("excuse-2", "Rejected");
    await deleteExcuseRequest("excuse-1");

    expect(mockedApiPost.mock.calls[0][0]).toBe("/attendance/excuse-requests");
    expect(mockedApiPost.mock.calls[0][1]).toStrictEqual({
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
    });
    expect(mockedApiPatch).toHaveBeenCalledWith("/attendance/excuse-requests/excuse-1", {
      reasonEn: "Updated reason",
    });
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/attendance/excuse-requests/excuse-1/approve",
      { decisionNote: "Approved" },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/attendance/excuse-requests/excuse-2/reject",
      { decisionNote: "Rejected" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith("/attendance/excuse-requests/excuse-1");
  });

  it("links already uploaded attachment file ids after creating an excuse request", async () => {
    mockedApiPost
      .mockResolvedValueOnce({ id: "excuse-1", academicYearId: "year-1", termId: "term-1", status: "PENDING" })
      .mockResolvedValueOnce({ items: [] });

    await createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "سارة علي",
      studentNameEn: "Sara Ali",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
      attachments: [{ id: "file-1", name: "medical.pdf", size: 1000, type: "application/pdf", url: "/files/file-1" }],
    });

    expect(mockedApiPost.mock.calls[0][0]).toBe("/attendance/excuse-requests");
    expect(mockedApiPost.mock.calls[0][1]).toStrictEqual({
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
    });
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/attendance/excuse-requests/excuse-1/attachments",
      { fileIds: ["file-1"] },
    );
  });

  it("sends canonical period keys and normalized nullable reasons", async () => {
    mockedApiPost.mockResolvedValueOnce({
      id: "excuse-1",
      academicYearId: "year-1",
      termId: "term-1",
      status: "PENDING",
    });

    await createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "",
      studentNameEn: "Sara Ali",
      type: "LATE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      selectedPeriodIds: ["period-1"],
      minutesLate: 10,
      reasonAr: "   ",
      reasonEn: "  Transport delay  ",
      attachments: [],
    });

    expect(mockedApiPost).toHaveBeenCalledWith("/attendance/excuse-requests", {
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      type: "LATE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      selectedPeriodKeys: ["period-1"],
      lateMinutes: 10,
      reasonAr: null,
      reasonEn: "Transport delay",
    });
  });

  it("links only newly added attachments when editing", async () => {
    mockedApiPatch.mockResolvedValueOnce({
      id: "excuse-1",
      academicYearId: "year-1",
      termId: "term-1",
      status: "PENDING",
    });
    mockedApiPost.mockResolvedValueOnce({ items: [] });

    const existing = {
      id: "existing-file",
      name: "existing.pdf",
      size: 100,
      type: "application/pdf",
    };
    await updateExcuseRequest(
      "excuse-1",
      { attachments: [existing, { ...existing, id: "new-file", name: "new.pdf" }] },
      [existing],
    );

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/attendance/excuse-requests/excuse-1/attachments",
      { fileIds: ["new-file"] },
    );
  });

  it("reports a saved request when attachment linking fails", async () => {
    mockedApiPost
      .mockResolvedValueOnce({
        id: "excuse-1",
        academicYearId: "year-1",
        termId: "term-1",
        status: "PENDING",
      })
      .mockRejectedValueOnce(new Error("storage unavailable"));

    const result = createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "",
      studentNameEn: "Sara Ali",
      scopeType: "SCHOOL",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "",
      reasonEn: "Medical",
      attachments: [
        { id: "file-1", name: "medical.pdf", size: 100, type: "application/pdf" },
      ],
    });

    await expect(result).rejects.toMatchObject({
      name: "ExcuseAttachmentLinkError",
      request: expect.objectContaining({ id: "excuse-1" }),
      fileIds: ["file-1"],
    } satisfies Partial<ExcuseAttachmentLinkError>);
  });

  it("maps the formal backend response without losing counts or audit ids", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "a4df7048-d7ec-404e-b051-0fe7ae52fbb7",
          academicYearId: "d538d645-97b2-4312-937d-53ad9327e20a",
          yearId: "d538d645-97b2-4312-937d-53ad9327e20a",
          termId: "1a9ae616-aa75-4ee0-86d2-b42d3b0579d2",
          studentId: "a20fdb15-86a8-40b4-b12d-4e43782b0805",
          student: {
            id: "a20fdb15-86a8-40b4-b12d-4e43782b0805",
            name: "Ali Dahshan",
            fullNameEn: "Ali Dahshan",
            studentNumber: null,
          },
          studentName: "Ali Dahshan",
          studentNameAr: null,
          studentNameEn: "Ali Dahshan",
          type: "LATE",
          status: "PENDING",
          dateFrom: "2026-07-01",
          dateTo: "2026-07-01",
          selectedPeriodKeys: ["period-1", "period-2"],
          lateMinutes: 10,
          reasonAr: "Calculus",
          reasonEn: "Transport",
          createdById: "dc9dbefb-3e65-4950-bc77-d7f758355d44",
          decidedById: null,
          linkedSessionIds: [],
          attachmentCount: 1,
          createdAt: "2026-07-11T02:58:40.719Z",
          updatedAt: "2026-07-11T02:58:40.719Z",
        },
      ],
    });

    const [request] = await fetchExcuseRequests({
      yearId: "d538d645-97b2-4312-937d-53ad9327e20a",
      termId: "1a9ae616-aa75-4ee0-86d2-b42d3b0579d2",
      status: "ALL",
      type: "ALL",
      search: "",
      hasAttachment: "ALL",
    });

    expect(request).toMatchObject({
      studentNameEn: "Ali Dahshan",
      studentNameAr: "Ali Dahshan",
      selectedPeriodIds: ["period-1", "period-2"],
      minutesLate: 10,
      attachmentCount: 1,
      createdById: "dc9dbefb-3e65-4950-bc77-d7f758355d44",
      decidedById: undefined,
      scopeType: "SCHOOL",
      scopeIds: {},
      hasScopeContext: true,
    });
  });

  it("loads attachment metadata only when request details need it", async () => {
    mockedApiGet
      .mockResolvedValueOnce({
        id: "excuse-1",
        academicYearId: "year-1",
        termId: "term-1",
        studentId: "student-1",
        studentNameEn: "Ali Dahshan",
        type: "ABSENCE",
        status: "PENDING",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-01",
        selectedPeriodKeys: [],
        attachmentCount: 1,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "attachment-1",
            fileId: "b8e9a2ac-a9b4-4dc1-b02a-fdbcf2ab73fd",
            originalName: "medical.pdf",
            mimeType: "application/pdf",
            sizeBytes: "700",
            downloadUrl: "/files/download",
          },
        ],
      });

    await expect(fetchExcuseRequestDetails("excuse-1")).resolves.toMatchObject({
      attachmentCount: 1,
      attachments: [
        {
          id: "b8e9a2ac-a9b4-4dc1-b02a-fdbcf2ab73fd",
          attachmentId: "attachment-1",
          name: "medical.pdf",
          size: 700,
          type: "application/pdf",
        },
      ],
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/attendance/excuse-requests/excuse-1/attachments",
    );
  });

  it("deletes attachment records removed while editing", async () => {
    mockedApiPatch.mockResolvedValueOnce({
      id: "excuse-1",
      status: "PENDING",
      attachmentCount: 0,
    });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await updateExcuseRequest(
      "excuse-1",
      { attachments: [] },
      [
        {
          id: "file-1",
          attachmentId: "attachment-1",
          name: "medical.pdf",
          size: 700,
          type: "application/pdf",
        },
      ],
    );

    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/attendance/excuse-requests/excuse-1/attachments/attachment-1",
    );
  });
});
