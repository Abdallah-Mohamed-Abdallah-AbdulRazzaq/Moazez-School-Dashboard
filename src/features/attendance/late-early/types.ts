export type IncidentType = "LATE" | "EARLY_LEAVE";
export type IncidentFilterType = "ALL" | IncidentType;
export type IncidentPolicyContext = "ESTIMATED_CURRENT" | "UNAVAILABLE";

export interface LateEarlyScopeIds {
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
}

export interface Incident {
  id: string;
  yearId: string;
  termId: string;
  date: string;
  periodId?: string;
  periodKey?: string;
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  sessionId: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  gradeNameAr?: string;
  gradeNameEn?: string;
  sectionNameAr?: string;
  sectionNameEn?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  type: IncidentType;
  minutes: number;
  threshold?: number;
  isViolation: boolean | null;
  policyScopeSummary: string;
  policyContext: IncidentPolicyContext;
  sessionStatus?: "DRAFT" | "SUBMITTED";
  updatedAt: string;
}

export interface LateEarlyFilters {
  dateFrom?: string;
  dateTo?: string;
  scopeType: "SCHOOL" | "STAGE" | "GRADE" | "SECTION" | "CLASSROOM";
  scopeIds?: LateEarlyScopeIds;
  type: IncidentFilterType;
  onlyViolations: boolean;
  minutesMin?: number;
  minutesMax?: number;
  periodId?: string;
  search: string;
  sessionStatus?: "ALL" | "DRAFT" | "SUBMITTED";
}

export interface LateEarlyKpis {
  totalIncidents: number;
  totalLate: number;
  totalEarlyLeave: number;
  avgLateMinutes: number;
  avgEarlyLeaveMinutes: number;
  violationsCount: number;
}
