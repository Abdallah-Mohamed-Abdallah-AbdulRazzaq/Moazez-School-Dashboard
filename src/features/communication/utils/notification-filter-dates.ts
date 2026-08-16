export function filterDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterIsoValue(value: Date | null): string {
  return value ? value.toISOString() : "";
}
