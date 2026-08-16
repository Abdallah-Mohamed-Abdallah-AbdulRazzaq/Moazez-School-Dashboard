/**
 * Format date and time for display in tooltips and charts
 * @param ts - ISO string or epoch milliseconds
 * @param locale - 'ar' or 'en'
 * @param timeZone - Optional timezone (defaults to 'Africa/Cairo')
 * @returns Formatted date and time string
 */
export function formatDateTime(
  ts: string | number,
  locale: string,
  timeZone: string = "Africa/Cairo"
): string {
  const date = typeof ts === "string" ? new Date(ts) : new Date(ts);
  
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  
  return new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

/**
 * Format date only (without time)
 * @param ts - ISO string or epoch milliseconds
 * @param locale - 'ar' or 'en'
 * @param timeZone - Optional timezone (defaults to 'Africa/Cairo')
 * @returns Formatted date string
 */
export function formatDate(
  ts: string | number,
  locale: string,
  timeZone: string = "Africa/Cairo"
): string {
  const date = typeof ts === "string" ? new Date(ts) : new Date(ts);
  
  const localeCode = locale === "ar" ? "ar-EG" : "en-US";
  
  return new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(date);
}
