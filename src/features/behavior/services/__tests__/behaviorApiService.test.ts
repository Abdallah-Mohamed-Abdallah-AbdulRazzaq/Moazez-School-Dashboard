import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import {
  cancelBehaviorRecord,
  deleteBehaviorCategory,
  getBehaviorOverview,
  getClassroomBehaviorSummary,
  getBehaviorReviewQueueItem,
  getStudentBehaviorSummary,
  listBehaviorRecords,
  rejectBehaviorRecord,
} from "@/features/behavior/services/behaviorApiService";
import type { BehaviorReviewRecord } from "@/features/behavior/types";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);

const submittedReviewRecord: BehaviorReviewRecord = {
  id: "record-1",
  academicYearId: "year-1",
  termId: "term-1",
  studentId: "student-1",
  enrollmentId: null,
  categoryId: "category-1",
  type: "negative",
  severity: "medium",
  status: "submitted",
  points: -3,
  titleEn: null,
  titleAr: null,
  noteEn: "Needs review",
  noteAr: null,
  occurredAt: "2026-03-01T10:00:00.000Z",
  createdById: "user-1",
  submittedById: "user-1",
  submittedAt: "2026-03-01T10:05:00.000Z",
  reviewedById: null,
  reviewedAt: null,
  reviewNoteEn: null,
  reviewNoteAr: null,
  metadata: null,
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:05:00.000Z",
  summaries: {
    student: { id: "student-1", displayName: "Ali Hassan" },
    category: { id: "category-1", nameEn: "Conduct", nameAr: null },
    enrollment: null,
    academicYear: {},
    term: {},
    createdBy: {},
    submittedBy: {},
    reviewedBy: null,
  },
  behaviorPointLedgerEntries: [],
};

describe("behaviorApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("translates dashboard date filters to backend occurred range params", async () => {
    mockedApiGet.mockResolvedValue({});

    await listBehaviorRecords({
      academicYearId: "year-1",
      termId: "term-1",
      status: "cancelled",
      severity: "critical",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getBehaviorOverview({
      academicYearId: "year-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getStudentBehaviorSummary("student-1", {
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getClassroomBehaviorSummary("classroom-1", {
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/behavior/records?academicYearId=year-1&termId=term-1&status=cancelled&severity=critical&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/behavior/overview?academicYearId=year-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/behavior/students/student-1/summary?termId=term-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      4,
      "/behavior/classrooms/classroom-1/summary?termId=term-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
  });

  it("exposes backend category delete and record cancel endpoints", async () => {
    mockedApiDelete.mockResolvedValue({});
    mockedApiPost.mockResolvedValue({});

    await deleteBehaviorCategory("category-1");
    await cancelBehaviorRecord("record-1", { cancellationReasonEn: "Duplicate" });

    expect(mockedApiDelete).toHaveBeenCalledWith("/behavior/categories/category-1");
    expect(mockedApiPost).toHaveBeenCalledWith("/behavior/records/record-1/cancel", {
      cancellationReasonEn: "Duplicate",
    });
  });

  it("returns a rejected review record without a record wrapper", async () => {
    const rejectedRecord: BehaviorReviewRecord = {
      ...submittedReviewRecord,
      status: "rejected",
      reviewedById: "reviewer-1",
      reviewedAt: "2026-03-01T11:00:00.000Z",
      reviewNoteEn: "Insufficient evidence",
    };
    mockedApiPost.mockResolvedValue(rejectedRecord);

    const result: BehaviorReviewRecord = await rejectBehaviorRecord("record-1", {
      reviewNoteEn: "Insufficient evidence",
    });

    expect(result).toBe(rejectedRecord);
    expect(mockedApiPost).toHaveBeenCalledWith("/behavior/records/record-1/reject", {
      reviewNoteEn: "Insufficient evidence",
    });
  });

  it("types review detail as the complete review presenter", async () => {
    mockedApiGet.mockResolvedValue(submittedReviewRecord);

    const result: BehaviorReviewRecord = await getBehaviorReviewQueueItem("record-1");

    expect(result).toBe(submittedReviewRecord);
    expect(mockedApiGet).toHaveBeenCalledWith("/behavior/review-queue/record-1");
  });
});
