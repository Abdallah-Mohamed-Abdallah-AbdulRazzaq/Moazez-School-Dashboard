// FILE: src/utils/dateFilters.ts

import { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";

export interface DateFilterResult {
  cutoffDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Calculate date filter boundaries based on selected range
 */
export function getDateFilterBoundaries(
  dateRange: DateRangeValue,
  customStartDate?: string,
  customEndDate?: string,
): DateFilterResult {
  const now = new Date();

  if (dateRange === "all") {
    return { cutoffDate: null, startDate: null, endDate: null };
  }

  if (dateRange === "custom") {
    const startDate = customStartDate ? new Date(customStartDate) : null;
    const endDate = customEndDate ? new Date(customEndDate) : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return {
      cutoffDate: startDate,
      startDate,
      endDate,
    };
  }

  // For preset ranges (7, 30, 60, 90 days)
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - parseInt(dateRange));
  cutoffDate.setHours(0, 0, 0, 0);

  return {
    cutoffDate,
    startDate: cutoffDate,
    endDate: now,
  };
}

/**
 * Check if a date is within the filter range
 */
export function isDateInRange(
  date: string | Date,
  filterResult: DateFilterResult,
): boolean {
  const checkDate = new Date(date);

  // No filter - all dates pass
  if (!filterResult.cutoffDate && !filterResult.startDate) {
    return true;
  }

  // Custom range with both dates
  if (filterResult.startDate && filterResult.endDate) {
    return (
      checkDate >= filterResult.startDate && checkDate <= filterResult.endDate
    );
  }

  // Preset range (cutoff date only)
  if (filterResult.cutoffDate) {
    return checkDate >= filterResult.cutoffDate;
  }

  return true;
}
