export type ExcuseType = "ABSENCE" | "LATE" | "EARLY_LEAVE";
export type ExcuseStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ExcuseScopeType = "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";

export interface AttachmentMeta {
  id: string;
  attachmentId?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ExcuseRequest {
  id: string;
  yearId: string;
  termId: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  scopeType?: ExcuseScopeType;
  scopeIds?: {
    stageId?: string;
    gradeId?: string;
    sectionId?: string;
    classroomId?: string;
  };
  hasScopeContext?: boolean;
  type: ExcuseType;
  dateFrom: string;
  dateTo: string;
  selectedPeriodIds?: string[]; // Stable period IDs from timetable
  periodIndexes?: number[]; // Legacy support - will be migrated to selectedPeriodIds
  minutesLate?: number; // Duration in minutes for LATE requests
  minutesEarlyLeave?: number; // Duration in minutes for EARLY_LEAVE requests
  reasonAr: string;
  reasonEn: string;
  attachments: AttachmentMeta[];
  attachmentCount?: number;
  status: ExcuseStatus;
  decisionNote?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdById?: string;
  decidedById?: string;
  createdAt: string;
  updatedAt: string;
  linkedSessionIds?: string[];
}

export interface ExcuseRequestFilters {
  dateFrom?: string;
  dateTo?: string;
  status: "ALL" | ExcuseStatus;
  type: "ALL" | ExcuseType;
  search: string;
  hasAttachment: "ALL" | "YES" | "NO";
}

export interface ExcusesKpis {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withAttachments: number;
}

export interface ExcuseValidationErrors {
  studentId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  selectedPeriodIds?: string;
  minutesLate?: string;
  minutesEarlyLeave?: string;
  reason?: string;
  attachments?: string;
  policy?: string;
}
