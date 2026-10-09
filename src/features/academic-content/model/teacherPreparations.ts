import {
  ACADEMIC_CONTENT_STATUSES,
  type AcademicContentStatus,
  type ListAcademicContentQuery,
} from "../types/contracts";

const DEFAULT_PAGE_SIZE = 10;

export interface TeacherPreparationFilters {
  page: number;
  limit: number;
  status: AcademicContentStatus | "";
  teacherUserId: string;
  stageId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
  subjectId: string;
  tag: string;
  search: string;
}

export type TeacherPreparationFilterUpdate = Partial<
  Omit<TeacherPreparationFilters, "page" | "limit" | "search">
>;

export const PREPARATION_COUNT_DEFINITIONS = [
  { key: "total", status: undefined },
  { key: "draft", status: "DRAFT" },
  { key: "pendingApproval", status: "SUBMITTED" },
  { key: "approved", status: "APPROVED" },
] as const;

export type TeacherPreparationCountKey =
  (typeof PREPARATION_COUNT_DEFINITIONS)[number]["key"];

function positiveInteger(rawValue: string | null, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function statusFilter(rawValue: string | null): AcademicContentStatus | "" {
  return rawValue &&
    ACADEMIC_CONTENT_STATUSES.includes(rawValue as AcademicContentStatus)
    ? (rawValue as AcademicContentStatus)
    : "";
}

export function readTeacherPreparationFilters(
  searchParams: URLSearchParams,
): TeacherPreparationFilters {
  return {
    page: positiveInteger(searchParams.get("page"), 1),
    limit: Math.min(
      100,
      positiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE),
    ),
    status: statusFilter(searchParams.get("contentStatus")),
    teacherUserId: searchParams.get("teacherUserId") ?? "",
    stageId: searchParams.get("stageId") ?? "",
    gradeId: searchParams.get("gradeId") ?? "",
    sectionId: searchParams.get("sectionId") ?? "",
    classroomId: searchParams.get("classroomId") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    tag: (searchParams.get("tag") ?? "").slice(0, 80),
    search: (searchParams.get("search") ?? "").slice(0, 120),
  };
}

export function teacherPreparationListQuery(
  filters: TeacherPreparationFilters,
  academicYearId: string,
  termId: string,
): Omit<ListAcademicContentQuery, "type"> {
  const query = {
    academicYearId,
    termId,
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    teacherUserId: filters.teacherUserId,
    stageId: filters.stageId,
    gradeId: filters.gradeId,
    sectionId: filters.sectionId,
    classroomId: filters.classroomId,
    subjectId: filters.subjectId,
    tag: filters.tag,
    search: filters.search,
  };
  return Object.fromEntries(
    Object.entries(query).filter(([, queryValue]) => queryValue !== ""),
  ) as Omit<ListAcademicContentQuery, "type">;
}
