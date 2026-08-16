// FILE: src/utils/studentUtils.ts
// Utility functions for student data manipulation and formatting

import type {
  Student,
  StudentStatus,
  RiskFlag,
} from "@/features/students-guardians/students/types";

// ============================================================================
// NAME UTILITIES
// ============================================================================

export function composeNameParts(...parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim() || "")
    .filter(Boolean)
    .join(" ");
}

export function splitFullName(fullName?: string): {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
} {
  const parts = (fullName || "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    fatherName: parts[1] || "",
    grandfatherName: parts[2] || "",
    familyName: parts.slice(3).join(" "),
  };
}

/**
 * Get display name for a student (handles backward compatibility)
 */
export function getStudentDisplayName(student: Student): string {
  return (
    student.name ??
    (composeNameParts(
      student.first_name_en,
      student.father_name_en,
      student.grandfather_name_en,
      student.family_name_en,
    ) ||
      student.full_name_en)
  );
}

/**
 * Get student initials
 */
export function getStudentInitials(student: Student): string {
  const name = getStudentDisplayName(student);
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// ID UTILITIES
// ============================================================================

/**
 * Get display ID for a student (handles backward compatibility)
 */
export function getStudentDisplayId(student: Student): string {
  return student.student_id ?? student.id;
}

// ============================================================================
// GRADE UTILITIES
// ============================================================================

/**
 * Get display grade for a student (handles backward compatibility)
 */
export function getStudentGrade(
  student: Student & { enrollment?: { grade?: string } },
): string {
  return student.enrollment?.grade ?? student.grade ?? student.gradeRequested;
}

/**
 * Get display section for a student when available
 */
export function getStudentSection(
  student: Student & {
    enrollment?: { section?: string };
  },
): string | undefined {
  return student.enrollment?.section ?? student.section;
}

/**
 * Get display classroom for a student when available
 */
export function getStudentClassroom(
  student: Student & {
    enrollment?: { classroom?: string };
  },
): string {
  return student.enrollment?.classroom ?? "N/A";
}

/**
 * Extract grade number from grade string (e.g., "Grade 4" -> 4)
 */
export function extractGradeNumber(grade: string): number {
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Sort grades in ascending order
 */
export function sortGrades(grades: string[]): string[] {
  return grades.sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b));
}

// ============================================================================
// STATUS UTILITIES
// ============================================================================

/**
 * Get status color class
 */
export function getStatusColor(status: StudentStatus): string {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case "active":
      return "bg-green-100 text-green-700";
    case "withdrawn":
      return "bg-gray-100 text-gray-700";
    case "suspended":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(status: StudentStatus): string {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case "active":
      return "green";
    case "suspended":
      return "yellow";
    case "withdrawn":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Normalize status (handles case variations)
 */
export function normalizeStatus(status: StudentStatus): StudentStatus {
  const lower = status.toLowerCase();
  if (lower === "active") return "Active";
  if (lower === "suspended") return "Suspended";
  if (lower === "withdrawn") return "Withdrawn";
  return "Active"; // Default
}

// ============================================================================
// RISK FLAG UTILITIES
// ============================================================================

/**
 * Get risk flag color
 */
export function getRiskFlagColor(flag: RiskFlag): string {
  switch (flag) {
    case "attendance":
      return "text-orange-600 bg-orange-50";
    case "grades":
      return "text-red-600 bg-red-50";
    case "behavior":
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Get risk flag label
 */
export function getRiskFlagLabel(flag: RiskFlag): string {
  switch (flag) {
    case "attendance":
      return "Low Attendance";
    case "grades":
      return "Low Grades";
    case "behavior":
      return "Behavior Issues";
    default:
      return flag;
  }
}

/**
 * Check if student is at risk
 */
export function isStudentAtRisk(student: Student): boolean {
  return !!(student.risk_flags && student.risk_flags.length > 0);
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Get attendance status
 */
export function getAttendanceStatus(
  percentage: number | undefined,
): "excellent" | "good" | "warning" | "critical" | "unknown" {
  if (percentage === undefined) return "unknown";
  if (percentage >= 95) return "excellent";
  if (percentage >= 85) return "good";
  if (percentage >= 75) return "warning";
  return "critical";
}

/**
 * Get grade status
 */
export function getGradeStatus(
  average: number | undefined,
): "excellent" | "good" | "warning" | "critical" | "unknown" {
  if (average === undefined) return "unknown";
  if (average >= 90) return "excellent";
  if (average >= 75) return "good";
  if (average >= 60) return "warning";
  return "critical";
}

/**
 * Get attendance color
 */
export function getAttendanceColor(percentage: number | undefined): string {
  const status = getAttendanceStatus(percentage);
  switch (status) {
    case "excellent":
      return "text-green-600 bg-green-50";
    case "good":
      return "text-blue-600 bg-blue-50";
    case "warning":
      return "text-orange-600 bg-orange-50";
    case "critical":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Get grade color
 */
export function getGradeColor(average: number | undefined): string {
  const status = getGradeStatus(average);
  switch (status) {
    case "excellent":
      return "text-green-600 bg-green-50";
    case "good":
      return "text-blue-600 bg-blue-50";
    case "warning":
      return "text-orange-600 bg-orange-50";
    case "critical":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get student age from date of birth
 */
export function getStudentAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get enrollment duration in years
 */
export function getEnrollmentDuration(student: Student): number {
  if (!student.enrollment_year) return 0;
  const currentYear = new Date().getFullYear();
  return currentYear - student.enrollment_year;
}

// ============================================================================
// FILTER UTILITIES
// ============================================================================

/**
 * Get unique grades from students
 */
export function getUniqueGrades(students: Student[]): string[] {
  const grades = new Set<string>();
  students.forEach((s) => {
    const grade = getStudentGrade(s);
    if (grade) grades.add(grade);
  });
  return sortGrades(Array.from(grades));
}

/**
 * Get unique sections from students
 */
export function getUniqueSections(students: Student[]): string[] {
  const sections = new Set<string>();
  students.forEach((s) => {
    if (s.section) sections.add(s.section);
  });
  return Array.from(sections).sort();
}

/**
 * Get unique statuses from students
 */
export function getUniqueStatuses(students: Student[]): StudentStatus[] {
  const statuses = new Set<StudentStatus>();
  students.forEach((s) => {
    statuses.add(s.status);
  });
  return Array.from(statuses);
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Format student data for export
 */
export function formatStudentForExport(
  student: Student,
): Record<string, string | number> {
  const studentWithEnrollment = student as Student & {
    enrollment?: { section?: string; classroom?: string };
  };

  return {
    "Student ID": getStudentDisplayId(student),
    "Name (English)": student.full_name_en,
    "Name (Arabic)": student.full_name_ar,
    Grade: getStudentGrade(student),
    Section:
      studentWithEnrollment.enrollment?.section ?? student.section ?? "N/A",
    Classroom: getStudentClassroom(studentWithEnrollment),
    Status: student.status,
    Gender: student.gender,
    Nationality: student.nationality,
    "Date of Birth": student.dateOfBirth,
    Age: getStudentAge(student.dateOfBirth),
    "Enrollment Year": student.enrollment_year ?? "N/A",
    "Attendance %": student.attendance_percentage ?? "N/A",
    "Current Average": student.current_average ?? "N/A",
    "Risk Flags": student.risk_flags?.join(", ") ?? "None",
    "Submitted Date": student.submittedDate,
  };
}
