# Hero Journey Mission Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Hero Journey mission creation and editing with the backend DTO, PATCH semantics, mission-status restrictions, and objective-order algorithm.

**Architecture:** Add a focused mission contract module that owns request types, runtime validation, create/update normalization, protected-field filtering, and error codes. The existing service calls those boundaries before POST/PATCH, while the modal and page remain responsible for form state, permission-gated actions, status-aware controls, localized feedback, and refresh behavior.

**Tech Stack:** TypeScript 5, React 19, Next.js 16, next-intl, Vitest, Testing Library, existing `apiPost`/`apiPatch` helpers.

## Global Constraints

- Do not add a validation dependency.
- Preserve `POST /reinforcement/hero/missions` and the existing mission PATCH route.
- Preserve the `reinforcement.hero.manage` permission gate.
- Create accepts `academicYearId` or `yearId`, rejects conflicting aliases, and emits only canonical `academicYearId`.
- Raw HTML form candidates are distinct from normalized request DTOs; valid numeric strings are converted without type casts.
- Update inspects only explicitly dirty fields and preserves omitted-versus-`null` PATCH semantics.
- Every update omits dashboard-protected `academicYearId`, `yearId`, `termId`, and `stageId`, regardless of mission status.
- Published missions must omit `academicYearId`, `yearId`, `termId`, `stageId`, `subjectId`, `linkedAssessmentId`, `linkedLessonRef`, `requiredLevel`, `rewardXp`, `badgeRewardId`, and `objectives` from PATCH payloads.
- Archived missions are non-editable.
- Create requires at least one objective; update may omit objectives, send `[]`, or send a normalized replacement list.
- Objective order normalization must match the backend algorithm exactly.
- Preserve unrelated staged and unstaged work in the shared working tree.

---

## File Structure

- Create `src/features/hero-journey/services/heroJourneyMissionContract.ts`: request DTO types, error codes, field validators, create/update normalizers, objective ordering, and editability helpers.
- Create `src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts`: focused unit coverage for all DTO and business-boundary behavior.
- Modify `src/features/hero-journey/services/heroJourneyService.ts`: remove broad mission payload declarations, import contract types, normalize before POST/PATCH, and require update context.
- Modify `src/features/hero-journey/__tests__/heroJourneyService.test.ts`: use valid UUID fixtures and assert normalized requests at the HTTP boundary.
- Modify `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx`: DTO defaults, optional numeric/order inputs, maximum lengths, status-aware disabling, and form-candidate plus dirty-field submission.
- Create `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`: verify published-field protection and editable copy fields.
- Modify `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx`: create/update context, archived edit suppression, normalized error feedback, and safe backend messages.
- Modify `src/messages/en.json` and `src/messages/ar.json`: localized contract error and save-failure messages.

---

### Task 1: Mission DTO contract and normalizers

**Files:**

- Create: `src/features/hero-journey/services/heroJourneyMissionContract.ts`
- Create: `src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts`

**Interfaces:**

- Consumes: `HeroJourneyMission` and `HeroJourneyMissionStatus` from `src/features/hero-journey/types/index.ts`.
- Produces:
  - `HeroMissionObjectiveType`
  - `NumericFormValue`
  - `HeroMissionObjectiveCandidate`
  - `CreateHeroMissionCandidate`
  - `UpdateHeroMissionCandidate`
  - `HeroMissionEditableField`
  - `HeroMissionObjectiveRequest`
  - `CreateHeroMissionRequest`
  - `UpdateHeroMissionRequest`
  - `HeroMissionUpdateContext`
  - `HeroMissionContractError`
  - `normalizeCreateHeroMissionRequest(candidate)`
  - `normalizeUpdateHeroMissionRequest(candidate, context)`
  - `isHeroMissionEditable(status)`

- [ ] **Step 1: Write failing create-normalizer tests**

Create `heroJourneyMissionContract.test.ts` with valid UUID constants and these exact expectations:

```ts
import { describe, expect, it } from "vitest";
import {
  HeroMissionContractError,
  normalizeCreateHeroMissionRequest,
  type CreateHeroMissionCandidate,
  type HeroMissionContractErrorCode,
} from "../heroJourneyMissionContract";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const TERM_ID = "22222222-2222-4222-8222-222222222222";
const STAGE_ID = "33333333-3333-4333-8333-333333333333";
const ASSESSMENT_ID = "55555555-5555-4555-8555-555555555555";

describe("normalizeCreateHeroMissionRequest", () => {
  it("canonicalizes the year alias and preserves backend-owned defaults", () => {
    expect(
      normalizeCreateHeroMissionRequest({
        yearId: ` ${YEAR_ID} `,
        termId: TERM_ID,
        stageId: STAGE_ID,
        titleEn: " Mathematics Explorer ",
        rewardXp: "100",
        objectives: [{ titleEn: " First objective " }],
      }),
    ).toEqual({
      academicYearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleEn: "Mathematics Explorer",
      rewardXp: 100,
      objectives: [
        {
          titleEn: "First objective",
          type: "manual",
          isRequired: true,
          sortOrder: 1,
        },
      ],
    });
  });

  it("matches backend objective ordering", () => {
    const result = normalizeCreateHeroMissionRequest({
      academicYearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleAr: "مهمة",
      objectives: [
        { titleEn: "order-three", sortOrder: 3 },
        { titleEn: "unordered-one" },
        { titleEn: "order-one", sortOrder: 1 },
        { titleEn: "unordered-two" },
      ],
    });

    expect(result.objectives.map(({ titleEn, sortOrder }) => ({ titleEn, sortOrder }))).toEqual([
      { titleEn: "order-one", sortOrder: 1 },
      { titleEn: "order-three", sortOrder: 2 },
      { titleEn: "unordered-one", sortOrder: 3 },
      { titleEn: "unordered-two", sortOrder: 4 },
    ]);
  });

  it.each([
    [{ termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{}] }, "academicYearRequired"],
    [{ academicYearId: YEAR_ID, yearId: "99999999-9999-4999-8999-999999999999", termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{}] }, "academicYearConflict"],
    [{ academicYearId: "not-a-uuid", termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{}] }, "invalidUuid"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: " ", titleAr: null, objectives: [{}] }, "missionTitleRequired"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "x".repeat(256), objectives: [{}] }, "maxLengthExceeded"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [] }, "objectivesRequired"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{ sortOrder: 1 }, { sortOrder: 1 }] }, "duplicateObjectiveOrder"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", rewardXp: Number.POSITIVE_INFINITY, objectives: [{}] }, "integerRequired"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", rewardXp: 1.5, objectives: [{}] }, "integerRequired"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", rewardXp: "12x", objectives: [{}] }, "integerRequired"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", metadata: [], objectives: [{}] }, "metadataInvalid"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{ type: "video" }] }, "invalidObjectiveType"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{ isRequired: "yes" }] }, "invalidBoolean"],
    [{ academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID, titleEn: "Title", objectives: [{ linkedAssessmentId: "bad" }] }, "invalidUuid"],
  ] satisfies Array<[CreateHeroMissionCandidate, HeroMissionContractErrorCode]>)("rejects invalid create input", (input, code) => {
    expect(() => normalizeCreateHeroMissionRequest(input)).toThrowError(
      expect.objectContaining<Partial<HeroMissionContractError>>({ code }),
    );
  });

  it.each([
    ["academicYearId", "academicYearId"],
    ["yearId", "yearId"],
    ["termId", "termId"],
    ["stageId", "stageId"],
    ["subjectId", "subjectId"],
    ["linkedAssessmentId", "linkedAssessmentId"],
    ["badgeRewardId", "badgeRewardId"],
  ] as const)("validates UUID field %s", (key, field) => {
    const candidate: CreateHeroMissionCandidate = {
      academicYearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleEn: "Title",
      objectives: [{}],
      [key]: "bad",
    };
    if (key === "yearId") candidate.academicYearId = undefined;
    expect(() => normalizeCreateHeroMissionRequest(candidate)).toThrowError(
      expect.objectContaining({ code: "invalidUuid", field }),
    );
  });

  it("reports an indexed field path for an invalid objective UUID", () => {
    expect(() => normalizeCreateHeroMissionRequest({
      academicYearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleEn: "Title",
      objectives: [{}, {}, { linkedAssessmentId: "bad" }],
    })).toThrowError(expect.objectContaining({
      code: "invalidUuid",
      field: "objectives.2.linkedAssessmentId",
    }));
  });

  it("accepts nullable objective fields and defaults null isRequired", () => {
    const result = normalizeCreateHeroMissionRequest({
      academicYearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleEn: "Title",
      linkedAssessmentId: ASSESSMENT_ID,
      objectives: [{ titleEn: null, isRequired: null, metadata: null }],
    });
    expect(result.objectives[0]).toMatchObject({ isRequired: true, metadata: null });
  });
});
```

- [ ] **Step 2: Run create-normalizer tests and verify red**

Run:

```powershell
npm run test:run -- src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts
```

Expected: FAIL because `heroJourneyMissionContract.ts` does not exist.

- [ ] **Step 3: Add failing update and mission-status tests**

Append tests that prove partial PATCH behavior and status restrictions:

```ts
import {
  isHeroMissionEditable,
  normalizeUpdateHeroMissionRequest,
} from "../heroJourneyMissionContract";
import type { HeroJourneyMission } from "../../types";

const originalMission = {
  id: "mission-1",
  titleEn: "Original",
  titleAr: "الأصلية",
  briefEn: "Existing brief",
  stageNameEn: "Stage",
  stageNameAr: "المرحلة",
  requiredLevel: 1,
  rewardXp: 20,
  linkedLessonId: "",
  linkedLessonTitleEn: "",
  linkedLessonTitleAr: "",
  linkedQuizId: "",
  linkedQuizTitleEn: "",
  linkedQuizTitleAr: "",
  status: "draft",
  studentsStarted: 0,
  studentsCompleted: 0,
  updatedAt: "2026-07-13T00:00:00.000Z",
} satisfies HeroJourneyMission;

describe("normalizeUpdateHeroMissionRequest", () => {
  it("does not require create-only fields and omits unchanged fields", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { titleEn: "Original", briefEn: "Changed" },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["briefEn"]),
        },
      ),
    ).toEqual({ briefEn: "Changed" });
  });

  it("sends null for an explicitly cleared optional field", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { briefEn: "" },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["briefEn"]),
        },
      ),
    ).toEqual({ briefEn: null });
  });

  it("rejects an update whose effective titles are both blank", () => {
    expect(() =>
      normalizeUpdateHeroMissionRequest(
        { titleEn: "", titleAr: "" },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["titleEn", "titleAr"]),
        },
      ),
    ).toThrowError(expect.objectContaining({ code: "missionTitleRequired" }));
  });

  it("distinguishes omitted objectives from an explicit empty replacement", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        {},
        { status: "draft", original: originalMission, dirtyFields: new Set() },
      ),
    ).toEqual({});
    expect(
      normalizeUpdateHeroMissionRequest(
        { objectives: [] },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["objectives"]),
        },
      ),
    ).toEqual({ objectives: [] });
  });

  it("always omits dashboard-protected academic scope", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { academicYearId: YEAR_ID, termId: TERM_ID, stageId: STAGE_ID },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["academicYearId", "termId", "stageId"]),
        },
      ),
    ).toEqual({});
  });

  it("treats a dirty undefined property as omitted", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { briefEn: undefined },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["briefEn"]),
        },
      ),
    ).toEqual({});
  });

  it("removes every protected property from published updates", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        {
          titleEn: "New title",
          stageId: STAGE_ID,
          subjectId: null,
          rewardXp: 100,
          objectives: [{ titleEn: "Changed objective" }],
        },
        {
          status: "published",
          original: { ...originalMission, status: "published" },
          dirtyFields: new Set([
            "titleEn", "stageId", "subjectId", "rewardXp", "objectives",
          ]),
        },
      ),
    ).toEqual({ titleEn: "New title" });
  });

  it("rejects archived updates", () => {
    expect(() =>
      normalizeUpdateHeroMissionRequest(
        { titleEn: "New title" },
        {
          status: "archived",
          original: { ...originalMission, status: "archived" },
          dirtyFields: new Set(["titleEn"]),
        },
      ),
    ).toThrowError(expect.objectContaining({ code: "missionArchived" }));
  });
});

describe("isHeroMissionEditable", () => {
  it.each(["draft", "published", "scheduled"] as const)("allows %s", (status) => {
    expect(isHeroMissionEditable(status)).toBe(true);
  });

  it("rejects archived missions", () => {
    expect(isHeroMissionEditable("archived")).toBe(false);
  });
});
```

- [ ] **Step 4: Implement the contract module**

Create the module with the following public model and algorithms:

```ts
import type { HeroJourneyMission, HeroJourneyMissionStatus } from "../types";

export const HERO_MISSION_OBJECTIVE_TYPES = [
  "manual", "lesson", "quiz", "assessment", "task", "custom",
] as const;

export type HeroMissionObjectiveType =
  (typeof HERO_MISSION_OBJECTIVE_TYPES)[number];

export type NumericFormValue = number | string;

export interface HeroMissionObjectiveCandidate {
  type?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  sortOrder?: NumericFormValue | null;
  isRequired?: unknown;
  metadata?: unknown;
}

export interface HeroMissionFormCandidate {
  academicYearId?: string | null;
  yearId?: string | null;
  termId?: string | null;
  stageId?: string | null;
  subjectId?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  briefEn?: string | null;
  briefAr?: string | null;
  requiredLevel?: NumericFormValue | null;
  rewardXp?: NumericFormValue | null;
  badgeRewardId?: string | null;
  positionX?: NumericFormValue | null;
  positionY?: NumericFormValue | null;
  sortOrder?: NumericFormValue | null;
  metadata?: unknown;
  objectives?: HeroMissionObjectiveCandidate[] | null;
}

export type CreateHeroMissionCandidate = HeroMissionFormCandidate;
export type UpdateHeroMissionCandidate = HeroMissionFormCandidate;
export type HeroMissionEditableField = keyof UpdateHeroMissionCandidate;

export interface HeroMissionObjectiveRequest {
  type?: HeroMissionObjectiveType | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  sortOrder?: number | null;
  isRequired?: boolean | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateHeroMissionRequest {
  academicYearId?: string;
  yearId?: string;
  termId: string;
  stageId: string;
  subjectId?: string | null;
  linkedAssessmentId?: string | null;
  linkedLessonRef?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  briefEn?: string | null;
  briefAr?: string | null;
  requiredLevel?: number;
  rewardXp?: number;
  badgeRewardId?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  objectives: HeroMissionObjectiveRequest[];
}

export type UpdateHeroMissionRequest = Partial<
  Omit<CreateHeroMissionRequest, "objectives">
> & { objectives?: HeroMissionObjectiveRequest[] };

export interface HeroMissionUpdateContext {
  status: HeroJourneyMissionStatus;
  original: HeroJourneyMission;
  dirtyFields: ReadonlySet<HeroMissionEditableField>;
}

export type HeroMissionContractErrorCode =
  | "academicYearRequired" | "academicYearConflict" | "invalidUuid"
  | "termRequired" | "stageRequired" | "missionTitleRequired"
  | "maxLengthExceeded" | "integerRequired" | "minimumValue"
  | "objectivesRequired" | "invalidObjectiveType"
  | "invalidObjectiveOrder" | "duplicateObjectiveOrder"
  | "invalidBoolean" | "metadataInvalid" | "missionArchived";

export class HeroMissionContractError extends Error {
  constructor(
    public readonly code: HeroMissionContractErrorCode,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "HeroMissionContractError";
  }
}
```

Define the protection lists exactly once:

```ts
const DASHBOARD_PROTECTED_UPDATE_FIELDS = new Set<HeroMissionEditableField>([
  "academicYearId", "yearId", "termId", "stageId",
]);

const PUBLISHED_PROTECTED_UPDATE_FIELDS = new Set<HeroMissionEditableField>([
  "subjectId", "linkedAssessmentId", "linkedLessonRef", "requiredLevel",
  "rewardXp", "badgeRewardId", "objectives",
]);
```

Implement private helpers with these exact rules:

- `trimText(value, max, field)`: preserve `undefined`, convert `null` to `null`, trim strings, convert blank strings to `null`, and throw `maxLengthExceeded` with `field` and `{ max }` details.
- `validateUuid(value, field)`: accept `undefined`/`null`; trim strings before requiring RFC 4122 UUID text using `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`; return the trimmed UUID.
- `normalizeInteger(value, field, minimum?)`: treat `undefined`, `null`, and `""` as absent; convert a complete numeric string with `Number(value)`; reject `NaN`, `Infinity`, decimal values, and partially numeric strings with `integerRequired`; then apply `minimumValue` with `{ minimum }` details.
- `validateMetadata(value)`: accept `undefined`, `null`, or a non-array object only.
- `normalizeObjectives(objectives, { requireNonEmpty })`: validate that the value is an array; require at least one item only for create; allow `[]` for update; use indexed field paths such as `objectives.2.sortOrder`; validate runtime type and boolean values; reject duplicate explicit orders with a `Set<number>`; sort `{ objective, index, key: sortOrder ?? Number.MAX_SAFE_INTEGER }` by `key` then `index`; default `type` and `isRequired` using `??`; and assign `sortOrder: index + 1`.
- `normalizeCreateHeroMissionRequest(candidate)`: trim both year aliases, reject different non-empty values with `academicYearConflict` on `academicYearId`, resolve `academicYearId ?? yearId`, validate it, emit it as `academicYearId`, omit `yearId`, require term/stage/non-empty objectives, validate the effective title pair, and omit optional backend-default fields when absent.
- `normalizeUpdateHeroMissionRequest(candidate, context)`: reject `missionArchived` before any request work; iterate `context.dirtyFields` only; skip every dashboard-protected field; additionally skip published-protected fields when `context.status === "published"`; treat a dirty `undefined` value as omitted; normalize dirty values; emit `null` for dirty cleared nullable fields; and validate effective titles using original values for title fields not marked dirty.
- `isHeroMissionEditable(status)`: return `status !== "archived"`.

- [ ] **Step 5: Run contract tests and verify green**

Run:

```powershell
npm run test:run -- src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts
```

Expected: PASS with all create, update, objective-order, and status tests green.

- [ ] **Step 6: Commit the contract boundary**

```powershell
git add src/features/hero-journey/services/heroJourneyMissionContract.ts src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts
git commit -m "feat: validate hero mission requests"
```

---

### Task 2: Enforce normalization at the HTTP service boundary

**Files:**

- Modify: `src/features/hero-journey/services/heroJourneyService.ts:1-74,821-836`
- Modify: `src/features/hero-journey/__tests__/heroJourneyService.test.ts:216-274`

**Interfaces:**

- Consumes: contract types and normalizers from Task 1.
- Produces:
  - `createHeroJourneyMission(candidate: CreateHeroMissionCandidate)`
  - `updateHeroJourneyMission(missionId, candidate: UpdateHeroMissionCandidate, context: HeroMissionUpdateContext)`
  - Contract types remain exported by `heroJourneyMissionContract.ts` and are imported directly by callers.

- [ ] **Step 1: Change service tests to expect normalized payloads**

Replace the mission endpoint test fixtures with valid UUIDs and assert canonical/default behavior:

```ts
const missionPayload = {
  yearId: "11111111-1111-4111-8111-111111111111",
  termId: "22222222-2222-4222-8222-222222222222",
  stageId: "33333333-3333-4333-8333-333333333333",
  titleEn: " Read ",
  objectives: [{ titleEn: "Finish chapter" }],
};

await createHeroJourneyMission(missionPayload);
await updateHeroJourneyMission(
  "mission-1",
  { titleEn: "Read more", rewardXp: 999 },
  {
    status: "published",
    original: { ...mission, status: "published" },
    dirtyFields: new Set(["titleEn", "rewardXp"]),
  },
);

expect(apiMocks.apiPost).toHaveBeenCalledWith(
  "/reinforcement/hero/missions",
  {
    academicYearId: "11111111-1111-4111-8111-111111111111",
    termId: "22222222-2222-4222-8222-222222222222",
    stageId: "33333333-3333-4333-8333-333333333333",
    titleEn: "Read",
    objectives: [{ titleEn: "Finish chapter", type: "manual", isRequired: true, sortOrder: 1 }],
  },
);
expect(apiMocks.apiPatch).toHaveBeenCalledWith(
  "/reinforcement/hero/missions/mission-1",
  { titleEn: "Read more" },
);
```

Add two separate boundary tests:

```ts
await expect(createHeroJourneyMission({
  academicYearId: "bad",
  termId: "22222222-2222-4222-8222-222222222222",
  stageId: "33333333-3333-4333-8333-333333333333",
  titleEn: "Title",
  objectives: [{}],
})).rejects.toMatchObject({ code: "invalidUuid" });
expect(apiMocks.apiPost).not.toHaveBeenCalled();

await expect(updateHeroJourneyMission(
  "mission-1",
  { titleEn: "Blocked" },
  {
    status: "archived",
    original: { ...mission, status: "archived" },
    dirtyFields: new Set(["titleEn"]),
  },
)).rejects.toMatchObject({ code: "missionArchived" });
expect(apiMocks.apiPatch).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the service test and verify red**

Run:

```powershell
npm run test:run -- src/features/hero-journey/__tests__/heroJourneyService.test.ts
```

Expected: FAIL because the current service forwards raw payloads and update has no context parameter.

- [ ] **Step 3: Wire the service to the contract module**

Delete `HeroJourneyMissionObjectivePayload` and `HeroJourneyMissionPayload` from `heroJourneyService.ts`. Import the candidate/context types used by the service, and have component callers import shared types directly from the contract module. Normalize immediately before network calls:

```ts
import {
  normalizeCreateHeroMissionRequest,
  normalizeUpdateHeroMissionRequest,
  type CreateHeroMissionCandidate,
  type HeroMissionUpdateContext,
  type UpdateHeroMissionCandidate,
} from "./heroJourneyMissionContract";

export async function createHeroJourneyMission(
  candidate: CreateHeroMissionCandidate,
): Promise<HeroJourneyMission> {
  const request = normalizeCreateHeroMissionRequest(candidate);
  const response = await apiPost<unknown>(`${HERO_ENDPOINT}/missions`, request);
  return mapMission(unwrapReinforcementItemResponse(response));
}

export async function updateHeroJourneyMission(
  missionId: string,
  candidate: UpdateHeroMissionCandidate,
  context: HeroMissionUpdateContext,
): Promise<HeroJourneyMission> {
  const request = normalizeUpdateHeroMissionRequest(candidate, context);
  const response = await apiPatch<unknown>(
    `${HERO_ENDPOINT}/missions/${missionId}`,
    request,
  );
  return mapMission(unwrapReinforcementItemResponse(response));
}
```

- [ ] **Step 4: Run contract and service tests**

Run:

```powershell
npm run test:run -- src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts src/features/hero-journey/__tests__/heroJourneyService.test.ts
```

Expected: PASS; invalid requests never call the HTTP helpers, and valid create/update requests match the contract.

- [ ] **Step 5: Commit service enforcement**

```powershell
git add src/features/hero-journey/services/heroJourneyService.ts src/features/hero-journey/__tests__/heroJourneyService.test.ts
git commit -m "feat: enforce hero mission contract at service boundary"
```

---

### Task 3: Align the create/edit modal and mission page

**Files:**

- Modify: `src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx:9-82,153-192,512-603,729-955`
- Create: `src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx`
- Modify: `src/features/hero-journey/components/HeroJourneyMissionsPage.tsx:1-40,721-775,913-1080,1345-1449`
- Modify: `src/messages/en.json:9716-9815`
- Modify: `src/messages/ar.json:9717-9816`

**Interfaces:**

- Consumes: `CreateHeroMissionCandidate`, `UpdateHeroMissionCandidate`, `HeroMissionEditableField`, `HeroMissionContractError`, `isHeroMissionEditable`, and the updated service functions.
- Produces: status-aware form candidates plus `ReadonlySet<HeroMissionEditableField>`, localized validation feedback, protected-field UI state, and archived edit suppression.

- [ ] **Step 1: Write failing modal status tests**

Create `HeroJourneyMissionFormModal.test.tsx`. Mock `next-intl` as in `HeroJourneyBadgeThumb.test.tsx`, provide empty option arrays and a resolved `onLoadLessons`, and use a complete `HeroJourneyMission` fixture. Add these assertions:

```tsx
it("disables protected fields for a published mission but keeps copy editable", () => {
  renderMission({ status: "published" });

  expect(screen.getByLabelText("heroJourney.missionForm.labels.titleEn")).not.toBeDisabled();
  expect(screen.getByLabelText("heroJourney.missionForm.labels.briefEn")).not.toBeDisabled();
  expect(screen.getByLabelText("heroJourney.missionForm.labels.requiredLevel")).toBeDisabled();
  expect(screen.getByLabelText("heroJourney.missionForm.labels.rewardXp")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "heroJourney.missionForm.actions.addObjective" }),
  ).toBeDisabled();
});

it("uses backend defaults for a new mission until the user enters values", () => {
  renderMission(null);
  expect(screen.getByLabelText("heroJourney.missionForm.labels.requiredLevel")).toHaveValue(null);
  expect(screen.getByLabelText("heroJourney.missionForm.labels.rewardXp")).toHaveValue(null);
  expect(screen.getByLabelText("heroJourney.missionForm.labels.objectiveOrder")).toHaveValue(null);
});

it("allows a draft update to remove its final objective", () => {
  renderMission({ status: "draft" });
  expect(
    screen.getByRole("button", { name: "heroJourney.missionForm.actions.removeObjective" }),
  ).not.toBeDisabled();
});

it("keeps the final objective required during create", () => {
  renderMission(null);
  expect(
    screen.getByRole("button", { name: "heroJourney.missionForm.actions.removeObjective" }),
  ).toBeDisabled();
});
```

- [ ] **Step 2: Run the modal test and verify red**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: FAIL because new missions currently inject numeric defaults and published protected controls are enabled.

- [ ] **Step 3: Update modal DTO behavior and accessibility**

Make these concrete changes:

- Replace service imports with `HeroMissionObjectiveCandidate`, `HeroMissionFormCandidate`, and `HeroMissionEditableField`; do not cast form state to request DTO types.
- Change `onSubmit` to accept the modal-scoped `HeroMissionFormCandidate` fields plus `dirtyFields: ReadonlySet<HeroMissionEditableField>`.
- Add `dirtyFields` state initialized to `new Set<HeroMissionEditableField>()` and a `markDirty(field)` helper that clones the set before adding the field.
- Mark the corresponding DTO field in every user-driven handler. Any exposed objective title/order edit, add, or remove action marks `objectives`. Cascading programmatic resets caused by a user subject/reference change retain the affected field markers.
- Change `blankObjective()` to `{ type: "manual", titleEn: "", titleAr: "", isRequired: true }`; do not assign `sortOrder`.
- Change mission objective fallback type from `task` to `manual`.
- Initialize optional numeric create fields with `""`; retain mission values when editing.
- Render optional objective order with `objective.sortOrder == null ? "" : String(objective.sortOrder)` and convert an empty event value to `undefined`.
- Add `maxLength={255}` to exposed mission/objective title inputs and `maxLength={2000}` to mission briefs. The contract boundary enforces limits for linked lesson references and objective subtitles, which are not free-text controls in this modal.
- Define `const isEditing = Boolean(mission)`, `const protectsAcademicScope = isEditing`, and `const protectsPublishedFields = mission?.status === "published"`. Disable stage, grade, section, and classroom for every edit. Disable subject, linked lesson, linked assessment, required level, reward XP, badge reward, and all objective controls only for published edits.
- Disable Add/Remove Objective for published missions.
- During create, keep Remove Objective disabled when only one objective remains. During a draft edit, allow removal of the final objective and submit `objectives: []` with `objectives` marked dirty.
- Keep title, brief, `positionX`, `positionY`, and mission `sortOrder` editable.
- Submit the form candidate together with a snapshot of `dirtyFields`; preserve blank nullable values so a dirty clear normalizes to `null`, while the normalizer ignores identical blank values for fields not in the set.

- [ ] **Step 4: Update the page to pass create/update context and status gates**

Use the contract helper in every edit entry point:

```ts
const canEditMission = (mission: HeroJourneyMission) =>
  canManageHero && isHeroMissionEditable(mission.status);
```

Apply it to row-menu Edit items, detail-modal Edit buttons, and `openEditMission`. Archived missions retain View but expose no Edit action. Change `saveMission` to receive `(candidate, dirtyFields)`. Then call the service without request-type casts:

```ts
if (editingMission) {
  await updateHeroJourneyMission(
    editingMission.id,
    candidate,
    {
      status: editingMission.status,
      original: editingMission,
      dirtyFields,
    },
  );
} else {
  await createHeroJourneyMission({
    ...candidate,
    academicYearId,
    termId,
  });
}
```

Replace the generic catch with contract and API-aware feedback:

```ts
} catch (error) {
  if (error instanceof HeroMissionContractError) {
    showError(t(`missionForm.errors.${error.code}`));
  } else if (isApiError(error) && error.message.trim()) {
    showError(error.message);
  } else {
    showError(t("messages.saveMissionFailed"));
  }
}
```

The modal stays open on every failure and closes only after the request succeeds.

- [ ] **Step 5: Add English and Arabic error keys**

Under `heroJourney.missionForm.errors`, add matching translations for every stable `HeroMissionContractErrorCode`: academic year required/conflict, invalid UUID, term/stage required, mission title required, maximum length exceeded, integer required, minimum value, objectives required, invalid objective type/order, duplicate objective order, invalid boolean, invalid metadata, and archived mission. Under `heroJourney.messages`, add `saveMissionFailed` in both languages. Keep indexed `error.field` available for diagnostics without embedding English field names in the contract module.

- [ ] **Step 6: Run modal, contract, and service tests**

Run:

```powershell
npm run test:run -- src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts src/features/hero-journey/__tests__/heroJourneyService.test.ts
```

Expected: PASS with published controls disabled, archived edits gated by the shared helper, and normalized HTTP payloads.

- [ ] **Step 7: Run targeted lint and typecheck**

Run:

```powershell
npm run lint -- src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/services/heroJourneyMissionContract.ts src/features/hero-journey/services/heroJourneyService.ts src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts src/features/hero-journey/__tests__/heroJourneyService.test.ts
npm run typecheck
```

Expected: both commands exit 0 with no ESLint or TypeScript errors.

- [ ] **Step 8: Commit the UI integration**

```powershell
git add src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: align hero mission create and edit forms"
```

---

## Final Verification

- [ ] Run the complete Hero Journey unit suite:

```powershell
npm run test:run -- src/features/hero-journey
```

Expected: all Hero Journey tests pass.

- [ ] Run repository typecheck:

```powershell
npm run typecheck
```

Expected: exit 0.

- [ ] Run targeted lint for every changed TypeScript/TSX file:

```powershell
npm run lint -- src/features/hero-journey/services/heroJourneyMissionContract.ts src/features/hero-journey/services/heroJourneyService.ts src/features/hero-journey/services/__tests__/heroJourneyMissionContract.test.ts src/features/hero-journey/__tests__/heroJourneyService.test.ts src/features/hero-journey/components/HeroJourneyMissionFormModal.tsx src/features/hero-journey/components/HeroJourneyMissionsPage.tsx src/features/hero-journey/components/__tests__/HeroJourneyMissionFormModal.test.tsx
```

Expected: exit 0.

- [ ] Inspect `git diff --check` and confirm no unrelated file changes were introduced:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; status contains only the intended implementation files plus the user's pre-existing changes.
