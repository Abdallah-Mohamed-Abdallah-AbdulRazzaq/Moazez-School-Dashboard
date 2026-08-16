function formatDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

export function formatExcuseDateRange(
  dateFrom: string,
  dateTo: string,
  locale: string,
): string {
  const from = formatDate(dateFrom, locale);
  return dateFrom === dateTo ? from : `${from} → ${formatDate(dateTo, locale)}`;
}

export function getSecondaryStudentName(
  primaryName: string,
  secondaryName: string,
): string | null {
  const primary = primaryName.trim().toLocaleLowerCase();
  const secondary = secondaryName.trim();
  return !secondary || secondary.toLocaleLowerCase() === primary
    ? null
    : secondary;
}
