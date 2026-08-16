// Utility functions for filtering students

import type { StudentWithEnrollment } from "@/features/students-guardians/students/utils/studentsListFilters";

export type DateRangeValue = "7" | "30" | "60" | "90" | "all" | "custom";

export interface StudentFilterValues {
  academicYear: string;
  term: string;
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

export function filterStudents(
  students: StudentWithEnrollment[],
  filterValues: StudentFilterValues
): StudentWithEnrollment[] {
  return students.filter((student) => {
    const academicYear = student.enrollment?.academicYear;
    const term = student.currentTerm?.term;

    // Apply academic year filter
    if (
      filterValues.academicYear !== "all" &&
      academicYear !== filterValues.academicYear
    ) {
      return false;
    }

    // Apply term filter
    if (filterValues.term !== "all" && term !== filterValues.term) {
      return false;
    }

    return true;
  });
}
