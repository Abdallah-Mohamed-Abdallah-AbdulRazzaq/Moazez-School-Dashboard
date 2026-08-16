import type { BackendTimetablePeriodDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { TimetableErrorCode } from "@/features/academics/timetable/services/timetableErrorHandling";

export interface PeriodFormValues {
  id?: string;
  index: number;
  startTime: string;
  endTime: string;
}

export function validatePeriodForm(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): TimetableErrorCode[] {
  const validationErrors = [
    ...validatePeriodTimeOrder(period),
    ...validateUniquePeriodIndex(period, existingPeriods),
    ...validatePeriodOverlap(period, existingPeriods),
  ];
  return validationErrors;
}

function validatePeriodTimeOrder(
  period: PeriodFormValues,
): TimetableErrorCode[] {
  if (period.startTime && period.endTime && period.startTime >= period.endTime) {
    return ["academics.timetable.invalid_time_range"];
  }
  return [];
}

function validateUniquePeriodIndex(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): TimetableErrorCode[] {
  const duplicate = existingPeriods.some(
    (existingPeriod) =>
      existingPeriod.id !== period.id && existingPeriod.index === period.index,
  );
  return duplicate ? ["academics.timetable.period_index_taken"] : [];
}

function validatePeriodOverlap(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): TimetableErrorCode[] {
  const overlaps = existingPeriods.some(
    (existingPeriod) =>
      existingPeriod.id !== period.id &&
      period.startTime < existingPeriod.endTime &&
      period.endTime > existingPeriod.startTime,
  );
  return overlaps ? ["academics.timetable.period_overlap"] : [];
}
