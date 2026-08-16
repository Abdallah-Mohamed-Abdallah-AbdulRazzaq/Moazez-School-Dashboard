import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  createHeroJourneyBadge,
  createHeroJourneyMission,
  deleteHeroJourneyBadge,
  deleteHeroJourneyMission,
  getHeroJourneyBadge,
  getHeroJourneyBadgeCatalog,
  getHeroJourneyMission,
  getHeroJourneyMissions,
  getHeroJourneyOverview,
  getHeroJourneyStudentProgress,
  toggleHeroJourneyMissionPublishState,
  updateHeroJourneyBadge,
  updateHeroJourneyMission,
} from "../services/heroJourneyService";
import type { HeroJourneyMission } from "../types";

const YEAR_ID = "11111111-1111-4111-8111-111111111111";
const TERM_ID = "22222222-2222-4222-8222-222222222222";
const STAGE_ID = "33333333-3333-4333-8333-333333333333";

const missionFixture = (
  patch: Partial<HeroJourneyMission> = {},
): HeroJourneyMission => ({
  id: "mission-1",
  titleEn: "Read",
  titleAr: "اقرأ",
  stageNameEn: "Stage",
  stageNameAr: "المرحلة",
  requiredLevel: 1,
  rewardXp: 10,
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
  ...patch,
});

describe("Hero Journey dashboard service", () => {
  beforeEach(() => {
    apiMocks.apiDelete.mockReset();
    apiMocks.apiGet.mockReset();
    apiMocks.apiPatch.mockReset();
    apiMocks.apiPost.mockReset();
  });

  it("uses backend dashboard overview and maps summary metrics", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: {
        missions: {
          total: 3,
          draft: 1,
          published: 1,
          archived: 1,
        },
        progress: {
          totalProgress: 6,
          notStarted: 2,
          inProgress: 2,
          completed: 2,
          cancelled: 0,
          completionRate: 33.3,
        },
        objectives: { averageProgressPercent: 48.5 },
        rewards: { totalHeroXp: 120, badgesAwarded: 4 },
        topStudents: [
          {
            studentId: "student-1",
            student: { id: "student-1", name: "Amina" },
            averageProgressPercent: 90,
          },
        ],
      },
    });

    const overview = await getHeroJourneyOverview({
      academicYearId: "year-1",
      termId: "term-1",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/hero/overview?academicYearId=year-1&termId=term-1",
    );
    expect(overview.missionCompletionRate).toBe(33.3);
    expect(overview.totalXpEarned).toBe(120);
    expect(overview.badgesEarnedThisMonth).toBe(4);
    expect(overview.summaryWidgets[0]?.value).toBe("1");
  });

  it("lists active badges through the core Hero badge endpoint", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      items: [
        {
          id: "badge-1",
          slug: "reader",
          nameEn: "Reader",
          nameAr: "Reader AR",
          assetPath: "/badges/reader.svg",
        },
      ],
    });

    const badges = await getHeroJourneyBadgeCatalog();

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/hero/badges?isActive=true",
    );
    expect(badges[0]).toMatchObject({
      id: "badge-1",
      slug: "reader",
      nameEn: "Reader",
      assetPath: "/badges/reader.svg",
    });
  });

  it("can list all badges for dashboard badge management", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({ items: [] });

    await getHeroJourneyBadgeCatalog({});

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/reinforcement/hero/badges");
  });

  it("uses badge detail, create, update, and delete endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: { id: "badge-1", slug: "reader", nameEn: "Reader" },
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      data: { id: "badge-2", slug: "leader" },
    });
    apiMocks.apiPatch.mockResolvedValueOnce({
      data: { id: "badge-1", slug: "reader-pro" },
    });
    apiMocks.apiDelete.mockResolvedValueOnce({ ok: true });

    await getHeroJourneyBadge("badge-1");
    await createHeroJourneyBadge({ slug: "leader", nameEn: "Leader" });
    await updateHeroJourneyBadge("badge-1", { slug: "reader-pro" });
    await deleteHeroJourneyBadge("badge-1");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/hero/badges/badge-1",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/reinforcement/hero/badges",
      { slug: "leader", nameEn: "Leader" },
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/reinforcement/hero/badges/badge-1",
      { slug: "reader-pro" },
    );
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(
      "/reinforcement/hero/badges/badge-1",
    );
  });

  it("lists missions with aggregate progress from the Hero map endpoint", async () => {
    apiMocks.apiGet
      .mockResolvedValueOnce({
        items: [
          {
            id: "mission-1",
            titleEn: "Read",
            titleAr: "Read AR",
            status: "published",
            rewardXp: 20,
            requiredLevel: 2,
            linkedLessonRef: "lesson-1",
            linkedAssessmentId: "assessment-1",
            badgeReward: { slug: "reader" },
            updatedAt: "2026-06-01T00:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          missions: [
            {
              missionId: "mission-1",
              startedCount: 5,
              completedCount: 3,
            },
          ],
        },
      });

    const missions = await getHeroJourneyMissions({
      academicYearId: "year-1",
      termId: "term-1",
      search: "read",
      status: "published",
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/hero/missions?academicYearId=year-1&termId=term-1&search=read&status=published",
    );
    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/hero/map?academicYearId=year-1&termId=term-1&includeDraft=true&includeArchived=true",
    );
    expect(missions[0]).toMatchObject({
      id: "mission-1",
      studentsStarted: 5,
      studentsCompleted: 3,
      badgeRewardSlug: "reader",
    });
  });

  it("sends mission limit only when the caller selects one", async () => {
    apiMocks.apiGet
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ data: { missions: [] } });

    await getHeroJourneyMissions({
      academicYearId: "year-1",
      termId: "term-1",
      limit: 25,
    });

    expect(apiMocks.apiGet).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/hero/missions?academicYearId=year-1&termId=term-1&limit=25",
    );
  });

  it("uses mission detail and delete endpoints", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: {
        id: "mission-1",
        titleEn: "Read",
        objectives: [
          {
            id: "objective-1",
            titleEn: "Finish chapter",
            titleAr: "إنهاء الفصل",
            sortOrder: 1,
            isRequired: true,
          },
        ],
      },
    });
    apiMocks.apiDelete.mockResolvedValueOnce({ ok: true });

    const mission = await getHeroJourneyMission("mission-1");
    await deleteHeroJourneyMission("mission-1");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/hero/missions/mission-1",
    );
    expect(apiMocks.apiDelete).toHaveBeenCalledWith(
      "/reinforcement/hero/missions/mission-1",
    );
    expect(mission.objectives).toEqual([
      expect.objectContaining({
        id: "objective-1",
        titleEn: "Finish chapter",
        titleAr: "إنهاء الفصل",
        sortOrder: 1,
        isRequired: true,
      }),
    ]);
  });

  it("normalizes mission create requests before POST", async () => {
    apiMocks.apiPost.mockResolvedValueOnce({
      data: { id: "mission-2", titleEn: "Write" },
    });

    await createHeroJourneyMission({
      yearId: YEAR_ID,
      termId: TERM_ID,
      stageId: STAGE_ID,
      titleEn: " Read ",
      objectives: [{ titleEn: "Finish chapter" }],
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/reinforcement/hero/missions",
      {
        academicYearId: YEAR_ID,
        termId: TERM_ID,
        stageId: STAGE_ID,
        titleEn: "Read",
        objectives: [
          {
            titleEn: "Finish chapter",
            type: "manual",
            isRequired: true,
            sortOrder: 1,
          },
        ],
      },
    );
  });

  it("removes published-protected fields before PATCH", async () => {
    apiMocks.apiPatch.mockResolvedValueOnce({
      data: { id: "mission-1", titleEn: "Read more" },
    });
    const mission = missionFixture({ status: "published" });

    await updateHeroJourneyMission(
      mission.id,
      { titleEn: "Read more", rewardXp: 999 },
      {
        status: mission.status,
        original: mission,
        dirtyFields: new Set(["titleEn", "rewardXp"]),
      },
    );

    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/reinforcement/hero/missions/mission-1",
      { titleEn: "Read more" },
    );
  });

  it("rejects invalid creates before POST", async () => {
    await expect(
      createHeroJourneyMission({
        academicYearId: "bad",
        termId: TERM_ID,
        stageId: STAGE_ID,
        titleEn: "Title",
        objectives: [{}],
      }),
    ).rejects.toMatchObject({ code: "invalidUuid" });
    expect(apiMocks.apiPost).not.toHaveBeenCalled();
  });

  it("rejects archived updates before PATCH", async () => {
    const mission = missionFixture({ status: "archived" });

    await expect(
      updateHeroJourneyMission(
        mission.id,
        { titleEn: "Blocked" },
        {
          status: mission.status,
          original: mission,
          dirtyFields: new Set(["titleEn"]),
        },
      ),
    ).rejects.toMatchObject({ code: "missionArchived" });
    expect(apiMocks.apiPatch).not.toHaveBeenCalled();
  });

  it("derives student progress rows from dashboard top students", async () => {
    apiMocks.apiGet.mockResolvedValueOnce({
      data: {
        topStudents: [
          {
            studentId: "student-1",
            student: { id: "student-1", firstName: "Amina", lastName: "Ali" },
            totalHeroXp: 40,
            averageProgressPercent: 55,
            completedMissions: 2,
          },
          {
            studentId: "student-2",
            student: { id: "student-2", name: "Omar" },
            totalHeroXp: 5,
            averageProgressPercent: 15,
            completedMissions: 0,
          },
        ],
      },
    });

    const students = await getHeroJourneyStudentProgress({
      academicYearId: "year-1",
      termId: "term-1",
      status: "on_track",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/reinforcement/hero/overview?academicYearId=year-1&termId=term-1",
    );
    expect(students).toHaveLength(1);
    expect(students[0]).toMatchObject({
      id: "student-1",
      studentName: "Amina Ali",
      xpCurrent: 40,
      progressStatus: "on_track",
    });
  });

  it("publishes draft missions and archives published missions", async () => {
    apiMocks.apiGet
      .mockResolvedValueOnce({ data: { id: "mission-1", status: "draft" } })
      .mockResolvedValueOnce({ data: { id: "mission-2", status: "published" } });
    apiMocks.apiPost
      .mockResolvedValueOnce({ data: { id: "mission-1", status: "published" } })
      .mockResolvedValueOnce({ data: { id: "mission-2", status: "archived" } });

    await toggleHeroJourneyMissionPublishState("mission-1");
    await toggleHeroJourneyMissionPublishState("mission-2");

    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      1,
      "/reinforcement/hero/missions/mission-1/publish",
      {},
    );
    expect(apiMocks.apiPost).toHaveBeenNthCalledWith(
      2,
      "/reinforcement/hero/missions/mission-2/archive",
      { reason: "Dashboard toggle" },
    );
  });
});
