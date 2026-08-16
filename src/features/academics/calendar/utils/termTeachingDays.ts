/**
 * Term Teaching Days Utilities
 * 
 * Calculates teaching days and weeks for a term by excluding holidays
 * from the calendar events.
 */

import { AcademicEvent } from "@/features/academics/calendar/services/calendarService";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export interface ScopeFilter {
  type: "SCHOOL" | "STAGE" | "GRADE" | "SECTION";
  id?: string;
}

export interface TeachingWeek {
  weekIndex: number; // 1-based
  start: Date;
  end: Date;
  teachingDaysCount: number;
}

/**
 * Check if a date falls on a holiday
 * 
 * @param date - Date to check
 * @param events - Calendar events (only HOLIDAY type considered)
 * @param scope - Optional scope filter (SCHOOL, STAGE, GRADE, SECTION)
 * @returns true if date is a holiday
 */
export function isHolidayDate(
  date: Date,
  events: AcademicEvent[],
  scope?: ScopeFilter
): boolean {
  const dateStr = dayjs(date).format("YYYY-MM-DD");

  // Filter to HOLIDAY events only
  const holidays = events.filter((event) => event.type === "HOLIDAY");

  // Check if date falls within any holiday event
  for (const holiday of holidays) {
    // Check scope matching
    if (scope) {
      // SCHOOL holidays affect everyone
      if (holiday.scopeType === "SCHOOL") {
        // Continue to date check
      }
      // For other scopes, must match type and ID
      else if (holiday.scopeType === scope.type) {
        if (scope.id && holiday.scopeId !== scope.id) {
          continue; // Scope doesn't match, skip this holiday
        }
      } else {
        continue; // Different scope type, skip
      }
    }

    // Check if date is within holiday range (inclusive)
    if (dateStr >= holiday.startDate && dateStr <= holiday.endDate) {
      return true;
    }
  }

  return false;
}

/**
 * Get all teaching days in a term (excluding holidays)
 * 
 * @param termStart - Term start date
 * @param termEnd - Term end date
 * @param events - Calendar events
 * @param scope - Optional scope filter
 * @returns Array of teaching day dates
 */
export function getTeachingDays(
  termStart: Date,
  termEnd: Date,
  events: AcademicEvent[],
  scope?: ScopeFilter
): Date[] {
  const teachingDays: Date[] = [];
  const start = dayjs(termStart);
  const end = dayjs(termEnd);

  let current = start;
  while (current.isBefore(end) || current.isSame(end, "day")) {
    const currentDate = current.toDate();

    // Exclude weekends (Friday = 5, Saturday = 6)
    const dayOfWeek = current.day();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Check if it's a holiday
    const isHoliday = isHolidayDate(currentDate, events, scope);

    // Add to teaching days if not weekend and not holiday
    if (!isWeekend && !isHoliday) {
      teachingDays.push(currentDate);
    }

    current = current.add(1, "day");
  }

  return teachingDays;
}

/**
 * Get teaching weeks for a term
 * 
 * Divides the term into weeks (Sunday-Saturday) and calculates
 * teaching days count for each week.
 * 
 * @param termStart - Term start date
 * @param termEnd - Term end date
 * @param events - Calendar events
 * @param scope - Optional scope filter
 * @returns Array of teaching weeks with metadata
 */
export function getTeachingWeeks(
  termStart: Date,
  termEnd: Date,
  events: AcademicEvent[],
  scope?: ScopeFilter
): TeachingWeek[] {
  const weeks: TeachingWeek[] = [];
  const start = dayjs(termStart);
  const end = dayjs(termEnd);

  // Find the first Sunday on or before term start
  let weekStart = start;
  while (weekStart.day() !== 0) {
    weekStart = weekStart.subtract(1, "day");
  }

  let weekIndex = 1;

  while (weekStart.isBefore(end) || weekStart.isSame(end, "day")) {
    // Week ends on Saturday
    const weekEnd = weekStart.add(6, "day");

    // Calculate teaching days in this week
    let teachingDaysCount = 0;
    let current = weekStart;

    while (current.isBefore(weekEnd) || current.isSame(weekEnd, "day")) {
      const currentDate = current.toDate();

      // Only count days within term range
      if (
        (current.isAfter(start) || current.isSame(start, "day")) &&
        (current.isBefore(end) || current.isSame(end, "day"))
      ) {
        // Exclude weekends (Friday = 5, Saturday = 6)
        const dayOfWeek = current.day();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

        // Check if it's a holiday
        const isHoliday = isHolidayDate(currentDate, events, scope);

        if (!isWeekend && !isHoliday) {
          teachingDaysCount++;
        }
      }

      current = current.add(1, "day");
    }

    // Only add weeks that have at least one day in the term range
    const weekOverlapsTerm =
      (weekStart.isBefore(end) || weekStart.isSame(end, "day")) &&
      (weekEnd.isAfter(start) || weekEnd.isSame(start, "day"));

    if (weekOverlapsTerm) {
      weeks.push({
        weekIndex,
        start: weekStart.toDate(),
        end: weekEnd.toDate(),
        teachingDaysCount,
      });
      weekIndex++;
    }

    // Move to next week
    weekStart = weekStart.add(7, "day");
  }

  return weeks;
}

/**
 * Get total teaching weeks count (weeks with at least 1 teaching day)
 * 
 * @param termStart - Term start date
 * @param termEnd - Term end date
 * @param events - Calendar events
 * @param scope - Optional scope filter
 * @returns Number of teaching weeks
 */
export function getTeachingWeeksCount(
  termStart: Date,
  termEnd: Date,
  events: AcademicEvent[],
  scope?: ScopeFilter
): number {
  const weeks = getTeachingWeeks(termStart, termEnd, events, scope);
  // Count weeks with at least 1 teaching day
  return weeks.filter((week) => week.teachingDaysCount > 0).length;
}
