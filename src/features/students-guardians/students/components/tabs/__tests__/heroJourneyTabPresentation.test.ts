import { describe, expect, it } from "vitest";
import {
  getRewardCoverage,
  getMissionTitle,
  isAwaitingMissionCompletion,
  normalizeHeroJourneyProgress,
  normalizeHeroJourneyRewards,
} from "../heroJourneyTabPresentation";

describe("hero journey tab presentation", () => {
  it("identifies missions awaiting final completion", () => {
    const progress = normalizeHeroJourneyProgress({
      summary: {
        missionsTotal: 2,
        inProgress: 2,
        completionRate: 0,
      },
      missions: [
        {
          missionId: "mission-2",
          status: "in_progress",
          progressPercent: 100,
          titleEn: "Test mission",
          objectives: {
            required: 2,
            completedRequired: 2,
          },
        },
      ],
    });

    expect(isAwaitingMissionCompletion(progress.missions[0])).toBe(true);
    expect(getMissionTitle(progress.missions[0], "en")).toBe("Test mission");
  });

  it("preserves the progress response context and mission audit fields", () => {
    const progress = normalizeHeroJourneyProgress({
      student: { id: "student-1", firstName: "Ali", lastName: "Dahshan", admissionNo: "A-12" },
      enrollment: { academicYearId: "year-1", termId: "term-1", classroomId: "class-1", sectionId: "section-1", gradeId: "grade-1", stageId: "stage-1" },
      summary: { missionsTotal: 1 },
      missions: [{
        missionId: "mission-1",
        progressId: "progress-1",
        requiredLevel: 2,
        startedAt: "2026-07-12T18:40:02.779Z",
        completedAt: null,
        lastActivityAt: "2026-07-12T18:40:25.235Z",
        objectives: { total: 3, required: 2, optional: 1, completed: 2, completedRequired: 2 },
        badgeReward: { id: "badge-1", slug: "super", assetPath: "https://example.com/badge.png", fileId: "file-1", isActive: true },
      }],
      recentEvents: [{ id: "event-1", type: "objective_completed", missionId: "mission-1", missionProgressId: "progress-1", objectiveId: "objective-1", occurredAt: "2026-07-12T18:40:25.235Z", actorUserId: "actor-1" }],
    });

    expect(progress.student.admissionNo).toBe("A-12");
    expect(progress.enrollment.academicYearId).toBe("year-1");
    expect(progress.missions[0]).toMatchObject({ progressId: "progress-1", requiredLevel: 2, totalObjectives: 3, optionalObjectives: 1, completedObjectives: 2 });
    expect(progress.missions[0].badgeReward).toMatchObject({ slug: "super", fileId: "file-1", isActive: true });
    expect(progress.recentEvents[0]).toMatchObject({ missionProgressId: "progress-1", objectiveId: "objective-1", actorUserId: "actor-1" });
  });

  it("normalizes reward coverage and configured-but-unawarded mission rewards", () => {
    const rewards = normalizeHeroJourneyRewards({
      summary: {
        totalHeroXp: 50,
        badgesCount: 1,
        completedMissions: 2,
        xpGrantedMissions: 1,
        badgeAwardedMissions: 1,
      },
      missions: [
        { missionId: "mission-1", titleEn: "Completed", rewardXp: 50, xpGranted: true, badgeRewardId: "badge-1", badgeAwarded: true },
        { missionId: "mission-2", titleEn: "Needs review", rewardXp: 20, xpGranted: false, badgeRewardId: "badge-2", badgeAwarded: false },
      ],
    });

    expect(getRewardCoverage(rewards.summary)).toEqual({ xp: 50, badges: 50 });
    expect(rewards.missions[1].badgeAwarded).toBe(false);
  });
});
