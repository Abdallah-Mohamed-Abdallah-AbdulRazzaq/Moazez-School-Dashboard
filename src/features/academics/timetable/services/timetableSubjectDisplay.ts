import type { TimetableEntry } from "../types/timetable";

export function timetableSubjectName(
  entry: TimetableEntry,
  subject: { nameAr: string; nameEn: string } | undefined,
  locale: string,
): string {
  const reference = subject ??
    (entry.subjectSnapshot?.id === entry.subjectId
      ? entry.subjectSnapshot
      : undefined);
  if (!reference) return "";
  return (
    (locale === "ar" ? reference.nameAr : reference.nameEn).trim() ||
    (locale === "ar" ? reference.nameEn : reference.nameAr).trim()
  );
}
