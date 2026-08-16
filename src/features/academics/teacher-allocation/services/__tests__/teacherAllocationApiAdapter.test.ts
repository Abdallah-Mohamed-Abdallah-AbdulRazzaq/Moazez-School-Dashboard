import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import {
  applyTeacherToGrade,
  bulkSaveTeacherAllocations,
  clearSubjectAllocations,
  createTeacherAllocation,
  deleteTeacherAllocation,
  getTeacherAllocationValidation,
  getTeacherLoads,
  listTeacherAllocations,
} from "@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

describe("teacherAllocationApiAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the list endpoint with allocation filters", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await listTeacherAllocations({
      termId: "term-1",
      classroomId: "classroom-1",
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/allocations", {
      params: {
        termId: "term-1",
        classroomId: "classroom-1",
      },
    });
  });

  it("calls the create endpoint with a classroom allocation payload", async () => {
    const payload = {
      termId: "term-1",
      teacherUserId: "teacher-user-1",
      subjectId: "subject-1",
      classroomId: "classroom-1",
    };
    mockedApiPost.mockResolvedValueOnce({ id: "allocation-1" });

    await createTeacherAllocation(payload);

    expect(mockedApiPost).toHaveBeenCalledWith(
      "/academics/allocations",
      payload,
    );
  });

  it("calls backend write action endpoints with their contract payloads", async () => {
    const bulkPayload = {
      termId: "term-1",
      items: [
        {
          teacherUserId: "teacher-user-1",
          subjectId: "subject-1",
          classroomId: "classroom-1",
        },
      ],
    };
    const gradePayload = {
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      teacherUserId: "teacher-user-1",
      classroomIds: ["classroom-1"],
    };
    const clearPayload = {
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    };
    mockedApiPut.mockResolvedValueOnce({
      items: [],
      summary: { requestedCount: 1, createdCount: 1, existingCount: 0 },
    });
    mockedApiPost
      .mockResolvedValueOnce({
        items: [],
        summary: { requestedClassrooms: 1, createdCount: 1, existingCount: 0 },
      })
      .mockResolvedValueOnce({ ok: true, deletedCount: 1 });

    await bulkSaveTeacherAllocations(bulkPayload);
    await applyTeacherToGrade(gradePayload);
    await clearSubjectAllocations(clearPayload);

    expect(mockedApiPut).toHaveBeenCalledWith(
      "/academics/allocations/bulk",
      bulkPayload,
    );
    expect(mockedApiPut.mock.calls[0][1]).not.toMatchObject({
      items: [
        expect.objectContaining({
          sectionId: expect.anything(),
          teacherId: expect.anything(),
        }),
      ],
    });
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/academics/allocations/apply-to-grade",
      gradePayload,
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/academics/allocations/clear-subject",
      clearPayload,
    );
  });

  it("calls backend analytics endpoints with query params", async () => {
    mockedApiGet
      .mockResolvedValueOnce({
        termId: "term-1",
        academicYearId: "year-1",
        summary: {
          gradesChecked: 0,
          subjectAllocationRows: 0,
          teacherAllocationRows: 0,
          missingTeacherAssignments: 0,
          missingSubjectAllocationRows: 0,
          overAllocatedSubjects: 0,
          underAllocatedSubjects: 0,
        },
        items: [],
      })
      .mockResolvedValueOnce({
        termId: "term-1",
        academicYearId: "year-1",
        items: [],
      });

    await getTeacherAllocationValidation({
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });
    await getTeacherLoads({
      termId: "term-1",
      teacherUserId: "teacher-user-1",
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/allocations/validation",
      {
        params: {
          termId: "term-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
        },
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/allocations/teacher-loads",
      {
        params: {
          termId: "term-1",
          teacherUserId: "teacher-user-1",
        },
      },
    );
  });

  it("calls the delete endpoint by allocation id", async () => {
    mockedApiDelete.mockResolvedValueOnce({ ok: true });

    await deleteTeacherAllocation("allocation-1");

    expect(mockedApiDelete).toHaveBeenCalledWith(
      "/academics/allocations/allocation-1",
    );
  });
});
