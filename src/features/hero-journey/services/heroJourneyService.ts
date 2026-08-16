import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  buildReinforcementQueryString,
  unwrapReinforcementItemResponse,
  unwrapReinforcementListResponse,
} from "@/features/reinforcement/services/reinforcementApiUtils";
import { getHeroJourneyBadgeAssetPath } from "../utils/badgeAssetRegistry";
import {
  normalizeCreateHeroMissionRequest,
  normalizeUpdateHeroMissionRequest,
  type CreateHeroMissionCandidate,
  type HeroMissionUpdateContext,
  type UpdateHeroMissionCandidate,
} from "./heroJourneyMissionContract";
import type {
  HeroJourneyBadge,
  HeroJourneyChartDatum,
  HeroJourneyMission,
  HeroJourneyMissionFilters,
  HeroJourneyMissionObjective,
  HeroJourneyMissionStatus,
  HeroJourneyOverviewMetrics,
  HeroJourneyStudentProgress,
  HeroJourneyStudentProgressFilters,
} from "../types";

const HERO_ENDPOINT = "/reinforcement/hero";

export interface HeroJourneyBadgePayload {
  slug: string;
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  assetPath?: string;
  fileId?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface HeroJourneyBadgeCatalogParams {
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
}

export interface HeroJourneyOverviewParams {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const toMissionStatus = (value: unknown): HeroJourneyMissionStatus => {
  if (value === "published" || value === "archived" || value === "scheduled") {
    return value;
  }

  return "draft";
};

function chartDatum(
  id: string,
  labelEn: string,
  labelAr: string,
  value: unknown,
  color: string,
): HeroJourneyChartDatum {
  return {
    id,
    labelEn,
    labelAr,
    value: asNumber(value),
    color,
  };
}

function getBackendStudentName(student: unknown): string {
  if (!isRecord(student)) return "Unknown student";

  return (
    asString(student.name) ||
    [asString(student.firstName), asString(student.lastName)]
      .filter(Boolean)
      .join(" ") ||
    asString(student.id, "Unknown student")
  );
}

function mapBadge(rawBadge: unknown): HeroJourneyBadge {
  const badge = isRecord(rawBadge) ? rawBadge : {};
  const slug = asString(badge.slug, asString(badge.id, "badge"));

  return {
    id: asString(badge.id, slug),
    slug,
    nameEn: asString(badge.nameEn, slug),
    nameAr: asString(badge.nameAr, asString(badge.nameEn, slug)),
    descriptionEn: asString(badge.descriptionEn),
    descriptionAr: asString(badge.descriptionAr),
    assetPath: asString(badge.assetPath) || getHeroJourneyBadgeAssetPath(slug),
    fileId: asString(badge.fileId) || undefined,
    sortOrder:
      typeof badge.sortOrder === "number" ? badge.sortOrder : undefined,
    isActive: typeof badge.isActive === "boolean" ? badge.isActive : undefined,
  };
}

function mapMissionObjective(
  rawObjective: unknown,
  index: number,
): HeroJourneyMissionObjective {
  const objective = isRecord(rawObjective) ? rawObjective : {};
  const objectiveId = asString(
    objective.id,
    asString(objective.objectiveId, `objective-${index + 1}`),
  );

  return {
    id: objectiveId,
    type: asString(objective.type) || undefined,
    titleEn: asString(objective.titleEn) || undefined,
    titleAr: asString(objective.titleAr) || undefined,
    subtitleEn: asString(objective.subtitleEn) || undefined,
    subtitleAr: asString(objective.subtitleAr) || undefined,
    linkedAssessmentId: asString(objective.linkedAssessmentId) || undefined,
    linkedLessonRef: asString(objective.linkedLessonRef) || undefined,
    sortOrder:
      typeof objective.sortOrder === "number" ? objective.sortOrder : index + 1,
    isRequired:
      typeof objective.isRequired === "boolean"
        ? objective.isRequired
        : undefined,
    isCompleted:
      typeof objective.isCompleted === "boolean"
        ? objective.isCompleted
        : undefined,
    metadata: isRecord(objective.metadata) ? objective.metadata : null,
  };
}

function mapMission(
  rawMission: unknown,
  mapMission?: Record<string, unknown>,
): HeroJourneyMission {
  const mission = isRecord(rawMission) ? rawMission : {};
  const mapRow = isRecord(mapMission) ? mapMission : {};
  const metadata = isRecord(mission.metadata) ? mission.metadata : null;
  const academicScope = isRecord(metadata?.academicScope)
    ? metadata.academicScope
    : {};
  const badgeReward = isRecord(mission.badgeReward)
    ? mission.badgeReward
    : isRecord(mapRow.badgeReward)
      ? mapRow.badgeReward
      : undefined;
  const missionId = asString(mission.id, asString(mapRow.missionId));
  const linkedLesson = asString(
    mission.linkedLessonRef,
    asString(mission.linkedLessonId, asString(mapRow.briefEn)),
  );
  const linkedAssessment = asString(mission.linkedAssessmentId);
  const linkedLessonRecord = isRecord(mission.linkedLesson)
    ? mission.linkedLesson
    : undefined;
  const linkedAssessmentRecord = isRecord(mission.linkedAssessment)
    ? mission.linkedAssessment
    : isRecord(mission.linkedQuiz)
      ? mission.linkedQuiz
      : undefined;
  const linkedLessonTitleEn = asString(
    mission.linkedLessonTitleEn,
    asString(linkedLessonRecord?.titleEn, asString(linkedLessonRecord?.title)),
  );
  const linkedLessonTitleAr = asString(
    mission.linkedLessonTitleAr,
    asString(
      linkedLessonRecord?.titleAr,
      asString(linkedLessonRecord?.title, linkedLessonTitleEn),
    ),
  );
  const linkedAssessmentTitleEn = asString(
    mission.linkedAssessmentTitleEn,
    asString(
      mission.linkedQuizTitleEn,
      asString(
        linkedAssessmentRecord?.titleEn,
        asString(linkedAssessmentRecord?.title),
      ),
    ),
  );
  const linkedAssessmentTitleAr = asString(
    mission.linkedAssessmentTitleAr,
    asString(
      mission.linkedQuizTitleAr,
      asString(
        linkedAssessmentRecord?.titleAr,
        asString(linkedAssessmentRecord?.title, linkedAssessmentTitleEn),
      ),
    ),
  );

  return {
    id: missionId,
    titleEn: asString(mission.titleEn, asString(mapRow.titleEn, missionId)),
    titleAr: asString(
      mission.titleAr,
      asString(mapRow.titleAr, asString(mission.titleEn, missionId)),
    ),
    stageNameEn: asString(
      mission.stageNameEn,
      asString(mission.stageId, "All stages"),
    ),
    stageNameAr: asString(
      mission.stageNameAr,
      asString(mission.stageId, "كل المراحل"),
    ),
    requiredLevel: asNumber(
      mission.requiredLevel,
      asNumber(mapRow.requiredLevel, 1),
    ),
    linkedLessonId: linkedLesson,
    linkedLessonTitleEn:
      linkedLessonTitleEn || (linkedLesson ? "Linked lesson" : "Not linked"),
    linkedLessonTitleAr:
      linkedLessonTitleAr || (linkedLesson ? "درس مرتبط" : "غير مرتبط"),
    linkedQuizId: linkedAssessment,
    linkedQuizTitleEn:
      linkedAssessmentTitleEn ||
      (linkedAssessment ? "Linked assessment" : "No assessment linked"),
    linkedQuizTitleAr:
      linkedAssessmentTitleAr ||
      (linkedAssessment ? "تقييم مرتبط" : "لا يوجد تقييم مرتبط"),
    linkedAssessmentId: linkedAssessment || undefined,
    linkedLessonRef: linkedLesson || undefined,
    status: toMissionStatus(mission.status ?? mapRow.status),
    rewardXp: asNumber(mission.rewardXp, asNumber(mapRow.rewardXp)),
    badgeRewardSlug: badgeReward
      ? asString(badgeReward.slug)
      : asString(mission.badgeRewardSlug) || undefined,
    badgeRewardId: badgeReward
      ? asString(badgeReward.id)
      : asString(mission.badgeRewardId) || undefined,
    badgeRewardNameEn: badgeReward
      ? asString(badgeReward.nameEn, asString(badgeReward.slug))
      : undefined,
    badgeRewardNameAr: badgeReward
      ? asString(
          badgeReward.nameAr,
          asString(badgeReward.nameEn, asString(badgeReward.slug)),
        )
      : undefined,
    termId: asString(mission.termId),
    stageId: asString(mission.stageId),
    gradeId:
      asString(mission.gradeId, asString(academicScope.gradeId)) || undefined,
    sectionId:
      asString(mission.sectionId, asString(academicScope.sectionId)) ||
      undefined,
    classroomId:
      asString(mission.classroomId, asString(academicScope.classroomId)) ||
      undefined,
    subjectId: asString(mission.subjectId),
    academicYearId: asString(mission.academicYearId),
    briefEn: asString(mission.briefEn),
    briefAr: asString(mission.briefAr),
    positionX:
      typeof mission.positionX === "number" ? mission.positionX : undefined,
    positionY:
      typeof mission.positionY === "number" ? mission.positionY : undefined,
    sortOrder:
      typeof mission.sortOrder === "number" ? mission.sortOrder : undefined,
    metadata,
    objectives: asArray(mission.objectives).map(mapMissionObjective),
    studentsStarted: asNumber(mapRow.startedCount),
    studentsCompleted: asNumber(mapRow.completedCount),
    updatedAt: asString(mission.updatedAt, new Date(0).toISOString()),
  };
}

// Kept as a legacy mapper reference while the dashboard uses mapDashboardOverview.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapOverview(rawOverview: unknown) {
  const overview =
    unwrapReinforcementItemResponse<Record<string, unknown>>(rawOverview);
  const missions = isRecord(overview.missions) ? overview.missions : {};
  const progress = isRecord(overview.progress) ? overview.progress : {};
  const objectives = isRecord(overview.objectives) ? overview.objectives : {};
  const rewards = isRecord(overview.rewards) ? overview.rewards : {};
  const topStudents = asArray<Record<string, unknown>>(overview.topStudents);
  const missionTotal = asNumber(missions.total);
  const completed = asNumber(progress.completed);
  const inProgress = asNumber(progress.inProgress);
  const notStarted = asNumber(progress.notStarted);
  const cancelled = asNumber(progress.cancelled);
  const activeStudents = topStudents.filter(
    (student) => asNumber(student.averageProgressPercent) > 0,
  ).length;
  const stuckStudents = topStudents.filter(
    (student) => asNumber(student.averageProgressPercent) < 40,
  ).length;

  return {
    enrolledStudents: topStudents.length,
    activeStudentsThisWeek: activeStudents,
    missionCompletionRate: asNumber(progress.completionRate),
    totalXpEarned: asNumber(rewards.totalHeroXp),
    averageStreakDays: 0,
    badgesEarnedThisMonth: asNumber(rewards.badgesAwarded),
    stuckStudentsCount: stuckStudents,
    averageProgressPercent: asNumber(objectives.averageProgressPercent),
    missionStatusBreakdown: [
      chartDatum(
        "published",
        "Published",
        "منشورة",
        missions.published,
        "#10b981",
      ),
      chartDatum("draft", "Draft", "مسودة", missions.draft, "#94a3b8"),
      chartDatum(
        "archived",
        "Archived",
        "مؤرشفة",
        missions.archived,
        "#f59e0b",
      ),
    ],
    xpTrend: [],
    completionByStage: [
      {
        id: "all",
        stageNameEn: "All stages",
        stageNameAr: "كل المراحل",
        completionRate: asNumber(progress.completionRate),
        activeStudents,
      },
    ],
    streakDistribution: [
      chartDatum(
        "not-started",
        "Not started",
        "لم يبدأ",
        notStarted,
        "#94a3b8",
      ),
      chartDatum(
        "in-progress",
        "In progress",
        "قيد التنفيذ",
        inProgress,
        "#38bdf8",
      ),
      chartDatum("completed", "Completed", "مكتملة", completed, "#14b8a6"),
      chartDatum("cancelled", "Cancelled", "ملغاة", cancelled, "#f59e0b"),
    ],
    topMissionDropOff: [],
    summaryWidgets: [
      {
        id: "near-level-up",
        titleEn: "Near Level-Up",
        titleAr: "قريبون من المستوى التالي",
        value: String(
          topStudents.filter(
            (student) => asNumber(student.averageProgressPercent) >= 85,
          ).length,
        ),
        descriptionEn: "Students above 85% average Hero progress.",
        descriptionAr: "طلاب تجاوزوا 85% من متوسط تقدم رحلة البطل.",
        tone: "teal",
      },
      {
        id: "attention-queue",
        titleEn: "Attention Queue",
        titleAr: "قائمة التدخل",
        value: String(stuckStudents),
        descriptionEn: "Students with low average Hero progress.",
        descriptionAr: "طلاب لديهم متوسط تقدم منخفض في رحلة البطل.",
        tone: "amber",
      },
      {
        id: "best-stage",
        titleEn: "Total Missions",
        titleAr: "إجمالي المهام",
        value: String(missionTotal),
        descriptionEn: "Current Hero Journey mission catalog size.",
        descriptionAr: "حجم كتالوج مهام رحلة البطل الحالي.",
        tone: "sky",
      },
    ],
  };
}

function mapDashboardOverview(rawOverview: unknown): HeroJourneyOverviewMetrics {
  const overview =
    unwrapReinforcementItemResponse<Record<string, unknown>>(rawOverview);
  const scope = isRecord(overview.scope) ? overview.scope : {};
  const missions = isRecord(overview.missions) ? overview.missions : {};
  const progress = isRecord(overview.progress) ? overview.progress : {};
  const objectives = isRecord(overview.objectives) ? overview.objectives : {};
  const rewards = isRecord(overview.rewards) ? overview.rewards : {};
  const events = isRecord(overview.events) ? overview.events : {};
  const rawTopStudents = asArray<Record<string, unknown>>(overview.topStudents);
  const rawRecentActivity = asArray<Record<string, unknown>>(
    overview.recentActivity,
  );
  const missionTotal = asNumber(missions.total);
  const completed = asNumber(progress.completed);
  const inProgress = asNumber(progress.inProgress);
  const notStarted = asNumber(progress.notStarted);
  const cancelled = asNumber(progress.cancelled);
  const activeStudents = rawTopStudents.filter(
    (student) => asNumber(student.averageProgressPercent) > 0,
  ).length;
  const stuckStudents = rawTopStudents.filter(
    (student) => asNumber(student.averageProgressPercent) < 40,
  ).length;
  const mappedMissions = {
    total: missionTotal,
    draft: asNumber(missions.draft),
    published: asNumber(missions.published),
    archived: asNumber(missions.archived),
    withBadgeReward: asNumber(missions.withBadgeReward),
    withXpReward: asNumber(missions.withXpReward),
  };
  const mappedProgress = {
    totalProgress: asNumber(progress.totalProgress),
    notStarted,
    inProgress,
    completed,
    cancelled,
    completionRate: asNumber(progress.completionRate),
  };
  const mappedObjectives = {
    totalRequired: asNumber(objectives.totalRequired),
    completedRequired: asNumber(objectives.completedRequired),
    averageProgressPercent: asNumber(objectives.averageProgressPercent),
  };
  const mappedRewards = {
    totalHeroXp: asNumber(rewards.totalHeroXp),
    xpGrantedMissions: asNumber(rewards.xpGrantedMissions),
    badgesAwarded: asNumber(rewards.badgesAwarded),
    studentsWithBadges: asNumber(rewards.studentsWithBadges),
  };
  const topStudents = rawTopStudents.map((row) => {
    const student = isRecord(row.student) ? row.student : {};
    const studentId = asString(row.studentId, asString(student.id));

    return {
      studentId,
      student: {
        id: asString(student.id, studentId),
        firstName: asString(student.firstName),
        lastName: asString(student.lastName),
        name: getBackendStudentName(student),
        nameAr: asNullableString(student.nameAr),
        code: asNullableString(student.code),
        admissionNo: asNullableString(student.admissionNo),
      },
      completedMissions: asNumber(row.completedMissions),
      totalHeroXp: asNumber(row.totalHeroXp),
      badgesCount: asNumber(row.badgesCount),
      averageProgressPercent: asNumber(row.averageProgressPercent),
    };
  });

  return {
    scope: {
      academicYearId: asString(scope.academicYearId),
      yearId: asString(scope.yearId),
      termId: asString(scope.termId),
      stageId: asNullableString(scope.stageId),
      gradeId: asNullableString(scope.gradeId),
      sectionId: asNullableString(scope.sectionId),
      classroomId: asNullableString(scope.classroomId),
      studentId: asNullableString(scope.studentId),
      subjectId: asNullableString(scope.subjectId),
    },
    missions: mappedMissions,
    progress: mappedProgress,
    objectives: mappedObjectives,
    rewards: mappedRewards,
    events: {
      missionStarted: asNumber(events.missionStarted),
      objectiveCompleted: asNumber(events.objectiveCompleted),
      missionCompleted: asNumber(events.missionCompleted),
      xpGranted: asNumber(events.xpGranted),
      badgeAwarded: asNumber(events.badgeAwarded),
    },
    topStudents,
    recentActivity: rawRecentActivity.map((activity, index) => ({
      id: asString(activity.id, `activity-${index}`),
      type: asString(activity.type, "unknown"),
      missionId: asNullableString(activity.missionId),
      progressId: asNullableString(activity.progressId),
      objectiveId: asNullableString(activity.objectiveId),
      studentId: asNullableString(activity.studentId),
      xpLedgerId: asNullableString(activity.xpLedgerId),
      badgeId: asNullableString(activity.badgeId),
      occurredAt: asString(activity.occurredAt, new Date(0).toISOString()),
      actorUserId: asNullableString(activity.actorUserId),
    })),
    enrolledStudents: rawTopStudents.length,
    activeStudentsThisWeek: activeStudents,
    missionCompletionRate: mappedProgress.completionRate,
    totalXpEarned: mappedRewards.totalHeroXp,
    averageStreakDays: 0,
    badgesEarnedThisMonth: mappedRewards.badgesAwarded,
    stuckStudentsCount: stuckStudents,
    averageProgressPercent: mappedObjectives.averageProgressPercent,
    missionStatusBreakdown: [
      chartDatum(
        "published",
        "Published",
        "Published",
        mappedMissions.published,
        "#10b981",
      ),
      chartDatum("draft", "Draft", "Draft", mappedMissions.draft, "#94a3b8"),
      chartDatum(
        "archived",
        "Archived",
        "Archived",
        mappedMissions.archived,
        "#f59e0b",
      ),
    ],
    xpTrend: [],
    completionByStage: [
      {
        id: "all",
        stageNameEn: "All stages",
        stageNameAr: "All stages",
        completionRate: mappedProgress.completionRate,
        activeStudents,
      },
    ],
    streakDistribution: [
      chartDatum("not-started", "Not started", "Not started", notStarted, "#94a3b8"),
      chartDatum("in-progress", "In progress", "In progress", inProgress, "#38bdf8"),
      chartDatum("completed", "Completed", "Completed", completed, "#14b8a6"),
      chartDatum("cancelled", "Cancelled", "Cancelled", cancelled, "#f59e0b"),
    ],
    topMissionDropOff: [],
    summaryWidgets: [
      {
        id: "near-level-up",
        titleEn: "Near Level-Up",
        titleAr: "Near Level-Up",
        value: String(
          rawTopStudents.filter(
            (student) => asNumber(student.averageProgressPercent) >= 85,
          ).length,
        ),
        descriptionEn: "Students above 85% average Hero progress.",
        descriptionAr: "Students above 85% average Hero progress.",
        tone: "teal",
      },
      {
        id: "attention-queue",
        titleEn: "Attention Queue",
        titleAr: "Attention Queue",
        value: String(stuckStudents),
        descriptionEn: "Students with low average Hero progress.",
        descriptionAr: "Students with low average Hero progress.",
        tone: "amber",
      },
      {
        id: "best-stage",
        titleEn: "Total Missions",
        titleAr: "Total Missions",
        value: String(missionTotal),
        descriptionEn: "Current Hero Journey mission catalog size.",
        descriptionAr: "Current Hero Journey mission catalog size.",
        tone: "sky",
      },
    ],
  };
}

function mapStudentProgress(rawStudent: unknown): HeroJourneyStudentProgress {
  const row = isRecord(rawStudent) ? rawStudent : {};
  const student = isRecord(row.student) ? row.student : {};
  const studentId = asString(row.studentId, asString(student.id));
  const progressPercent = asNumber(row.averageProgressPercent);
  const totalXp = asNumber(row.totalHeroXp);

  return {
    id: studentId,
    studentName: getBackendStudentName(student),
    stageNameEn: "All stages",
    stageNameAr: "كل المراحل",
    gradeNameEn: "All grades",
    gradeNameAr: "كل الصفوف",
    sectionNameEn: "All sections",
    sectionNameAr: "كل الشعب",
    currentLevel: 1,
    currentMissionId: "",
    currentMissionTitleEn: "Hero Journey progress",
    currentMissionTitleAr: "تقدم رحلة البطل",
    xpCurrent: totalXp,
    xpTarget: Math.max(totalXp, 1),
    rankTitleEn: "Hero learner",
    rankTitleAr: "متعلم بطل",
    badgeSlugs: [],
    recentBadgeSlugs: [],
    streakDays: 0,
    lastActivityAt: new Date(0).toISOString(),
    progressStatus: progressPercent >= 40 ? "on_track" : "at_risk",
    progressPercent,
    completedMissionsCount: asNumber(row.completedMissions),
    currentObjectives: [
      {
        id: "average-progress",
        titleEn: "Average mission progress",
        titleAr: "متوسط تقدم المهام",
        isCompleted: progressPercent >= 100,
      },
    ],
    coachNoteEn:
      "This dashboard row is derived from backend Hero overview top-student metrics.",
    coachNoteAr: "هذا الصف مشتق من مقاييس أفضل الطلاب في ملخص رحلة البطل.",
  };
}

function filterStudentRows(
  students: HeroJourneyStudentProgress[],
  filters: HeroJourneyStudentProgressFilters,
) {
  const search = filters.search?.trim().toLowerCase();

  return students.filter((student) => {
    if (search && !student.studentName.toLowerCase().includes(search)) {
      return false;
    }

    if (
      filters.status &&
      filters.status !== "all" &&
      student.progressStatus !== filters.status
    ) {
      return false;
    }

    return true;
  });
}

async function getHeroJourneyMapRows(
  filters: Pick<
    HeroJourneyMissionFilters,
    | "academicYearId"
    | "yearId"
    | "termId"
    | "stageId"
    | "subjectId"
    | "includeArchived"
  > = {},
): Promise<Map<string, Record<string, unknown>>> {
  const mapQuery = buildReinforcementQueryString({
    academicYearId: filters.academicYearId,
    yearId: filters.yearId,
    termId: filters.termId,
    stageId: filters.stageId,
    subjectId: filters.subjectId,
    includeDraft: true,
    includeArchived: filters.includeArchived ?? true,
  });
  const response = await apiGet<unknown>(`${HERO_ENDPOINT}/map${mapQuery}`);
  const map =
    unwrapReinforcementItemResponse<Record<string, unknown>>(response);

  return new Map(
    asArray<Record<string, unknown>>(map.missions).map((mission) => [
      asString(mission.missionId),
      mission,
    ]),
  );
}

export async function getHeroJourneyOverview(
  params?: HeroJourneyOverviewParams,
): Promise<HeroJourneyOverviewMetrics> {
  const query = buildReinforcementQueryString(
    params ? { ...params } : undefined,
  );
  const response = await apiGet<unknown>(`${HERO_ENDPOINT}/overview${query}`);
  return mapDashboardOverview(response);
}

export async function getHeroJourneyBadgeCatalog(
  params: HeroJourneyBadgeCatalogParams = { isActive: true },
): Promise<HeroJourneyBadge[]> {
  const query = buildReinforcementQueryString({ ...params });
  const response = await apiGet<unknown>(`${HERO_ENDPOINT}/badges${query}`);
  return unwrapReinforcementListResponse<unknown>(response).items.map(mapBadge);
}

export async function getHeroJourneyBadge(
  badgeId: string,
): Promise<HeroJourneyBadge> {
  const response = await apiGet<unknown>(`${HERO_ENDPOINT}/badges/${badgeId}`);
  return mapBadge(unwrapReinforcementItemResponse(response));
}

export async function createHeroJourneyBadge(
  payload: HeroJourneyBadgePayload,
): Promise<HeroJourneyBadge> {
  const response = await apiPost<unknown>(`${HERO_ENDPOINT}/badges`, payload);
  return mapBadge(unwrapReinforcementItemResponse(response));
}

export async function updateHeroJourneyBadge(
  badgeId: string,
  payload: Partial<HeroJourneyBadgePayload>,
): Promise<HeroJourneyBadge> {
  const response = await apiPatch<unknown>(
    `${HERO_ENDPOINT}/badges/${badgeId}`,
    payload,
  );
  return mapBadge(unwrapReinforcementItemResponse(response));
}

export async function deleteHeroJourneyBadge(badgeId: string): Promise<void> {
  await apiDelete<unknown>(`${HERO_ENDPOINT}/badges/${badgeId}`);
}

export async function getHeroJourneyMissions(
  filters: HeroJourneyMissionFilters = {},
): Promise<HeroJourneyMission[]> {
  const query = buildReinforcementQueryString({
    academicYearId: filters.academicYearId,
    yearId: filters.yearId,
    termId: filters.termId,
    stageId: filters.stageId,
    subjectId: filters.subjectId,
    search: filters.search,
    status:
      filters.status && filters.status !== "scheduled"
        ? filters.status
        : undefined,
    includeArchived:
      filters.includeArchived ??
      (filters.status === "archived" ? true : undefined),
    includeDeleted: filters.includeDeleted,
    limit: filters.limit,
    offset: filters.offset,
  });
  const [missionsResponse, mapRows] = await Promise.all([
    apiGet<unknown>(`${HERO_ENDPOINT}/missions${query}`),
    getHeroJourneyMapRows(filters),
  ]);

  return unwrapReinforcementListResponse<unknown>(missionsResponse).items.map(
    (mission) => {
      const id = isRecord(mission) ? asString(mission.id) : "";
      return mapMission(mission, mapRows.get(id));
    },
  );
}

export async function getHeroJourneyMission(
  missionId: string,
): Promise<HeroJourneyMission> {
  const response = await apiGet<unknown>(
    `${HERO_ENDPOINT}/missions/${missionId}`,
  );
  return mapMission(unwrapReinforcementItemResponse(response));
}

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

export async function deleteHeroJourneyMission(
  missionId: string,
): Promise<void> {
  await apiDelete<unknown>(`${HERO_ENDPOINT}/missions/${missionId}`);
}

export async function publishHeroJourneyMission(
  missionId: string,
): Promise<HeroJourneyMission> {
  const response = await apiPost<unknown>(
    `${HERO_ENDPOINT}/missions/${missionId}/publish`,
    {},
  );
  return mapMission(unwrapReinforcementItemResponse(response));
}

export async function archiveHeroJourneyMission(
  missionId: string,
  reason = "Dashboard archive",
): Promise<HeroJourneyMission> {
  const response = await apiPost<unknown>(
    `${HERO_ENDPOINT}/missions/${missionId}/archive`,
    { reason },
  );
  return mapMission(unwrapReinforcementItemResponse(response));
}

export async function getHeroJourneyStudentProgress(
  filters: HeroJourneyStudentProgressFilters = {},
): Promise<HeroJourneyStudentProgress[]> {
  const query = buildReinforcementQueryString({
    academicYearId: filters.academicYearId,
    yearId: filters.yearId,
    termId: filters.termId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    stageId: filters.stageId,
    gradeId: filters.gradeId,
    sectionId: filters.sectionId,
    classroomId: filters.classroomId,
    studentId: filters.studentId,
  });
  const response = await apiGet<unknown>(`${HERO_ENDPOINT}/overview${query}`);
  const overview =
    unwrapReinforcementItemResponse<Record<string, unknown>>(response);
  const students = asArray(overview.topStudents).map(mapStudentProgress);

  return filterStudentRows(students, filters);
}

export async function toggleHeroJourneyMissionPublishState(
  missionId: string,
): Promise<HeroJourneyMission | null> {
  const current = unwrapReinforcementItemResponse<Record<string, unknown>>(
    await apiGet<unknown>(`${HERO_ENDPOINT}/missions/${missionId}`),
  );
  const currentStatus = toMissionStatus(current.status);

  if (currentStatus === "archived") {
    return null;
  }

  return currentStatus === "published"
    ? archiveHeroJourneyMission(missionId, "Dashboard toggle")
    : publishHeroJourneyMission(missionId);
}
