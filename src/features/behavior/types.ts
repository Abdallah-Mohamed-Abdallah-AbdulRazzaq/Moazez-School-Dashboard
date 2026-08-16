// ─── Primitive enums (lowercase, matching API values) ──────────────────────
export type BehaviorType = "positive" | "negative";
export type BehaviorStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";
export type BehaviorSeverity = "low" | "medium" | "high" | "critical";

// ─── Scope filter types (self-contained, no attendance dependency) ──────────
export type BehaviorScopeType =
  | "SCHOOL"
  | "STAGE"
  | "GRADE"
  | "SECTION"
  | "CLASSROOM";

export type BehaviorScopeIds = {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
};

export interface BehaviorFilters {
  scopeType: BehaviorScopeType;
  scopeIds: BehaviorScopeIds;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  type?: BehaviorType;
  status?: BehaviorStatus;
}

// ─── Category ──────────────────────────────────────────────────────────────
export interface BehaviorCategory {
  id: string;
  code: string;
  nameEn: string | null;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorCategoryCreatePayload {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: BehaviorType;
  defaultSeverity: BehaviorSeverity;
  defaultPoints: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BehaviorCategoryUpdatePayload {
  code?: string;
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: BehaviorType;
  defaultSeverity?: BehaviorSeverity;
  defaultPoints?: number;
  isActive?: boolean;
  sortOrder?: number;
}

/** POST /behavior/categories → response */
export interface BehaviorCategoryCreateResponse {
  id: string;
  type: BehaviorType;
  defaultPoints: number;
}

/** PATCH /behavior/categories/:id → response */
export interface BehaviorCategoryUpdateResponse {
  id: string;
  sortOrder?: number;
}

export interface BehaviorCategoryListFilters {
  type?: BehaviorType;
  severity?: BehaviorSeverity;
  isActive?: boolean;
  search?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

/** GET /behavior/categories → items shape */
export interface BehaviorCategoryListResponse {
  items: BehaviorCategory[];
  total?: number;
}

export interface BehaviorTerm {
  id: string;
  academicYearId: string;
  nameEn: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BehaviorEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  termId: string;
  classroomId: string;
  status: string;
  classroom?: {
    id: string;
    nameEn: string;
    nameAr: string;
    section?: {
      id: string;
      nameEn: string;
      nameAr: string;
      grade?: {
        id: string;
        nameEn: string;
        nameAr: string;
      };
    };
  };
}

// ─── Record ────────────────────────────────────────────────────────────────
export interface BehaviorRecord {
  id: string;
  academicYearId?: string;
  termId: string | null;
  studentId: string;
  enrollmentId: string | null;
  categoryId: string | null;
  categoryName?: string;
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  type?: BehaviorType;
  status: BehaviorStatus;
  severity?: BehaviorSeverity;
  points: number;
  occurredAt: string;
  reviewNoteEn?: string;
  submittedAt?: string;
  approvedAt?: string;
  reviewedAt?: string;
  cancelledAt?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    status: string;
  };
  category: BehaviorCategory | null;
  academicYear?: {
    id: string;
    nameEn: string;
    nameAr: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  term: BehaviorTerm | null;
  enrollment: BehaviorEnrollment | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    userType: string;
  };
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    userType: string;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    userType: string;
  };
  cancelledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    userType: string;
  } | null;
  reviewNoteAr?: string | null;
  cancellationReasonEn?: string | null;
  cancellationReasonAr?: string | null;
}

export interface BehaviorRecordCreatePayload {
  academicYearId: string;
  termId?: string;
  studentId: string;
  enrollmentId?: string;
  categoryId?: string;
  type?: BehaviorType;
  severity?: BehaviorSeverity;
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  points?: number;
  occurredAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface BehaviorRecordUpdatePayload {
  categoryId?: string;
  type?: BehaviorType;
  titleEn?: string;
  titleAr?: string;
  noteEn?: string;
  noteAr?: string;
  points?: number;
  severity?: BehaviorSeverity;
  occurredAt?: string;
  metadata?: Record<string, unknown> | null;
}

/** POST /behavior/records → response */
export interface BehaviorRecordCreateResponse {
  id: string;
  status: BehaviorStatus;
  type: BehaviorType;
  points: number;
}

/** POST /behavior/records/:id/submit → response */
export interface BehaviorSubmitResponse {
  id: string;
  status: BehaviorStatus;
  submittedAt: string;
}

export interface BehaviorRecordApprovePayload {
  reviewNoteEn?: string;
  pointsOverride?: number;
}

/** POST /behavior/records/:id/approve → response */
export interface BehaviorApproveResponse {
  record: {
    id: string;
    status: BehaviorStatus;
    points: number;
  };
}

export interface BehaviorRecordRejectPayload {
  reviewNoteEn?: string;
}

/** POST /behavior/records/:id/reject → response */
export interface BehaviorRecordListFilters {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  enrollmentId?: string;
  categoryId?: string;
  status?: BehaviorStatus;
  type?: BehaviorType;
  severity?: BehaviorSeverity;
  dateFrom?: string;
  dateTo?: string;
  occurredFrom?: string;
  occurredTo?: string;
  createdById?: string;
  includeDeleted?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BehaviorRecordSummary {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  cancelled: number;
  positive: number;
  negative: number;
}

/** GET /behavior/records → items shape */
export interface BehaviorRecordListResponse {
  items: BehaviorRecord[];
  total?: number;
  summary?: BehaviorRecordSummary;
}

// ─── Review Queue ──────────────────────────────────────────────────────────
export interface BehaviorReviewQueueItem {
  id: string;
  studentId: string;
  categoryId: string | null;
  type: BehaviorType;
  severity: BehaviorSeverity;
  status: Exclude<BehaviorStatus, "draft">;
  points: number;
  occurredAt: string;
  submittedAt: string | null;
  summaries: {
    student: { id: string; displayName: string } | null;
    category: {
      id: string;
      nameEn: string | null;
      nameAr: string | null;
    } | null;
  };
}

/** Full review presenter returned by review actions and review-item lookup. */
export interface BehaviorReviewRecord extends Omit<BehaviorReviewQueueItem, "summaries"> {
  academicYearId: string;
  termId: string | null;
  enrollmentId: string | null;
  titleEn: string | null;
  titleAr: string | null;
  noteEn: string | null;
  noteAr: string | null;
  createdById: string;
  submittedById: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNoteEn: string | null;
  reviewNoteAr: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  summaries: BehaviorReviewQueueItem["summaries"] & {
    enrollment: Record<string, unknown> | null;
    academicYear: Record<string, unknown> | null;
    term: Record<string, unknown> | null;
    createdBy: Record<string, unknown> | null;
    submittedBy: Record<string, unknown> | null;
    reviewedBy: Record<string, unknown> | null;
  };
  behaviorPointLedgerEntries: Array<Record<string, unknown>>;
}

export interface BehaviorReviewQueueFilters {
  academicYearId?: string;
  termId?: string;
  studentId?: string;
  enrollmentId?: string;
  categoryId?: string;
  type?: BehaviorType;
  severity?: BehaviorSeverity;
  status?: BehaviorStatus;
  dateFrom?: string;
  dateTo?: string;
  occurredFrom?: string;
  occurredTo?: string;
  submittedFrom?: string;
  submittedTo?: string;
  createdById?: string;
  includeReviewed?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/** GET /behavior/review-queue → items shape */
export interface BehaviorReviewQueueResponse {
  items: BehaviorReviewQueueItem[];
  total?: number;
}

// ─── Dashboard / Overview ──────────────────────────────────────────────────
export interface BehaviorOverviewFilters {
  academicYearId?: string;
  termId?: string;
  classroomId?: string;
  studentId?: string;
  type?: BehaviorType;
  severity?: BehaviorSeverity;
  status?: BehaviorStatus;
  dateFrom?: string;
  dateTo?: string;
  occurredFrom?: string;
  occurredTo?: string;
  includeRecentActivity?: boolean;
  includeTopCategories?: boolean;
}

/** GET /behavior/overview → response */
export interface BehaviorOverviewResponse {
  scope: {
    academicYearId: string;
    termId: string;
    studentId: string | null;
    classroomId: string | null;
    occurredFrom: string | null;
    occurredTo: string | null;
  };
  records: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
    cancelled: number;
    positive: number;
    negative: number;
  };
  severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  review: {
    pendingReview: number;
    reviewed: number;
    approvalRate: number;
    rejectionRate: number;
  };
  points: {
    totalPoints: number;
    positivePoints: number;
    negativePoints: number;
    awardEntries: number;
    penaltyEntries: number;
    studentsWithPoints: number;
    averagePointsPerStudent: number;
  };
  categories: {
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    topCategories: BehaviorOverviewTopCategory[];
  };
  recentActivity: BehaviorOverviewRecentItem[];
  topStudents: BehaviorOverviewTopStudent[];
}

export interface BehaviorOverviewTopCategory {
  categoryId: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: BehaviorType;
  totalRecords: number;
  approvedRecords: number;
  totalPoints: number;
}

export interface BehaviorOverviewRecentItem {
  id: string;
  status: BehaviorStatus;
  type: BehaviorType;
  severity: BehaviorSeverity;
  studentId: string;
  categoryId: string | null;
  points: number;
  occurredAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  cancelledAt: string | null;
}

export interface BehaviorOverviewTopStudent {
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    nameAr: string | null;
    code: string | null;
    admissionNo: string | null;
  };
  totalPoints: number;
  positivePoints: number;
  negativePoints: number;
}

export interface BehaviorStudentSummaryFilters {
  academicYearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  occurredFrom?: string;
  occurredTo?: string;
  includeTimeline?: boolean;
  includeCategoryBreakdown?: boolean;
  includeLedger?: boolean;
}

/** GET /behavior/students/:studentId/summary → response */
export interface BehaviorStudentSummaryResponse {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    nameAr: string | null;
    code: string | null;
    admissionNo: string | null;
  };
  scope: {
    academicYearId: string | null;
    termId: string | null;
    studentId: string;
    classroomId: string | null;
    occurredFrom: string | null;
    occurredTo: string | null;
  };
  records: BehaviorRecordSummary;
  severity: Record<BehaviorSeverity, number>;
  points: {
    totalPoints: number;
    positivePoints: number;
    negativePoints: number;
    awardEntries: number;
    penaltyEntries: number;
  };
  review: {
    pendingReview: number;
    reviewed: number;
    approvalRate: number;
    rejectionRate: number;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    code: string | null;
    nameEn: string | null;
    nameAr: string | null;
    type: BehaviorType | null;
    records: BehaviorRecordSummary;
    points: { totalPoints: number };
  }>;
  timeline: BehaviorOverviewRecentItem[];
  ledger: unknown[];
}

export interface BehaviorClassroomSummaryFilters {
  academicYearId?: string;
  termId?: string;
  dateFrom?: string;
  dateTo?: string;
  occurredFrom?: string;
  occurredTo?: string;
  includeStudents?: boolean;
  includeCategoryBreakdown?: boolean;
  includeRecentActivity?: boolean;
}

/** GET /behavior/classrooms/:classroomId/summary → response */
export interface BehaviorClassroomSummaryResponse {
  classroom: {
    id: string;
    name: string;
    nameAr: string | null;
    code: string | null;
    section: { id: string; name: string; nameAr: string | null; code: string | null } | null;
    grade: { id: string; name: string; nameAr: string | null; code: string | null } | null;
    stage: { id: string; name: string; nameAr: string | null; code: string | null } | null;
  };
  scope: {
    academicYearId: string | null;
    termId: string | null;
    studentId: string | null;
    classroomId: string;
    occurredFrom: string | null;
    occurredTo: string | null;
  };
  students: {
    totalEnrolledStudents: number;
    studentsWithBehaviorRecords: number;
    studentsWithPoints: number;
  };
  records: BehaviorRecordSummary;
  severity: Record<BehaviorSeverity, number>;
  points: {
    totalPoints: number;
    positivePoints: number;
    negativePoints: number;
    averagePointsPerStudent: number;
  };
  review: {
    pendingReview: number;
    reviewed: number;
    approvalRate: number;
    rejectionRate: number;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    code: string | null;
    nameEn: string | null;
    nameAr: string | null;
    type: BehaviorType | null;
    records: BehaviorRecordSummary;
    points: { totalPoints: number };
  }>;
  studentSummaries: Array<{
    student: BehaviorOverviewTopStudent["student"];
    records: BehaviorRecordSummary;
    review: {
      pendingReview: number;
      reviewed: number;
      approvalRate: number;
      rejectionRate: number;
    };
    points: {
      totalPoints: number;
      positivePoints: number;
      negativePoints: number;
      awardEntries: number;
      penaltyEntries: number;
    };
  }>;
  recentActivity: BehaviorOverviewRecentItem[];
}
