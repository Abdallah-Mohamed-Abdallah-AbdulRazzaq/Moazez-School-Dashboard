export function formatAcademicContentDateTime(
  value: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAcademicContentRelativeTime(
  value: string,
  locale: string,
  now = new Date(),
): string {
  const elapsedMilliseconds = new Date(value).getTime() - now.getTime();
  const absoluteMilliseconds = Math.abs(elapsedMilliseconds);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absoluteMilliseconds < 60 * 60_000) {
    return formatter.format(Math.round(elapsedMilliseconds / 60_000), "minute");
  }
  if (absoluteMilliseconds < 24 * 60 * 60_000) {
    return formatter.format(
      Math.round(elapsedMilliseconds / (60 * 60_000)),
      "hour",
    );
  }
  return formatter.format(
    Math.round(elapsedMilliseconds / (24 * 60 * 60_000)),
    "day",
  );
}
