import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCurriculumApiAdapter } from "../curriculumApiAdapter";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiDelete = vi.mocked(apiDelete);

describe("curriculumApiAdapter", () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
    mockedApiPatch.mockReset();
    mockedApiDelete.mockReset();
  });

  it("lists curricula with backend-supported filters and unwraps items", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "curriculum-1",
          curriculumId: "curriculum-1",
          academicYearId: "year-1",
          termId: "term-1",
          gradeId: "grade-1",
          subjectId: "subject-1",
          title: "Math",
          description: null,
          status: "DRAFT",
          publishedAt: null,
          archivedAt: null,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          academicYear: { id: "year-1", name: "2026", nameAr: "٢٠٢٦", nameEn: "2026" },
          term: { id: "term-1", name: "Term 1", nameAr: "الفصل ١", nameEn: "Term 1" },
          grade: { id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1" },
          subject: {
            id: "subject-1",
            name: "Math",
            nameAr: "رياضيات",
            nameEn: "Math",
            code: null,
            color: null,
          },
          unitCount: 0,
          lessonCount: 0,
        },
      ],
    });

    const result = await createCurriculumApiAdapter().listCurricula({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      search: "math",
    });

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/academics/curriculum?academicYearId=year-1&termId=term-1&gradeId=grade-1&subjectId=subject-1&search=math",
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Math");
  });

  it("fetches curriculum detail from the curriculum id route", async () => {
    mockedApiGet.mockResolvedValueOnce({
      id: "curriculum-1",
      curriculumId: "curriculum-1",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
      description: null,
      status: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      academicYear: { id: "year-1", name: "2026", nameAr: "٢٠٢٦", nameEn: "2026" },
      term: { id: "term-1", name: "Term 1", nameAr: "الفصل ١", nameEn: "Term 1" },
      grade: { id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1" },
      subject: {
        id: "subject-1",
        name: "Math",
        nameAr: "رياضيات",
        nameEn: "Math",
        code: null,
        color: null,
      },
      unitCount: 0,
      lessonCount: 0,
      units: [],
    });

    await createCurriculumApiAdapter().getCurriculum("curriculum-1");

    expect(mockedApiGet).toHaveBeenCalledWith(
      "/academics/curriculum/curriculum-1",
    );
  });

  it("uses nested unit, lesson, and content routes with supported request bodies", async () => {
    const adapter = createCurriculumApiAdapter();
    const unitResponse = {
      id: "unit-1",
      unitId: "unit-1",
      curriculumId: "curriculum-1",
      title: "Numbers",
      description: null,
      sortOrder: 2,
      estimatedLessons: null,
      lessonCount: 0,
      lessons: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const lessonResponse = {
      id: "lesson-1",
      lessonId: "lesson-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      title: "Counting",
      description: null,
      objectives: [],
      sortOrder: 3,
      estimatedMinutes: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const contentResponse = {
      id: "content-1",
      contentItemId: "content-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: "video_link",
      title: "Watch",
      bodyText: null,
      url: "https://example.com/video",
      file: null,
      sortOrder: 0,
      isRequired: true,
      estimatedMinutes: null,
      metadata: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    mockedApiPatch
      .mockResolvedValueOnce(unitResponse)
      .mockResolvedValueOnce(lessonResponse);
    mockedApiPost.mockResolvedValueOnce(contentResponse);

    await adapter.reorderUnit("curriculum-1", "unit-1", { sortOrder: 2 });
    await adapter.reorderLesson("curriculum-1", "unit-1", "lesson-1", {
      sortOrder: 3,
    });
    await adapter.createLessonContent("curriculum-1", "unit-1", "lesson-1", {
      type: "VIDEO_LINK",
      title: "Watch",
      url: "https://example.com/video",
      fileId: null,
      bodyText: null,
    });

    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum/curriculum-1/units/unit-1/reorder",
      { sortOrder: 2 },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/reorder",
      { sortOrder: 3 },
    );
    expect(mockedApiPost).toHaveBeenCalledWith(
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content",
      {
        type: "VIDEO_LINK",
        title: "Watch",
        url: "https://example.com/video",
        fileId: null,
        bodyText: null,
      },
    );
  });

  it("implements the planned curriculum route matrix and delete response shape", async () => {
    const adapter = createCurriculumApiAdapter();
    const curriculumResponse = {
      id: "curriculum-1",
      curriculumId: "curriculum-1",
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
      description: null,
      status: "DRAFT",
      publishedAt: null,
      archivedAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
      academicYear: { id: "year-1", name: "2026" },
      term: { id: "term-1", name: "Term 1" },
      grade: { id: "grade-1", name: "Grade 1" },
      subject: { id: "subject-1", name: "Math", code: null, color: null },
      unitCount: 0,
      lessonCount: 0,
      units: [],
    };
    const unitResponse = {
      id: "unit-1",
      curriculumId: "curriculum-1",
      title: "Numbers",
      description: null,
      sortOrder: 0,
      estimatedLessons: null,
      lessonCount: 0,
      lessons: [],
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const lessonResponse = {
      id: "lesson-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      title: "Counting",
      description: null,
      objectives: [],
      sortOrder: 0,
      estimatedMinutes: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    const contentResponse = {
      id: "content-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: "TEXT",
      title: "Read",
      bodyText: "Hello",
      url: null,
      file: null,
      sortOrder: 0,
      isRequired: true,
      estimatedMinutes: null,
      metadata: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };

    mockedApiPost
      .mockResolvedValueOnce(curriculumResponse)
      .mockResolvedValueOnce(curriculumResponse)
      .mockResolvedValueOnce(curriculumResponse)
      .mockResolvedValueOnce(unitResponse)
      .mockResolvedValueOnce(lessonResponse)
      .mockResolvedValueOnce(contentResponse);
    mockedApiGet
      .mockResolvedValueOnce({ items: [curriculumResponse] })
      .mockResolvedValueOnce(curriculumResponse)
      .mockResolvedValueOnce({ items: [contentResponse] })
      .mockResolvedValueOnce(contentResponse);
    mockedApiPatch
      .mockResolvedValueOnce(curriculumResponse)
      .mockResolvedValueOnce(unitResponse)
      .mockResolvedValueOnce(unitResponse)
      .mockResolvedValueOnce(lessonResponse)
      .mockResolvedValueOnce(lessonResponse)
      .mockResolvedValueOnce(contentResponse)
      .mockResolvedValueOnce(contentResponse);
    mockedApiDelete.mockResolvedValue({ ok: true });

    await adapter.listCurricula({ status: "DRAFT" });
    await adapter.createCurriculum({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    await adapter.getCurriculum("curriculum-1");
    await adapter.updateCurriculum("curriculum-1", { title: "Math 2" });
    await adapter.activateCurriculum("curriculum-1");
    await adapter.archiveCurriculum("curriculum-1");
    await expect(adapter.deleteCurriculum("curriculum-1")).resolves.toEqual({
      ok: true,
    });
    await adapter.createUnit("curriculum-1", { title: "Numbers" });
    await adapter.updateUnit("curriculum-1", "unit-1", { title: "Numbers 2" });
    await adapter.reorderUnit("curriculum-1", "unit-1", { sortOrder: 1 });
    await expect(adapter.deleteUnit("curriculum-1", "unit-1")).resolves.toEqual({
      ok: true,
    });
    await adapter.createLesson("curriculum-1", "unit-1", { title: "Counting" });
    await adapter.updateLesson("curriculum-1", "unit-1", "lesson-1", {
      title: "Counting 2",
    });
    await adapter.reorderLesson("curriculum-1", "unit-1", "lesson-1", {
      sortOrder: 1,
    });
    await expect(
      adapter.deleteLesson("curriculum-1", "unit-1", "lesson-1"),
    ).resolves.toEqual({ ok: true });
    await adapter.listLessonContent("curriculum-1", "unit-1", "lesson-1");
    await adapter.createLessonContent("curriculum-1", "unit-1", "lesson-1", {
      type: "TEXT",
      title: "Read",
      bodyText: "Hello",
      url: null,
      fileId: null,
    });
    await adapter.getLessonContent(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
    );
    await adapter.updateLessonContent(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
      { title: "Read 2" },
    );
    await adapter.reorderLessonContent(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      "content-1",
      { sortOrder: 1 },
    );
    await expect(
      adapter.deleteLessonContent(
        "curriculum-1",
        "unit-1",
        "lesson-1",
        "content-1",
      ),
    ).resolves.toEqual({ ok: true });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum?status=DRAFT",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(1, "/academics/curriculum", {
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1",
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum/curriculum-1",
      { title: "Math 2" },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/activate",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/academics/curriculum/curriculum-1/archive",
    );
    expect(mockedApiDelete).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum/curriculum-1",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      4,
      "/academics/curriculum/curriculum-1/units",
      { title: "Numbers" },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/units/unit-1",
      { title: "Numbers 2" },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      3,
      "/academics/curriculum/curriculum-1/units/unit-1/reorder",
      { sortOrder: 1 },
    );
    expect(mockedApiDelete).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/units/unit-1",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      5,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons",
      { title: "Counting" },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      4,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1",
      { title: "Counting 2" },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      5,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/reorder",
      { sortOrder: 1 },
    );
    expect(mockedApiDelete).toHaveBeenNthCalledWith(
      3,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      6,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content",
      {
        type: "TEXT",
        title: "Read",
        bodyText: "Hello",
        url: null,
        fileId: null,
      },
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      4,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1",
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      6,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1",
      { title: "Read 2" },
    );
    expect(mockedApiPatch).toHaveBeenNthCalledWith(
      7,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1/reorder",
      { sortOrder: 1 },
    );
    expect(mockedApiDelete).toHaveBeenNthCalledWith(
      4,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1",
    );
  });

  it("uses bodyless lifecycle routes for lesson content publication", async () => {
    const adapter = createCurriculumApiAdapter();
    const contentResponse = {
      id: "content-1",
      contentItemId: "content-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: "TEXT",
      title: "Read",
      bodyText: "Hello",
      url: null,
      file: null,
      sortOrder: 0,
      isRequired: true,
      estimatedMinutes: null,
      metadata: null,
      publicationStatus: "draft",
      publishedAt: null,
      publishedByUserId: null,
      archivedAt: null,
      archivedByUserId: null,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    mockedApiPost.mockResolvedValue(contentResponse);

    await adapter.publishLessonContent("curriculum-1", "unit-1", "lesson-1", "content-1");
    await adapter.unpublishLessonContent("curriculum-1", "unit-1", "lesson-1", "content-1");
    await adapter.archiveLessonContent("curriculum-1", "unit-1", "lesson-1", "content-1");

    expect(mockedApiPost).toHaveBeenNthCalledWith(
      1,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1/publish",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1/unpublish",
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/academics/curriculum/curriculum-1/units/unit-1/lessons/lesson-1/content/content-1/archive",
    );
  });
});
