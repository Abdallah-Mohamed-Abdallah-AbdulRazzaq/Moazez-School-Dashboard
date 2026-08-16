# Curriculum Backend Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the curriculum, units, lessons, and lesson-content frontend with the backend curriculum contract and remove or disable unsupported curriculum features.

**Architecture:** Replace the mock-shaped curriculum service boundary with backend contract types, focused mappers, and a route-accurate API adapter. Keep homework assignment code and assignment builder flows untouched, while removing unsupported curriculum carry-over, scheduling, mark-done, dedicated material/video APIs, standalone unit/lesson list calls, and bulk reorder payloads from the curriculum page flow.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Axios-backed `apiGet`/`apiPost`/`apiPatch`/`apiDelete`, `next-intl`, existing UI primitives, backend contract from `Moazez-Backend` commit `d46b19e`.

---

## File structure

- Create `src/features/academics/curriculum/services/curriculumBackendTypes.ts`
  - Backend request/response DTOs and canonical UI model types for curricula, units, lessons, and lesson content only.
- Create `src/features/academics/curriculum/services/curriculumMappers.ts`
  - Pure mapping functions from backend DTOs to frontend models.
  - Normalizes response content types from `text`, `file`, `video_link`, and `external_link` to `TEXT`, `FILE`, `VIDEO_LINK`, and `EXTERNAL_LINK`.
- Create `src/features/academics/curriculum/services/curriculumErrors.ts`
  - Maps backend curriculum and lesson-content error codes into UI messages while preserving details and trace IDs.
- Modify `src/features/academics/curriculum/services/curriculumAdapter.ts`
  - Narrow the curriculum adapter interface to supported curriculum, unit, lesson, and lesson-content methods.
  - Keep assignment adapter methods out of this interface; assignment modules should not rely on it for this scoped change.
- Modify `src/features/academics/curriculum/services/curriculumApiAdapter.ts`
  - Replace wrong standalone routes with `/academics/curriculum` nested routes.
  - Remove carry-over, planned-week, done/undo, dedicated attachment/video, standalone unit/lesson list, and bulk reorder methods.
- Modify `src/features/academics/curriculum/services/curriculumService.ts`
  - Export the new backend-aligned curriculum functions and types.
  - Preserve existing assignment-only exported types and functions needed by homework/assignment files.
  - Delete or stop exporting unsupported curriculum-only functions.
- Modify `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`
  - Load curricula with all four scope filters, then fetch detail.
  - Use explicit permission/read-only booleans.
  - Remove carry-over dialog usage and planned-week export columns.
- Modify `src/features/academics/curriculum/components/CreateCurriculumDialog.tsx`
  - Send `academicYearId`, `termId`, `gradeId`, `subjectId`, `title`, and optional `description`.
- Modify `src/features/academics/curriculum/components/CurriculumOutline.tsx`
  - Display backend single-title units/lessons.
  - Remove planned-week and done badges.
- Modify `src/features/academics/curriculum/components/CurriculumEditor.tsx`
  - Replace bilingual-only fields and planned-week/status fields with backend `title`, `description`, `objectives`, and `estimatedMinutes`.
  - Pass full hierarchy IDs to unit and lesson mutations.
  - Remove mark-done/undo actions.
  - Pass `curriculumId`, `unitId`, and `lessonId` to lesson-content UI.
- Replace `src/features/academics/curriculum/components/LearningContentPanel.tsx`
  - Show backend-supported lesson-content items only.
  - Do not render homework assignment tabs in this curriculum content drawer.
- Modify or delete `src/features/academics/curriculum/components/LearningContent.tsx`
  - Remove any remaining imports of old material/video components if this wrapper is still reachable.
- Stop using or delete from reachable curriculum UI:
  - `src/features/academics/curriculum/components/LessonMaterials.tsx`
  - `src/features/academics/curriculum/components/LessonVideo.tsx`
  - `src/features/academics/curriculum/components/CurriculumCarryOverDialog.tsx`
  - `src/features/academics/curriculum/components/CurriculumPlan.tsx`
  - Keep assignment pages and assignment components untouched.
- Test files:
  - Create `src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts`
  - Create `src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts`
  - Create `src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`
  - Create or update `src/features/academics/curriculum/pages/__tests__/CurriculumPageContent.test.tsx` only if the component can be tested without broad app-shell mocking.

## Backend contract facts to preserve

- List route: `GET /academics/curriculum?academicYearId=&termId=&gradeId=&subjectId=&status=&search=`
- Detail route: `GET /academics/curriculum/:curriculumId`
- Lifecycle routes:
  - `POST /academics/curriculum/:curriculumId/activate`
  - `POST /academics/curriculum/:curriculumId/archive`
- Unit routes:
  - `POST /academics/curriculum/:curriculumId/units`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId/reorder`
  - `DELETE /academics/curriculum/:curriculumId/units/:unitId`
- Lesson routes:
  - `POST /academics/curriculum/:curriculumId/units/:unitId/lessons`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/reorder`
  - `DELETE /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId`
- Lesson content routes:
  - `GET /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content`
  - `POST /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content`
  - `GET /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId`
  - `PATCH /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId/reorder`
  - `DELETE /academics/curriculum/:curriculumId/units/:unitId/lessons/:lessonId/content/:contentItemId`
- Read permission: `academics.curriculum.view`
- Write and lifecycle permission: `academics.curriculum.manage`
- Activation rule shown in UI: draft curriculum plus at least one non-deleted unit and at least one non-deleted lesson.
- Backend status filters preserve Prisma enum casing: `DRAFT`, `ACTIVE`, and `ARCHIVED`. UI can derive lowercase display/comparison values, but backend request payloads and query filters must not send lowercase status values.
- New curriculum API calls use `apiGet`, `apiPost`, `apiPatch`, and `apiDelete` from `src/lib/api.ts`. Do not use deprecated `apiWithToken` for this work.
- Lesson content request `type` values preserve uppercase enum casing: `TEXT`, `FILE`, `VIDEO_LINK`, and `EXTERNAL_LINK`.
- FILE lesson content creation remains disabled unless a supported existing file picker or upload flow returns a valid backend `fileId`.

## Task 1: Add backend-aligned types and mappers

**Files:**
- Create: `src/features/academics/curriculum/services/curriculumBackendTypes.ts`
- Create: `src/features/academics/curriculum/services/curriculumMappers.ts`
- Test: `src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Create `src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  mapCurriculumDetailDto,
  mapCurriculumListDto,
  mapLessonContentItemDto,
} from "../curriculumMappers";
import type {
  CurriculumDetailResponseDto,
  CurriculaListResponseDto,
  LessonContentItemResponseDto,
} from "../curriculumBackendTypes";

const curriculumDto: CurriculumDetailResponseDto = {
  id: "curriculum-1",
  curriculumId: "curriculum-1",
  academicYearId: "year-1",
  termId: "term-1",
  gradeId: "grade-1",
  subjectId: "subject-1",
  title: "Grade 1 Math",
  description: "Numbers",
  status: "DRAFT",
  publishedAt: null,
  archivedAt: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  academicYear: { id: "year-1", name: "2026", nameAr: "٢٠٢٦", nameEn: "2026" },
  term: { id: "term-1", name: "Term 1", nameAr: "الفصل ١", nameEn: "Term 1" },
  grade: { id: "grade-1", name: "Grade 1", nameAr: "الأول", nameEn: "Grade 1" },
  subject: {
    id: "subject-1",
    name: "Math",
    nameAr: "رياضيات",
    nameEn: "Math",
    code: "MATH",
    color: "#2563eb",
  },
  unitCount: 1,
  lessonCount: 1,
  units: [
    {
      id: "unit-1",
      unitId: "unit-1",
      curriculumId: "curriculum-1",
      title: "Numbers",
      description: null,
      sortOrder: 0,
      estimatedLessons: 5,
      lessonCount: 1,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      lessons: [
        {
          id: "lesson-1",
          lessonId: "lesson-1",
          curriculumId: "curriculum-1",
          unitId: "unit-1",
          title: "Counting",
          description: "Count objects",
          objectives: ["Count to 10"],
          sortOrder: 0,
          estimatedMinutes: 45,
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    },
  ],
};

describe("curriculumMappers", () => {
  it("maps list envelopes without inventing nested units", () => {
    const list: CurriculaListResponseDto = { items: [curriculumDto] };

    expect(mapCurriculumListDto(list)).toEqual([
      expect.objectContaining({
        id: "curriculum-1",
        title: "Grade 1 Math",
        status: "DRAFT",
        unitCount: 1,
        lessonCount: 1,
      }),
    ]);
  });

  it("maps curriculum detail, units, and lessons from backend fields", () => {
    const detail = mapCurriculumDetailDto(curriculumDto);

    expect(detail.units).toHaveLength(1);
    expect(detail.units[0]).toMatchObject({
      id: "unit-1",
      title: "Numbers",
      sortOrder: 0,
      estimatedLessons: 5,
      lessonCount: 1,
    });
    expect(detail.units[0].lessons[0]).toMatchObject({
      id: "lesson-1",
      title: "Counting",
      objectives: ["Count to 10"],
      estimatedMinutes: 45,
      sortOrder: 0,
    });
  });

  it.each([
    ["text", "TEXT"],
    ["file", "FILE"],
    ["video_link", "VIDEO_LINK"],
    ["external_link", "EXTERNAL_LINK"],
    ["TEXT", "TEXT"],
    ["VIDEO_LINK", "VIDEO_LINK"],
  ] as const)("normalizes lesson content type %s to %s", (input, expected) => {
    const dto: LessonContentItemResponseDto = {
      id: "content-1",
      contentItemId: "content-1",
      curriculumId: "curriculum-1",
      unitId: "unit-1",
      lessonId: "lesson-1",
      type: input,
      title: "Intro",
      bodyText: input.toLowerCase() === "text" ? "Read this" : null,
      url: input.includes("link") ? "https://example.com" : null,
      file: null,
      sortOrder: 0,
      isRequired: true,
      estimatedMinutes: 10,
      metadata: { source: "teacher" },
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
    };

    expect(mapLessonContentItemDto(dto).type).toBe(expected);
  });

  it("does not silently normalize unknown curriculum status to draft", () => {
    const detail = mapCurriculumDetailDto({
      ...curriculumDto,
      status: "PAUSED",
    });

    expect(detail.status).toBe("unknown");
    expect(detail.rawStatus).toBe("PAUSED");
  });
});
```

- [ ] **Step 2: Run mapper tests to verify they fail**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts
```

Expected: FAIL because `curriculumMappers` and `curriculumBackendTypes` do not exist.

- [ ] **Step 3: Add backend contract and UI model types**

Create `src/features/academics/curriculum/services/curriculumBackendTypes.ts`:

```ts
export type BackendCurriculumStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CurriculumStatus = "draft" | "active" | "archived" | "unknown";

export type LessonContentType =
  | "TEXT"
  | "FILE"
  | "VIDEO_LINK"
  | "EXTERNAL_LINK";

export interface CurriculumScopeSummaryDto {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
}

export interface CurriculumSubjectSummaryDto extends CurriculumScopeSummaryDto {
  code: string | null;
  color: string | null;
}

export interface CurriculumLessonResponseDto {
  id: string;
  lessonId: string;
  curriculumId: string;
  unitId: string;
  title: string;
  description: string | null;
  objectives: string[];
  sortOrder: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumUnitResponseDto {
  id: string;
  unitId: string;
  curriculumId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  estimatedLessons: number | null;
  lessonCount: number;
  lessons: CurriculumLessonResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumResponseDto {
  id: string;
  curriculumId: string;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description: string | null;
  status: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: CurriculumScopeSummaryDto;
  term: CurriculumScopeSummaryDto;
  grade: CurriculumScopeSummaryDto;
  subject: CurriculumSubjectSummaryDto;
  unitCount: number;
  lessonCount: number;
}

export interface CurriculumDetailResponseDto extends CurriculumResponseDto {
  units: CurriculumUnitResponseDto[];
}

export interface CurriculaListResponseDto {
  items: CurriculumResponseDto[];
}

export interface DeleteCurriculumNodeResponseDto {
  ok: true;
}

export interface LessonContentFileSummaryDto {
  fileId: string;
  filename: string;
  mimeType: string;
  sizeBytes: string;
}

export interface LessonContentItemResponseDto {
  id: string;
  contentItemId: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  type: string;
  title: string;
  bodyText: string | null;
  url: string | null;
  file: LessonContentFileSummaryDto | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface LessonContentListResponseDto {
  items: LessonContentItemResponseDto[];
}

export interface DeleteLessonContentItemResponseDto {
  ok: true;
}

export interface CurriculumListFilters {
  academicYearId?: string;
  termId?: string;
  gradeId?: string;
  subjectId?: string;
  status?: BackendCurriculumStatus;
  search?: string;
}

export interface CreateCurriculumRequest {
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description?: string | null;
}

export interface UpdateCurriculumRequest {
  title?: string;
  description?: string | null;
}

export interface CreateUnitRequest {
  title: string;
  description?: string | null;
  sortOrder?: number;
  estimatedLessons?: number | null;
}

export interface UpdateUnitRequest {
  title?: string;
  description?: string | null;
  estimatedLessons?: number | null;
}

export interface CreateLessonRequest {
  title: string;
  description?: string | null;
  objectives?: string[] | null;
  sortOrder?: number;
  estimatedMinutes?: number | null;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string | null;
  objectives?: string[] | null;
  estimatedMinutes?: number | null;
}

export interface ReorderRequest {
  sortOrder: number;
}

export interface CreateLessonContentRequest {
  type: LessonContentType;
  title: string;
  bodyText?: string | null;
  url?: string | null;
  fileId?: string | null;
  sortOrder?: number;
  isRequired?: boolean;
  estimatedMinutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateLessonContentRequest {
  type?: LessonContentType;
  title?: string;
  bodyText?: string | null;
  url?: string | null;
  fileId?: string | null;
  isRequired?: boolean;
  estimatedMinutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface Curriculum {
  id: string;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  title: string;
  description: string | null;
  status: CurriculumStatus;
  rawStatus: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: CurriculumScopeSummaryDto;
  term: CurriculumScopeSummaryDto;
  grade: CurriculumScopeSummaryDto;
  subject: CurriculumSubjectSummaryDto;
  unitCount: number;
  lessonCount: number;
  units: Unit[];
}

export interface Unit {
  id: string;
  curriculumId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  estimatedLessons: number | null;
  lessonCount: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  curriculumId: string;
  unitId: string;
  title: string;
  description: string | null;
  objectives: string[];
  sortOrder: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonContentItem {
  id: string;
  curriculumId: string;
  unitId: string;
  lessonId: string;
  type: LessonContentType;
  title: string;
  bodyText: string | null;
  url: string | null;
  file: LessonContentFileSummaryDto | null;
  sortOrder: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 4: Add mapper implementation**

Create `src/features/academics/curriculum/services/curriculumMappers.ts`:

```ts
import type {
  CurriculaListResponseDto,
  Curriculum,
  CurriculumDetailResponseDto,
  CurriculumLessonResponseDto,
  CurriculumResponseDto,
  BackendCurriculumStatus,
  CurriculumStatus,
  CurriculumUnitResponseDto,
  Lesson,
  LessonContentItem,
  LessonContentItemResponseDto,
  LessonContentListResponseDto,
  LessonContentType,
  Unit,
} from "./curriculumBackendTypes";

const curriculumStatusMap: Record<BackendCurriculumStatus, CurriculumStatus> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
};

export function mapCurriculumStatus(status: string): CurriculumStatus {
  const normalized = status.toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "ACTIVE" ||
    normalized === "ARCHIVED"
  ) {
    return curriculumStatusMap[normalized];
  }
  return "unknown";
}

export function normalizeLessonContentType(type: string): LessonContentType {
  const normalized = type.toUpperCase();
  if (normalized === "TEXT") return "TEXT";
  if (normalized === "FILE") return "FILE";
  if (normalized === "VIDEO_LINK") return "VIDEO_LINK";
  if (normalized === "EXTERNAL_LINK") return "EXTERNAL_LINK";
  throw new Error(`Unsupported lesson content type: ${type}`);
}

export function mapCurriculumSummaryDto(dto: CurriculumResponseDto): Curriculum {
  return {
    id: dto.curriculumId || dto.id,
    academicYearId: dto.academicYearId,
    termId: dto.termId,
    gradeId: dto.gradeId,
    subjectId: dto.subjectId,
    title: dto.title,
    description: dto.description,
    status: mapCurriculumStatus(dto.status),
    rawStatus: dto.status,
    publishedAt: dto.publishedAt,
    archivedAt: dto.archivedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    academicYear: dto.academicYear,
    term: dto.term,
    grade: dto.grade,
    subject: dto.subject,
    unitCount: dto.unitCount,
    lessonCount: dto.lessonCount,
    units: [],
  };
}

export function mapCurriculumListDto(dto: CurriculaListResponseDto): Curriculum[] {
  return dto.items.map(mapCurriculumSummaryDto);
}

export function mapCurriculumDetailDto(dto: CurriculumDetailResponseDto): Curriculum {
  return {
    ...mapCurriculumSummaryDto(dto),
    units: dto.units.map(mapCurriculumUnitDto),
  };
}

export function mapCurriculumUnitDto(dto: CurriculumUnitResponseDto): Unit {
  return {
    id: dto.unitId || dto.id,
    curriculumId: dto.curriculumId,
    title: dto.title,
    description: dto.description,
    sortOrder: dto.sortOrder,
    estimatedLessons: dto.estimatedLessons,
    lessonCount: dto.lessonCount,
    lessons: dto.lessons.map(mapCurriculumLessonDto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapCurriculumLessonDto(dto: CurriculumLessonResponseDto): Lesson {
  return {
    id: dto.lessonId || dto.id,
    curriculumId: dto.curriculumId,
    unitId: dto.unitId,
    title: dto.title,
    description: dto.description,
    objectives: dto.objectives,
    sortOrder: dto.sortOrder,
    estimatedMinutes: dto.estimatedMinutes,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapLessonContentListDto(
  dto: LessonContentListResponseDto,
): LessonContentItem[] {
  return dto.items.map(mapLessonContentItemDto);
}

export function mapLessonContentItemDto(
  dto: LessonContentItemResponseDto,
): LessonContentItem {
  return {
    id: dto.contentItemId || dto.id,
    curriculumId: dto.curriculumId,
    unitId: dto.unitId,
    lessonId: dto.lessonId,
    type: normalizeLessonContentType(dto.type),
    title: dto.title,
    bodyText: dto.bodyText,
    url: dto.url,
    file: dto.file,
    sortOrder: dto.sortOrder,
    isRequired: dto.isRequired,
    estimatedMinutes: dto.estimatedMinutes,
    metadata: dto.metadata,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
```

- [ ] **Step 5: Run mapper tests to verify they pass**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/curriculum/services/curriculumBackendTypes.ts src/features/academics/curriculum/services/curriculumMappers.ts src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts
git commit -m "feat: add curriculum backend mappers"
```

## Task 2: Replace curriculum API adapter with backend-supported routes

**Files:**
- Modify: `src/features/academics/curriculum/services/curriculumAdapter.ts`
- Modify: `src/features/academics/curriculum/services/curriculumApiAdapter.ts`
- Test: `src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts`

- [ ] **Step 1: Write failing API adapter tests**

Create `src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run API adapter tests to verify they fail**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts
```

Expected: FAIL because the adapter still exposes old methods and calls wrong routes.

- [ ] **Step 3: Narrow the adapter interface**

Replace the curriculum portion of `src/features/academics/curriculum/services/curriculumAdapter.ts` with:

```ts
import type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  DeleteCurriculumNodeResponseDto,
  Lesson,
  LessonContentItem,
  ReorderRequest,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

export interface CurriculumAdapter {
  listCurricula(filters: CurriculumListFilters): Promise<Curriculum[]>;
  getCurriculum(curriculumId: string): Promise<Curriculum>;
  createCurriculum(payload: CreateCurriculumRequest): Promise<Curriculum>;
  updateCurriculum(
    curriculumId: string,
    payload: UpdateCurriculumRequest,
  ): Promise<Curriculum>;
  activateCurriculum(curriculumId: string): Promise<Curriculum>;
  archiveCurriculum(curriculumId: string): Promise<Curriculum>;
  deleteCurriculum(curriculumId: string): Promise<DeleteCurriculumNodeResponseDto>;
  createUnit(curriculumId: string, payload: CreateUnitRequest): Promise<Unit>;
  updateUnit(
    curriculumId: string,
    unitId: string,
    payload: UpdateUnitRequest,
  ): Promise<Unit>;
  reorderUnit(
    curriculumId: string,
    unitId: string,
    payload: ReorderRequest,
  ): Promise<Unit>;
  deleteUnit(
    curriculumId: string,
    unitId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
  createLesson(
    curriculumId: string,
    unitId: string,
    payload: CreateLessonRequest,
  ): Promise<Lesson>;
  updateLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: UpdateLessonRequest,
  ): Promise<Lesson>;
  reorderLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: ReorderRequest,
  ): Promise<Lesson>;
  deleteLesson(
    curriculumId: string,
    unitId: string,
    lessonId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
  listLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
  ): Promise<LessonContentItem[]>;
  createLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    payload: CreateLessonContentRequest,
  ): Promise<LessonContentItem>;
  getLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<LessonContentItem>;
  updateLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
    payload: UpdateLessonContentRequest,
  ): Promise<LessonContentItem>;
  reorderLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
    payload: ReorderRequest,
  ): Promise<LessonContentItem>;
  deleteLessonContent(
    curriculumId: string,
    unitId: string,
    lessonId: string,
    contentItemId: string,
  ): Promise<DeleteCurriculumNodeResponseDto>;
}
```

- [ ] **Step 4: Replace the API adapter implementation**

Replace the curriculum adapter object in `src/features/academics/curriculum/services/curriculumApiAdapter.ts` with a backend-supported implementation:

```ts
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CurriculumAdapter } from "./curriculumAdapter";
import type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  CurriculaListResponseDto,
  CurriculumDetailResponseDto,
  CurriculumLessonResponseDto,
  CurriculumListFilters,
  CurriculumUnitResponseDto,
  DeleteCurriculumNodeResponseDto,
  LessonContentItemResponseDto,
  LessonContentListResponseDto,
  ReorderRequest,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";
import {
  mapCurriculumDetailDto,
  mapCurriculumLessonDto,
  mapCurriculumListDto,
  mapCurriculumUnitDto,
  mapLessonContentItemDto,
  mapLessonContentListDto,
} from "./curriculumMappers";

function buildQuery(params: CurriculumListFilters): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

const contentPath = (
  basePath: string,
  curriculumId: string,
  unitId: string,
  lessonId: string,
) =>
  `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}/content`;

export const createCurriculumApiAdapter = (
  basePath: string = "/academics/curriculum",
): CurriculumAdapter => ({
  async listCurricula(filters) {
    const response = await apiGet<CurriculaListResponseDto>(
      `${basePath}${buildQuery(filters)}`,
    );
    return mapCurriculumListDto(response);
  },

  async getCurriculum(curriculumId) {
    const response = await apiGet<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}`,
    );
    return mapCurriculumDetailDto(response);
  },

  async createCurriculum(payload: CreateCurriculumRequest) {
    const response = await apiPost<CurriculumDetailResponseDto>(basePath, payload);
    return mapCurriculumDetailDto(response);
  },

  async updateCurriculum(curriculumId, payload: UpdateCurriculumRequest) {
    const response = await apiPatch<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}`,
      payload,
    );
    return mapCurriculumDetailDto(response);
  },

  async activateCurriculum(curriculumId) {
    const response = await apiPost<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}/activate`,
    );
    return mapCurriculumDetailDto(response);
  },

  async archiveCurriculum(curriculumId) {
    const response = await apiPost<CurriculumDetailResponseDto>(
      `${basePath}/${curriculumId}/archive`,
    );
    return mapCurriculumDetailDto(response);
  },

  deleteCurriculum(curriculumId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(`${basePath}/${curriculumId}`);
  },

  async createUnit(curriculumId, payload: CreateUnitRequest) {
    const response = await apiPost<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  async updateUnit(curriculumId, unitId, payload: UpdateUnitRequest) {
    const response = await apiPatch<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  async reorderUnit(curriculumId, unitId, payload: ReorderRequest) {
    const response = await apiPatch<CurriculumUnitResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/reorder`,
      payload,
    );
    return mapCurriculumUnitDto(response);
  },

  deleteUnit(curriculumId, unitId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}`,
    );
  },

  async createLesson(curriculumId, unitId, payload: CreateLessonRequest) {
    const response = await apiPost<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  async updateLesson(curriculumId, unitId, lessonId, payload: UpdateLessonRequest) {
    const response = await apiPatch<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  async reorderLesson(curriculumId, unitId, lessonId, payload: ReorderRequest) {
    const response = await apiPatch<CurriculumLessonResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}/reorder`,
      payload,
    );
    return mapCurriculumLessonDto(response);
  },

  deleteLesson(curriculumId, unitId, lessonId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${basePath}/${curriculumId}/units/${unitId}/lessons/${lessonId}`,
    );
  },

  async listLessonContent(curriculumId, unitId, lessonId) {
    const response = await apiGet<LessonContentListResponseDto>(
      contentPath(basePath, curriculumId, unitId, lessonId),
    );
    return mapLessonContentListDto(response);
  },

  async createLessonContent(curriculumId, unitId, lessonId, payload) {
    const response = await apiPost<LessonContentItemResponseDto>(
      contentPath(basePath, curriculumId, unitId, lessonId),
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  async getLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    const response = await apiGet<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
    );
    return mapLessonContentItemDto(response);
  },

  async updateLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload: UpdateLessonContentRequest,
  ) {
    const response = await apiPatch<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  async reorderLessonContent(curriculumId, unitId, lessonId, contentItemId, payload) {
    const response = await apiPatch<LessonContentItemResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}/reorder`,
      payload,
    );
    return mapLessonContentItemDto(response);
  },

  deleteLessonContent(curriculumId, unitId, lessonId, contentItemId) {
    return apiDelete<DeleteCurriculumNodeResponseDto>(
      `${contentPath(basePath, curriculumId, unitId, lessonId)}/${contentItemId}`,
    );
  },
});

export const curriculumApiAdapter = createCurriculumApiAdapter();
```

- [ ] **Step 5: Run API adapter tests to verify they pass**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/curriculum/services/curriculumAdapter.ts src/features/academics/curriculum/services/curriculumApiAdapter.ts src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts
git commit -m "feat: align curriculum API adapter with backend"
```

## Task 3: Replace curriculum service exports without touching homework assignment behavior

**Files:**
- Modify: `src/features/academics/curriculum/services/curriculumService.ts`
- Test: `src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts`

- [ ] **Step 1: Write failing service boundary tests**

Create `src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { CurriculumAdapter } from "../curriculumAdapter";
import {
  activateCurriculumAdapter,
  createCurriculum,
  createLesson,
  createLessonContent,
  fetchCurriculumForScope,
  getCurriculum,
  listLessonContent,
} from "../curriculumService";

describe("curriculumService backend boundary", () => {
  it("finds the selected scoped curriculum through list then detail", async () => {
    const adapter = {
      listCurricula: vi.fn().mockResolvedValue([{ id: "curriculum-1" }]),
      getCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1", units: [] }),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await expect(
      fetchCurriculumForScope({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).resolves.toEqual({ id: "curriculum-1", units: [] });

    expect(adapter.listCurricula).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
    });
    expect(adapter.getCurriculum).toHaveBeenCalledWith("curriculum-1");
  });

  it("returns null for an empty scoped list", async () => {
    const adapter = {
      listCurricula: vi.fn().mockResolvedValue([]),
      getCurriculum: vi.fn(),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await expect(
      fetchCurriculumForScope({
        academicYearId: "year-1",
        termId: "term-1",
        gradeId: "grade-1",
        subjectId: "subject-1",
      }),
    ).resolves.toBeNull();
    expect(adapter.getCurriculum).not.toHaveBeenCalled();
  });

  it("forwards hierarchy ids for lesson and content mutations", async () => {
    const adapter = {
      createCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1" }),
      getCurriculum: vi.fn().mockResolvedValue({ id: "curriculum-1" }),
      createLesson: vi.fn().mockResolvedValue({ id: "lesson-1" }),
      createLessonContent: vi.fn().mockResolvedValue({ id: "content-1" }),
      listLessonContent: vi.fn().mockResolvedValue([]),
    } as unknown as CurriculumAdapter;

    activateCurriculumAdapter(adapter);

    await createCurriculum({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    await getCurriculum("curriculum-1");
    await createLesson("curriculum-1", "unit-1", { title: "Counting" });
    await createLessonContent("curriculum-1", "unit-1", "lesson-1", {
      type: "TEXT",
      title: "Read",
      bodyText: "Hello",
      fileId: null,
      url: null,
    });
    await listLessonContent("curriculum-1", "unit-1", "lesson-1");

    expect(adapter.createCurriculum).toHaveBeenCalledWith({
      academicYearId: "year-1",
      termId: "term-1",
      gradeId: "grade-1",
      subjectId: "subject-1",
      title: "Math",
    });
    expect(adapter.createLesson).toHaveBeenCalledWith("curriculum-1", "unit-1", {
      title: "Counting",
    });
    expect(adapter.createLessonContent).toHaveBeenCalledWith(
      "curriculum-1",
      "unit-1",
      "lesson-1",
      {
        type: "TEXT",
        title: "Read",
        bodyText: "Hello",
        fileId: null,
        url: null,
      },
    );
  });
});
```

- [ ] **Step 2: Run service boundary tests to verify they fail**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts
```

Expected: FAIL because `fetchCurriculumForScope` and lesson-content exports do not exist.

- [ ] **Step 3: Replace curriculum service boundary**

In `src/features/academics/curriculum/services/curriculumService.ts`, keep existing assignment-only interfaces and assignment-only functions that are imported by assignment pages, then replace curriculum/unit/lesson functions with:

```ts
import type { CurriculumAdapter } from "./curriculumAdapter";
import { curriculumApiAdapter } from "./curriculumApiAdapter";
import type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  Lesson,
  LessonContentItem,
  ReorderRequest,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

export type {
  CreateCurriculumRequest,
  CreateLessonContentRequest,
  CreateLessonRequest,
  CreateUnitRequest,
  Curriculum,
  CurriculumListFilters,
  Lesson,
  LessonContentItem,
  LessonContentType,
  Unit,
  UpdateCurriculumRequest,
  UpdateLessonContentRequest,
  UpdateLessonRequest,
  UpdateUnitRequest,
} from "./curriculumBackendTypes";

let curriculumAdapter: CurriculumAdapter = curriculumApiAdapter;

export const getCurriculumAdapter = (): CurriculumAdapter => curriculumAdapter;

export const activateCurriculumAdapter = (adapter: CurriculumAdapter) => {
  curriculumAdapter = adapter;
};

export const setCurriculumAdapter = activateCurriculumAdapter;

export const resetCurriculumAdapter = () => {
  curriculumAdapter = curriculumApiAdapter;
};

export const listCurricula = (filters: CurriculumListFilters): Promise<Curriculum[]> =>
  curriculumAdapter.listCurricula(filters);

export const getCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.getCurriculum(curriculumId);

export const fetchCurriculumForScope = async (
  filters: Required<
    Pick<CurriculumListFilters, "academicYearId" | "termId" | "gradeId" | "subjectId">
  >,
): Promise<Curriculum | null> => {
  const curricula = await curriculumAdapter.listCurricula(filters);
  const first = curricula[0];
  return first ? curriculumAdapter.getCurriculum(first.id) : null;
};

export const createCurriculum = (
  payload: CreateCurriculumRequest,
): Promise<Curriculum> => curriculumAdapter.createCurriculum(payload);

export const updateCurriculum = (
  curriculumId: string,
  payload: UpdateCurriculumRequest,
): Promise<Curriculum> => curriculumAdapter.updateCurriculum(curriculumId, payload);

export const activateCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.activateCurriculum(curriculumId);

export const archiveCurriculum = (curriculumId: string): Promise<Curriculum> =>
  curriculumAdapter.archiveCurriculum(curriculumId);

export const deleteCurriculum = (curriculumId: string) =>
  curriculumAdapter.deleteCurriculum(curriculumId);

export const createUnit = (
  curriculumId: string,
  payload: CreateUnitRequest,
): Promise<Unit> => curriculumAdapter.createUnit(curriculumId, payload);

export const updateUnit = (
  curriculumId: string,
  unitId: string,
  payload: UpdateUnitRequest,
): Promise<Unit> => curriculumAdapter.updateUnit(curriculumId, unitId, payload);

export const reorderUnit = (
  curriculumId: string,
  unitId: string,
  payload: ReorderRequest,
): Promise<Unit> => curriculumAdapter.reorderUnit(curriculumId, unitId, payload);

export const deleteUnit = (curriculumId: string, unitId: string) =>
  curriculumAdapter.deleteUnit(curriculumId, unitId);

export const createLesson = (
  curriculumId: string,
  unitId: string,
  payload: CreateLessonRequest,
): Promise<Lesson> => curriculumAdapter.createLesson(curriculumId, unitId, payload);

export const updateLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: UpdateLessonRequest,
): Promise<Lesson> =>
  curriculumAdapter.updateLesson(curriculumId, unitId, lessonId, payload);

export const reorderLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: ReorderRequest,
): Promise<Lesson> =>
  curriculumAdapter.reorderLesson(curriculumId, unitId, lessonId, payload);

export const deleteLesson = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
) => curriculumAdapter.deleteLesson(curriculumId, unitId, lessonId);

export const listLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
): Promise<LessonContentItem[]> =>
  curriculumAdapter.listLessonContent(curriculumId, unitId, lessonId);

export const createLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  payload: CreateLessonContentRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.createLessonContent(curriculumId, unitId, lessonId, payload);

export const getLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
): Promise<LessonContentItem> =>
  curriculumAdapter.getLessonContent(curriculumId, unitId, lessonId, contentItemId);

export const updateLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
  payload: UpdateLessonContentRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.updateLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload,
  );

export const reorderLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
  payload: ReorderRequest,
): Promise<LessonContentItem> =>
  curriculumAdapter.reorderLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
    payload,
  );

export const deleteLessonContent = (
  curriculumId: string,
  unitId: string,
  lessonId: string,
  contentItemId: string,
) =>
  curriculumAdapter.deleteLessonContent(
    curriculumId,
    unitId,
    lessonId,
    contentItemId,
  );
```

If assignment pages fail because they imported removed curriculum-only exports, update those imports only where the imported function is truly curriculum-only. Do not change assignment endpoint behavior.

- [ ] **Step 4: Prove unsupported curriculum exports are gone**

Run:

```bash
rg -n "carryOverCurriculum|updateLessonSchedule|markLessonDone|undoLessonDone|fetchLessonAttachments|uploadLessonAttachmentFile|createLessonAttachmentLink|deleteAttachment|fetchLessonVideo|upsertLessonVideoLink|uploadLessonVideoFile|deleteLessonVideo" src/features/academics/curriculum --glob '!**/Assignment*' --glob '!**/assignments/**'
```

Expected: no reachable curriculum page/component imports remain after later UI tasks. At this step, remaining hits in `CurriculumEditor.tsx`, `LessonMaterials.tsx`, `LessonVideo.tsx`, or `CurriculumCarryOverDialog.tsx` are acceptable and will be removed in Tasks 5-7.

- [ ] **Step 5: Run service tests**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/academics/curriculum/services/curriculumService.ts src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts
git commit -m "feat: expose supported curriculum service boundary"
```

## Task 4: Add curriculum error mapping

**Files:**
- Create: `src/features/academics/curriculum/services/curriculumErrors.ts`
- Test: `src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`

- [ ] **Step 1: Write failing error tests**

Create `src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { curriculumUiError } from "../curriculumErrors";

describe("curriculumErrors", () => {
  it("maps known curriculum and lesson-content domain codes", () => {
    expect(
      curriculumUiError(
        new ApiError(
          "backend",
          400,
          "academics.lesson_content.invalid_type_payload",
        ),
        "Fallback",
      ).message,
    ).toBe("The content fields do not match the selected content type.");
  });

  it("preserves trace ids and nested validation details", () => {
    const result = curriculumUiError(
      new ApiError(
        "Validation failed",
        400,
        "validation.failed",
        undefined,
        { title: ["Title is required"], url: "URL must use HTTP or HTTPS" },
        "trace-123",
      ),
      "Fallback",
    );

    expect(result).toEqual({
      message: "Check the submitted curriculum fields.",
      traceId: "trace-123",
      details: ["Title is required", "URL must use HTTP or HTTPS"],
    });
  });

  it("falls back for non-api errors", () => {
    expect(curriculumUiError(new Error("boom"), "Fallback")).toEqual({
      message: "Fallback",
      details: [],
    });
  });
});
```

- [ ] **Step 2: Run error tests to verify they fail**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts
```

Expected: FAIL because `curriculumErrors.ts` does not exist.

- [ ] **Step 3: Implement error mapping**

Create `src/features/academics/curriculum/services/curriculumErrors.ts`:

```ts
import { isApiError } from "@/lib/api-error";

export type CurriculumErrorCode =
  | "academics.curriculum.not_found"
  | "academics.curriculum.duplicate"
  | "academics.curriculum.invalid_scope"
  | "academics.curriculum.read_only"
  | "academics.curriculum.activation_incomplete"
  | "academics.curriculum.unit_not_found"
  | "academics.curriculum.lesson_not_found"
  | "academics.curriculum.invalid_reorder"
  | "academics.lesson_content.not_found"
  | "academics.lesson_content.invalid_scope"
  | "academics.lesson_content.invalid_type_payload"
  | "academics.lesson_content.invalid_url"
  | "academics.lesson_content.file_not_found"
  | "academics.lesson_content.read_only"
  | "validation.failed"
  | "auth.scope.missing";

const curriculumErrorMessages: Record<CurriculumErrorCode, string> = {
  "academics.curriculum.not_found": "The curriculum could not be found.",
  "academics.curriculum.duplicate":
    "A curriculum already exists for this academic scope.",
  "academics.curriculum.invalid_scope":
    "The curriculum is outside the selected academic scope.",
  "academics.curriculum.read_only": "This curriculum is read-only.",
  "academics.curriculum.activation_incomplete":
    "Add at least one non-deleted unit and one non-deleted lesson before activation.",
  "academics.curriculum.unit_not_found": "The selected unit could not be found.",
  "academics.curriculum.lesson_not_found":
    "The selected lesson could not be found.",
  "academics.curriculum.invalid_reorder":
    "The requested order is not valid for this curriculum.",
  "academics.lesson_content.not_found":
    "The selected lesson content item could not be found.",
  "academics.lesson_content.invalid_scope":
    "The lesson content item is outside the selected curriculum hierarchy.",
  "academics.lesson_content.invalid_type_payload":
    "The content fields do not match the selected content type.",
  "academics.lesson_content.invalid_url":
    "Lesson content links must use HTTP or HTTPS.",
  "academics.lesson_content.file_not_found":
    "The selected file could not be found.",
  "academics.lesson_content.read_only": "This lesson content item is read-only.",
  "validation.failed": "Check the submitted curriculum fields.",
  "auth.scope.missing": "You do not have permission to perform this action.",
};

export interface CurriculumUiError {
  message: string;
  traceId?: string;
  details: string[];
}

export function curriculumUiError(
  error: unknown,
  fallbackMessage: string,
): CurriculumUiError {
  if (!isApiError(error)) {
    return { message: fallbackMessage, details: [] };
  }

  const message = isCurriculumErrorCode(error.code)
    ? curriculumErrorMessages[error.code]
    : error.message || fallbackMessage;

  return {
    message,
    traceId: error.traceId,
    details: detailMessages(error.details),
  };
}

export function isCurriculumErrorCode(
  code: string,
): code is CurriculumErrorCode {
  return code in curriculumErrorMessages;
}

function detailMessages(input: unknown): string[] {
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap(detailMessages);
  if (input && typeof input === "object") {
    return Object.values(input).flatMap(detailMessages);
  }
  return [];
}
```

- [ ] **Step 4: Run error tests to verify they pass**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/academics/curriculum/services/curriculumErrors.ts src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts
git commit -m "feat: map curriculum backend errors"
```

## Task 5: Align page data flow, permissions, and unsupported page actions

**Files:**
- Modify: `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`
- Modify: `src/features/academics/curriculum/components/CreateCurriculumDialog.tsx`

- [ ] **Step 1: Update imports and page state for backend detail**

In `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`, replace imports of old curriculum fetches with:

```ts
import {
  archiveCurriculum,
  activateCurriculum,
  fetchCurriculumForScope,
  type Curriculum,
  type Lesson,
  type Unit,
} from "@/features/academics/curriculum/services/curriculumService";
import { curriculumUiError } from "@/features/academics/curriculum/services/curriculumErrors";
```

Keep existing assignment imports elsewhere untouched.

- [ ] **Step 2: Make read-only and lifecycle booleans explicit**

Near the existing permission setup in `CurriculumPageContent.tsx`, use:

```ts
const { hasPermission } = usePermissions();
const canViewCurriculum = hasPermission("academics.curriculum.view");
const canManageCurriculum = hasPermission("academics.curriculum.manage");
const isArchived = curriculum?.status === "archived";
const isClosedTerm = termStatus === "closed";
const isReadOnly = !canManageCurriculum || isArchived || isClosedTerm;
const canMutate = canViewCurriculum && !isReadOnly;
const canActivate =
  canMutate &&
  curriculum?.status === "draft" &&
  curriculum.unitCount > 0 &&
  curriculum.lessonCount > 0;
const canArchive = canMutate && curriculum != null;
```

Do not remove the existing page route guard in `src/app/[lang]/(dashboard)/academics/(with-context)/curriculum/page.tsx`.

- [ ] **Step 3: Load current scoped curriculum through list then detail**

Replace the curriculum load body in `loadCurriculumData` with:

```ts
if (!academicYearId || !termId || !selectedGradeId || !selectedSubjectId) {
  setCurriculum(null);
  setUnits([]);
  setLessons([]);
  return;
}

setIsLoading(true);
setCurriculumError(null);
try {
  const curriculumData = await fetchCurriculumForScope({
    academicYearId,
    termId,
    gradeId: selectedGradeId,
    subjectId: selectedSubjectId,
  });

  setCurriculum(curriculumData);
  const nextUnits = curriculumData?.units ?? [];
  setUnits(nextUnits);
  setLessons(nextUnits.flatMap((unit) => unit.lessons));
} catch (error) {
  const mapped = curriculumUiError(error, tCommon("error"));
  setCurriculumError(
    mapped.traceId
      ? `${mapped.message} (${mapped.traceId})`
      : mapped.message,
  );
  setCurriculum(null);
  setUnits([]);
  setLessons([]);
} finally {
  setIsLoading(false);
}
```

- [ ] **Step 4: Remove carry-over dialog state and handlers**

Delete these page pieces from `CurriculumPageContent.tsx`:

```ts
const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);

const handleCarryOverSuccess = async () => {
  await refreshCurriculum();
  setShowCarryOverDialog(false);
};
```

Remove the `<CurriculumCarryOverDialog ... />` JSX block and the import.

- [ ] **Step 5: Replace create dialog props**

Update `CreateCurriculumDialog` usage:

```tsx
<CreateCurriculumDialog
  isOpen={showCreateDialog}
  onClose={() => setShowCreateDialog(false)}
  onSuccess={handleCreateSuccess}
  academicYearId={academicYearId}
  termId={termId}
  gradeId={selectedGradeId}
  subjectId={selectedSubjectId}
  gradeName={grades.find((g) => g.id === selectedGradeId)?.name || ""}
  subjectName={subjects.find((s) => s.id === selectedSubjectId)?.name || ""}
/>
```

- [ ] **Step 6: Update create dialog implementation**

In `src/features/academics/curriculum/components/CreateCurriculumDialog.tsx`, change props and submit:

```ts
interface CreateCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  academicYearId: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  gradeName: string;
  subjectName: string;
}
```

Use `title` and `description` state:

```ts
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const defaultTitle = `${gradeName} - ${subjectName}`;
```

Submit:

```ts
await createCurriculum({
  academicYearId,
  termId,
  gradeId,
  subjectId,
  title: title.trim() || defaultTitle,
  description: description.trim() || null,
});
onSuccess();
setTitle("");
setDescription("");
```

Render one required title input and one optional description textarea; remove the old `name` field.

- [ ] **Step 7: Remove planned-week and done fields from export**

In `CurriculumPageContent.tsx`, change curriculum export rows to:

```ts
const curriculumExportRows = useMemo(() => {
  return units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      unit: unit.title,
      lesson: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes || "",
    })),
  );
}, [units]);
```

Use export columns:

```ts
const columns: ExportColumn[] = [
  { key: "unit", label: locale === "ar" ? "الوحدة" : "Unit" },
  { key: "lesson", label: locale === "ar" ? "الدرس" : "Lesson" },
  {
    key: "estimatedMinutes",
    label: locale === "ar" ? "المدة (دقائق)" : "Duration (minutes)",
  },
];
```

- [ ] **Step 8: Add lifecycle handlers with guard repetition**

Add handlers:

```ts
const handleActivateCurriculum = async () => {
  if (!curriculum || !canActivate) return;
  try {
    await activateCurriculum(curriculum.id);
    await refreshCurriculum();
  } catch (error) {
    const mapped = curriculumUiError(error, tCommon("error"));
    setCurriculumError(mapped.message);
  }
};

const handleArchiveCurriculum = async () => {
  if (!curriculum || !canArchive) return;
  try {
    await archiveCurriculum(curriculum.id);
    await refreshCurriculum();
  } catch (error) {
    const mapped = curriculumUiError(error, tCommon("error"));
    setCurriculumError(mapped.message);
  }
};
```

Render lifecycle buttons near existing page actions only when `hasCurriculum` is true:

```tsx
{hasCurriculum && (
  <>
    <Button
      variant="secondary"
      size="md"
      onClick={handleActivateCurriculum}
      disabled={!canActivate}
    >
      {t("actions.activate_curriculum")}
    </Button>
    <Button
      variant="secondary"
      size="md"
      onClick={handleArchiveCurriculum}
      disabled={!canArchive}
    >
      {t("actions.archive_curriculum")}
    </Button>
  </>
)}
```

Add missing translation keys in Task 8.

- [ ] **Step 9: Run targeted typecheck for page edits**

Run:

```bash
npm run typecheck
```

Expected: no curriculum-related TypeScript errors. If unrelated repo baseline errors appear, copy the first 20 lines for the final handoff and continue only if curriculum files typecheck cleanly.

- [ ] **Step 10: Commit**

```bash
git add src/features/academics/curriculum/pages/CurriculumPageContent.tsx src/features/academics/curriculum/components/CreateCurriculumDialog.tsx
git commit -m "feat: align curriculum page flow with backend"
```

## Task 6: Align unit and lesson editor with backend fields

**Files:**
- Modify: `src/features/academics/curriculum/components/CurriculumOutline.tsx`
- Modify: `src/features/academics/curriculum/components/CurriculumEditor.tsx`

- [ ] **Step 1: Simplify outline display**

In `CurriculumOutline.tsx`:

- Remove `useLocale`.
- Replace `buildSearchText(unit.titleAr, unit.titleEn, unit.title)` with `unit.title`.
- Replace `buildSearchText(lesson.titleAr, lesson.titleEn, lesson.title)` with `lesson.title`.
- Replace title selection with:

```ts
const unitTitle = unit.title;
const lessonTitle = lesson.title;
```

- Delete the done badge and planned-week span:

```tsx
{lesson.status === "done" && ...}
<span className="text-xs text-gray-500">
  {t("week_short", { week: lesson.plannedWeek })}
</span>
```

- [ ] **Step 2: Replace editor imports**

In `CurriculumEditor.tsx`, remove:

```ts
import Select from "@/components/ui/input/Select";
import BilingualTextField from "@/components/ui/bilingual-text-field/BilingualTextField";
import { validateArEnDifferent } from "@/utils/validation/bilingualValidation";
import { CheckCircle } from "lucide-react";
import { markLessonDone, undoLessonDone } from "@/features/academics/curriculum/services/curriculumService";
```

Use:

```ts
import { Save, Trash2, BookOpen } from "lucide-react";
```

- [ ] **Step 3: Use backend form fields**

Use this form state type:

```ts
type CurriculumEditorForm = {
  title: string;
  description: string;
  objectives: string;
  estimatedLessons: string;
  estimatedMinutes: string;
};
```

Initialize state:

```ts
const emptyForm: CurriculumEditorForm = {
  title: "",
  description: "",
  objectives: "",
  estimatedLessons: "",
  estimatedMinutes: "",
};

const [formData, setFormData] = useState<CurriculumEditorForm>(emptyForm);
const [originalData, setOriginalData] = useState<CurriculumEditorForm>(emptyForm);
const [validationError, setValidationError] = useState<string | null>(null);
```

For existing units:

```ts
const data: CurriculumEditorForm = {
  title: unit.title,
  description: unit.description || "",
  objectives: "",
  estimatedLessons: unit.estimatedLessons?.toString() ?? "",
  estimatedMinutes: "",
};
```

For existing lessons:

```ts
const data: CurriculumEditorForm = {
  title: lesson.title,
  description: lesson.description || "",
  objectives: lesson.objectives.join("\n"),
  estimatedLessons: "",
  estimatedMinutes: lesson.estimatedMinutes?.toString() ?? "",
};
```

- [ ] **Step 4: Save unit and lesson through hierarchy IDs**

Replace `handleSave` mutation body with:

```ts
if (isReadOnly || !selectedNode) return;

const title = formData.title.trim();
if (!title) {
  setValidationError(tValidation("required"));
  return;
}

setValidationError(null);
setIsSaving(true);
try {
  if (selectedNode.type === "unit") {
    const estimatedLessons = formData.estimatedLessons.trim()
      ? Number(formData.estimatedLessons)
      : null;
    const payload = {
      title,
      description: formData.description.trim() || null,
      estimatedLessons,
    };
    if (selectedNode.id === "new") {
      await createUnit(curriculum.id, {
        ...payload,
        sortOrder: units.length,
      });
    } else {
      await updateUnit(curriculum.id, selectedNode.id, payload);
    }
  } else {
    const estimatedMinutes = formData.estimatedMinutes.trim()
      ? Number(formData.estimatedMinutes)
      : null;
    const objectives = formData.objectives
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    if (selectedNode.id.startsWith("new-")) {
      const unitId = selectedNode.id.replace("new-", "");
      const unitLessons = lessons.filter((lesson) => lesson.unitId === unitId);
      await createLesson(curriculum.id, unitId, {
        title,
        description: formData.description.trim() || null,
        objectives,
        estimatedMinutes,
        sortOrder: unitLessons.length,
      });
    } else {
      const lesson = lessons.find((item) => item.id === selectedNode.id);
      if (!lesson) return;
      await updateLesson(curriculum.id, lesson.unitId, selectedNode.id, {
        title,
        description: formData.description.trim() || null,
        objectives,
        estimatedMinutes,
      });
    }
  }

  await onRefresh();
  onDirtyChange(false);
} catch (error) {
  console.error("Failed to save:", error);
} finally {
  setIsSaving(false);
}
```

- [ ] **Step 5: Delete through hierarchy IDs**

Replace `handleDelete` with:

```ts
const handleDelete = async () => {
  if (isReadOnly || !selectedNode || !confirm(t("confirm_delete"))) return;

  try {
    if (selectedNode.type === "unit") {
      await deleteUnit(curriculum.id, selectedNode.id);
    } else {
      const lesson = lessons.find((item) => item.id === selectedNode.id);
      if (!lesson) return;
      await deleteLesson(curriculum.id, lesson.unitId, selectedNode.id);
    }
    await onRefresh();
    onSelectNode?.(null);
  } catch (error) {
    console.error("Failed to delete:", error);
  }
};
```

- [ ] **Step 6: Remove mark-done UI and planned-week fields**

Delete:

```ts
const handleMarkDone = async () => { ... };
const weekOptions = Array.from(...);
```

Delete status chip rendering and the Mark Done button. Remove the planned-week `Select`.

- [ ] **Step 7: Render backend fields**

Replace `BilingualTextField` with:

```tsx
<Input
  label={t("title")}
  value={formData.title}
  onChange={(e) => {
    setFormData({ ...formData, title: e.target.value });
    setValidationError(null);
  }}
  required
  error={validationError || undefined}
  disabled={isReadOnly}
/>
```

Render description for both units and lessons:

```tsx
<TextArea
  label={t("description")}
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  disabled={isReadOnly}
  rows={3}
/>
```

For units:

```tsx
<Input
  label={t("estimated_lessons")}
  type="number"
  value={formData.estimatedLessons}
  onChange={(e) => setFormData({ ...formData, estimatedLessons: e.target.value })}
  disabled={isReadOnly}
/>
```

For lessons:

```tsx
<TextArea
  label={t("objectives")}
  value={formData.objectives}
  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
  disabled={isReadOnly}
  rows={4}
/>
<Input
  label={t("duration_minutes")}
  type="number"
  value={formData.estimatedMinutes}
  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
  disabled={isReadOnly}
/>
```

- [ ] **Step 8: Pass lesson content hierarchy**

For the lesson content button and panel, derive:

```ts
const selectedLesson =
  selectedNode.type === "lesson" && !isNew
    ? lessons.find((item) => item.id === selectedNode.id)
    : null;
```

Render:

```tsx
{selectedLesson && (
  <LearningContentPanel
    curriculumId={curriculum.id}
    unitId={selectedLesson.unitId}
    lessonId={selectedLesson.id}
    isReadOnly={isReadOnly}
    open={learningContentOpen}
    onClose={() => setLearningContentOpen(false)}
  />
)}
```

- [ ] **Step 9: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: no curriculum editor/outline TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add src/features/academics/curriculum/components/CurriculumOutline.tsx src/features/academics/curriculum/components/CurriculumEditor.tsx
git commit -m "feat: align curriculum editor with backend fields"
```

## Task 7: Replace learning content UI with backend lesson-content contract

**Files:**
- Modify: `src/features/academics/curriculum/components/LearningContentPanel.tsx`
- Modify or delete: `src/features/academics/curriculum/components/LearningContent.tsx`
- Stop using: `src/features/academics/curriculum/components/LessonMaterials.tsx`
- Stop using: `src/features/academics/curriculum/components/LessonVideo.tsx`

- [ ] **Step 1: Replace content panel props**

Use:

```ts
interface LearningContentPanelProps {
  curriculumId: string;
  unitId: string;
  lessonId: string;
  isReadOnly: boolean;
  open: boolean;
  onClose: () => void;
}
```

- [ ] **Step 2: Replace tabs with supported content list**

Replace imports in `LearningContentPanel.tsx` with:

```ts
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, FileText, Link as LinkIcon, Trash2 } from "lucide-react";
import {
  Drawer,
  IconButton,
  MenuItem,
  Select as MuiSelect,
  Tooltip,
} from "@mui/material";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import TextArea from "@/components/ui/input/TextArea";
import {
  createLessonContent,
  deleteLessonContent,
  listLessonContent,
  updateLessonContent,
  type LessonContentItem,
  type LessonContentType,
} from "@/features/academics/curriculum/services/curriculumService";
import { curriculumUiError } from "@/features/academics/curriculum/services/curriculumErrors";
```

- [ ] **Step 3: Add clear content form state**

Use:

```ts
type ContentForm = {
  id?: string;
  type: LessonContentType;
  title: string;
  bodyText: string;
  url: string;
  fileId: string;
  estimatedMinutes: string;
  isRequired: boolean;
};

const emptyContentForm: ContentForm = {
  type: "TEXT",
  title: "",
  bodyText: "",
  url: "",
  fileId: "",
  estimatedMinutes: "",
  isRequired: true,
};

const hasBackendFileIdPicker = false;
```

- [ ] **Step 4: Implement supported payload builder**

Inside `LearningContentPanel.tsx`, add:

```ts
function buildContentPayload(form: ContentForm) {
  const estimatedMinutes = form.estimatedMinutes.trim()
    ? Number(form.estimatedMinutes)
    : null;

  if (form.type === "TEXT") {
    return {
      type: "TEXT" as const,
      title: form.title.trim(),
      bodyText: form.bodyText.trim(),
      url: null,
      fileId: null,
      estimatedMinutes,
      isRequired: form.isRequired,
    };
  }

  if (form.type === "FILE") {
    if (!form.fileId.trim()) {
      throw new Error("FILE content requires a backend fileId.");
    }

    return {
      type: "FILE" as const,
      title: form.title.trim(),
      bodyText: null,
      url: null,
      fileId: form.fileId.trim(),
      estimatedMinutes,
      isRequired: form.isRequired,
    };
  }

  return {
    type: form.type,
    title: form.title.trim(),
    bodyText: null,
    url: form.url.trim(),
    fileId: null,
    estimatedMinutes,
    isRequired: form.isRequired,
  };
}
```

- [ ] **Step 5: Load and save content through nested routes**

Use:

```ts
const [items, setItems] = useState<LessonContentItem[]>([]);
const [form, setForm] = useState<ContentForm>(emptyContentForm);
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadItems = async () => {
  setLoading(true);
  setError(null);
  try {
    setItems(await listLessonContent(curriculumId, unitId, lessonId));
  } catch (loadError) {
    setError(curriculumUiError(loadError, t("load_failed")).message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (open) void loadItems();
}, [open, curriculumId, unitId, lessonId]);

const handleSave = async () => {
  if (
    isReadOnly ||
    !form.title.trim() ||
    (form.type === "FILE" && !hasBackendFileIdPicker)
  ) {
    return;
  }
  setSaving(true);
  setError(null);
  try {
    const payload = buildContentPayload(form);
    if (form.id) {
      await updateLessonContent(
        curriculumId,
        unitId,
        lessonId,
        form.id,
        payload,
      );
    } else {
      await createLessonContent(curriculumId, unitId, lessonId, {
        ...payload,
        sortOrder: items.length,
      });
    }
    setForm(emptyContentForm);
    await loadItems();
  } catch (saveError) {
    setError(curriculumUiError(saveError, t("save_failed")).message);
  } finally {
    setSaving(false);
  }
};

const handleDelete = async (item: LessonContentItem) => {
  if (isReadOnly) return;
  await deleteLessonContent(curriculumId, unitId, lessonId, item.id);
  await loadItems();
};
```

- [ ] **Step 6: Render uppercase content type controls**

Render the type selector with exactly:

```tsx
<MuiSelect
  value={form.type}
  onChange={(event) => {
    const type = event.target.value as LessonContentType;
    setForm({
      ...emptyContentForm,
      id: form.id,
      title: form.title,
      type,
      isRequired: form.isRequired,
    });
  }}
  disabled={isReadOnly}
  size="small"
>
  <MenuItem value="TEXT">TEXT</MenuItem>
  <MenuItem value="FILE" disabled={!hasBackendFileIdPicker}>
    <Tooltip title={t("file_disabled_tooltip")}>
      <span>FILE</span>
    </Tooltip>
  </MenuItem>
  <MenuItem value="VIDEO_LINK">VIDEO_LINK</MenuItem>
  <MenuItem value="EXTERNAL_LINK">EXTERNAL_LINK</MenuItem>
</MuiSelect>
```

Render conditional fields:

```tsx
{form.type === "TEXT" && (
  <TextArea
    label={t("body_text")}
    value={form.bodyText}
    onChange={(event) => setForm({ ...form, bodyText: event.target.value })}
    disabled={isReadOnly}
    rows={5}
  />
)}
{form.type === "FILE" && (
  <Tooltip title={t("file_disabled_tooltip")}>
    <span>
      <Input
        label={t("file_id")}
        value={form.fileId}
        onChange={(event) => setForm({ ...form, fileId: event.target.value })}
        disabled
      />
    </span>
  </Tooltip>
)}
{(form.type === "VIDEO_LINK" || form.type === "EXTERNAL_LINK") && (
  <Input
    label={t("url")}
    value={form.url}
    onChange={(event) => setForm({ ...form, url: event.target.value })}
    disabled={isReadOnly}
    placeholder="https://example.com"
  />
)}
```

- [ ] **Step 7: Keep assignments out of this drawer**

Remove imports and rendering of:

```ts
import LessonMaterials from "./LessonMaterials";
import LessonVideo from "./LessonVideo";
import LessonAssignments from "./LessonAssignments";
```

This does not delete assignment pages; it only removes the homework tab from the curriculum lesson-content drawer because homework is out of scope for this backend alignment.

- [ ] **Step 8: Remove or delete the old wrapper if it still imports unsupported components**

If `src/features/academics/curriculum/components/LearningContent.tsx` is still imported anywhere, replace it with a wrapper that delegates to the new panel contract only when full hierarchy IDs are supplied:

```tsx
"use client";

import LearningContentPanel from "./LearningContentPanel";

interface LearningContentProps {
  curriculumId: string;
  unitId: string;
  lessonId: string;
  isReadOnly: boolean;
  open: boolean;
  onClose: () => void;
}

export default function LearningContent(props: LearningContentProps) {
  return <LearningContentPanel {...props} />;
}
```

If it has no imports after `CurriculumEditor.tsx` is updated, delete it:

```bash
git rm src/features/academics/curriculum/components/LearningContent.tsx
```

- [ ] **Step 9: Confirm unsupported material/video endpoints are unreachable**

Run:

```bash
rg -n "LessonMaterials|LessonVideo|fetchLessonAttachments|uploadLessonAttachmentFile|createLessonAttachmentLink|deleteAttachment|fetchLessonVideo|upsertLessonVideoLink|uploadLessonVideoFile|deleteLessonVideo" src/features/academics/curriculum --glob '!**/Assignment*' --glob '!**/assignments/**'
```

Expected: no reachable imports from `CurriculumEditor.tsx`, `LearningContent.tsx`, or `LearningContentPanel.tsx`. If `LessonMaterials.tsx` and `LessonVideo.tsx` still contain their own internals but are not imported, delete them if no assignment file imports them.

- [ ] **Step 10: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: no curriculum lesson-content TypeScript errors.

- [ ] **Step 11: Commit**

```bash
git add src/features/academics/curriculum/components/LearningContentPanel.tsx src/features/academics/curriculum/components/LearningContent.tsx
git rm src/features/academics/curriculum/components/LessonMaterials.tsx src/features/academics/curriculum/components/LessonVideo.tsx
git commit -m "feat: use backend lesson content contract"
```

## Task 8: Remove or disable remaining unsupported curriculum UI and add translations

**Files:**
- Modify: `src/features/academics/curriculum/pages/CurriculumPageContent.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`
- Delete if unused: `src/features/academics/curriculum/components/CurriculumCarryOverDialog.tsx`
- Delete if unused: `src/features/academics/curriculum/components/CurriculumPlan.tsx`

- [ ] **Step 1: Remove curriculum plan panel from reachable page**

In `CurriculumPageContent.tsx`, delete the right panel that renders:

```tsx
<CurriculumPlan
  curriculum={curriculum!}
  units={units}
  lessons={lessons}
  termWeeks={termWeeks}
  onRefresh={refreshCurriculum}
  isReadOnly={isReadOnly}
/>
```

Replace the right panel with backend-supported metadata:

```tsx
<div className="p-6 space-y-4">
  <h2 className="text-lg font-semibold text-gray-900">
    {t("details.title")}
  </h2>
  <div className="text-sm text-gray-700">
    {t("details.status")}: {curriculum.status}
  </div>
  <div className="text-sm text-gray-700">
    {t("details.units")}: {curriculum.unitCount}
  </div>
  <div className="text-sm text-gray-700">
    {t("details.lessons")}: {curriculum.lessonCount}
  </div>
</div>
```

Do the same in the mobile right drawer.

- [ ] **Step 2: Delete unused unsupported curriculum components**

Run:

```bash
rg -n "CurriculumCarryOverDialog|CurriculumPlan" src/features/academics/curriculum src/app
```

If only the component files define themselves, delete them:

```bash
git rm src/features/academics/curriculum/components/CurriculumCarryOverDialog.tsx src/features/academics/curriculum/components/CurriculumPlan.tsx
```

- [ ] **Step 3: Add English messages**

In `src/messages/en.json`, under `academics.curriculum`, add missing keys used above:

```json
{
  "actions": {
    "activate_curriculum": "Activate curriculum",
    "archive_curriculum": "Archive curriculum"
  },
  "details": {
    "title": "Curriculum details",
    "status": "Status",
    "units": "Units",
    "lessons": "Lessons"
  },
  "editor": {
    "estimated_lessons": "Estimated lessons"
  },
  "learningContent": {
    "body_text": "Body text",
    "file_disabled_tooltip": "File content is disabled until a supported file picker provides a backend file ID.",
    "file_id": "File ID",
    "load_failed": "Could not load lesson content.",
    "save_failed": "Could not save lesson content.",
    "url": "URL"
  }
}
```

Merge with existing nested objects rather than replacing existing keys.

- [ ] **Step 4: Add Arabic messages**

In `src/messages/ar.json`, under `academics.curriculum`, add matching keys:

```json
{
  "actions": {
    "activate_curriculum": "تفعيل المنهج",
    "archive_curriculum": "أرشفة المنهج"
  },
  "details": {
    "title": "تفاصيل المنهج",
    "status": "الحالة",
    "units": "الوحدات",
    "lessons": "الدروس"
  },
  "editor": {
    "estimated_lessons": "عدد الدروس المتوقع"
  },
  "learningContent": {
    "body_text": "النص",
    "file_disabled_tooltip": "محتوى الملفات معطل إلى أن يتوفر اختيار ملف يعيد معرّف ملف من الخادم.",
    "file_id": "معرّف الملف",
    "load_failed": "تعذر تحميل محتوى الدرس.",
    "save_failed": "تعذر حفظ محتوى الدرس.",
    "url": "الرابط"
  }
}
```

Merge with existing nested objects rather than replacing existing keys.

- [ ] **Step 5: Confirm unsupported curriculum features are absent**

Run:

```bash
rg -n "carryOverCurriculum|CurriculumCarryOverDialog|plannedWeek|markLessonDone|undoLessonDone|updateLessonSchedule|fetchUnits\\(|fetchLessons\\(|reorderUnits\\(|reorderLessons\\(|LessonMaterials|LessonVideo|uploadLessonAttachmentFile|uploadLessonVideoFile" src/features/academics/curriculum src/app --glob '!**/Assignment*' --glob '!**/assignments/**' --glob '!**/hooks/useAssignment*' --glob '!**/hooks/useQuestion*'
```

Expected: no hits in reachable curriculum page/service/editor/content files. Hits in assignment-specific files are out of scope and should not be changed.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: no curriculum-related TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/academics/curriculum src/messages/en.json src/messages/ar.json
git commit -m "feat: remove unsupported curriculum UI"
```

## Task 9: Verification and quality gates

**Files:**
- Review all changed files from Tasks 1-8.

- [ ] **Step 1: Run focused curriculum tests**

Run:

```bash
npm run test:run -- src/features/academics/curriculum/services/__tests__/curriculumMappers.test.ts src/features/academics/curriculum/services/__tests__/curriculumApiAdapter.test.ts src/features/academics/curriculum/services/__tests__/curriculumErrors.test.ts src/features/academics/curriculum/services/__tests__/curriculumServiceExports.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm run test:run
```

Expected: PASS, or report unrelated pre-existing failures separately with file names and first failing assertion.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npm run typecheck
```

Expected: PASS, or report unrelated baseline errors separately. Curriculum files must be clean.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS, or report unrelated baseline errors separately. Touched curriculum files must not introduce lint failures.

- [ ] **Step 5: Optional production build**

Run if typecheck and lint are not blocked by unrelated baseline failures:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Manual source audit**

Run:

```bash
rg -n "academics/curriculum/.*/units/|/units/\\$\\{|/lessons/\\$\\{|carry-over|carryOver|plannedWeek|doneAt|markLessonDone|undoLessonDone|updateLessonSchedule" src/features/academics/curriculum src/app --glob '!**/Assignment*' --glob '!**/assignments/**'
```

Expected:

- Supported nested URLs appear only in `curriculumApiAdapter.ts`.
- No unsupported carry-over, planned-week scheduling, done/undo, or shortened standalone unit/lesson URLs appear in reachable curriculum files.

- [ ] **Step 7: Clean-code review pass**

Use `clean-code-guard` on production code changes. Fix any must-fix findings before final handoff.

- [ ] **Step 8: Test review pass**

Use `test-guard` on new tests. Fix any must-fix findings before final handoff.

- [ ] **Step 9: Final commit if verification fixes changed files**

If verification required fixes:

```bash
git add src/features/academics/curriculum src/messages/en.json src/messages/ar.json
git commit -m "fix: verify curriculum backend alignment"
```

If no files changed after Task 8, do not create an empty commit.

## Self-review notes

- Spec coverage:
  - Backend routes, filters, permissions, content type casing, response normalization, activation readiness, read-only logic, unsupported feature removal, and error mapping are each covered by Tasks 1-8.
  - New curriculum API snippets use `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`; `apiWithToken` is mentioned only as a deprecated wrapper to avoid.
  - Backend status filters use uppercase `DRAFT`, `ACTIVE`, and `ARCHIVED`; UI status mapping never silently maps unknown values to draft.
  - FILE content remains disabled until an existing supported picker/upload flow returns a backend `fileId`.
  - Homework assignments are intentionally excluded; only the curriculum drawer stops rendering the homework tab because that drawer is scoped to backend lesson content.
- Placeholder scan:
  - No placeholder markers or unspecific “write tests” tasks remain.
  - Each code-producing task includes concrete snippets and exact commands.
- Type consistency:
  - Canonical content type is uppercase in frontend models and request payloads.
  - Backend lower-case response values are normalized in `normalizeLessonContentType`.
  - Backend status casing and UI display status are separate types.
  - Unit and lesson mutations carry `curriculumId`, and lesson/content mutations carry the full hierarchy.
