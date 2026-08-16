export type HeroJourneyMission = {
  id: string;
  progressId: string;
  status: string;
  progressPercent: number;
  titleEn: string | null;
  titleAr: string | null;
  requiredObjectives: number;
  completedRequiredObjectives: number;
  totalObjectives: number;
  optionalObjectives: number;
  completedObjectives: number;
  requiredLevel: number;
  rewardXp: number;
  badgeReward: {
    id: string;
    slug: string;
    nameEn: string | null;
    nameAr: string | null;
    assetPath: string | null;
    fileId: string | null;
    isActive: boolean;
  } | null;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
};

export type HeroJourneyActivity = {
  id: string;
  type: string;
  missionId: string | null;
  missionProgressId: string | null;
  objectiveId: string | null;
  occurredAt: string | null;
  actorUserId: string | null;
};

export type HeroJourneyProgress = {
  student: { id: string; firstName: string | null; lastName: string | null; nameAr: string | null; code: string | null; admissionNo: string | null };
  enrollment: { enrollmentId: string | null; academicYearId: string | null; termId: string | null; classroomId: string | null; sectionId: string | null; gradeId: string | null; stageId: string | null };
  id: string;
  summary: {
    missionsTotal: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  missions: HeroJourneyMission[];
  recentEvents: HeroJourneyActivity[];
};

export type HeroJourneyRewards = {
  student: { id: string; firstName: string | null; lastName: string | null; nameAr: string | null; code: string | null; admissionNo: string | null };
  totalHeroXp: number;
  badgesCount: number;
  summary: {
    completedMissions: number;
    xpGrantedMissions: number;
    badgeAwardedMissions: number;
  };
  badges: Array<{
    id: string;
    studentBadgeId: string;
    badgeId: string;
    missionId: string | null;
    progressId: string | null;
    earnedAt: string | null;
    badge: { slug: string; nameEn: string | null; nameAr: string | null; descriptionEn: string | null; descriptionAr: string | null; assetPath: string | null; fileId: string | null };
  }>;
  xpLedger: Array<{
    id: string;
    amount: number;
    reason: string;
    reasonAr: string | null;
    progressId: string | null;
    missionId: string | null;
    sourceType: string;
    sourceId: string | null;
    policyId: string | null;
    occurredAt: string | null;
    actorUserId: string | null;
  }>;
  missions: Array<{
    missionId: string;
    progressId: string | null;
    titleEn: string | null;
    titleAr: string | null;
    rewardXp: number;
    xpGranted: boolean;
    badgeRewardId: string | null;
    badgeAwarded: boolean;
    xpLedgerId: string | null;
    studentBadgeId: string | null;
    completedAt: string | null;
  }>;
  events: Array<{ id: string; type: string; missionId: string | null; progressId: string | null; studentId: string | null; enrollmentId: string | null; xpLedgerId: string | null; badgeId: string | null; occurredAt: string | null; actorUserId: string | null }>;
};
