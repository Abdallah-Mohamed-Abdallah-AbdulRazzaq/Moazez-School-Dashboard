export type ReinforcementSource = "teacher" | "parent" | "system";

export type ReinforcementStatus =
  | "cancelled"
  | "in_progress"
  | "under_review"
  | "completed"
  | "not_completed";

export type ReinforcementProofType = "image" | "video" | "document" | "none";
export type ReinforcementRewardType = "moral" | "financial" | "xp" | "badge";
export type ReinforcementAssignmentScope =
  | "school"
  | "stage"
  | "grade"
  | "section"
  | "classroom"
  | "student";

export interface ReinforcementStage {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  proofType: ReinforcementProofType;
  isCompleted: boolean;
  isApproved: boolean;
  submittedAt?: string;
  proofUrl?: string;
}

export interface ReinforcementTaskTarget {
  scopeType: ReinforcementAssignmentScope;
  scopeId: string;
  nameAr: string;
  nameEn: string;
  stageId?: string;
  stageNameAr?: string;
  stageNameEn?: string;
  gradeId?: string;
  gradeNameAr?: string;
  gradeNameEn?: string;
  sectionId?: string;
  sectionNameAr?: string;
  sectionNameEn?: string;
  classroomId?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  audienceCount?: number;
}

export interface ReinforcementTaskTargetInput {
  scopeType: ReinforcementAssignmentScope;
  scopeId: string;
}

export interface CreateReinforcementStagePayload {
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  proofType: ReinforcementProofType;
}

export interface ReinforcementTask {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  studentId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  source: ReinforcementSource;
  status: ReinforcementStatus;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt: string;
  stages: ReinforcementStage[];
  targets: ReinforcementTaskTarget[];
  primaryTargetType: ReinforcementAssignmentScope;
  primaryTargetId: string;
  targetSummaryAr: string;
  targetSummaryEn: string;
  audienceCount: number;
}

export interface CreateReinforcementTaskPayload {
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  targets: ReinforcementTaskTargetInput[];
  stages: CreateReinforcementStagePayload[];
  source: ReinforcementSource;
  rewardType: ReinforcementRewardType;
  rewardValue: string;
  dueDate?: string;
  assignedById?: string;
  assignedByName?: string;
}

export interface ReinforcementScopeOption {
  value: string;
  scopeType: ReinforcementAssignmentScope;
  nameAr: string;
  nameEn: string;
  audienceCount: number;
  searchText?: string;
}

export interface ReinforcementFilterOptions {
  students: Array<{ studentId: string; studentName: string }>;
  classes: string[];
  scopeTargets: Record<ReinforcementAssignmentScope, ReinforcementScopeOption[]>;
}

export interface ReinforcementTaskFilters {
  search?: string;
  assignmentScope?: ReinforcementAssignmentScope | "all";
  targetId?: string;
  student?: string;
  className?: string;
  source?: ReinforcementSource | "all";
  status?: ReinforcementStatus | "all";
  rewardType?: ReinforcementRewardType | "all";
  dueDate?: string;
}

export interface ReinforcementOverviewKpis {
  inProgress: number;
  notCompleted: number;
  completedThisWeek: number;
  rewardedStudents: number;
  averageCompletionRate: number;
  totalRewardsIssued: number;
}

export interface ReinforcementChartDatum {
  id: string;
  label: string;
  value: number;
}

export interface ReinforcementTopPerformer {
  id: string;
  name: string;
  value: number;
}

export interface ReinforcementActivityItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timestamp: string;
  type: "reward" | "task" | "submission";
}

export interface ReinforcementQuickAction {
  id: string;
  titleAr: string;
  titleEn: string;
  href: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface ReinforcementOverview {
  kpis: ReinforcementOverviewKpis;
  tasksByStatus: ReinforcementChartDatum[];
  tasksBySource: ReinforcementChartDatum[];
  rewardsByType: ReinforcementChartDatum[];
  topClasses: ReinforcementTopPerformer[];
  topStudents: ReinforcementTopPerformer[];
  recentActivity: ReinforcementActivityItem[];
  quickActions: ReinforcementQuickAction[];
}
