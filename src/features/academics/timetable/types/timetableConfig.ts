// Timetable Configuration Types

export interface TimetableDay {
  key: string; // e.g., "sat", "sun", "mon", "tue", "wed", "thu", "fri"
  index: number; // Display order (0..6)
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface TimetablePeriod {
  id: string; // Stable unique identifier (e.g., "period-uuid" or "p1", "p2")
  index: number; // Display order (1..N) - can change when reordering
  nameAr: string; // e.g., "الحصة 1"
  nameEn: string; // e.g., "Period 1"
  startTime?: string; // "HH:mm" format
  endTime?: string; // "HH:mm" format
  type?: "CLASS" | "BREAK" | "ASSEMBLY" | "ACTIVITY";
  isInstructional?: boolean;
}

export type TimetableConfigScope = "TERM" | "GRADE" | "SECTION" | "CLASSROOM";

export interface TimetableConfig {
  id: string;
  termId: string;
  scopeType: TimetableConfigScope;
  scopeId?: string; // gradeId, sectionId, or classroomId (null for TERM scope)
  days: TimetableDay[];
  periods: TimetablePeriod[];
  updatedAt: string;
}

export interface ResolvedTimetableConfig {
  days: TimetableDay[];
  periods: TimetablePeriod[];
  source: {
    scope: TimetableConfigScope;
    id?: string;
  };
}

/**
 * Resolve the effective timetable config for a target.
 * Priority: CLASSROOM > SECTION > GRADE > TERM
 */
export function resolveTimetableConfig(
  termConfig: TimetableConfig | null,
  gradeConfig?: TimetableConfig | null,
  sectionConfig?: TimetableConfig | null,
  classroomConfig?: TimetableConfig | null
): ResolvedTimetableConfig {
  if (classroomConfig) {
    return {
      days: classroomConfig.days,
      periods: classroomConfig.periods,
      source: {
        scope: "CLASSROOM",
        id: classroomConfig.scopeId,
      },
    };
  }

  if (sectionConfig) {
    return {
      days: sectionConfig.days,
      periods: sectionConfig.periods,
      source: {
        scope: "SECTION",
        id: sectionConfig.scopeId,
      },
    };
  }

  if (gradeConfig) {
    return {
      days: gradeConfig.days,
      periods: gradeConfig.periods,
      source: {
        scope: "GRADE",
        id: gradeConfig.scopeId,
      },
    };
  }

  if (termConfig) {
    return {
      days: termConfig.days,
      periods: termConfig.periods,
      source: {
        scope: "TERM",
      },
    };
  }

  // Fallback to default config (should not happen in production)
  return getDefaultTimetableConfig();
}

/**
 * Get default timetable configuration
 * Used as fallback when no config exists
 */
export function getDefaultTimetableConfig(): ResolvedTimetableConfig {
  return {
    days: [
      { key: "sun", index: 0, nameAr: "الأحد", nameEn: "Sunday", isActive: true },
      { key: "mon", index: 1, nameAr: "الإثنين", nameEn: "Monday", isActive: true },
      { key: "tue", index: 2, nameAr: "الثلاثاء", nameEn: "Tuesday", isActive: true },
      { key: "wed", index: 3, nameAr: "الأربعاء", nameEn: "Wednesday", isActive: true },
      { key: "thu", index: 4, nameAr: "الخميس", nameEn: "Thursday", isActive: true },
      { key: "fri", index: 5, nameAr: "الجمعة", nameEn: "Friday", isActive: false },
      { key: "sat", index: 6, nameAr: "السبت", nameEn: "Saturday", isActive: false },
    ],
    periods: [
      { id: "p1", index: 1, nameAr: "الحصة 1", nameEn: "Period 1" },
      { id: "p2", index: 2, nameAr: "الحصة 2", nameEn: "Period 2" },
      { id: "p3", index: 3, nameAr: "الحصة 3", nameEn: "Period 3" },
      { id: "p4", index: 4, nameAr: "الحصة 4", nameEn: "Period 4" },
      { id: "p5", index: 5, nameAr: "الحصة 5", nameEn: "Period 5" },
      { id: "p6", index: 6, nameAr: "الحصة 6", nameEn: "Period 6" },
      { id: "p7", index: 7, nameAr: "الحصة 7", nameEn: "Period 7" },
      { id: "p8", index: 8, nameAr: "الحصة 8", nameEn: "Period 8" },
    ],
    source: {
      scope: "TERM",
    },
  };
}

/**
 * Validate timetable configuration
 */
export function validateTimetableConfig(config: {
  days: TimetableDay[];
  periods: TimetablePeriod[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have at least 1 active day
  const activeDays = config.days.filter((d) => d.isActive);
  if (activeDays.length === 0) {
    errors.push("At least one day must be active");
  }

  // Must have at least 1 period
  if (config.periods.length === 0) {
    errors.push("At least one period is required");
  }

  // Validate period times
  for (const period of config.periods) {
    if (period.startTime && period.endTime) {
      if (period.startTime >= period.endTime) {
        errors.push(
          `Period ${period.index}: Start time must be before end time`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Map existing entries to new config
 * Returns entries that still match the new config
 */
export function mapEntriesToNewConfig<T extends { dayKey: string; periodIndex: number }>(
  entries: T[],
  newConfig: ResolvedTimetableConfig
): {
  kept: T[];
  dropped: T[];
} {
  const activeDayKeys = new Set(
    newConfig.days.filter((d) => d.isActive).map((d) => d.key)
  );
  const validPeriodIndices = new Set(newConfig.periods.map((p) => p.index));

  const kept: T[] = [];
  const dropped: T[] = [];

  for (const entry of entries) {
    if (
      activeDayKeys.has(entry.dayKey) &&
      validPeriodIndices.has(entry.periodIndex)
    ) {
      kept.push(entry);
    } else {
      dropped.push(entry);
    }
  }

  return { kept, dropped };
}

/**
 * Migration helper: Convert old index-based period IDs to stable IDs
 * @param oldId - Old format like "period-1", "period-2"
 * @param periods - Current period configuration
 * @returns Stable period ID or null if not found
 */
export function migratePeriodId(
  oldId: string,
  periods: TimetablePeriod[]
): string | null {
  // Check if already using stable ID format
  if (!oldId.match(/^period-\d+$/)) {
    // Already stable or custom format
    return oldId;
  }

  // Extract index from old format "period-N"
  const match = oldId.match(/^period-(\d+)$/);
  if (!match) return null;

  const index = parseInt(match[1], 10);
  const period = periods.find((p) => p.index === index);
  
  return period ? period.id : null;
}

/**
 * Batch migrate period IDs
 */
export function migratePeriodIds(
  oldIds: string[],
  periods: TimetablePeriod[]
): string[] {
  return oldIds
    .map((id) => migratePeriodId(id, periods))
    .filter((id): id is string => id !== null);
}
