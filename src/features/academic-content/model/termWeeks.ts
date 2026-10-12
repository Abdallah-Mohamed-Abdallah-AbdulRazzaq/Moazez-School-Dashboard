import { validDateOnlyFilter } from "./academicContentListFilters";
import type { WeeklyPlanTermBounds } from "./weeklyPlanDetail";

export interface TermWeek extends WeeklyPlanTermBounds {
  number: number;
}

const DAY_MS = 86_400_000;

export function formatTermWeekRange(range: WeeklyPlanTermBounds, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: range.startDate.slice(0, 4) !== range.endDate.slice(0, 4) ? "numeric" : undefined,
    timeZone: "UTC",
  });
  const startDate = validDateOnlyFilter(range.startDate);
  const endDate = validDateOnlyFilter(range.endDate);
  const start = startDate ? new Date(`${startDate}T00:00:00Z`) : null;
  const end = endDate ? new Date(`${endDate}T00:00:00Z`) : null;
  return start && end && start <= end
    ? formatter.formatRange(start, end)
    : `${start ? formatter.format(start) : "…"} – ${end ? formatter.format(end) : "…"}`;
}

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
