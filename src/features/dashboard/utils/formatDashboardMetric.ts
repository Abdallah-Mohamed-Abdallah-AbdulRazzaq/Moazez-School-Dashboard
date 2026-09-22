export function formatDashboardMetric(value: number, locale: string) {
  return value.toLocaleString(locale === "ar" ? "ar-EG" : "en");
}
