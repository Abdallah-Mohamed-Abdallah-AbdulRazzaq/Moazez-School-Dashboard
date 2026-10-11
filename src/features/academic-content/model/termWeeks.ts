import { validDateOnlyFilter } from "./academicContentListFilters";
import type { WeeklyPlanTermBounds } from "./weeklyPlanDetail";

export interface TermWeek extends WeeklyPlanTermBounds {
  number: number;
}

const DAY_MS = 86_400_000;

export function calculateTermWeeks(bounds?: WeeklyPlanTermBounds): TermWeek[] {
  // Include one-day terms, leap days, year boundaries, and a shortened final week.
  const startDate = validDateOnlyFilter(bounds?.startDate ?? null);
  const endDate = validDateOnlyFilter(bounds?.endDate ?? null);
  if (!startDate || !endDate || endDate < startDate) return [];
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const weekCount = Math.ceil((end - start + DAY_MS) / (7 * DAY_MS));
  return Array.from({ length: weekCount }, (_, index) => {
    const weekStart = start + index * 7 * DAY_MS;
    return {
      number: index + 1,
      startDate: new Date(weekStart).toISOString().slice(0, 10),
      endDate: new Date(Math.min(weekStart + 6 * DAY_MS, end)).toISOString().slice(0, 10),
    };
  });
}
