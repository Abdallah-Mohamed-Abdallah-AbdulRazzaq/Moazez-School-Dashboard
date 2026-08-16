export type AttendanceScopeType =
  | "SCHOOL"
  | "STAGE"
  | "GRADE"
  | "SECTION"
  | "CLASSROOM";
export type AttendanceMode = "DAILY" | "PERIOD";
export type DailyComputationStrategy = "MANUAL" | "DERIVED_FROM_PERIODS";

export interface AttendancePolicy {
  id: string;
  yearId: string;
  termId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  notes: string | null;
  scopeType: AttendanceScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  mode: AttendanceMode;
  dailyComputationStrategy?: DailyComputationStrategy; // Only for DAILY mode
  selectedPeriodIds?: string[]; // For PERIOD mode or DAILY with DERIVED strategy
  lateThresholdMinutes: number | null;
  earlyLeaveThresholdMinutes: number | null;
  autoAbsentAfterMinutes: number | null; // For DAILY mode
  absentIfMissedPeriodsCount: number | null; // For PERIOD mode
  allowExcuses: boolean;
  requireExcuseReason: boolean;
  requireAttachmentForExcuse: boolean;
  notifyTeachers: boolean;
  notifyStudents: boolean;
  notifyGuardians: boolean;
  notifyOnAbsent: boolean;
  notifyOnLate: boolean;
  notifyOnEarlyLeave: boolean;
  effectiveStartDate: string | null; // YYYY-MM-DD, null means unbounded
  effectiveEndDate: string | null; // YYYY-MM-DD, null means unbounded
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PolicyFormData = Omit<
  AttendancePolicy,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "descriptionAr"
  | "descriptionEn"
  | "notes"
  | "lateThresholdMinutes"
  | "earlyLeaveThresholdMinutes"
  | "autoAbsentAfterMinutes"
  | "absentIfMissedPeriodsCount"
  | "effectiveStartDate"
  | "effectiveEndDate"
> & {
  descriptionAr?: string;
  descriptionEn?: string;
  notes?: string;
  lateThresholdMinutes: number | null;
  earlyLeaveThresholdMinutes: number | null;
  autoAbsentAfterMinutes?: number | null;
  absentIfMissedPeriodsCount?: number | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
};

export interface PolicyConflict {
  policyId: string;
  conflictingPolicyId: string;
  reason: string;
}

export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  conflicts: PolicyConflict[];
}
