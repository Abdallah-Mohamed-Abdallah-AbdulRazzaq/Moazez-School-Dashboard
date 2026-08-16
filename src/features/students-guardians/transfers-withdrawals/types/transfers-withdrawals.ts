// FILE: src/types/students/transfers-withdrawals.ts

export type TransferType = "internal" | "external";

export type WithdrawalReason =
  | "relocation"
  | "financial"
  | "academic"
  | "behavior"
  | "health"
  | "other";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "finance_clearance"
  | "behavior_review"
  | "approved"
  | "rejected"
  | "executed";

export type BehaviorBand = "low" | "medium" | "high";

export type Stage = "primary" | "preparatory" | "secondary";

export interface TransferApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentNameAr: string;
  stage: Stage;
  grade: string;
  section?: string;
  classroom?: string;
  type: TransferType;
  targetSection?: string;
  targetSectionId?: string;
  targetClassroom?: string;
  targetClassroomId?: string;
  targetClass?: string; // For internal transfers
  externalSchool?: string; // For external transfers
  reason: string;
  behaviorScore?: number;
  behaviorBand?: BehaviorBand;
  status: ApplicationStatus;
  requestDate: string;
  effectiveDate: string;
  notes?: string;
  attachments?: string[];
  createdBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface WithdrawalApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentNameAr: string;
  stage: Stage;
  grade: string;
  section?: string;
  classroom?: string;
  reason: WithdrawalReason;
  behaviorAvg?: number;
  behaviorBand?: BehaviorBand;
  attendancePercent?: number;
  financialClearance?: "pending" | "cleared" | "blocked";
  status: ApplicationStatus;
  requestDate: string;
  effectiveDate: string;
  notes?: string;
  attachments?: string[];
  createdBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface TransfersFilters {
  dateRange?: { start: string; end: string };
  stage?: Stage | "all";
  grade?: string;
  type?: TransferType | "all";
  status?: ApplicationStatus | "all";
  behaviorBand?: BehaviorBand | "all";
  searchQuery?: string;
}

export interface WithdrawalsFilters {
  dateRange?: { start: string; end: string };
  stage?: Stage | "all";
  grade?: string;
  reason?: WithdrawalReason | "all";
  status?: ApplicationStatus | "all";
  behaviorBand?: BehaviorBand | "all";
  financialClearance?: "pending" | "cleared" | "blocked" | "all";
  searchQuery?: string;
}
