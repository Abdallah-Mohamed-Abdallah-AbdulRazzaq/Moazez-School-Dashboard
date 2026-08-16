export function formatTimetableTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

export function formatTimetableTimeRange(
  startTime: string,
  endTime: string,
): string {
  return `${formatTimetableTime(startTime)} - ${formatTimetableTime(endTime)}`;
}
