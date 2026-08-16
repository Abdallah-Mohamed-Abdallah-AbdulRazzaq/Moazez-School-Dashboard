export interface GradesAnalyticsKpis {
  classAverage: number;
  passRate: number;
  completionRate: number;
  failingStudents: number;
}

export interface GradesDistributionBucket extends Record<string, string | number> {
  label: string;
  count: number;
}

export interface GradesAssessmentPerformance extends Record<string, string | number> {
  assessmentId: string;
  label: string;
  average: number;
  enteredCount: number;
  maxScore: number;
}

export interface GradesStudentAnalyticsRow extends Record<string, unknown> {
  studentId: string;
  studentNameEn: string;
  studentNameAr: string;
  classroomName?: string;
  average: number;
  completionRate: number;
  completedItems: number;
  totalItems: number;
  status: "passing" | "failing";
}

export interface GradesAnalyticsReport {
  kpis: GradesAnalyticsKpis;
  distribution: GradesDistributionBucket[];
  assessmentPerformance: GradesAssessmentPerformance[];
  topStudents: GradesStudentAnalyticsRow[];
  lowestStudents: GradesStudentAnalyticsRow[];
}
