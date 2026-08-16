export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return formatDateOnly(date) === value ? date : null;
}

export const isDateOnlyInside = (value: string, start?: string, end?: string) =>
  (!start || value >= start) && (!end || value <= end);

export function autoPlanDateErrors(
  from: string | undefined,
  to: string | undefined,
  termStart?: string,
  termEnd?: string,
) {
  const errors: { from?: string; to?: string } = {};
  if (!from) errors.from = "from_required";
  else if (termStart && from < termStart) errors.from = "from_before_term";
  if (!to) errors.to = "to_required";
  else if (termEnd && to > termEnd) errors.to = "to_after_term";
  if (from && to && from > to) {
    errors.from = "from_after_to";
    errors.to = "from_after_to";
  }
  return errors;
}

export function lessonPlanRangeErrors(
  start: string | undefined,
  end: string | undefined,
  termStart?: string,
  termEnd?: string,
) {
  const errors: { start?: string; end?: string } = {};
  if (!start) errors.start = "week_start_required";
  else if (termStart && start < termStart)
    errors.start = "week_start_before_term";
  if (!end) errors.end = "week_end_required";
  else if (termEnd && end > termEnd) errors.end = "week_end_after_term";
  if (start && end && start > end) {
    errors.start = "week_start_after_end";
    errors.end = "week_start_after_end";
  }
  return errors;
}
