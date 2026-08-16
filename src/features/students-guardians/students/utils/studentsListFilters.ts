// Utility functions for filtering and processing students list

import type {
  Student,
  StudentStatus,
  StudentEnrollment,
  EnrollmentTerm,
} from "@/features/students-guardians/students/types";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { getStudentDisplayId } from "@/features/students-guardians/students/utils/studentUtils";
import type { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";

// Extended student type with enrollment data
export type StudentWithEnrollment = Student & {
  enrollment?: StudentEnrollment;
  currentTerm?: EnrollmentTerm;
  ytdPerformance?: {
    attendance: number;
    gradeAverage: number;
    riskFlags: EnrollmentTerm["riskFlags"];
  };
};

export interface StudentFilterValues {
  searchQuery: string;
  academicYearFilter: string;
  termFilter: string;
  gradeFilter: string;
  sectionFilter: string;
  classroomFilter: string;
  statusFilter: StudentStatus | "all";
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

export interface StudentKPIs {
  total: number;
  active: number;
  suspended: number;
  withdrawn: number;
  atRisk: number;
}

export function filterStudentsList(
  students: StudentWithEnrollment[],
  filters: StudentFilterValues
): StudentWithEnrollment[] {
  const {
    searchQuery,
    academicYearFilter,
    termFilter,
    gradeFilter,
    sectionFilter,
    classroomFilter,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
  } = filters;

  const filterResult = getDateFilterBoundaries(
    dateRange,
    customStartDate,
    customEndDate
  );

  return students.filter((student) => {
    // Search in both English and Arabic names
    const studentWithNames = student as Student & {
      full_name_en?: string;
      studentName?: string;
      full_name_ar?: string;
      studentNameArabic?: string;
    };
    const englishName =
      studentWithNames.full_name_en || studentWithNames.studentName || "";
    const arabicName =
      studentWithNames.full_name_ar || studentWithNames.studentNameArabic || "";
    const studentId = getStudentDisplayId(student);

    const matchesSearch =
      searchQuery === "" ||
      englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arabicName.includes(searchQuery) ||
      studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const studentGrade = student.enrollment?.grade || student.gradeRequested;
    const studentSection = student.enrollment?.section || "";
    const studentClassroom = student.enrollment?.classroom || "";
    const studentAcademicYear = student.enrollment?.academicYear || "";
    const studentTerm = student.currentTerm?.term || "";

    const matchesAcademicYear =
      academicYearFilter === "all" || studentAcademicYear === academicYearFilter;
    const matchesTerm = termFilter === "all" || studentTerm === termFilter;
    const matchesGrade = gradeFilter === "all" || studentGrade === gradeFilter;
    const matchesSection =
      sectionFilter === "all" || studentSection === sectionFilter;
    const matchesClassroom =
      classroomFilter === "all" || studentClassroom === classroomFilter;
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesDateRange = isDateInRange(
      student.created_at ?? student.submittedDate,
      filterResult
    );

    return (
      matchesSearch &&
      matchesAcademicYear &&
      matchesTerm &&
      matchesGrade &&
      matchesSection &&
      matchesClassroom &&
      matchesStatus &&
      matchesDateRange
    );
  });
}

export function calculateStudentKPIs(
  students: StudentWithEnrollment[],
  dateRange: DateRangeValue,
  customStartDate: string,
  customEndDate: string
): StudentKPIs {
  const filterResult = getDateFilterBoundaries(
    dateRange,
    customStartDate,
    customEndDate
  );

  const studentsInRange = students.filter((s) =>
    isDateInRange(s.created_at ?? s.submittedDate, filterResult)
  );

  const total = studentsInRange.length;
  const active = studentsInRange.filter((s) => s.status === "Active").length;
  const suspended = studentsInRange.filter((s) => s.status === "Suspended").length;
  const withdrawn = studentsInRange.filter((s) => s.status === "Withdrawn").length;
  const atRisk = studentsInRange.filter(
    (s) => s.ytdPerformance && s.ytdPerformance.riskFlags.length > 0
  ).length;

  return { total, active, suspended, withdrawn, atRisk };
}

export function extractStudentFilterOptions(students: StudentWithEnrollment[]): {
  uniqueAcademicYears: string[];
  uniqueTerms: string[];
  uniqueGrades: string[];
  uniqueSections: string[];
  uniqueClassrooms: string[];
} {
  const years = new Set<string>();
  const terms = new Set<string>();
  const grades = new Set<string>();
  const sections = new Set<string>();
  const classrooms = new Set<string>();

  students.forEach((s) => {
    if (s.enrollment?.academicYear) {
      years.add(s.enrollment.academicYear);
    }
    if (s.currentTerm?.term) {
      terms.add(s.currentTerm.term);
    }
    const grade = s.enrollment?.grade || s.gradeRequested;
    grades.add(grade);
    if (s.enrollment?.section) {
      sections.add(s.enrollment.section);
    }
    if (s.enrollment?.classroom) {
      classrooms.add(s.enrollment.classroom);
    }
  });

  return {
    uniqueAcademicYears: Array.from(years).sort(),
    uniqueTerms: Array.from(terms).sort(),
    uniqueGrades: Array.from(grades).sort(),
    uniqueSections: Array.from(sections).sort(),
    uniqueClassrooms: Array.from(classrooms).sort(),
  };
}

export function hasActiveFilters(filters: StudentFilterValues): boolean {
  return (
    filters.searchQuery !== "" ||
    filters.academicYearFilter !== "all" ||
    filters.termFilter !== "all" ||
    filters.gradeFilter !== "all" ||
    filters.sectionFilter !== "all" ||
    filters.classroomFilter !== "all" ||
    filters.statusFilter !== "all"
  );
}
