import {
  ACADEMIC_CONTENT_STATUSES,
  ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
  type AcademicContentLibraryItem,
  type AcademicContentStatus,
  type AcademicGuardianNotePriority,
  type ListAcademicContentQuery,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 10;

export type GuardianNoteView = "table" | "grid";

export interface GuardianNoteFilters {
  page: number;
  limit: number;
  status: AcademicContentStatus | "";
  priority: AcademicGuardianNotePriority | "";
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  teacherUserId: string;
  tag: string;
  search: string;
  view: GuardianNoteView;
}

export type GuardianNoteFilterUpdate = Partial<
  Omit<GuardianNoteFilters, "page" | "limit" | "search" | "view">
>;

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function enumValue<T extends string>(
  rawValue: string | null,
  values: readonly T[],
): T | "" {
  return rawValue && values.includes(rawValue as T) ? (rawValue as T) : "";
}

export function readGuardianNoteFilters(
  searchParams: URLSearchParams,
): GuardianNoteFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    status: enumValue(
      searchParams.get("contentStatus"),
      ACADEMIC_CONTENT_STATUSES,
    ),
    priority: enumValue(
      searchParams.get("guardianPriority"),
      ACADEMIC_GUARDIAN_NOTE_PRIORITIES,
    ),
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    search: (searchParams.get("search") ?? "").slice(0, 120),
    view: searchParams.get("view") === "grid" ? "grid" : "table",
  };
}

export function guardianNoteListQuery(
  filters: GuardianNoteFilters,
  academicYearId: string,
  termId: string,
): Omit<ListAcademicContentQuery, "type" | "audience"> {
  const query = {
    academicYearId,
    termId,
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    guardianPriority: filters.priority,
    stageId: filters.stageId,
    gradeId: filters.gradeId,
    sectionId: filters.sectionId,
    classroomId: filters.classroomId,
    subjectId: filters.subjectId,
    teacherUserId: filters.teacherUserId,
    tag: filters.tag,
    search: filters.search,
  };

  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ""),
  ) as Omit<ListAcademicContentQuery, "type" | "audience">;
}

export function guardianNotePageStats(
  items: AcademicContentLibraryItem[],
  total: number,
) {
  const guardianNotes = items.filter(
    (item) => item.summary?.type === "GUARDIAN_WEEKLY_NOTE",
  );
  return {
    total,
    pageItems: items.length,
    urgentOnPage: guardianNotes.filter(
      (item) =>
        item.summary?.type === "GUARDIAN_WEEKLY_NOTE" &&
        item.summary.priority === "URGENT",
    ).length,
    acknowledgementOnPage: guardianNotes.filter(
      (item) =>
        item.summary?.type === "GUARDIAN_WEEKLY_NOTE" &&
        item.summary.requiresAcknowledgement,
    ).length,
  };
}
