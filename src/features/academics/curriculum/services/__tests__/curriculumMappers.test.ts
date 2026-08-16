import { describe, expect, it } from "vitest";
import type {
  CurriculumDetailResponseDto,
  CurriculumResponseDto,
  LessonContentItemResponseDto,
} from "../curriculumBackendTypes";
import {
  mapCurriculumDetailDto,
  mapCurriculumListDto,
  mapLessonContentItemDto,
} from "../curriculumMappers";

const curriculumDetailDto: CurriculumDetailResponseDto = {
  id: "curriculum-1",
  curriculumId: "curriculum-1",
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  subjectId: "subject-1",
  title: "Grade 5 Mathematics",
  description: "Core mathematics curriculum",
  status: "DRAFT",
  publishedAt: null,
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  academicYear: {
    id: "year-1",
    name: "2025/2026",
  },
  term: {
    id: "term-1",
    name: "Term 1",
  },
  grade: {
    id: "grade-1",
    name: "Grade 5",
  },
  subject: {
    id: "subject-1",
    name: "Mathematics",
    code: "MATH",
    color: "#0ea5e9",
  },
  unitCount: 1,
  lessonCount: 1,
  units: [
    {
      id: "unit-1",
      unitId: "unit-1",
      curriculumId: "curriculum-1",
      title: "Numbers",
      description: "Number systems",
      sortOrder: 1,
      estimatedLessons: 3,
      lessonCount: 1,
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
      lessons: [
        {
          id: "lesson-1",
          lessonId: "lesson-1",
          curriculumId: "curriculum-1",
          unitId: "unit-1",
          title: "Integers",
          description: "Introduction to integers",
          objectives: ["Identify positive and negative integers"],
          sortOrder: 1,
          estimatedMinutes: 45,
          createdAt: "2026-01-05T00:00:00.000Z",
          updatedAt: "2026-01-06T00:00:00.000Z",
        },
      ],
    },
  ],
};

describe("curriculumMappers", () => {
  it("maps curriculum list DTO items to summary UI models without inventing nested units", () => {
    const item: CurriculumResponseDto = {
      ...curriculumDetailDto,
      units: undefined,
    };

    expect(mapCurriculumListDto({ items: [item] })).toEqual([
      expect.objectContaining({
        id: "curriculum-1",
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
        title: "Grade 5 Mathematics",
        description: "Core mathematics curriculum",
        status: "draft",
        rawStatus: "DRAFT",
        unitCount: 1,
        lessonCount: 1,
        units: [],
      }),
    ]);
  });

  it("maps curriculum detail DTO units and lessons from backend fields", () => {
    expect(mapCurriculumDetailDto(curriculumDetailDto)).toEqual(
      expect.objectContaining({
        id: "curriculum-1",
        status: "draft",
        rawStatus: "DRAFT",
        units: [
          expect.objectContaining({
            id: "unit-1",
            curriculumId: "curriculum-1",
            title: "Numbers",
            description: "Number systems",
            sortOrder: 1,
            estimatedLessons: 3,
            lessonCount: 1,
            lessons: [
              expect.objectContaining({
                id: "lesson-1",
                curriculumId: "curriculum-1",
                unitId: "unit-1",
                title: "Integers",
                description: "Introduction to integers",
                objectives: ["Identify positive and negative integers"],
                sortOrder: 1,
                estimatedMinutes: 45,
              }),
            ],
          }),
        ],
      }),
    );
  });

  it.each([
    ["text", "TEXT"],
    ["file", "FILE"],
    ["video_link", "VIDEO_LINK"],
    ["external_link", "EXTERNAL_LINK"],
    ["TEXT", "TEXT"],
    ["FILE", "FILE"],
    ["VIDEO_LINK", "VIDEO_LINK"],
    ["EXTERNAL_LINK", "EXTERNAL_LINK"],
  ] as const)("normalizes lesson content type %s to %s", (inputType, expectedType) => {
    const dto: LessonContentItemResponseDto = {
      id: `content-${inputType}`,
      contentItemId: `content-${inputType}`,
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: inputType,
      title: "Content item",
      bodyText: null,
      url: null,
      file: null,
      sortOrder: 1,
      isRequired: true,
      estimatedMinutes: 10,
      metadata: null,
      publicationStatus: "draft",
      publishedAt: null,
      publishedByUserId: null,
      archivedAt: null,
      archivedByUserId: null,
      createdAt: "2026-01-07T00:00:00.000Z",
      updatedAt: "2026-01-08T00:00:00.000Z",
    };

    expect(mapLessonContentItemDto(dto).type).toBe(expectedType);
  });

  it("maps unknown curriculum status to unknown and preserves rawStatus", () => {
    expect(
      mapCurriculumDetailDto({
        ...curriculumDetailDto,
        status: "PENDING_REVIEW",
      }),
    ).toEqual(
      expect.objectContaining({
        status: "unknown",
        rawStatus: "PENDING_REVIEW",
      }),
    );
  });

  it.each([
    ["DRAFT", "draft"],
    ["draft", "draft"],
    ["Draft", "draft"],
    ["ACTIVE", "active"],
    ["active", "active"],
    ["ARCHIVED", "archived"],
    ["archived", "archived"],
  ] as const)("maps backend status casing %s to %s", (status, expectedStatus) => {
      expect(
        mapCurriculumDetailDto({
          ...curriculumDetailDto,
          status,
        }),
      ).toEqual(
        expect.objectContaining({
          status: expectedStatus,
          rawStatus: status,
        }),
      );
    },
  );
});
