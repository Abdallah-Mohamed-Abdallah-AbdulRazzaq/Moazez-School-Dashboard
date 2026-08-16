import type { AttendanceStatus } from "@/features/attendance/roll-call/types";
import type { AttendanceScopeType } from "@/features/attendance/policies/types";
import type { AttendanceScopeIds } from "@/features/attendance/shared/attendanceScope";
import type { ExcuseStatus, ExcuseType, ExcuseRequest } from "@/features/attendance/excuses/types";
import type { Incident } from "@/features/attendance/late-early/types";
import type { AbsenceRecord } from "@/features/attendance/absences/types";

export type ReportsIncidentFilter = "ALL" | "ABSENCE" | "LATE" | "EARLY_LEAVE" | "EXCUSED";
export type ReportsTrendBucket = "day" | "week";
export type ReportsPerformanceLevel = "stage" | "grade" | "section" | "classroom";
export type ReportsExportDataset = "summary" | "detailed" | "risk" | "performance";

export interface AttendanceReportsFilters {
  dateFrom?: string;
  dateTo?: string;
  scopeType: AttendanceScopeType;
  scopeIds?: AttendanceScopeIds;
  studentId?: string;
  attendanceStatus: "ALL" | AttendanceStatus;
  excuseStatus: "ALL" | ExcuseStatus;
  incidentType: ReportsIncidentFilter;
}

export interface ReportsStudentOption {
  id: string;
  label: string;
  studentNumber?: string;
}

export interface ReportsAttendanceRow {
  id: string;
  sessionId: string;
  date: string;
  sessionStatus: "DRAFT" | "SUBMITTED";
  mode: "DAILY" | "PERIOD";
  periodIndex?: number;
  periodNameAr?: string;
  periodNameEn?: string;
  studentId: string;
  studentNumber: string;
  studentNameAr: string;
  studentNameEn: string;
  status: AttendanceStatus;
  minutesLate?: number;
  minutesEarlyLeave?: number;
  stageId?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  stageNameAr?: string;
  stageNameEn?: string;
  gradeNameAr?: string;
  gradeNameEn?: string;
  sectionNameAr?: string;
  sectionNameEn?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  updatedAt: string;
}

export interface ReportsTrendPoint {
  key: string;
  label: string;
  dateFrom: string;
  dateTo: string;
  attendanceRate: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  earlyLeaveCount: number;
}

export interface ReportsKpiCard {
  key:
    | "attendanceRate"
    | "presentCount"
    | "absentCount"
    | "excusedCount"
    | "lateCount"
    | "earlyLeaveCount"
    | "riskStudents"
    | "groupsBelowThreshold";
  value: number;
  displayValue: string;
  delta?: number;
}

export interface ReportsAbsenceStudentRow {
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  absenceCount: number;
  excusedCount: number;
  unexcusedCount: number;
}

export interface ReportsWeekdayRow {
  weekday: string;
  count: number;
}

export interface ReportsScopeBreakdownRow {
  id: string;
  labelAr: string;
  labelEn: string;
  incidents: number;
  attendanceRate?: number;
}

export interface ReportsAbsenceAnalysis {
  totalAbsences: number;
  excusedCount: number;
  unexcusedCount: number;
  byDate: ReportsTrendPoint[];
  byGrade: ReportsScopeBreakdownRow[];
  bySection: ReportsScopeBreakdownRow[];
  byClassroom: ReportsScopeBreakdownRow[];
  topStudents: ReportsAbsenceStudentRow[];
  weekdayPattern: ReportsWeekdayRow[];
}

export interface ReportsLateEarlyStudentRow {
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber?: string;
  incidentCount: number;
  averageMinutes: number;
  violationCount: number;
}

export interface ReportsLateEarlyAnalysis {
  totalLate: number;
  totalEarlyLeave: number;
  violationCount: number;
  averageLateMinutes: number;
  averageEarlyLeaveMinutes: number;
  trend: ReportsTrendPoint[];
  byGrade: ReportsScopeBreakdownRow[];
  bySection: ReportsScopeBreakdownRow[];
  byClassroom: ReportsScopeBreakdownRow[];
  topLateStudents: ReportsLateEarlyStudentRow[];
  topEarlyLeaveStudents: ReportsLateEarlyStudentRow[];
}

export interface ReportsExcuseScopeRow {
  key: string;
  labelAr: string;
  labelEn: string;
  total: number;
}

export interface ReportsExcusesAnalysis {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  withAttachmentsCount: number;
  lateSubmissionsCount: number;
  byType: Array<{ type: ExcuseType; count: number }>;
  topStudents: Array<{
    studentId: string;
    studentNameAr: string;
    studentNameEn: string;
    studentNumber?: string;
    count: number;
    approvedCount: number;
    rejectedCount: number;
  }>;
  topScopes: ReportsExcuseScopeRow[];
}

export interface ReportsRiskFlag {
  code:
    | "low_attendance"
    | "repeated_absence"
    | "repeated_late"
    | "rejected_excuses"
    | "missing_attendance";
  count: number;
}

export interface ReportsRiskStudentRow {
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  studentNumber: string;
  attendanceRate: number;
  absenceCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  rejectedExcuses: number;
  missingMarks: number;
  scopeLabelAr: string;
  scopeLabelEn: string;
  flags: ReportsRiskFlag[];
}

export interface ReportsPerformanceRow {
  id: string;
  level: ReportsPerformanceLevel;
  parentId?: string;
  labelAr: string;
  labelEn: string;
  attendanceRate: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  studentCount: number;
  delta?: number;
}

export interface AttendanceReportsData {
  filters: AttendanceReportsFilters;
  studentOptions: ReportsStudentOption[];
  attendanceRows: ReportsAttendanceRow[];
  absenceRecords: AbsenceRecord[];
  incidents: Incident[];
  excuseRequests: ExcuseRequest[];
  overview: {
    cards: ReportsKpiCard[];
    sectionsBelowThreshold: number;
  };
  trend: {
    bucket: ReportsTrendBucket;
    points: ReportsTrendPoint[];
  };
  absenceAnalysis: ReportsAbsenceAnalysis;
  lateEarlyAnalysis: ReportsLateEarlyAnalysis;
  excusesAnalysis: ReportsExcusesAnalysis;
  riskStudents: ReportsRiskStudentRow[];
  performance: Record<ReportsPerformanceLevel, ReportsPerformanceRow[]>;
}

export interface AttendanceReportsExportPayload {
  title: string;
  subtitle: string;
  filename: string;
  data: Record<string, string | number>[];
}
