// FILE: src/utils/chartFilters.ts

import { ChartFilterValues } from "@/features/students-guardians/shared/ChartFilter";
import { getDateFilterBoundaries, isDateInRange } from "./dateFilters";

export interface FilteredDataParams {
  academicYearId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Convert chart filter values to API query parameters
 */
export function getAPIQueryParams(
  filters: ChartFilterValues,
): FilteredDataParams {
  const params: FilteredDataParams = {};

  // Add academic year if selected
  if (filters.academicYear !== "all") {
    params.academicYearId = filters.academicYear;
  }

  // Add term if selected
  if (filters.term !== "all") {
    params.termId = filters.term;
  }

  // Handle date range
  if (filters.dateRange !== "all") {
    const dateResult = getDateFilterBoundaries(
      filters.dateRange,
      filters.customStartDate,
      filters.customEndDate,
    );

    if (dateResult.startDate) {
      params.startDate =
        dateResult.startDate instanceof Date
          ? dateResult.startDate.toISOString()
          : dateResult.startDate;
    }
    if (dateResult.endDate) {
      params.endDate =
        dateResult.endDate instanceof Date
          ? dateResult.endDate.toISOString()
          : dateResult.endDate;
    }
  }

  return params;
}

/**
 * Filter data array based on chart filter values
 */
export function filterDataByChartFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: ChartFilterValues,
  options: {
    academicYearKey?: string;
    termKey?: string;
    dateKey?: string;
  } = {},
): T[] {
  const {
    academicYearKey = "academicYear",
    termKey = "term",
    dateKey = "created_at",
  } = options;

  const dateResult = getDateFilterBoundaries(
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate,
  );

  return data.filter((item) => {
    // Filter by academic year
    if (filters.academicYear !== "all") {
      const itemYear = item[academicYearKey] as string;
      if (itemYear !== filters.academicYear) {
        return false;
      }
    }

    // Filter by term
    if (filters.term !== "all") {
      const itemTerm = item[termKey] as string;
      if (itemTerm !== filters.term) {
        return false;
      }
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const itemDate = item[dateKey] as string | Date;
      if (!isDateInRange(itemDate, dateResult)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if filters are active (not all default values)
 */
export function hasActiveChartFilters(filters: ChartFilterValues): boolean {
  return (
    filters.academicYear !== "all" ||
    filters.term !== "all" ||
    filters.dateRange !== "all"
  );
}
