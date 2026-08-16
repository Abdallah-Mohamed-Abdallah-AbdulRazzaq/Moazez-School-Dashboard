export type HeroJourneyMissionStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "archived";

export type HeroJourneyProgressStatus = "on_track" | "at_risk" | "inactive";

export interface HeroJourneyBadge {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  assetPath?: string;
  fileId?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface HeroJourneyChartDatum {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  color?: string;
}

export interface HeroJourneyTimeSeriesDatum {
  label: string;
  value: number;
  ts?: string;
}

export interface HeroJourneyStagePerformance {
  id: string;
  stageNameEn: string;
  stageNameAr: string;
  completionRate: number;
  activeStudents: number;
}

export interface HeroJourneyDropOffDatum {
  missionId: string;
  titleEn: string;
  titleAr: string;
  started: number;
  completed: number;
  dropOffRate: number;
}

export interface HeroJourneySummaryWidget {
  id: string;
  titleEn: string;
  titleAr: string;
  value: string;
  descriptionEn: string;
  descriptionAr: string;
  tone: "teal" | "sky" | "amber";
}

export interface HeroJourneyOverviewScope {
  academicYearId: string;
  yearId: string;
  termId: string;
  stageId: string | null;
  gradeId: string | null;
  sectionId: string | null;
  classroomId: string | null;
  studentId: string | null;
  subjectId: string | null;
}

export interface HeroJourneyOverviewMissions {
  total: number;
  draft: number;
  published: number;
  archived: number;
  withBadgeReward: number;
  withXpReward: number;
}

export interface HeroJourneyOverviewProgress {
  totalProgress: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface HeroJourneyOverviewObjectives {
  totalRequired: number;
  completedRequired: number;
  averageProgressPercent: number;
}

export interface HeroJourneyOverviewRewards {
  totalHeroXp: number;
  xpGrantedMissions: number;
  badgesAwarded: number;
  studentsWithBadges: number;
}

export interface HeroJourneyOverviewEvents {
  missionStarted: number;
  objectiveCompleted: number;
  missionCompleted: number;
  xpGranted: number;
  badgeAwarded: number;
}

export interface HeroJourneyOverviewTopStudent {
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    nameAr: string | null;
    code: string | null;
    admissionNo: string | null;
  };
  completedMissions: number;
  totalHeroXp: number;
  badgesCount: number;
  averageProgressPercent: number;
}

export interface HeroJourneyOverviewActivity {
  id: string;
  type: string;
  missionId: string | null;
  progressId: string | null;
  objectiveId: string | null;
  studentId: string | null;
  xpLedgerId: string | null;
  badgeId: string | null;
  occurredAt: string;
  actorUserId: string | null;
}

export interface HeroJourneyOverviewMetrics {
  scope: HeroJourneyOverviewScope;
  missions: HeroJourneyOverviewMissions;
  progress: HeroJourneyOverviewProgress;
  objectives: HeroJourneyOverviewObjectives;
  rewards: HeroJourneyOverviewRewards;
  events: HeroJourneyOverviewEvents;
  topStudents: HeroJourneyOverviewTopStudent[];
  recentActivity: HeroJourneyOverviewActivity[];
  enrolledStudents: number;
  activeStudentsThisWeek: number;
  missionCompletionRate: number;
  totalXpEarned: number;
  averageStreakDays: number;
  badgesEarnedThisMonth: number;
  stuckStudentsCount: number;
  averageProgressPercent: number;
  missionStatusBreakdown: HeroJourneyChartDatum[];
  xpTrend: HeroJourneyTimeSeriesDatum[];
  completionByStage: HeroJourneyStagePerformance[];
  streakDistribution: HeroJourneyChartDatum[];
  topMissionDropOff: HeroJourneyDropOffDatum[];
  summaryWidgets: HeroJourneySummaryWidget[];
}

export interface HeroJourneyMission {
  id: string;
  academicYearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  subjectId?: string;
  linkedAssessmentId?: string;
  linkedLessonRef?: string;
  titleEn: string;
  titleAr: string;
  briefEn?: string;
  briefAr?: string;
  stageNameEn: string;
  stageNameAr: string;
  requiredLevel: number;
  linkedLessonId: string;
  linkedLessonTitleEn: string;
  linkedLessonTitleAr: string;
  linkedQuizId: string;
  linkedQuizTitleEn: string;
  linkedQuizTitleAr: string;
  status: HeroJourneyMissionStatus;
  rewardXp: number;
  badgeRewardId?: string;
  badgeRewardSlug?: string;
  badgeRewardNameEn?: string;
  badgeRewardNameAr?: string;
  positionX?: number;
  positionY?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  objectives?: HeroJourneyMissionObjective[];
  studentsStarted: number;
  studentsCompleted: number;
  updatedAt: string;
}

export interface HeroJourneyMissionObjective {
  id: string;
  type?: string;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  linkedAssessmentId?: string;
  linkedLessonRef?: string;
  sortOrder?: number;
  isRequired?: boolean;
  isCompleted?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface HeroJourneyStudentProgress {
  id: string;
  studentName: string;
  stageNameEn: string;
  stageNameAr: string;
  gradeNameEn: string;
  gradeNameAr: string;
  sectionNameEn: string;
  sectionNameAr: string;
  currentLevel: number;
  currentMissionId: string;
  currentMissionTitleEn: string;
  currentMissionTitleAr: string;
  xpCurrent: number;
  xpTarget: number;
  rankTitleEn: string;
  rankTitleAr: string;
  badgeSlugs: string[];
  recentBadgeSlugs: string[];
  streakDays: number;
  lastActivityAt: string;
  progressStatus: HeroJourneyProgressStatus;
  progressPercent: number;
  completedMissionsCount: number;
  currentObjectives: HeroJourneyMissionObjective[];
  coachNoteEn: string;
  coachNoteAr: string;
}

export interface HeroJourneyMissionFilters {
  search?: string;
  status?: HeroJourneyMissionStatus | "all";
  stage?: string | "all";
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  stageId?: string;
  subjectId?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface HeroJourneyStudentProgressFilters {
  academicYearId?: string;
  yearId?: string;
  termId?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  grade?: string | "all";
  section?: string | "all";
  status?: HeroJourneyProgressStatus | "all";
}
