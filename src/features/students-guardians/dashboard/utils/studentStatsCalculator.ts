// Utility functions for calculating student statistics

import type { StudentWithEnrollment } from "@/features/students-guardians/students/utils/studentsListFilters";

export interface StudentStats {
  total: number;
  active: number;
  suspended: number;
  withdrawn: number;
  atRisk: number;
  avgAttendance: number;
  avgGrade: number;
}

export interface RiskDistribution {
  attendance: number;
  grades: number;
  behavior: number;
}

export function calculateStudentStats(
  students: StudentWithEnrollment[],
): StudentStats {
  const total = students.length;
  const active = students.filter((s) => s.status === "Active").length;
  const suspended = students.filter((s) => s.status === "Suspended").length;
  const withdrawn = students.filter((s) => s.status === "Withdrawn").length;

  const atRisk = students.filter(
    (student) =>
      student.ytdPerformance && student.ytdPerformance.riskFlags.length > 0,
  ).length;

  // Calculate average attendance
  const studentsWithAttendance = students.filter(
    (student) => student.ytdPerformance?.attendance,
  );
  const avgAttendance =
    studentsWithAttendance.length > 0
      ? Math.round(
          studentsWithAttendance.reduce(
            (sum, student) => sum + (student.ytdPerformance?.attendance || 0),
            0
          ) / studentsWithAttendance.length
        )
      : 0;

  // Calculate average grade
  const studentsWithGrades = students.filter(
    (student) => student.ytdPerformance?.gradeAverage,
  );
  const avgGrade =
    studentsWithGrades.length > 0
      ? Math.round(
          studentsWithGrades.reduce(
            (sum, student) => sum + (student.ytdPerformance?.gradeAverage || 0),
            0
          ) / studentsWithGrades.length
        )
      : 0;

  return {
    total,
    active,
    suspended,
    withdrawn,
    atRisk,
    avgAttendance,
    avgGrade,
  };
}

export function calculateRiskDistribution(
  students: StudentWithEnrollment[],
): RiskDistribution {
  const distribution: RiskDistribution = {
    attendance: 0,
    grades: 0,
    behavior: 0,
  };

  students.forEach((student) => {
    if (student.ytdPerformance?.riskFlags) {
      student.ytdPerformance.riskFlags.forEach(
        (flag: "attendance" | "grades" | "behavior") => {
          if (flag === "attendance") distribution.attendance++;
          if (flag === "grades") distribution.grades++;
          if (flag === "behavior") distribution.behavior++;
        }
      );
    }
  });

  return distribution;
}

export function extractFilterOptions(students: StudentWithEnrollment[]): {
  academicYears: string[];
  terms: string[];
} {
  const years = new Set<string>();
  const termSet = new Set<string>();

  students.forEach((student) => {
    if (student.enrollment?.academicYear) {
      years.add(student.enrollment.academicYear);
    }
    if (student.currentTerm?.term) {
      termSet.add(student.currentTerm.term);
    }
  });

  return {
    academicYears: Array.from(years).sort(),
    terms: Array.from(termSet).sort(),
  };
}
