import type { TimetableEntry } from "../types/timetable";
import { timetableSubjectName } from "./timetableSubjectDisplay";

interface LessonSearchReference {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface TimetableLessonSearchInput {
  query: string;
  entries: TimetableEntry[];
  subjects: LessonSearchReference[];
  teachers: LessonSearchReference[];
  rooms: LessonSearchReference[];
}

function searchableText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\p{M}\u0640]/gu, "")
    .toLowerCase();
}

export function findTimetableLessons({
  query,
  entries,
  subjects,
  teachers,
  rooms,
}: TimetableLessonSearchInput): TimetableEntry[] {
  const terms = searchableText(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const names = (references: LessonSearchReference[]) =>
    new Map(
      references.map((reference) => [
        reference.id,
        `${reference.nameAr} ${reference.nameEn}`,
      ]),
    );
  const subjectNames = names(subjects);
  const teacherNames = names(teachers);
  const roomNames = names(rooms);
  return entries.filter((entry) => {
    if (!entry.subjectId || entry.slotType === "BREAK") return false;
    const text = searchableText(
      [
        subjectNames.get(entry.subjectId) ?? `${timetableSubjectName(entry, undefined, "ar")} ${timetableSubjectName(entry, undefined, "en")}`,
        entry.teacherId ? teacherNames.get(entry.teacherId) : "",
        entry.roomId ? roomNames.get(entry.roomId) : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
}
