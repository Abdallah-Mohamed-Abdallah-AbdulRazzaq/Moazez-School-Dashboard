export interface DashboardKPIs {
  totalStudents: number;
  activeStudents: number;
  avgAttendance: number;
  atRiskStudents: number;
  lowAttendance: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface DashboardAttendanceBreakdown {
  present: number;
  absent: number;
}

export interface DashboardActivity {
  id: string;
  studentName: string;
  reason: string;
  xp: number;
}

export type DashboardAlertPriority = "high" | "medium" | "low";

export interface DashboardAlertItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  priority: DashboardAlertPriority;
  actionKey: string;
}

export interface DashboardMonitoringItem {
  time: string;
  title: string;
  subtitle: string;
  status: "ongoing" | "upcoming" | "completed";
}

export interface DashboardAcademicPerformanceData {
  positiveRate: number;
  negativeRate: number;
  trends: Record<"today" | "this_week" | "this_term", number[]>;
}

export interface DashboardAttendanceTrendPeriod {
  days: number[];
  attendanceData: number[];
  average: number;
  belowDays: number;
}

export interface DashboardStudentsPerGradeData {
  grades: string[];
  newStudents: number[];
  existingStudents: number[];
}

export interface DashboardAbsenceReasonsData {
  medical: number;
  permission: number;
  noExcuse: number;
}

export interface DashboardExportSummaryRow {
  date: string;
  academicYear: string;
  term: string;
  totalStudents: number;
  attendanceRate: string;
  deliveredClasses: number;
  violations: number;
  lowAttendanceStudents: number;
  nedaaEfficiency: string;
}

export interface DashboardExportAttendanceRow {
  grade: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: string;
}

export interface DashboardExportIncidentRow {
  studentName: string;
  reason: string;
  xp: number;
  priority: DashboardAlertPriority;
}

export interface DashboardSnapshot {
  kpis: DashboardKPIs;
  deliveredClasses: number;
  violations: number;
  lowAttendanceStudents: number;
  nedaaEfficiencyMinutes: number;
  chartData: {
    students: ChartData[];
    attendance: ChartData[];
    classes: ChartData[];
    violations: ChartData[];
    lowAttendance: ChartData[];
    nedaa: ChartData[];
  };
  attendanceBreakdown: DashboardAttendanceBreakdown;
  activities: DashboardActivity[];
  academicPerformance: DashboardAcademicPerformanceData;
  attendanceTrend: Record<
    "days_30" | "week" | "term" | "academic_year",
    DashboardAttendanceTrendPeriod
  >;
  studentsPerGrade: DashboardStudentsPerGradeData;
  absenceReasons: DashboardAbsenceReasonsData;
  alerts: DashboardAlertItem[];
  monitoring: {
    classes: DashboardMonitoringItem[];
    exams: DashboardMonitoringItem[];
  };
  exportData: {
    summary: DashboardExportSummaryRow;
    attendance: DashboardExportAttendanceRow[];
    incidents: DashboardExportIncidentRow[];
  };
}
