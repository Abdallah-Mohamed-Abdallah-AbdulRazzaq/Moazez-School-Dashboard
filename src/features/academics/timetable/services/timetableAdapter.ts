import type {
  TimetableConflict,
  TimetableEntry,
  TimetableValidationResult,
} from "@/features/academics/timetable/types/timetable";

export interface TimetableAdapter {
  fetchTimetable(
    termId: string,
    sectionId: string,
    classroomId?: string
  ): Promise<TimetableEntry[]>;
  fetchAllTimetablesForTerm(termId: string): Promise<TimetableEntry[]>;
  upsertTimetableEntries(
    termId: string,
    sectionId: string,
    entries: Partial<TimetableEntry>[],
    classroomId?: string
  ): Promise<TimetableEntry[]>;
  deleteTimetableEntry(
    termId: string,
    sectionId: string,
    day: number,
    period: number,
    classroomId?: string
  ): Promise<void>;
  validateTimetable(): Promise<TimetableValidationResult>;
  publishTimetable(
    termId: string,
    sectionId: string,
    classroomId?: string
  ): Promise<void>;
  unpublishTimetable(
    termId: string,
    sectionId: string,
    classroomId?: string
  ): Promise<void>;
  detectConflicts(
    entries: TimetableEntry[],
    sections: Array<{ id: string; nameAr: string; nameEn: string }>,
    classrooms: Array<{ id: string; nameAr: string; nameEn: string }>,
    teachers: Array<{ id: string; nameAr: string; nameEn: string }>,
    rooms: Array<{ id: string; nameAr: string; nameEn: string }>,
    subjects: Array<{ id: string; nameAr: string; nameEn: string }>
  ): TimetableConflict[];
}
