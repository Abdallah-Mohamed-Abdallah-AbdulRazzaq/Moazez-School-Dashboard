import type {
  HeroJourneyActivity,
  HeroJourneyMission,
  HeroJourneyProgress,
  HeroJourneyRewards,
} from "./heroJourneyTabTypes";

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const sortByRecentActivity = <T extends { lastActivityAt?: string | null; occurredAt?: string | null }>(
  values: T[],
) =>
  [...values].sort((left, right) => {
    const leftTime = new Date(left.lastActivityAt ?? left.occurredAt ?? 0).getTime();
    const rightTime = new Date(right.lastActivityAt ?? right.occurredAt ?? 0).getTime();
    return rightTime - leftTime;
  });

function normalizeMission(value: unknown): HeroJourneyMission {
  const row = asRecord(value);
  const objectives = asRecord(row.objectives);
  const badge = asRecord(row.badgeReward);

  return {
    id: asString(row.missionId || row.id),
    progressId: asString(row.progressId),
    status: asString(row.status),
    progressPercent: asNumber(row.progressPercent),
    titleEn: asString(row.titleEn) || null,
    titleAr: asString(row.titleAr) || null,
    requiredObjectives: asNumber(objectives.required),
    completedRequiredObjectives: asNumber(objectives.completedRequired),
    totalObjectives: asNumber(objectives.total),
    optionalObjectives: asNumber(objectives.optional),
    completedObjectives: asNumber(objectives.completed),
    requiredLevel: asNumber(row.requiredLevel),
    rewardXp: asNumber(row.rewardXp),
    badgeReward: Object.keys(badge).length
      ? {
          id: asString(badge.id),
          slug: asString(badge.slug),
          nameEn: asString(badge.nameEn) || null,
          nameAr: asString(badge.nameAr) || null,
          assetPath: asString(badge.assetPath) || null,
          fileId: asString(badge.fileId) || null,
          isActive: badge.isActive === true,
        }
      : null,
    startedAt: asString(row.startedAt) || null,
    completedAt: asString(row.completedAt) || null,
    lastActivityAt: asString(row.lastActivityAt) || null,
  };
}

export function normalizeHeroJourneyProgress(raw: unknown): HeroJourneyProgress {
  const response = asRecord(raw);
  const summary = asRecord(response.summary);
  const student = asRecord(response.student);
  const enrollment = asRecord(response.enrollment);

  return {
    student: { id: asString(student.id), firstName: asString(student.firstName) || null, lastName: asString(student.lastName) || null, nameAr: asString(student.nameAr) || null, code: asString(student.code) || null, admissionNo: asString(student.admissionNo) || null },
    enrollment: {
      enrollmentId: asString(enrollment.enrollmentId) || null,
      academicYearId: asString(enrollment.academicYearId) || null,
      termId: asString(enrollment.termId) || null,
      classroomId: asString(enrollment.classroomId) || null,
      sectionId: asString(enrollment.sectionId) || null,
      gradeId: asString(enrollment.gradeId) || null,
      stageId: asString(enrollment.stageId) || null,
    },
    id: asString(response.progressId || response.id),
    summary: {
      missionsTotal: asNumber(summary.missionsTotal),
      notStarted: asNumber(summary.notStarted),
      inProgress: asNumber(summary.inProgress),
      completed: asNumber(summary.completed),
      cancelled: asNumber(summary.cancelled),
      completionRate: asNumber(summary.completionRate),
    },
    missions: sortByRecentActivity(asArray(response.missions).map(normalizeMission)),
    recentEvents: sortByRecentActivity(
      asArray(response.recentEvents).map((item): HeroJourneyActivity => {
        const row = asRecord(item);
        return {
          id: asString(row.id),
          type: asString(row.type),
          missionId: asString(row.missionId) || null,
          missionProgressId: asString(row.missionProgressId) || null,
          objectiveId: asString(row.objectiveId) || null,
          occurredAt: asString(row.occurredAt) || null,
          actorUserId: asString(row.actorUserId) || null,
        };
      }),
    ),
  };
}

export function normalizeHeroJourneyRewards(raw: unknown): HeroJourneyRewards {
  const response = asRecord(raw);
  const summary = asRecord(response.summary);
  const student = asRecord(response.student);

  return {
    student: { id: asString(student.id), firstName: asString(student.firstName) || null, lastName: asString(student.lastName) || null, nameAr: asString(student.nameAr) || null, code: asString(student.code) || null, admissionNo: asString(student.admissionNo) || null },
    totalHeroXp: asNumber(summary.totalHeroXp),
    badgesCount: asNumber(summary.badgesCount),
    summary: {
      completedMissions: asNumber(summary.completedMissions),
      xpGrantedMissions: asNumber(summary.xpGrantedMissions),
      badgeAwardedMissions: asNumber(summary.badgeAwardedMissions),
    },
    badges: asArray(response.badges).map((item) => {
      const row = asRecord(item);
      const badge = asRecord(row.badge);
      return {
        id: asString(row.id),
        studentBadgeId: asString(row.studentBadgeId || row.id), badgeId: asString(row.badgeId), missionId: asString(row.missionId) || null, progressId: asString(row.progressId) || null, earnedAt: asString(row.earnedAt) || null,
        badge: { slug: asString(badge.slug), nameEn: asString(badge.nameEn) || null, nameAr: asString(badge.nameAr) || null, descriptionEn: asString(badge.descriptionEn) || null, descriptionAr: asString(badge.descriptionAr) || null, assetPath: asString(badge.assetPath) || null, fileId: asString(badge.fileId) || null },
      };
    }),
    xpLedger: asArray(response.xpLedger).map((item) => {
      const row = asRecord(item);
      return {
        id: asString(row.id),
        amount: asNumber(row.amount),
        reason: asString(row.reason),
        reasonAr: asString(row.reasonAr) || null, progressId: asString(row.progressId) || null, missionId: asString(row.missionId) || null, sourceType: asString(row.sourceType), sourceId: asString(row.sourceId) || null, policyId: asString(row.policyId) || null, occurredAt: asString(row.occurredAt) || null, actorUserId: asString(row.actorUserId) || null,
      };
    }),
    missions: asArray(response.missions).map((item) => {
      const row = asRecord(item);
      return {
        missionId: asString(row.missionId),
        progressId: asString(row.progressId) || null,
        titleEn: asString(row.titleEn) || null,
        titleAr: asString(row.titleAr) || null,
        rewardXp: asNumber(row.rewardXp),
        xpGranted: row.xpGranted === true,
        badgeRewardId: asString(row.badgeRewardId) || null,
        badgeAwarded: row.badgeAwarded === true,
        xpLedgerId: asString(row.xpLedgerId) || null, studentBadgeId: asString(row.studentBadgeId) || null, completedAt: asString(row.completedAt) || null,
      };
    }),
    events: sortByRecentActivity(asArray(response.events).map((item) => { const row = asRecord(item); return { id: asString(row.id), type: asString(row.type), missionId: asString(row.missionId) || null, progressId: asString(row.progressId) || null, studentId: asString(row.studentId) || null, enrollmentId: asString(row.enrollmentId) || null, xpLedgerId: asString(row.xpLedgerId) || null, badgeId: asString(row.badgeId) || null, occurredAt: asString(row.occurredAt) || null, actorUserId: asString(row.actorUserId) || null }; })),
  };
}

export function getRewardCoverage(summary: HeroJourneyRewards["summary"]) {
  const completed = Math.max(summary.completedMissions, 1);
  return {
    xp: Math.round((summary.xpGrantedMissions / completed) * 100),
    badges: Math.round((summary.badgeAwardedMissions / completed) * 100),
  };
}

export const getMissionTitle = (mission: HeroJourneyMission, locale: string) =>
  (locale === "ar" ? mission.titleAr || mission.titleEn : mission.titleEn || mission.titleAr) ||
  "Mission";

export const isAwaitingMissionCompletion = (mission: HeroJourneyMission) =>
  mission.status === "in_progress" &&
  mission.requiredObjectives > 0 &&
  mission.completedRequiredObjectives >= mission.requiredObjectives;
