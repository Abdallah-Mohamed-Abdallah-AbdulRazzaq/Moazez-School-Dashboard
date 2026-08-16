import type { TimetablePeriod } from "@/features/academics/timetable/types/timetableConfig";
import { normalizeSelectedPeriodIds } from "@/features/attendance/utils/periodIdNormalization";

export function getExcusePeriodKeysForSave(
  selectedKeys: string[],
  periods: TimetablePeriod[],
): string[] {
  return periods.length > 0
    ? normalizeSelectedPeriodIds(selectedKeys, periods)
    : selectedKeys;
}
