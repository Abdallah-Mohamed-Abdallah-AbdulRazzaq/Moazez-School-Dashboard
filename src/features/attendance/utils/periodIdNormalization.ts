/**
 * Period ID Normalization Utilities
 * 
 * Provides helpers to normalize legacy period ID formats to stable timetable period IDs.
 * Handles backward compatibility with old formats like "period-1", "p1", etc.
 */

import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";

/**
 * Normalize a single period ID to stable format
 * 
 * @param id - Period ID in any format (stable, "period-N", "pN", etc.)
 * @param periods - Available timetable periods
 * @returns Stable period ID or null if not found
 */
export function normalizePeriodId(
  id: string,
  periods: TimetablePeriod[]
): string | null {
  // Check if ID already exists in periods (stable ID)
  if (periods.some((p) => p.id === id)) {
    return id;
  }

  // Try to extract index from old formats
  let index: number | null = null;

  // Format: "period-N"
  const oldMatch = id.match(/^period-(\d+)$/);
  if (oldMatch) {
    index = parseInt(oldMatch[1], 10);
  }

  // Format: "pN"
  if (!index) {
    const newMatch = id.match(/^p(\d+)$/);
    if (newMatch) {
      index = parseInt(newMatch[1], 10);
    }
  }

  // If we extracted an index, find the period by index
  if (index !== null) {
    const period = periods.find((p) => p.index === index);
    if (period) {
      return period.id;
    }
  }

  // ID doesn't match any known format or period
  return null;
}

/**
 * Normalize multiple period IDs to stable format
 * Filters out IDs that cannot be normalized
 * 
 * @param ids - Array of period IDs in any format
 * @param periods - Available timetable periods
 * @returns Array of stable period IDs
 */
export function normalizeSelectedPeriodIds(
  ids: string[],
  periods: TimetablePeriod[]
): string[] {
  return ids
    .map((id) => normalizePeriodId(id, periods))
    .filter((id): id is string => id !== null);
}

/**
 * Check if a period ID is in legacy format
 * 
 * @param id - Period ID to check
 * @returns True if ID is in legacy format
 */
export function isLegacyPeriodId(id: string): boolean {
  return /^period-\d+$/.test(id) || /^p\d+$/.test(id);
}

/**
 * Extract display label from period ID
 * Useful for showing period numbers in UI
 * 
 * @param id - Period ID in any format
 * @returns Display label (e.g., "P1", "P2")
 */
export function getPeriodDisplayLabel(id: string): string {
  // Try to extract number from various formats
  const match = id.match(/(\d+)$/);
  if (match) {
    return `P${match[1]}`;
  }
  // If no digits, return the ID as-is
  return id;
}
