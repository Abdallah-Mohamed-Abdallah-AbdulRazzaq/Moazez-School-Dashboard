import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { createSubjectsApiAdapter } from "@/features/academics/subjects/services/subjectsApiAdapter";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

describe("subjectsApiAdapter", () => {
  const adapter = createSubjectsApiAdapter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists subject allocations from the backend allocation endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "subject-allocation-1",
          academicYearId: "year-1",
          termId: "term-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
          weeklyHours: 5,
          grade: { id: "grade-1", nameAr: "Grade 1 AR", nameEn: "Grade 1" },
          subject: {
            id: "subject-1",
            nameAr: "Math AR",
            nameEn: "Math",
            code: "MATH",
            color: "#2563eb",
          },
          createdAt: "2026-06-16T09:00:00.000Z",
          updatedAt: "2026-06-16T09:00:00.000Z",
        },
      ],
    });

    await expect(
      adapter.fetchSubjectAllocations("term-1", {
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "subject-allocation-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        weeklyHours: 5,
      }),
    ]);
    expect(mockedApiGet).toHaveBeenCalledWith(
      "/academics/subject-allocations",
      {
        params: {
          termId: "term-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
        },
      },
    );
  });

  it("bulk saves subject allocations through the backend bulk endpoint", async () => {
    mockedApiPut.mockResolvedValueOnce({ items: [] });

    await adapter.bulkUpsertSubjectAllocations("term-1", [
      {
        id: "client-only-id",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        weeklyHours: 6,
      },
    ]);

    expect(mockedApiPut).toHaveBeenCalledWith(
      "/academics/subject-allocations/bulk",
      {
        termId: "term-1",
        items: [
          {
            gradeId: "grade-1",
            subjectId: "subject-1",
            weeklyHours: 6,
          },
        ],
      },
    );
  });

  it("keeps subject CRUD calls catalog-only on the subjects endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });
    mockedApiPost.mockResolvedValueOnce({ id: "subject-1" });
    mockedApiPatch.mockResolvedValueOnce({ id: "subject-1" });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await adapter.fetchSubjects();
    await adapter.createSubject({
      name: "Math",
      nameAr: "Math AR",
      nameEn: "Math",
      code: null,
      color: null,
      isActive: true,
    });
    await adapter.updateSubject("subject-1", { isActive: false });
    await adapter.deleteSubject("subject-1");

    expect(mockedApiGet).toHaveBeenCalledWith("/academics/subjects");
    expect(mockedApiPost).toHaveBeenCalledWith("/academics/subjects", {
      name: "Math",
      nameAr: "Math AR",
      nameEn: "Math",
      code: null,
      color: null,
      isActive: true,
    });
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/academics/subjects/subject-1",
      {
        isActive: false,
      },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith("/academics/subjects/subject-1");
  });
});
