import { describe, expect, it } from "vitest";
import type { HeroJourneyMission } from "../../types";
import {
  isHeroMissionEditable,
  normalizeCreateHeroMissionRequest,
  normalizeUpdateHeroMissionRequest,
  type CreateHeroMissionCandidate,
  type HeroMissionContractErrorCode,
} from "../heroJourneyMissionContract";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_YEAR_ID = "99999999-9999-4999-8999-999999999999";
const TERM_ID = "22222222-2222-4222-8222-222222222222";
const STAGE_ID = "33333333-3333-4333-8333-333333333333";
const SUBJECT_ID = "44444444-4444-4444-8444-444444444444";
const ASSESSMENT_ID = "55555555-5555-4555-8555-555555555555";
const BADGE_ID = "66666666-6666-4666-8666-666666666666";

const originalMission: HeroJourneyMission = {
  id: "mission-1",
  academicYearId: YEAR_ID,
  termId: TERM_ID,
  stageId: STAGE_ID,
  subjectId: SUBJECT_ID,
  linkedAssessmentId: ASSESSMENT_ID,
  linkedLessonRef: "lesson-1",
  titleEn: "Original",
  titleAr: "الأصلية",
  briefEn: "Existing brief",
  briefAr: "وصف",
  stageNameEn: "Stage",
  stageNameAr: "المرحلة",
  requiredLevel: 2,
  rewardXp: 20,
  linkedLessonId: "lesson-1",
  linkedLessonTitleEn: "Lesson",
  linkedLessonTitleAr: "الدرس",
  linkedQuizId: ASSESSMENT_ID,
  linkedQuizTitleEn: "Quiz",
  linkedQuizTitleAr: "الاختبار",
  status: "draft",
  badgeRewardId: BADGE_ID,
  positionX: 10,
  positionY: 20,
  sortOrder: 3,
  metadata: { theme: "math" },
  objectives: [
    {
      id: "objective-1",
      titleEn: "Existing objective",
      type: "manual",
      isRequired: true,
      sortOrder: 1,
    },
  ],
  studentsStarted: 0,
  studentsCompleted: 0,
  updatedAt: "2026-07-13T00:00:00.000Z",
};

const validCreateCandidate = (
  patch: Partial<CreateHeroMissionCandidate> = {},
): CreateHeroMissionCandidate => ({
  academicYearId: YEAR_ID,
  termId: TERM_ID,
  stageId: STAGE_ID,
  titleEn: "Mission",
  objectives: [{ titleEn: "Objective" }],
  ...patch,
});

describe("normalizeCreateHeroMissionRequest", () => {
  it("canonicalizes a trimmed year alias and converts numeric form values", () => {
    expect(
      normalizeCreateHeroMissionRequest({
        yearId: ` ${YEAR_ID} `,
        termId: ` ${TERM_ID} `,
        stageId: ` ${STAGE_ID} `,
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

  it("rejects conflicting academic year aliases", () => {
    expect(() =>
      normalizeCreateHeroMissionRequest(
        validCreateCandidate({ yearId: OTHER_YEAR_ID }),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "academicYearConflict",
        field: "academicYearId",
      }),
    );
  });

  it("orders explicit objectives first and preserves unordered relative order", () => {
    const normalized = normalizeCreateHeroMissionRequest(
      validCreateCandidate({
        objectives: [
          { titleEn: "Unordered A" },
          { titleEn: "Third", sortOrder: 3 },
          { titleEn: "First", sortOrder: 1 },
          { titleEn: "Unordered B" },
        ],
      }),
    );

    expect(
      normalized.objectives.map(({ titleEn, sortOrder }) => ({
        title: titleEn,
        order: sortOrder,
      })),
    ).toEqual([
      { title: "First", order: 1 },
      { title: "Third", order: 2 },
      { title: "Unordered A", order: 3 },
      { title: "Unordered B", order: 4 },
    ]);
  });

  it.each(
    [
      [{ academicYearId: undefined }, "academicYearRequired"],
      [{ termId: undefined }, "termRequired"],
      [{ stageId: undefined }, "stageRequired"],
      [{ titleEn: " ", titleAr: null }, "missionTitleRequired"],
      [{ titleEn: "x".repeat(256) }, "maxLengthExceeded"],
      [{ objectives: [] }, "objectivesRequired"],
      [{ rewardXp: Number.POSITIVE_INFINITY }, "integerRequired"],
      [{ rewardXp: Number.NaN }, "integerRequired"],
      [{ rewardXp: 1.5 }, "integerRequired"],
      [{ rewardXp: "12x" }, "integerRequired"],
      [{ requiredLevel: 0 }, "minimumValue"],
      [{ rewardXp: -1 }, "minimumValue"],
      [{ metadata: [] }, "metadataInvalid"],
      [{ metadata: "invalid" }, "metadataInvalid"],
      [{ objectives: [{ type: "video" }] }, "invalidObjectiveType"],
      [{ objectives: [{ isRequired: "yes" }] }, "invalidBoolean"],
      [{ objectives: [{ sortOrder: 0 }] }, "invalidObjectiveOrder"],
      [{ objectives: [{ sortOrder: "0" }] }, "invalidObjectiveOrder"],
      [{ objectives: [{ sortOrder: 1.5 }] }, "integerRequired"],
      [
        { objectives: [{ sortOrder: 1 }, { sortOrder: 1 }] },
        "duplicateObjectiveOrder",
      ],
    ] satisfies Array<
      [Partial<CreateHeroMissionCandidate>, HeroMissionContractErrorCode]
    >,
  )("rejects invalid create candidate %#", (patch, code) => {
    expect(() =>
      normalizeCreateHeroMissionRequest(validCreateCandidate(patch)),
    ).toThrowError(expect.objectContaining({ code }));
  });

  it.each([
    ["academicYearId", "academicYearId"],
    ["yearId", "yearId"],
    ["termId", "termId"],
    ["stageId", "stageId"],
    ["subjectId", "subjectId"],
    ["linkedAssessmentId", "linkedAssessmentId"],
    ["badgeRewardId", "badgeRewardId"],
  ] as const)("validates the %s UUID", (candidateKey, field) => {
    const candidate = validCreateCandidate({ [candidateKey]: "bad" });
    if (candidateKey === "yearId") candidate.academicYearId = undefined;

    expect(() => normalizeCreateHeroMissionRequest(candidate)).toThrowError(
      expect.objectContaining({ code: "invalidUuid", field }),
    );
  });

  it("reports indexed objective UUID paths", () => {
    expect(() =>
      normalizeCreateHeroMissionRequest(
        validCreateCandidate({
          objectives: [{}, {}, { linkedAssessmentId: "bad" }],
        }),
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "invalidUuid",
        field: "objectives.2.linkedAssessmentId",
      }),
    );
  });

  it("accepts nullable objective values and applies null defaults", () => {
    const normalized = normalizeCreateHeroMissionRequest(
      validCreateCandidate({
        linkedAssessmentId: ASSESSMENT_ID,
        objectives: [{ titleEn: null, isRequired: null, metadata: null }],
      }),
    );

    expect(normalized.objectives[0]).toMatchObject({
      type: "manual",
      isRequired: true,
      metadata: null,
    });
  });
  it("treats a blank objective order as missing before normalization", () => {
    const normalized = normalizeCreateHeroMissionRequest(
      validCreateCandidate({
        objectives: [{ titleEn: "Unordered", sortOrder: "" }],
      }),
    );

    expect(normalized.objectives[0].sortOrder).toBe(1);
  });
});

describe("normalizeUpdateHeroMissionRequest", () => {
  it("inspects only dirty fields", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { titleEn: "Ignored", briefEn: "Changed" },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["briefEn"]),
        },
      ),
    ).toEqual({ briefEn: "Changed" });
  });

  it("emits null for a dirty clear and omits dirty undefined", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        { briefEn: "", briefAr: undefined },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["briefEn", "briefAr"]),
        },
      ),
    ).toEqual({ briefEn: null });
  });

  it("validates titles against the effective updated mission", () => {
    expect(() =>
      normalizeUpdateHeroMissionRequest(
        { titleEn: "", titleAr: "" },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(["titleEn", "titleAr"]),
        },
      ),
    ).toThrowError(
      expect.objectContaining({ code: "missionTitleRequired" }),
    );
  });

  it("distinguishes omitted objectives from an empty replacement", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        {},
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set(),
        },
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
        {
          academicYearId: OTHER_YEAR_ID,
          yearId: OTHER_YEAR_ID,
          termId: TERM_ID,
          stageId: STAGE_ID,
          subjectId: null,
        },
        {
          status: "draft",
          original: originalMission,
          dirtyFields: new Set([
            "academicYearId",
            "yearId",
            "termId",
            "stageId",
            "subjectId",
          ]),
        },
      ),
    ).toEqual({ subjectId: null });
  });

  it("omits every published-protected field even when dirty", () => {
    expect(
      normalizeUpdateHeroMissionRequest(
        {
          titleEn: "New title",
          subjectId: null,
          linkedAssessmentId: null,
          linkedLessonRef: null,
          requiredLevel: 4,
          rewardXp: 100,
          badgeRewardId: null,
          objectives: [],
        },
        {
          status: "published",
          original: { ...originalMission, status: "published" },
          dirtyFields: new Set([
            "titleEn",
            "subjectId",
            "linkedAssessmentId",
            "linkedLessonRef",
            "requiredLevel",
            "rewardXp",
            "badgeRewardId",
            "objectives",
          ]),
        },
      ),
    ).toEqual({ titleEn: "New title" });
  });

  it("rejects archived updates", () => {
    expect(() =>
      normalizeUpdateHeroMissionRequest(
        { titleEn: "Blocked" },
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
  it.each(["draft", "published", "scheduled"] as const)(
    "allows %s missions",
    (status) => {
      expect(isHeroMissionEditable(status)).toBe(true);
    },
  );

  it("rejects archived missions", () => {
    expect(isHeroMissionEditable("archived")).toBe(false);
  });
});
